import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

interface CalendarEvent {
  title: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  isGatherly?: boolean;
  status?: string;
  attendees?: string[];
}

interface SuggestedEvent {
  title: string;
  reason: string;
  suggestedDate: string;
  suggestedTime: string;
  duration: number;
}

interface DailySummaryResponse {
  greeting: string;
  focusSummary: string;
  todayHighlights: string[];
  lookAhead: string;
  suggestedEvents: SuggestedEvent[];
}

// Fallback summary without AI
function generateBasicSummary(events: CalendarEvent[], userName: string): DailySummaryResponse {
  const today = new Date();
  const todayISO = today.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];
  
  const todayEvents = events.filter(e => e.date === todayISO);
  const tomorrowEvents = events.filter(e => e.date === tomorrowISO);
  
  const hour = today.getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';
  
  const firstName = userName.split(' ')[0] || 'there';
  
  let focusSummary = '';
  if (todayEvents.length === 0) {
    focusSummary = `Your day is clear${firstName !== 'there' ? `, ${firstName}` : ''}! Great time for focused work or planning ahead.`;
  } else if (todayEvents.length === 1) {
    focusSummary = `Just one thing on tap today: ${todayEvents[0].title}. Plenty of room to be productive!`;
  } else if (todayEvents.length <= 3) {
    focusSummary = `You have ${todayEvents.length} events today. A balanced schedule—you've got this!`;
  } else {
    focusSummary = `Busy day ahead with ${todayEvents.length} events. Pace yourself and stay hydrated!`;
  }
  
  const todayHighlights = todayEvents.slice(0, 3).map(e => {
    const timeStr = e.time ? new Date(`2000-01-01T${e.time}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }) : 'All day';
    return `${timeStr} — ${e.title}`;
  });
  
  let lookAhead = '';
  if (tomorrowEvents.length === 0) {
    lookAhead = 'Tomorrow looks clear so far.';
  } else {
    lookAhead = `Tomorrow you have ${tomorrowEvents.length} event${tomorrowEvents.length > 1 ? 's' : ''} coming up.`;
  }
  
  // Suggest events only if calendar is relatively free
  const suggestedEvents: SuggestedEvent[] = [];
  if (todayEvents.length < 3) {
    // Suggest based on time of day
    if (hour < 10) {
      suggestedEvents.push({
        title: 'Morning Focus Block',
        reason: 'Best time for deep work',
        suggestedDate: todayISO,
        suggestedTime: '09:00',
        duration: 90
      });
    } else if (hour < 14) {
      suggestedEvents.push({
        title: 'Lunch with a colleague',
        reason: 'Good for networking',
        suggestedDate: todayISO,
        suggestedTime: '12:00',
        duration: 60
      });
    }
  }
  
  return {
    greeting: `${greeting}, ${firstName}!`,
    focusSummary,
    todayHighlights,
    lookAhead,
    suggestedEvents
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { events = [], userName = '', contacts = [] } = req.body;

    if (!OPENAI_API_KEY) {
      return res.status(200).json(generateBasicSummary(events, userName));
    }

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    // Get events for the next 7 days
    const relevantEvents = (events as CalendarEvent[])
      .filter(e => {
        const eventDate = new Date(e.date);
        const daysDiff = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff < 7;
      })
      .slice(0, 20); // Limit to avoid token overflow

    const eventsContext = relevantEvents.length > 0
      ? `Events for the next 7 days:\n${relevantEvents.map(e => 
          `- ${e.date} ${e.time || 'all day'}: "${e.title}"${e.location ? ` at ${e.location}` : ''}${e.isGatherly ? ' [Gatherly event]' : ''}`
        ).join('\n')}`
      : 'No events scheduled for the next week.';

    const contactsContext = contacts.length > 0
      ? `\nKnown contacts: ${contacts.slice(0, 10).join(', ')}`
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
            content: `You are a friendly, concise personal assistant helping someone start their day. Generate a brief daily summary.

Today is ${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}.
User's name: ${userName || 'User'}
${eventsContext}${contactsContext}

Generate a JSON response with:
1. "greeting" - Warm, personalized greeting using their first name (2-5 words)
2. "focusSummary" - One sentence about what to focus on today. Be human, casual, helpful. Not corporate-speak.
3. "todayHighlights" - Array of up to 3 key things happening today (time — event format, be concise)
4. "lookAhead" - One sentence preview of tomorrow/this week. Casual tone.
5. "suggestedEvents" - Array of 1-2 suggested events IF the calendar has room. Each has:
   - "title": catchy event name
   - "reason": why this would be good (short)
   - "suggestedDate": YYYY-MM-DD
   - "suggestedTime": HH:MM
   - "duration": minutes

TONE GUIDELINES:
- Be warm and human, like a helpful friend
- Use simple words, not business jargon
- If it's a busy day, be encouraging
- If it's light, suggest productive ways to use the time
- Keep everything SHORT and punchy

Example outputs:
- "Big presentation day! You've prepared well—go nail it."
- "Light schedule today. Perfect for tackling that project you've been putting off."
- "Back-to-back meetings until 3pm, then you're free. Hang in there!"

Return ONLY valid JSON, no markdown.`
          },
          {
            role: 'user',
            content: 'Generate my daily summary.'
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status);
      return res.status(200).json(generateBasicSummary(events, userName));
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(200).json(generateBasicSummary(events, userName));
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json(generateBasicSummary(events, userName));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json({
      greeting: parsed.greeting || `Hey, ${userName.split(' ')[0] || 'there'}!`,
      focusSummary: parsed.focusSummary || 'Make today count!',
      todayHighlights: parsed.todayHighlights || [],
      lookAhead: parsed.lookAhead || '',
      suggestedEvents: (parsed.suggestedEvents || []).slice(0, 2)
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    const { events = [], userName = '' } = req.body;
    return res.status(200).json(generateBasicSummary(events, userName));
  }
}

