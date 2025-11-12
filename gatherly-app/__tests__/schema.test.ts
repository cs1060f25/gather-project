/**
 * Schema Validation Tests
 * Linear Task: GATHER-27 (HW9)
 * 
 * Tests for database schema types and validation
 */

import {
  User,
  EventSession,
  Message,
  AvailabilityBlock,
  PreferenceProfile,
  SchedulingEvent,
  SessionStatus,
  MessageRole,
  AvailabilitySource,
  SchedulingOutcome,
} from '../types/schema';

describe('Schema Type Validation', () => {
  describe('User Schema', () => {
    it('should create a valid User object', () => {
      const user: User = {
        id: 'user_test123',
        email: 'test@stanford.edu',
        name: 'Test User',
        timezone: 'America/Los_Angeles',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.id).toBe('user_test123');
      expect(user.email).toBe('test@stanford.edu');
      expect(user.timezone).toBe('America/Los_Angeles');
    });

    it('should include optional calendar connections', () => {
      const user: User = {
        id: 'user_test123',
        email: 'test@stanford.edu',
        name: 'Test User',
        timezone: 'America/Los_Angeles',
        calendars: [
          {
            provider: 'google',
            calendarId: 'primary',
            isPrimary: true,
            readOnly: false,
            syncedAt: new Date(),
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.calendars).toBeDefined();
      expect(user.calendars?.length).toBe(1);
      expect(user.calendars?.[0].provider).toBe('google');
    });

    it('should include default preferences', () => {
      const user: User = {
        id: 'user_test123',
        email: 'test@stanford.edu',
        name: 'Test User',
        timezone: 'America/Los_Angeles',
        defaultPreferences: {
          preferredDuration: 30,
          bufferTime: 15,
          workingHours: {
            start: '09:00',
            end: '17:00',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user.defaultPreferences).toBeDefined();
      expect(user.defaultPreferences?.preferredDuration).toBe(30);
      expect(user.defaultPreferences?.workingHours.start).toBe('09:00');
    });
  });

  describe('EventSession Schema', () => {
    it('should create a valid EventSession with required fields', () => {
      const session: EventSession = {
        id: 'session_test123',
        hostUserId: 'user_host',
        inviteeIds: ['user_invitee1', 'user_invitee2'],
        title: 'Team Sync',
        duration: 60,
        status: 'pending' as SessionStatus,
        createdAt: new Date(),
      };

      expect(session.id).toBe('session_test123');
      expect(session.inviteeIds.length).toBe(2);
      expect(session.status).toBe('pending');
    });

    it('should include proposed times with confidence scores', () => {
      const session: EventSession = {
        id: 'session_test123',
        hostUserId: 'user_host',
        inviteeIds: ['user_invitee1'],
        title: 'Meeting',
        duration: 30,
        status: 'pending' as SessionStatus,
        proposedTimes: [
          {
            start: new Date('2025-11-15T14:00:00Z'),
            end: new Date('2025-11-15T14:30:00Z'),
            confidence: 0.95,
            conflicts: [],
          },
          {
            start: new Date('2025-11-15T15:00:00Z'),
            end: new Date('2025-11-15T15:30:00Z'),
            confidence: 0.82,
            conflicts: ['Back-to-back meetings'],
          },
        ],
        createdAt: new Date(),
      };

      expect(session.proposedTimes).toBeDefined();
      expect(session.proposedTimes?.length).toBe(2);
      expect(session.proposedTimes?.[0].confidence).toBe(0.95);
      expect(session.proposedTimes?.[1].conflicts?.[0]).toBe('Back-to-back meetings');
    });

    it('should support all session statuses', () => {
      const statuses: SessionStatus[] = ['pending', 'scheduled', 'cancelled', 'failed'];

      statuses.forEach(status => {
        const session: EventSession = {
          id: 'session_test',
          hostUserId: 'user_host',
          inviteeIds: [],
          title: 'Test',
          duration: 30,
          status,
          createdAt: new Date(),
        };

        expect(session.status).toBe(status);
      });
    });

    it('should include scheduling constraints', () => {
      const session: EventSession = {
        id: 'session_test123',
        hostUserId: 'user_host',
        inviteeIds: ['user_invitee1'],
        title: 'Meeting',
        duration: 60,
        status: 'pending' as SessionStatus,
        constraints: {
          daysOfWeek: ['monday', 'tuesday', 'wednesday'],
          timeRange: {
            start: '14:00',
            end: '18:00',
          },
          excludeDates: ['2025-11-20'],
        },
        createdAt: new Date(),
      };

      expect(session.constraints).toBeDefined();
      expect(session.constraints?.daysOfWeek?.length).toBe(3);
      expect(session.constraints?.timeRange?.start).toBe('14:00');
    });
  });

  describe('Message Schema', () => {
    it('should create messages with different roles', () => {
      const roles: MessageRole[] = ['user', 'assistant', 'system'];

      roles.forEach(role => {
        const message: Message = {
          id: `msg_${role}`,
          sessionId: 'session_123',
          role,
          content: `Test message from ${role}`,
          timestamp: new Date(),
        };

        expect(message.role).toBe(role);
        expect(message.content).toContain(role);
      });
    });

    it('should include extracted entities metadata', () => {
      const message: Message = {
        id: 'msg_001',
        sessionId: 'session_123',
        role: 'user',
        content: 'Schedule lunch with Alice and Bob next Tuesday at 12pm',
        metadata: {
          extractedEntities: {
            attendees: ['Alice', 'Bob'],
            timeframe: 'next Tuesday',
            times: ['12pm'],
            preference: 'lunch',
          },
        },
        timestamp: new Date(),
      };

      expect(message.metadata?.extractedEntities?.attendees).toEqual(['Alice', 'Bob']);
      expect(message.metadata?.extractedEntities?.timeframe).toBe('next Tuesday');
    });
  });

  describe('AvailabilityBlock Schema', () => {
    it('should create availability blocks from different sources', () => {
      const sources: AvailabilitySource[] = ['calendar', 'preference', 'constraint'];

      sources.forEach(source => {
        const block: AvailabilityBlock = {
          userId: 'user_123',
          start: new Date('2025-11-15T09:00:00Z'),
          end: new Date('2025-11-15T10:00:00Z'),
          source,
          isBusy: source === 'calendar',
        };

        expect(block.source).toBe(source);
        expect(block.isBusy).toBe(source === 'calendar');
      });
    });

    it('should include metadata for busy blocks', () => {
      const block: AvailabilityBlock = {
        userId: 'user_123',
        start: new Date('2025-11-15T09:00:00Z'),
        end: new Date('2025-11-15T10:00:00Z'),
        source: 'calendar',
        isBusy: true,
        metadata: {
          eventTitle: 'CS lecture',
        },
      };

      expect(block.metadata?.eventTitle).toBe('CS lecture');
    });
  });

  describe('PreferenceProfile Schema', () => {
    it('should create a valid preference profile', () => {
      const profile: PreferenceProfile = {
        userId: 'user_123',
        dayOfWeekPatterns: {
          monday: 0.8,
          tuesday: 0.9,
          wednesday: 0.85,
          thursday: 0.75,
          friday: 0.6,
          saturday: 0.1,
          sunday: 0.05,
        },
        timeOfDayPatterns: {
          '09': 0.3,
          '10': 0.5,
          '14': 0.9,
          '15': 0.85,
        },
        durationPreferences: {
          '30': 0.6,
          '60': 0.35,
          '90': 0.05,
        },
        acceptanceRate: 78.5,
        avgResponseTime: 45,
        lastUpdated: new Date(),
        sampleSize: 42,
        createdAt: new Date(),
      };

      expect(profile.dayOfWeekPatterns.tuesday).toBe(0.9);
      expect(profile.timeOfDayPatterns['14']).toBe(0.9);
      expect(profile.acceptanceRate).toBe(78.5);
    });

    it('should validate day of week patterns sum to reasonable values', () => {
      const profile: PreferenceProfile = {
        userId: 'user_123',
        dayOfWeekPatterns: {
          monday: 0.8,
          tuesday: 0.9,
          wednesday: 0.85,
          thursday: 0.75,
          friday: 0.6,
          saturday: 0.1,
          sunday: 0.05,
        },
        timeOfDayPatterns: {},
        durationPreferences: {},
        acceptanceRate: 0,
        avgResponseTime: 0,
        lastUpdated: new Date(),
        sampleSize: 0,
        createdAt: new Date(),
      };

      // All values should be between 0 and 1
      Object.values(profile.dayOfWeekPatterns).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('SchedulingEvent Schema', () => {
    it('should create a valid scheduling event', () => {
      const event: SchedulingEvent = {
        id: 'event_uuid',
        sessionId: 'session_123',
        hostUserId: 'user_host',
        numInvitees: 2,
        outcome: 'scheduled' as SchedulingOutcome,
        timeToSchedule: 8,
        numMessages: 5,
        createdAt: new Date(),
      };

      expect(event.outcome).toBe('scheduled');
      expect(event.numInvitees).toBe(2);
      expect(event.timeToSchedule).toBe(8);
    });

    it('should support all scheduling outcomes', () => {
      const outcomes: SchedulingOutcome[] = ['scheduled', 'cancelled', 'failed'];

      outcomes.forEach(outcome => {
        const event: SchedulingEvent = {
          id: 'event_test',
          sessionId: 'session_123',
          hostUserId: 'user_host',
          numInvitees: 1,
          outcome,
          numMessages: 3,
          createdAt: new Date(),
        };

        expect(event.outcome).toBe(outcome);
      });
    });

    it('should include proposed and selected time slots', () => {
      const event: SchedulingEvent = {
        id: 'event_uuid',
        sessionId: 'session_123',
        hostUserId: 'user_host',
        numInvitees: 1,
        proposedSlots: [
          {
            start: new Date('2025-11-15T14:00:00Z'),
            end: new Date('2025-11-15T15:00:00Z'),
            confidence: 0.9,
          },
        ],
        selectedSlot: {
          start: new Date('2025-11-15T14:00:00Z'),
          end: new Date('2025-11-15T15:00:00Z'),
        },
        outcome: 'scheduled',
        timeToSchedule: 10,
        numMessages: 4,
        createdAt: new Date(),
      };

      expect(event.proposedSlots?.length).toBe(1);
      expect(event.selectedSlot).toBeDefined();
    });
  });
});

describe('Data Flow Integration Tests', () => {
  it('should model a complete scheduling flow', () => {
    // Step 1: User created
    const user: User = {
      id: 'user_alice',
      email: 'alice@stanford.edu',
      name: 'Alice',
      timezone: 'America/Los_Angeles',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Step 2: EventSession created
    const session: EventSession = {
      id: 'session_001',
      hostUserId: user.id,
      inviteeIds: ['user_bob'],
      title: 'Coffee Chat',
      duration: 30,
      status: 'pending',
      createdAt: new Date(),
    };

    // Step 3: User message
    const userMessage: Message = {
      id: 'msg_001',
      sessionId: session.id,
      role: 'user',
      content: 'Schedule coffee with Bob next Tuesday afternoon',
      timestamp: new Date(),
    };

    // Step 4: AI proposes times
    const updatedSession: EventSession = {
      ...session,
      proposedTimes: [
        {
          start: new Date('2025-11-19T14:00:00Z'),
          end: new Date('2025-11-19T14:30:00Z'),
          confidence: 0.95,
        },
      ],
    };

    // Step 5: User accepts
    const finalSession: EventSession = {
      ...updatedSession,
      status: 'scheduled',
      finalTime: updatedSession.proposedTimes![0],
      scheduledAt: new Date(),
    };

    // Step 6: Log analytics
    const analyticsEvent: SchedulingEvent = {
      id: 'event_001',
      sessionId: session.id,
      hostUserId: user.id,
      numInvitees: 1,
      outcome: 'scheduled',
      timeToSchedule: 5,
      numMessages: 3,
      createdAt: new Date(),
    };

    // Assertions
    expect(user.id).toBe(finalSession.hostUserId);
    expect(finalSession.status).toBe('scheduled');
    expect(analyticsEvent.outcome).toBe('scheduled');
  });

  it('should model a failed scheduling attempt', () => {
    const session: EventSession = {
      id: 'session_002',
      hostUserId: 'user_alice',
      inviteeIds: ['user_bob'],
      title: 'Meeting',
      duration: 60,
      status: 'failed',
      proposedTimes: [],
      metadata: {
        failureReason: 'No mutual availability in next 7 days',
        suggestions: ['Extend search window', 'Reduce meeting duration'],
      },
      createdAt: new Date(),
    };

    const analyticsEvent: SchedulingEvent = {
      id: 'event_002',
      sessionId: session.id,
      hostUserId: 'user_alice',
      numInvitees: 1,
      outcome: 'failed',
      numMessages: 6,
      createdAt: new Date(),
    };

    expect(session.status).toBe('failed');
    expect(session.metadata?.failureReason).toContain('No mutual availability');
    expect(analyticsEvent.outcome).toBe('failed');
  });
});

