/**
 * Gatherly Utility Functions
 * Pure functions for date/time manipulation, validation, and parsing
 */

// ============================================================================
// Date Formatting Utilities
// ============================================================================

/**
 * Format a Date object as YYYY-MM-DD in local timezone (not UTC)
 */
export function formatLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object as a human-readable string
 */
export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Format time from 24h to 12h format
 */
export function formatTime12h(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Check if a date string is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date-time combination is in the past
 */
export function isDateTimeInPast(dateStr: string, timeStr: string): boolean {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const dateTime = new Date(dateStr);
  dateTime.setHours(hours, minutes, 0, 0);
  return dateTime < new Date();
}

// ============================================================================
// Parsing Utilities
// ============================================================================

/**
 * Parse natural language time references
 * Returns suggested time in HH:MM format
 */
export function parseTimeReference(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Direct time match (e.g., "3pm", "10 am")
  const timeMatch = lowerText.match(/(\d{1,2})\s*(am|pm)/);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1]);
    if (timeMatch[2] === 'pm' && hour !== 12) hour += 12;
    if (timeMatch[2] === 'am' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // Named time periods
  if (lowerText.includes('morning')) return '09:00';
  if (lowerText.includes('afternoon')) return '14:00';
  if (lowerText.includes('evening')) return '18:00';
  if (lowerText.includes('noon') || lowerText.includes('midday')) return '12:00';
  if (lowerText.includes('sunrise')) return '07:00';
  if (lowerText.includes('sunset')) return '18:00';

  return null;
}

/**
 * Parse natural language date references
 * Returns date as YYYY-MM-DD string
 */
export function parseDateReference(text: string, baseDate: Date = new Date()): string | null {
  const lowerText = text.toLowerCase();
  const result = new Date(baseDate);
  
  if (lowerText.includes('today')) {
    return formatLocalDate(result);
  }
  
  if (lowerText.includes('tomorrow')) {
    result.setDate(result.getDate() + 1);
    return formatLocalDate(result);
  }
  
  if (lowerText.includes('next week')) {
    result.setDate(result.getDate() + 7);
    return formatLocalDate(result);
  }

  // Day of week matching
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < days.length; i++) {
    if (lowerText.includes(days[i])) {
      const currentDay = baseDate.getDay();
      let daysUntil = i - currentDay;
      if (daysUntil <= 0) daysUntil += 7; // Next occurrence
      result.setDate(result.getDate() + daysUntil);
      return formatLocalDate(result);
    }
  }

  return null;
}

/**
 * Extract @ mentions from text
 * Returns array of mentioned names
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@(\S+)/g) || [];
  return matches.map(m => m.slice(1));
}

/**
 * Check if text contains scheduling keywords
 */
export function isSchedulingRequest(text: string): boolean {
  const lowerText = text.toLowerCase();
  const schedulingKeywords = [
    'schedule', 'meet', 'meeting', 'coffee', 'lunch', 'dinner', 
    'call', 'sync', 'chat', 'catch up', 'book', 'set up', 'plan'
  ];
  return schedulingKeywords.some(kw => lowerText.includes(kw));
}

// ============================================================================
// Event Utilities
// ============================================================================

interface TimeSlot {
  start: number; // minutes since midnight
  end: number;
}

interface CalendarEvent {
  date: string;
  time?: string;
  endTime?: string;
}

/**
 * Get suggested available times for a given date
 * Returns array of available time slots in HH:MM format
 */
export function getSuggestedTimes(
  events: CalendarEvent[],
  targetDate: string,
  durationMinutes: number = 60
): string[] {
  const suggestions: string[] = [];
  const workHours = { start: 9, end: 18 }; // 9 AM to 6 PM

  // Get events for the target date
  const dayEvents: TimeSlot[] = events
    .filter(e => e.date === targetDate && e.time)
    .map(e => ({
      start: timeToMinutes(e.time!),
      end: e.endTime ? timeToMinutes(e.endTime) : timeToMinutes(e.time!) + 60
    }))
    .sort((a, b) => a.start - b.start);

  // Find free slots
  let currentTime = workHours.start * 60;
  const endTime = workHours.end * 60;

  for (const event of dayEvents) {
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

  return suggestions.slice(0, 3);
}

// ============================================================================
// Invite Statistics
// ============================================================================

interface Invite {
  status: 'pending' | 'accepted' | 'declined' | 'maybe';
}

export interface InviteStats {
  total: number;
  accepted: number;
  declined: number;
  maybe: number;
  pending: number;
}

/**
 * Calculate statistics for a list of invites
 */
export function getInviteStats(invites: Invite[]): InviteStats {
  return {
    total: invites.length,
    accepted: invites.filter(i => i.status === 'accepted').length,
    declined: invites.filter(i => i.status === 'declined').length,
    maybe: invites.filter(i => i.status === 'maybe').length,
    pending: invites.filter(i => i.status === 'pending').length,
  };
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate a unique ID for events
 */
export function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse duration string to minutes
 * Handles formats like "1 hour", "30 min", "1.5 hours", "90 minutes"
 */
export function parseDuration(text: string): number {
  const lowerText = text.toLowerCase();
  
  // Match hours
  const hourMatch = lowerText.match(/(\d+\.?\d*)\s*(?:hour|hr)s?/);
  if (hourMatch) {
    return Math.round(parseFloat(hourMatch[1]) * 60);
  }
  
  // Match minutes
  const minMatch = lowerText.match(/(\d+)\s*(?:min|minute)s?/);
  if (minMatch) {
    return parseInt(minMatch[1]);
  }
  
  // Default to 60 minutes
  return 60;
}

