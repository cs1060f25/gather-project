import type { VercelRequest, VercelResponse } from '@vercel/node';

// Safely access server-side environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

export interface ParsedSchedulingData {
  title: string;
  participants: string[];
  suggestedDate?: string;
  suggestedTime?: string;
  duration?: number;
  location?: string;
  priority?: 'must' | 'should' | 'maybe';
  notes?: string;
  isSchedulingRequest: boolean;
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
    const { message, contactNames = [] } = req.body;

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
            content: `You are an agentic scheduling assistant for Gatherly. Your job is to interpret natural-language messages and update only the relevant fields in the Create Event form.

${dateContext}

Known contacts: ${contactNames.join(', ') || 'none'}

**CORE PRINCIPLES:**
1. Infer clear event names from context ("I want to go to the movies with friends" → "Movies with Friends")
2. Extract locations exactly as stated ("ice skating rink," "downtown bistro")
3. **TIME INFERENCE RULES - FOLLOW STRICTLY:**
   - Breakfast: 08:00-10:00
   - Brunch: 10:00-12:00  
   - Lunch: 11:30-13:30
   - **Dinner: MUST be 18:00 or later (18:00-21:00)** - people eat dinner in the evening
   - **Parties/Hangouts/Social: 17:00-22:00** - social events happen after work hours
   - Work meetings: 09:00-17:00
   - Coffee/Casual: 10:00-16:00
4. **WEEKEND HANDLING - CRITICAL:**
   - If user says "weekend", "saturday", "sunday" - ALL suggestions should be on weekend days
   - If user says "this weekend" - use the upcoming Saturday/Sunday
   - If user says "next weekend" - use Saturday/Sunday of the following week
5. When users provide explicit dates or times, use them
6. Modify ONLY fields the user clearly intends to change, preserving existing values in the form state
7. Add or remove participants ONLY when explicitly requested

**LOCATION RULES:**
- If specific place mentioned: use it exactly
- If "zoom", "video call", "online", "virtual", "teams", "meet" mentioned: use "Google Meet" or the specific platform
- If NOT specified: use "TBD"
- For MEALS: assume physical location unless stated otherwise → "TBD"

**SUGGESTED TIMES STRATEGY:**
- Provide 3 different time slot suggestions that are SPACED OUT:
  - If it's a dinner → 18:00, 18:30, 19:00 (all evening, different times)
  - If it's weekend → spread across Saturday AND Sunday
  - Don't bunch all suggestions in the same hour
  - Consider variety: different days if event is flexible

**WHAT TO HANDLE:**
- Creation of new events
- Incremental updates
- Rescheduling and location changes
- Participant modifications

**WHAT TO IGNORE:**
- Vague messages ("Bored," "hmm")
- Never fabricate participants

Return JSON:
- isSchedulingRequest: boolean
- title: string (clean event title)
- participants: string[] (match to contacts)
- suggestedDate: string (YYYY-MM-DD) 
- suggestedTime: string (HH:MM 24h - MUST match event type! Dinner=18:00+)
- suggestedDate2: string (optional second date for variety)
- suggestedTime2: string (optional second time)
- suggestedDate3: string (optional third date)
- suggestedTime3: string (optional third time)
- duration: number (minutes)
- location: string (specific place or "TBD")
- priority: "must" | "should" | "maybe"
- notes: string

REMEMBER: Dinner times MUST be 18:00 or later. Weekend events MUST be on Sat/Sun.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 500
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
    return res.status(200).json({
      title: parsed.title || message.slice(0, 50),
      participants: parsed.participants || [],
      suggestedDate: parsed.suggestedDate,
      suggestedTime: parsed.suggestedTime,
      duration: parsed.duration || 60,
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
