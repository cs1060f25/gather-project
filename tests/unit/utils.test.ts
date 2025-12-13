/**
 * Gatherly Unit Tests
 * Tests for utility functions: date formatting, validation, parsing, and event utilities
 */

import {
  formatLocalDate,
  formatDisplayDate,
  timeToMinutes,
  minutesToTime,
  formatTime12h,
  isValidEmail,
  isDateInPast,
  isDateTimeInPast,
  parseTimeReference,
  parseDateReference,
  extractMentions,
  isSchedulingRequest,
  getSuggestedTimes,
  getInviteStats,
  truncateText,
  parseDuration,
} from '../../src/lib/utils';

// ============================================================================
// 1. Date Formatting Tests
// ============================================================================

describe('formatLocalDate', () => {
  test('formats date as YYYY-MM-DD', () => {
    const date = new Date(2025, 11, 15); // Dec 15, 2025
    expect(formatLocalDate(date)).toBe('2025-12-15');
  });

  test('pads single digit months and days', () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025
    expect(formatLocalDate(date)).toBe('2025-01-05');
  });

  test('handles end of year dates', () => {
    const date = new Date(2025, 11, 31); // Dec 31, 2025
    expect(formatLocalDate(date)).toBe('2025-12-31');
  });
});

describe('timeToMinutes', () => {
  test('converts midnight to 0', () => {
    expect(timeToMinutes('00:00')).toBe(0);
  });

  test('converts noon to 720', () => {
    expect(timeToMinutes('12:00')).toBe(720);
  });

  test('converts 9:30 AM to 570', () => {
    expect(timeToMinutes('09:30')).toBe(570);
  });

  test('converts 6 PM to 1080', () => {
    expect(timeToMinutes('18:00')).toBe(1080);
  });

  test('handles time without minutes', () => {
    expect(timeToMinutes('14')).toBe(840);
  });
});

describe('minutesToTime', () => {
  test('converts 0 to midnight', () => {
    expect(minutesToTime(0)).toBe('00:00');
  });

  test('converts 720 to noon', () => {
    expect(minutesToTime(720)).toBe('12:00');
  });

  test('converts 570 to 9:30', () => {
    expect(minutesToTime(570)).toBe('09:30');
  });

  test('converts 1080 to 6 PM', () => {
    expect(minutesToTime(1080)).toBe('18:00');
  });
});

describe('formatTime12h', () => {
  test('formats midnight correctly', () => {
    expect(formatTime12h('00:00')).toBe('12:00 AM');
  });

  test('formats noon correctly', () => {
    expect(formatTime12h('12:00')).toBe('12:00 PM');
  });

  test('formats morning time', () => {
    expect(formatTime12h('09:30')).toBe('9:30 AM');
  });

  test('formats evening time', () => {
    expect(formatTime12h('18:45')).toBe('6:45 PM');
  });
});

// ============================================================================
// 2. Validation Tests
// ============================================================================

describe('isValidEmail', () => {
  test('accepts valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@email.co.uk')).toBe(true);
  });

  test('rejects invalid email addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@missing.local')).toBe(false);
    expect(isValidEmail('missing@.com')).toBe(false);
    expect(isValidEmail('spaces in@email.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('handles whitespace trimming', () => {
    expect(isValidEmail('  test@example.com  ')).toBe(true);
  });
});

describe('isDateInPast', () => {
  test('returns true for past dates', () => {
    expect(isDateInPast('2020-01-01')).toBe(true);
    expect(isDateInPast('2000-12-31')).toBe(true);
  });

  test('returns false for future dates', () => {
    expect(isDateInPast('2030-01-01')).toBe(false);
    expect(isDateInPast('2099-12-31')).toBe(false);
  });
});

// ============================================================================
// 3. Parsing Tests
// ============================================================================

describe('parseTimeReference', () => {
  test('parses direct time formats', () => {
    expect(parseTimeReference('at 3pm')).toBe('15:00');
    expect(parseTimeReference('at 10 am')).toBe('10:00');
    expect(parseTimeReference('12pm')).toBe('12:00');
    expect(parseTimeReference('12am')).toBe('00:00');
  });

  test('parses named time periods', () => {
    expect(parseTimeReference('in the morning')).toBe('09:00');
    expect(parseTimeReference('afternoon meeting')).toBe('14:00');
    expect(parseTimeReference('evening dinner')).toBe('18:00');
    expect(parseTimeReference('at noon')).toBe('12:00');
  });

  test('parses special times', () => {
    expect(parseTimeReference('at sunrise')).toBe('07:00');
    expect(parseTimeReference('around sunset')).toBe('18:00');
  });

  test('returns null for no time reference', () => {
    expect(parseTimeReference('meeting with John')).toBe(null);
    expect(parseTimeReference('schedule something')).toBe(null);
  });
});

describe('parseDateReference', () => {
  const baseDate = new Date(2025, 11, 15); // Dec 15, 2025 (Monday)

  test('parses today', () => {
    expect(parseDateReference('today', baseDate)).toBe('2025-12-15');
  });

  test('parses tomorrow', () => {
    expect(parseDateReference('tomorrow', baseDate)).toBe('2025-12-16');
  });

  test('parses next week', () => {
    expect(parseDateReference('next week', baseDate)).toBe('2025-12-22');
  });

  test('returns null for no date reference', () => {
    expect(parseDateReference('meeting with team', baseDate)).toBe(null);
  });
});

