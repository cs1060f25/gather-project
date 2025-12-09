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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
            content: `You are a scheduling assistant. Parse the user's message and extract scheduling information.
${dateContext}

Known contacts: ${contactNames.join(', ') || 'none'}

Return a JSON object with these fields:
- isSchedulingRequest: boolean (true if this is a request to schedule something)
- title: string (the event title/purpose)
- participants: string[] (names or emails of people mentioned, match to known contacts if possible)
- suggestedDate: string (ISO date YYYY-MM-DD, interpret relative dates like "tomorrow", "next Tuesday")
- suggestedTime: string (24h format HH:MM, interpret times like "2pm" = "14:00", "morning" = "09:00", "afternoon" = "14:00", "evening" = "18:00")
- duration: number (in minutes, default 60 if not specified)
- location: string (place if mentioned, or "virtual" for video calls)
- priority: "must" | "should" | "maybe" (based on urgency words like "urgent", "important", "if possible")
- notes: string (any additional context)

Only include fields that are explicitly mentioned or can be reasonably inferred.`
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
