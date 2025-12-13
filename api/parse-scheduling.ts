import type { VercelRequest, VercelResponse } from '@vercel/node';

// Safely access server-side environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export interface ParsedSchedulingData {
  title: string;
  participants: string[];
  suggestedDate?: string;
  suggestedTime?: string;
  suggestedDate2?: string;
  suggestedTime2?: string;
  suggestedDate3?: string;
  suggestedTime3?: string;
  duration?: number;
  location?: string;
  addGoogleMeet?: boolean;
  priority?: 'must' | 'should' | 'maybe';
  notes?: string;
  isSchedulingRequest: boolean;
}

interface BusySlot {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

// Helper to format date as YYYY-MM-DD in local timezone
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Fallback basic parsing without AI
function basicParse(message: string, contactNames: string[]): ParsedSchedulingData {
  const lowerMessage = message.toLowerCase();
  
  // Check if it's a scheduling request
  const schedulingKeywords = ['schedule', 'meet', 'meeting', 'coffee', 'lunch', 'dinner', 'call', 'sync', 'chat', 'catch up', 'book', 'set up', 'plan', 'organize', 'arrange'];
  const isSchedulingRequest = schedulingKeywords.some(kw => lowerMessage.includes(kw)) || true; // Default to true for Gatherly

  // Extract participants from @ mentions or "with X" patterns
  const mentionMatches = message.match(/@(\S+)/g) || [];
  const withMatch = message.match(/with\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
  
  let participants: string[] = mentionMatches.map(m => {
    const name = m.slice(1);
    const match = contactNames.find(c => c.toLowerCase().includes(name.toLowerCase()));
    return match || name;
  });
  
  if (withMatch && contactNames.some(c => c.toLowerCase().includes(withMatch[1].toLowerCase()))) {
    participants.push(withMatch[1]);
  }

  // Try to parse date
  let suggestedDate: string | undefined;
  let suggestedDate2: string | undefined;
  let suggestedDate3: string | undefined;
  const today = new Date();
  
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    suggestedDate = formatLocalDate(tomorrow);
  } else if (lowerMessage.includes('today')) {
    suggestedDate = formatLocalDate(today);
  } else if (lowerMessage.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    suggestedDate = formatLocalDate(nextWeek);
  } else if (lowerMessage.includes('this weekend') || lowerMessage.includes('weekend')) {
    // Find next Saturday
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() + (6 - saturday.getDay()));
    suggestedDate = formatLocalDate(saturday);
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    suggestedDate2 = formatLocalDate(sunday);
  }
  
  // Generate 3 spread out dates if we only have 1
  if (suggestedDate && !suggestedDate2) {
    const d2 = new Date(suggestedDate);
    d2.setDate(d2.getDate() + 1);
    suggestedDate2 = formatLocalDate(d2);
    const d3 = new Date(d2);
    d3.setDate(d3.getDate() + 1);
    suggestedDate3 = formatLocalDate(d3);
  }

  // Try to parse time - with event-type inference
  let suggestedTime: string | undefined;
  let duration = 60;
  
