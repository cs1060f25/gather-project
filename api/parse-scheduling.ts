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

// Fallback basic parsing without AI
function basicParse(message: string, contactNames: string[]): ParsedSchedulingData {
  const lowerMessage = message.toLowerCase();
  
  // Check if it's a scheduling request
  const schedulingKeywords = ['schedule', 'meet', 'meeting', 'coffee', 'lunch', 'dinner', 'call', 'sync', 'chat', 'catch up', 'book', 'set up'];
  const isSchedulingRequest = schedulingKeywords.some(kw => lowerMessage.includes(kw));

  // Extract participants from @ mentions
  const mentionMatches = message.match(/@(\S+)/g) || [];
  const participants = mentionMatches.map(m => {
    const name = m.slice(1);
    const match = contactNames.find(c => c.toLowerCase().includes(name.toLowerCase()));
    return match || name;
  });

  // Try to parse date
  let suggestedDate: string | undefined;
  const today = new Date();
  
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    suggestedDate = tomorrow.toISOString().split('T')[0];
  } else if (lowerMessage.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    suggestedDate = nextWeek.toISOString().split('T')[0];
  } else if (lowerMessage.includes('today')) {
    suggestedDate = today.toISOString().split('T')[0];
  }

  // Try to parse time
  let suggestedTime: string | undefined;
  const timeMatch = lowerMessage.match(/(\d{1,2})\s*(am|pm)/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
    if (timeMatch[2] === 'am' && hour === 12) hour = 0;
    suggestedTime = `${hour.toString().padStart(2, '0')}:00`;
  } else if (lowerMessage.includes('morning')) {
    suggestedTime = '09:00';
  } else if (lowerMessage.includes('afternoon')) {
    suggestedTime = '14:00';
  } else if (lowerMessage.includes('evening')) {
    suggestedTime = '18:00';
  }

  // Clean the title
  let title = message.replace(/@\S+/g, '').trim();
  if (title.length > 60) title = title.slice(0, 60) + '...';

  return {
    title: title || 'New Meeting',
    participants,
    suggestedDate,
    suggestedTime,
    duration: 60,
    priority: lowerMessage.includes('urgent') || lowerMessage.includes('important') ? 'must' : 'should',
    isSchedulingRequest
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
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
    const dateContext = `Today is ${today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}.`;

    // Format busy slots for the prompt - group by date for clarity
    const sortedBusySlots = [...(busySlots as BusySlot[])].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    
    const busySlotsContext = sortedBusySlots.length > 0 
      ? `\n\n**USER'S BUSY TIMES (ABSOLUTELY DO NOT SCHEDULE DURING THESE - THIS IS CRITICAL):**\n${sortedBusySlots.map((slot: BusySlot) => 
          `- ${slot.date} ${slot.startTime}-${slot.endTime}: "${slot.title}"`
        ).join('\n')}\n\n**CONFLICT CHECKING REQUIRED**: Before suggesting ANY time, verify it does NOT overlap with the above busy slots. A time conflicts if it starts during OR overlaps with any busy slot on the same date.`
      : '';

    const locationContext = userLocation 
      ? `\nUser's location: ${userLocation}. Prefer suggesting locations near this area.`
      : '';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an agentic scheduling assistant for Gatherly. Your job is to interpret natural-language messages and intelligently update meeting details.

${dateContext}${locationContext}

Known contacts: ${contactNames.join(', ') || 'none'}
${busySlotsContext}

**UNDERSTANDING FORM CONTEXT:**
The user's message may include "Current form state:" with existing event details. You MUST:
1. USE the existing event name to infer appropriate times (e.g., "Lunch Meeting" → lunch times 11:30-13:30)
2. PRESERVE existing values unless the user explicitly wants to change them
3. If user says "select good times" or similar, use the event name/context to pick appropriate times
4. If user mentions a partial location (like "dunster"), expand it to the full known location (e.g., "Dunster House, Cambridge, MA" if user is at Harvard)

**CRITICAL: AVOID BUSY TIMES - THIS IS MANDATORY**
- NEVER suggest times that overlap with ANY busy slot listed above
- A conflict occurs if your suggested time would START during OR OVERLAP with any busy period
- For example: if busy 10:00-11:00, do NOT suggest 10:00, 10:30, or any time where a 1-hour meeting would overlap
- Before outputting ANY time suggestion, mentally verify it against ALL busy slots on that date
- If ALL reasonable times on a date are busy, pick a DIFFERENT DATE
- This is the #1 priority - the user CANNOT be double-booked

**CORE PRINCIPLES:**
1. Infer clear event names from context ("I want to go to the movies with friends" → "Movies with Friends")
2. For locations: if user says a partial name like "dunster", expand to full name "Dunster House" with appropriate address
3. **TIME INFERENCE RULES - MATCH EVENT NAME:**
   - If event contains "Breakfast" → 08:00-10:00
   - If event contains "Brunch" → 10:00-12:00  
   - If event contains "Lunch" → 11:30-13:30
   - If event contains "Dinner" → 18:00-21:00
   - If event contains "Party/Hangout/Social" → 17:00-22:00
   - Work meetings: 09:00-17:00
   - Coffee/Casual: 10:00-16:00
4. **WEEKEND HANDLING - CRITICAL:**
   - If user says "weekend", "saturday", "sunday" - ALL suggestions should be on weekend days
   - If user says "this weekend" - use the upcoming Saturday/Sunday
   - If user says "next weekend" - use Saturday/Sunday of the following week
5. When users provide explicit dates or times, use them
6. Modify ONLY fields the user clearly intends to change

**LOCATION RULES:**
- If specific place mentioned: expand partial names to full addresses (e.g., "dunster" → "Dunster House, Memorial Drive, Cambridge, MA")
- If "zoom", "video call", "online", "virtual", "teams", "meet" mentioned: use "Google Meet" or the specific platform
- If NOT specified and no existing location: use "TBD"
- If the form already has a location and user doesn't mention location: preserve it

**ALWAYS PROVIDE 3 TIME SUGGESTIONS:**
- You MUST always provide suggestedDate, suggestedTime, suggestedDate2, suggestedTime2, suggestedDate3, suggestedTime3
- Base times on the EVENT NAME context (Lunch = lunch times, Dinner = dinner times, etc.)
- Space them out across different times and/or days
- VERIFY each suggestion doesn't conflict with busy times

Return JSON with ALL these fields:
{
  "isSchedulingRequest": boolean,
  "title": string,
  "participants": string[],
  "suggestedDate": "YYYY-MM-DD",
  "suggestedTime": "HH:MM",
  "suggestedDate2": "YYYY-MM-DD",
  "suggestedTime2": "HH:MM",
  "suggestedDate3": "YYYY-MM-DD",
  "suggestedTime3": "HH:MM",
  "duration": number (IN MINUTES - e.g., 60 for 1 hour, 120 for 2 hours, 30 for 30 minutes),
  "location": string,
  "priority": "must" | "should" | "maybe",
  "notes": string
}

REMEMBER: 
- Match times to the event type from the event name
- Expand partial location names to full addresses
- NEVER suggest times that conflict with busy slots
- ALWAYS provide all 3 time suggestions
- PRESERVE existing form values unless explicitly changed`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 600
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
    
    // Normalize duration - AI might return in hours (e.g., 2) instead of minutes (120)
    // If duration is less than 10, assume it's hours and convert to minutes
    let duration = parsed.duration || 60;
    if (duration > 0 && duration < 10) {
      duration = duration * 60; // Convert hours to minutes
    }
    
    return res.status(200).json({
      title: parsed.title || message.slice(0, 50),
      participants: parsed.participants || [],
      suggestedDate: parsed.suggestedDate,
      suggestedTime: parsed.suggestedTime,
      suggestedDate2: parsed.suggestedDate2,
      suggestedTime2: parsed.suggestedTime2,
      suggestedDate3: parsed.suggestedDate3,
      suggestedTime3: parsed.suggestedTime3,
      duration,
      location: parsed.location,
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
