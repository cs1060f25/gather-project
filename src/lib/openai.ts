// Scheduling helper - uses server-side API to keep API keys secure

// Helper to format date as YYYY-MM-DD in local timezone (not UTC)
const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

interface CalendarEvent {
  id: string;
  date: string;
  time?: string;
  endTime?: string;
  title: string;
}

interface BusySlot {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
}

// Parse a natural language message into structured scheduling data
// This calls our secure server-side API which handles the OpenAI integration
export async function parseSchedulingMessage(
  message: string,
  contactNames: string[] = [],
  busySlots: BusySlot[] = [],
  userLocation: string = ''
): Promise<ParsedSchedulingData> {
  try {
    // Call our server-side API to parse the message
    // The API key is safely stored on the server (not exposed to frontend)
    const response = await fetch('/api/parse-scheduling', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        contactNames,
        busySlots,
        userLocation
      })
    });

    if (!response.ok) {
      console.error('API error:', response.status);
      return basicParse(message, contactNames);
    }

    const parsed = await response.json();
    return {
      title: parsed.title || message.slice(0, 50),
      participants: parsed.participants || [],
      suggestedDate: parsed.suggestedDate,
      suggestedTime: parsed.suggestedTime,
      suggestedDate2: parsed.suggestedDate2,
      suggestedTime2: parsed.suggestedTime2,
      suggestedDate3: parsed.suggestedDate3,
      suggestedTime3: parsed.suggestedTime3,
      duration: parsed.duration || 60,
      location: parsed.location,
      priority: parsed.priority || 'should',
      notes: parsed.notes,
      isSchedulingRequest: parsed.isSchedulingRequest ?? true
    };
  } catch (error) {
    console.error('Error calling parsing API:', error);
    return basicParse(message, contactNames);
  }
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
    // Try to match to known contacts
    const match = contactNames.find(c => c.toLowerCase().includes(name.toLowerCase()));
    return match || name;
  });

  // Try to parse date
  let suggestedDate: string | undefined;
  const today = new Date();
  
  if (lowerMessage.includes('tomorrow')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    suggestedDate = formatLocalDate(tomorrow);
  } else if (lowerMessage.includes('next week')) {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    suggestedDate = formatLocalDate(nextWeek);
  } else if (lowerMessage.includes('today')) {
    suggestedDate = formatLocalDate(today);
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

// Get suggested available times based on calendar
export function getSuggestedTimes(
  events: CalendarEvent[],
  targetDate: string,
  durationMinutes: number = 60
): string[] {
  const suggestions: string[] = [];
  const workHours = { start: 9, end: 18 }; // 9 AM to 6 PM
  
  // Get events for the target date
  const dayEvents = events
    .filter(e => e.date === targetDate && e.time)
    .map(e => ({
      start: timeToMinutes(e.time!),
      end: e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.time!) + 60
    }))
    .sort((a, b) => a.start - b.start);

  // Find free slots
  let currentTime = workHours.start * 60; // Start at 9 AM in minutes
  const endTime = workHours.end * 60; // End at 6 PM

  for (const event of dayEvents) {
    // Check if there's a gap before this event
    if (event.start - currentTime >= durationMinutes) {
      suggestions.push(minutesToTime(currentTime));
    }
    currentTime = Math.max(currentTime, event.end);
  }

  // Check if there's time after the last event
  if (endTime - currentTime >= durationMinutes) {
    suggestions.push(minutesToTime(currentTime));
  }

  // If no events, suggest common meeting times
  if (suggestions.length === 0 && dayEvents.length === 0) {
    suggestions.push('09:00', '14:00', '16:00');
  }

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