describe('extractMentions', () => {
  test('extracts single mention', () => {
    expect(extractMentions('meeting with @john')).toEqual(['john']);
  });

  test('extracts multiple mentions', () => {
    expect(extractMentions('@alice and @bob')).toEqual(['alice', 'bob']);
  });

  test('returns empty array for no mentions', () => {
    expect(extractMentions('no mentions here')).toEqual([]);
  });
});

describe('isSchedulingRequest', () => {
  test('detects scheduling keywords', () => {
    expect(isSchedulingRequest('schedule a meeting')).toBe(true);
    expect(isSchedulingRequest('lets grab coffee')).toBe(true);
    expect(isSchedulingRequest('lunch tomorrow')).toBe(true);
    expect(isSchedulingRequest('dinner with friends')).toBe(true);
    expect(isSchedulingRequest('video call')).toBe(true);
    expect(isSchedulingRequest('lets sync up')).toBe(true);
    expect(isSchedulingRequest('catch up soon')).toBe(true);
  });

  test('returns false for non-scheduling text', () => {
    expect(isSchedulingRequest('hello there')).toBe(false);
    expect(isSchedulingRequest('nice weather')).toBe(false);
  });
});

// ============================================================================
// 4. Event Utilities Tests
// ============================================================================

describe('getSuggestedTimes', () => {
  test('returns available time for empty calendar', () => {
    const result = getSuggestedTimes([], '2025-12-15', 60);
    // With no events, the entire work day (9 AM - 6 PM) is available
    // Function returns the start of the first available slot
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toBe('09:00');
  });

  test('finds gap before first event', () => {
    const events = [
      { date: '2025-12-15', time: '11:00', endTime: '12:00' }
    ];
    const result = getSuggestedTimes(events, '2025-12-15', 60);
    expect(result[0]).toBe('09:00'); // 9-10 is free
  });

  test('finds gap between events', () => {
    const events = [
      { date: '2025-12-15', time: '09:00', endTime: '10:00' },
      { date: '2025-12-15', time: '14:00', endTime: '15:00' }
    ];
    const result = getSuggestedTimes(events, '2025-12-15', 60);
    expect(result).toContain('10:00'); // Gap between 10-14
  });

  test('finds time after last event', () => {
    const events = [
      { date: '2025-12-15', time: '09:00', endTime: '10:00' }
    ];
    const result = getSuggestedTimes(events, '2025-12-15', 60);
    expect(result).toContain('10:00');
  });

  test('respects duration requirement', () => {
    const events = [
      { date: '2025-12-15', time: '09:00', endTime: '09:30' },
      { date: '2025-12-15', time: '10:00', endTime: '11:00' }
    ];
    // 30 min gap is not enough for 60 min meeting
    const result = getSuggestedTimes(events, '2025-12-15', 60);
    expect(result).not.toContain('09:30');
  });

  test('only considers events on target date', () => {
    const events = [
      { date: '2025-12-14', time: '09:00', endTime: '17:00' }, // Different day
      { date: '2025-12-15', time: '11:00', endTime: '12:00' }
    ];
    const result = getSuggestedTimes(events, '2025-12-15', 60);
    expect(result[0]).toBe('09:00'); // 9 AM is free on target date
  });

  test('returns max 3 suggestions', () => {
    const result = getSuggestedTimes([], '2025-12-15', 60);
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

// ============================================================================
// 5. Invite Statistics Tests
// ============================================================================

describe('getInviteStats', () => {
  test('counts all invite statuses correctly', () => {
    const invites = [
      { status: 'accepted' as const },
      { status: 'accepted' as const },
      { status: 'declined' as const },
      { status: 'maybe' as const },
      { status: 'pending' as const },
      { status: 'pending' as const },
    ];
    
    const stats = getInviteStats(invites);
    
    expect(stats.total).toBe(6);
    expect(stats.accepted).toBe(2);
    expect(stats.declined).toBe(1);
    expect(stats.maybe).toBe(1);
    expect(stats.pending).toBe(2);
  });

  test('handles empty invite list', () => {
    const stats = getInviteStats([]);
    
    expect(stats.total).toBe(0);
    expect(stats.accepted).toBe(0);
    expect(stats.declined).toBe(0);
    expect(stats.maybe).toBe(0);
    expect(stats.pending).toBe(0);
  });

  test('handles all same status', () => {
    const invites = [
      { status: 'accepted' as const },
      { status: 'accepted' as const },
      { status: 'accepted' as const },
    ];
    
    const stats = getInviteStats(invites);
    
    expect(stats.total).toBe(3);
    expect(stats.accepted).toBe(3);
    expect(stats.declined).toBe(0);
    expect(stats.maybe).toBe(0);
    expect(stats.pending).toBe(0);
  });
});

// ============================================================================
// 6. String Utilities Tests
// ============================================================================

describe('truncateText', () => {
  test('returns original text if shorter than max', () => {
    expect(truncateText('short', 10)).toBe('short');
  });

  test('truncates and adds ellipsis', () => {
    expect(truncateText('this is a long text', 10)).toBe('this is...');
  });

  test('handles exact length', () => {
    expect(truncateText('exact', 5)).toBe('exact');
  });
});

describe('parseDuration', () => {
  test('parses hours', () => {
    expect(parseDuration('1 hour')).toBe(60);
    expect(parseDuration('2 hours')).toBe(120);
    expect(parseDuration('1.5 hours')).toBe(90);
  });

  test('parses minutes', () => {
    expect(parseDuration('30 minutes')).toBe(30);
    expect(parseDuration('45 min')).toBe(45);
    expect(parseDuration('90 mins')).toBe(90);
  });

  test('defaults to 60 for unrecognized format', () => {
    expect(parseDuration('some time')).toBe(60);
    expect(parseDuration('')).toBe(60);
  });
});

