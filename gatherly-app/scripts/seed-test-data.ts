#!/usr/bin/env ts-node
/**
 * Test Data Seeding Script
 * Run: npx ts-node scripts/seed-test-data.ts
 */

import { getUserService, getEventSessionService, getMessageService } from '../lib/db/services';
import { getPreferenceService, getSchedulingEventService } from '../lib/db/services';

async function seedTestData() {
  console.log('🌱 Seeding test data...\n');

  try {
    const userService = getUserService();
    const sessionService = getEventSessionService();
    const messageService = getMessageService();
    const preferenceService = getPreferenceService();
    const eventService = getSchedulingEventService();

    // Create test user
    console.log('1️⃣  Creating test user...');
    const testUser = await userService.createUser({
      email: 'test@gatherly.dev',
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
    });
    console.log(`   ✅ Created user: ${testUser.id}\n`);

    // Create test session
    console.log('2️⃣  Creating test session...');
    const testSession = await sessionService.createSession({
      hostUserId: testUser.id,
      inviteeIds: ['test_invitee_123'],
      title: 'Test Meeting',
      duration: 30,
      status: 'pending',
      proposedTimes: [
        {
          start: new Date('2025-11-18T14:00:00Z'),
          end: new Date('2025-11-18T14:30:00Z'),
          confidence: 0.95,
        },
      ],
    });
    console.log(`   ✅ Created session: ${testSession.id}\n`);

    // Add test message
    console.log('3️⃣  Adding test message...');
    const testMessage = await messageService.addMessage(testSession.id, {
      sessionId: testSession.id,
      role: 'user',
      content: 'Schedule a test meeting next week',
    });
    console.log(`   ✅ Created message: ${testMessage.id}\n`);

    // Create preference profile
    console.log('4️⃣  Creating preference profile...');
    const testProfile = await preferenceService.createProfile({
      userId: testUser.id,
      dayOfWeekPatterns: {
        monday: 0.75,
        tuesday: 0.85,
        wednesday: 0.90,
        thursday: 0.80,
        friday: 0.60,
        saturday: 0.10,
        sunday: 0.05,
      },
      timeOfDayPatterns: {
        '09': 0.20,
        '10': 0.35,
        '14': 0.80,
        '15': 0.90,
      },
      durationPreferences: {
        '30': 0.60,
        '60': 0.35,
      },
      acceptanceRate: 75.0,
      avgResponseTime: 42,
      lastUpdated: new Date(),
      sampleSize: 10,
    });
    console.log(`   ✅ Created preference profile for: ${testProfile.userId}\n`);

    // Log analytics event
    console.log('5️⃣  Logging analytics event...');
    const testEvent = await eventService.logEvent({
      sessionId: testSession.id,
      hostUserId: testUser.id,
      numInvitees: 1,
      outcome: 'scheduled',
      timeToSchedule: 8,
      numMessages: 3,
      selectedSlot: {
        start: new Date('2025-11-18T14:00:00Z'),
        end: new Date('2025-11-18T14:30:00Z'),
      },
    });
    console.log(`   ✅ Logged event: ${testEvent.id}\n`);

    console.log('✨ Test data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - User: ${testUser.email}`);
    console.log(`   - Session: ${testSession.title}`);
    console.log(`   - Messages: 1`);
    console.log(`   - Preference profile: Created`);
    console.log(`   - Analytics event: Logged`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();

