import * as dotenv from 'dotenv';
import OpenAI from 'openai';
import { calendarService } from './calendar.js';

// Load environment variables (for OpenAI only; Google tokens are handled by CalendarService)
dotenv.config();

// The system prompt from prompt.md
const SYSTEM_PROMPT = `You are Gatherly's **Scheduler Agent**.

Goal: given a natural-language request and the user's free/busy + preferences, produce a small set of conflict-free meeting options.

### Hard rules
- Output **valid JSON only** (no prose).
- Propose **exactly 3** options unless fewer are truly available.
- For coffee chats and social meetings, ONLY suggest times between **09:00-17:00 Eastern Time**.
- **Never** overlap existing events in any participant's calendar.
- Respect **quiet hours** and **ignored categories** from preferences.
- If the user explicitly specifies a preferred day or time window (e.g. "Thursday afternoon", "after 3pm", "Friday morning"), treat that as a hard constraint whenever possible: first try to place all options within that exact day/time window before considering any other times, as long as they don't violate quiet hours or free/busy constraints.
- If the user uses an explicit calendar reference like "tomorrow", "on Friday", or a concrete date like "on Dec 2", you MUST only propose slots on that calendar day in the host's local time **unless** there is truly no free time in the requested part of that day. Only then may you move to the closest later day with availability.
- If the user requests "see 3 more," produce **3 new options later than all previously suggested** options.

### Social appropriateness
- For **coffee chats, casual meetings, or social events**: restrict slots to **09:00–18:00 local time** only.
- Use times outside this window (early morning or evening) **only if** the user explicitly mentions flexibility (e.g., "evening is fine", "early morning works", "after 6pm", etc.).
- For professional meetings without explicit time hints, prefer standard business hours (09:00–18:00).

### Output schema (JSON)
{
  "title": "string",
  "who": ["string"],          // names inferred from text, if any
  "where": "string|null",     // inferred or null if unknown
  "slots": ["ISO-8601", "ISO-8601", "ISO-8601"]   // 1–3 items, ascending
}

Return only the JSON object. No markdown. No explanation.`;

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function suggestSlots(params: { text: string; durationMinutes?: number; hostId: string }) {
  const userRequest = params.text;

  const lowerText = userRequest.toLowerCase();

  const explicitDuration =
    typeof params.durationMinutes === 'number' && params.durationMinutes > 0
      ? params.durationMinutes
      : undefined;

  const inferDurationFromText = (text: string): number => {
    const lower = text.toLowerCase();

    const explicitMatch = lower.match(/(\d+)\s*(minute|min|mins|hour|hours|hr|hrs)/);
    if (explicitMatch) {
      const value = parseInt(explicitMatch[1], 10);
      const unit = explicitMatch[2];
      if (unit.startsWith('hour') || unit.startsWith('hr')) {
        return value * 60;
      }
      return value;
    }

    if (lower.includes('dinner')) {
      return 90;
    }

    if (lower.includes('coffee')) {
      return 45;
    }

    return 45;
  };

  const effectiveDurationMinutes = explicitDuration ?? inferDurationFromText(userRequest);

  try {
    // 1. Get calendar availability for a fixed planning horizon for this host
    console.log('1️⃣ Fetching calendar availability...');

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // If the user explicitly says "tomorrow", anchor the horizon at tomorrow
    // so the model naturally focuses on that day first.
    if (lowerText.includes('tomorrow')) {
      startDate.setDate(startDate.getDate() + 1);
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30); // 30-day horizon

    const busyPeriods = await calendarService.getHostBusy({
      hostId: params.hostId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
    });

    console.log(
      `Found ${busyPeriods.length} busy periods between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`
    );
    console.log('\nBusy periods:');
    busyPeriods.forEach((period) => {
      console.log(
        `- ${new Date(period.start).toLocaleString()} to ${new Date(period.end).toLocaleString()}`
      );
    });

    // 2. Get AI suggestions
    console.log('\n2️⃣ Getting AI suggestions...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: JSON.stringify(
            {
              text: userRequest,
              freeBusy: busyPeriods,
              preferences: {
                quiet_hours: ['22:00-07:00'],
                duration_minutes: effectiveDurationMinutes,
              },
            },
            null,
            2
          ),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Scheduler Agent did not return valid JSON. Got:\n${raw}`);
    }

    const title: string = typeof parsed.title === 'string' ? parsed.title : '';
    const where: string | null =
      typeof parsed.where === 'string' || parsed.where === null ? parsed.where : null;
    const who: string[] = Array.isArray(parsed.who) ? parsed.who : [];

    let slots: string[] = Array.isArray(parsed.slots)
      ? parsed.slots.filter((s: unknown) => typeof s === 'string')
      : [];

    if (slots.length > 3) {
      slots = slots.slice(0, 3);
    }

    // 3. Optional: verify slots don't conflict (for logging only)
    const slotsValid = slots.every((slot) => {
      const slotTime = new Date(slot);
      return !busyPeriods.some((busy) => {
        const start = new Date(busy.start);
        const end = new Date(busy.end);
        return slotTime >= start && slotTime <= end;
      });
    });

    console.log(`\nAll slots avoid calendar conflicts (per LLM): ${slotsValid ? '✅' : '❌'}`);

    // 4. Return structured result for API
    return {
      title,
      who,
      where,
      slots,
    };
  } catch (error) {
    console.error('Error in suggestSlots:', error);
    throw error;
  }
}