  // Check for explicit time
  const timeMatch = lowerMessage.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (timeMatch[3].toLowerCase() === 'pm' && hour !== 12) hour += 12;
    if (timeMatch[3].toLowerCase() === 'am' && hour === 12) hour = 0;
    const mins = timeMatch[2] || '00';
    suggestedTime = `${hour.toString().padStart(2, '0')}:${mins}`;
  } else {
    // Infer time from event type
    if (lowerMessage.includes('breakfast')) {
      suggestedTime = '08:30';
      duration = 60;
    } else if (lowerMessage.includes('brunch')) {
      suggestedTime = '10:30';
      duration = 90;
    } else if (lowerMessage.includes('lunch')) {
      suggestedTime = '12:00';
      duration = 60;
    } else if (lowerMessage.includes('coffee')) {
      suggestedTime = '10:00';
      duration = 45;
    } else if (lowerMessage.includes('dinner')) {
      suggestedTime = '18:30';
      duration = 90;
    } else if (lowerMessage.includes('happy hour')) {
      suggestedTime = '17:00';
      duration = 90;
    } else if (lowerMessage.includes('study')) {
      suggestedTime = '14:00';
      duration = 120;
    } else if (lowerMessage.includes('morning')) {
      suggestedTime = '09:00';
    } else if (lowerMessage.includes('afternoon')) {
      suggestedTime = '14:00';
    } else if (lowerMessage.includes('evening')) {
      suggestedTime = '18:00';
    }
  }
  
  // Check for duration in message
  const durationMatch = lowerMessage.match(/(\d+)\s*(hour|hr|minute|min)/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    if (durationMatch[2].toLowerCase().startsWith('hour') || durationMatch[2].toLowerCase().startsWith('hr')) {
      duration = value * 60;
    } else {
      duration = value;
    }
  }

  // Check for Google Meet / virtual meeting
  const addGoogleMeet = /zoom|meet|video|virtual|online|teams|call/i.test(lowerMessage);

  // Extract location
  let location: string | undefined;
  if (addGoogleMeet) {
    location = 'Google Meet';
  } else {
    const atMatch = message.match(/at\s+([^,\d]+?)(?:\s+(?:on|at|for|tomorrow|today|next|this)|\s*$)/i);
    if (atMatch) {
      location = atMatch[1].trim();
    }
  }

  // Clean the title
  let title = message
    .replace(/@\S+/g, '') // Remove mentions
    .replace(/at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)/gi, '') // Remove time
    .replace(/tomorrow|today|next week|this weekend/gi, '') // Remove date words
    .replace(/\s+/g, ' ')
    .trim();
  
  if (title.length > 60) title = title.slice(0, 60) + '...';

  return {
    title: title || 'New Meeting',
    participants,
    suggestedDate,
    suggestedTime,
    suggestedDate2,
    suggestedTime2: suggestedTime,
    suggestedDate3,
    suggestedTime3: suggestedTime,
    duration,
    location,
    addGoogleMeet,
    priority: lowerMessage.includes('urgent') || lowerMessage.includes('important') ? 'must' : 'should',
    isSchedulingRequest
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, contactNames = [], busySlots = [], userLocation = '' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // If no API key, use basic parsing
    if (!OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured, using basic parsing');
      return res.status(200).json(basicParse(message, contactNames));
    }

    const today = new Date();
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Calculate upcoming days for reference
    const upcomingDays: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      upcomingDays.push(`${d.toLocaleDateString('en-US', { weekday: 'long' })} ${formatLocalDate(d)}`);
    }

    // Format busy slots grouped by date
    const sortedBusySlots = [...(busySlots as BusySlot[])].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    
    const busySlotsContext = sortedBusySlots.length > 0 
      ? `\n\n## ⚠️ CRITICAL: USER'S BUSY TIMES - ABSOLUTE CONFLICTS ⚠️
**NEVER EVER suggest times that overlap with these. This is non-negotiable.**
These come from the user's selected/toggled calendars:

${sortedBusySlots.map((slot: BusySlot) => 
          `- ${slot.date} ${slot.startTime}-${slot.endTime}: "${slot.title}"`
        ).join('\n')}

**CONFLICT CHECK ALGORITHM:**
For each suggested time, verify:
1. suggestedDate + suggestedTime + duration does NOT overlap ANY slot above
2. Example: if busy 14:00-15:00, do NOT suggest 13:30 with 1hr duration (ends 14:30 = conflict)
3. If ALL times on a day conflict, use a DIFFERENT day
4. [PENDING GATHERLY] events are times the user is waiting on - NEVER conflict with these`
      : '';

    const locationContext = userLocation 
      ? `User's location: ${userLocation}. Suggest locations near this area when relevant.`
      : '';

    const systemPrompt = `You are Gatherly's intelligent scheduling assistant. Your job is to extract ALL relevant scheduling information from natural language and populate EVERY applicable field.

## CURRENT CONTEXT
- Today: ${dayOfWeek}, ${dateStr}
- Today's date: ${formatLocalDate(today)}
- Upcoming 2 weeks: ${upcomingDays.join(', ')}
${locationContext}
- Known contacts: ${contactNames.length > 0 ? contactNames.join(', ') : 'None'}
${busySlotsContext}

## YOUR TASK
Parse the user's message and extract/infer ALL of these fields:

### REQUIRED FIELDS (always provide):
1. **title**: A clean, concise event name (e.g., "Coffee with Sarah", "Team Standup", "Dinner at Shake Shack")
2. **isSchedulingRequest**: true if this is about scheduling, false otherwise
3. **suggestedDate/Time 1, 2, 3**: ALWAYS provide 3 different time options spread across different days

### FIELD EXTRACTION RULES:

**TITLE:**
- Extract the core event type + context (e.g., "Lunch meeting" → "Lunch Meeting", "coffee tmr 2pm" → "Coffee")
- Capitalize properly
- Remove time/date words from title
- Max 50 characters

**PARTICIPANTS:**
- Match names to known contacts (fuzzy match)
- "Coffee with John" → look for "John" in contacts
- "@sarah" → look for "sarah" in contacts
- Return the contact NAME (we'll match to email later)

**DATES (suggestedDate, suggestedDate2, suggestedDate3):**
Format: YYYY-MM-DD

- "tomorrow" → ${formatLocalDate(new Date(today.getTime() + 86400000))}
- "today" → ${formatLocalDate(today)}
- "this weekend" → upcoming Saturday & Sunday
- "next week" → Monday of next week
- "Friday" → the next Friday
- "in 2 days" → calculate from today
- DEFAULT: Spread across 3 different days (e.g., tomorrow, day after, 3 days from now)

**TIMES (suggestedTime, suggestedTime2, suggestedTime3):**
Format: HH:MM (24-hour)

INFER FROM EVENT TYPE if not specified:
- Breakfast → 08:00, 08:30, 09:00
- Brunch → 10:30, 11:00, 11:30
- Coffee/Tea → 10:00, 14:00, 15:00
- Lunch → 12:00, 12:30, 13:00
- Happy Hour → 17:00, 17:30, 18:00
- Dinner → 18:30, 19:00, 19:30
- Study/Work Session → 10:00, 14:00, 16:00
- Meeting (generic) → 10:00, 14:00, 16:00
- Party/Social → 19:00, 20:00, 21:00
- Call/Sync → 09:00, 11:00, 14:00

Explicit times override inference:
- "2pm" → 14:00
- "3:30pm" → 15:30
- "morning" → 09:00
- "afternoon" → 14:00
- "evening" → 18:00

**DURATION (in minutes):**
- "30 min" → 30
- "1 hour" → 60
- "2 hours" → 120
- "quick" → 30
- DEFAULT by event type:
  - Coffee/Tea: 45
  - Breakfast: 60
  - Brunch: 90
  - Lunch: 60
  - Dinner: 90
  - Happy Hour: 90
  - Meeting: 60
  - Study Session: 120
  - Party: 180

**LOCATION:**
- Virtual keywords (zoom, meet, video, call, virtual, online, teams) → "Google Meet"
- "at [place]" → extract and expand (e.g., "at dunster" → "Dunster House, Harvard University")
- Partial names → expand to full address if recognizable
- No location mentioned → "TBD"

**addGoogleMeet (boolean):**
- true if: zoom, meet, video, call, virtual, online, teams mentioned
- true if: no physical location and it's a work meeting
- false otherwise

**NOTES:**
- Any additional context not captured elsewhere
- Special requests, reminders, etc.

## ⚠️ CONFLICT AVOIDANCE - HIGHEST PRIORITY ⚠️
**The user CANNOT be double-booked. This overrides ALL other preferences.**

Before outputting ANY suggestedDate/suggestedTime combination:
1. **CHECK**: Does this time + duration overlap with ANY busy slot on that date?
2. **OVERLAP DEFINITION**: Time A overlaps with B if A starts during B OR B starts during A
3. **IF CONFLICT**: Pick the nearest non-conflicting time on that day
4. **IF ALL DAY BUSY**: Pick a completely DIFFERENT day
5. **VERIFY ALL 3**: Each of the 3 suggestions must pass this check independently

**Example conflict detection:**
- Busy: 2024-12-15 14:00-15:00
- BAD: suggestedTime=13:30 with duration=60 (ends 14:30, overlaps busy)
- BAD: suggestedTime=14:00 (starts during busy)
- BAD: suggestedTime=14:30 (starts during busy)
- GOOD: suggestedTime=13:00 with duration=60 (ends 14:00, just before busy)
- GOOD: suggestedTime=15:00 (starts when busy ends)

## EDITING EXISTING EVENTS - CRITICAL FOR MULTI-TURN CONVERSATIONS
If the message includes "Current form state:", the user is building on top of an EXISTING event.

**PRESERVATION RULES (VERY IMPORTANT):**
1. If user ONLY mentions a location → KEEP title, dates, times, duration, participants EXACTLY as in form state
2. If user ONLY mentions a time → KEEP title, location, duration, participants; UPDATE only the relevant time option
3. If user ONLY mentions a person → KEEP everything else; ADD to participants
4. If user mentions "make it X hours" → KEEP everything; ONLY change duration

**PARSING THE FORM STATE:**
The form state looks like: Event="Coffee", Location="TBD", Options=[{day:"2024-12-15", time:"10:00", duration:60}, ...]

- If Event is not empty and user doesn't mention a new title → use the existing Event name
- If Location is not "TBD" and user doesn't mention location → use existing Location
- If Options have dates/times and user doesn't mention new times → use existing Options

**EXAMPLES:**
Form: Event="Lunch with Team", Location="TBD", Options=[{day:"2024-12-15", time:"12:00", duration:60}]
User: "at Shake Shack"
Output: title="Lunch with Team", location="Shake Shack, [address]", dates/times unchanged

Form: Event="Coffee", Location="Starbucks", Options=[{day:"2024-12-15", time:"10:00", duration:45}]
User: "make it an hour"
Output: title="Coffee", location="Starbucks", duration=60, dates/times unchanged

Form: Event="", Location="TBD", Options=empty
User: "Dinner with Sarah on Friday at 7pm"
Output: title="Dinner with Sarah", location="TBD", date=Friday, time=19:00, duration=90

**PARTIAL DATE/TIME CHANGES:**
- "change the Sunday one to Monday" → find the option with Sunday, move ONLY that one to Monday
- "move option 2 to 3pm" → change ONLY suggestedTime2 to 15:00
- "move everything to next week" → add 7 days to ALL dates

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "isSchedulingRequest": boolean,
  "title": "string",
  "participants": ["name1", "name2"],
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTime": "HH:MM",
  "suggestedDate2": "YYYY-MM-DD",
  "suggestedTime2": "HH:MM",
  "suggestedDate3": "YYYY-MM-DD",
  "suggestedTime3": "HH:MM",
  "duration": number,
  "location": "string or TBD",
  "addGoogleMeet": boolean,
  "priority": "must" | "should" | "maybe",
  "notes": "string or null"
}

IMPORTANT:
- ALWAYS provide all 3 date/time suggestions
- ALWAYS spread them across DIFFERENT DAYS by default
- Duration is ALWAYS in MINUTES (60 = 1 hour)
- Match event name context to appropriate times`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.2, // Lower temperature for more consistent outputs
        max_tokens: 800
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return res.status(200).json(basicParse(message, contactNames));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return res.status(200).json(basicParse(message, contactNames));
    }

    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json(basicParse(message, contactNames));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Normalize duration - AI might return in hours instead of minutes
    let duration = parsed.duration || 60;
    if (duration > 0 && duration < 15) {
      duration = duration * 60; // Convert hours to minutes if suspiciously small
    }
    
    // Ensure we have all 3 date/time suggestions
    // If AI only provided 1-2, spread them out
    let date1 = parsed.suggestedDate;
    let time1 = parsed.suggestedTime;
    let date2 = parsed.suggestedDate2;
    let time2 = parsed.suggestedTime2;
    let date3 = parsed.suggestedDate3;
    let time3 = parsed.suggestedTime3;
    
    if (date1 && !date2) {
      const d2 = new Date(date1);
      d2.setDate(d2.getDate() + 1);
      date2 = formatLocalDate(d2);
      time2 = time1;
    }
    
    if (date2 && !date3) {
      const d3 = new Date(date2);
      d3.setDate(d3.getDate() + 1);
      date3 = formatLocalDate(d3);
      time3 = time1;
    }
    
    return res.status(200).json({
      title: parsed.title || message.slice(0, 50),
      participants: parsed.participants || [],
      suggestedDate: date1,
      suggestedTime: time1,
      suggestedDate2: date2,
      suggestedTime2: time2,
      suggestedDate3: date3,
      suggestedTime3: time3,
      duration,
      location: parsed.location || 'TBD',
      addGoogleMeet: parsed.addGoogleMeet || false,
      priority: parsed.priority || 'should',
      notes: parsed.notes,
      isSchedulingRequest: parsed.isSchedulingRequest ?? true
    });
  } catch (error) {
    console.error('Error parsing with OpenAI:', error);
    const { message, contactNames = [] } = req.body;
    return res.status(200).json(basicParse(message || '', contactNames));
  }
}
