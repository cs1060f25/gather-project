# GATHER-27: Detailed Test Plan for Persistence Layer

**Linear Task:** GATHER-27  
**Component:** Persistence Layer (Firestore + PostgreSQL)  
**Last Updated:** November 12, 2025

---

## Overview

This test plan validates that the persistence layer can correctly represent and handle all data operations required for Gatherly's scheduling agent across Stage 1-3 functionality.

---

## Test Environment Setup

### Prerequisites
- Firebase Project: `gatherly-mvp` (configured and accessible)
- PostgreSQL: Local or cloud instance (can be mocked initially)
- Node.js environment with TypeScript
- Test data generators for realistic scenarios

### Test Data Seeds
```typescript
// Test Users
const testUsers = [
  { id: 'alice_stanford', email: 'alice@stanford.edu', timezone: 'America/Los_Angeles' },
  { id: 'bob_stanford', email: 'bob@stanford.edu', timezone: 'America/New_York' },
  { id: 'carol_stanford', email: 'carol@stanford.edu', timezone: 'Europe/London' },
];

// Test Calendar Events (for availability checking)
const testCalendarEvents = [
  { userId: 'alice_stanford', start: '2025-11-18T09:00:00', end: '2025-11-18T10:00:00', title: 'CS161 Lecture' },
  { userId: 'alice_stanford', start: '2025-11-18T14:00:00', end: '2025-11-18T15:00:00', title: 'Office Hours' },
  { userId: 'bob_stanford', start: '2025-11-18T12:00:00', end: '2025-11-18T13:00:00', title: 'Lunch' },
];
```

---

## Test Scenario 1: Simple 1-on-1 Scheduling

### Scenario Description
Alice wants to schedule a 30-minute coffee chat with Bob next week. Both have some existing commitments.

### Test Steps

#### Step 1: User Authentication & Profile Creation
```typescript
// Test: Create user profiles in Firestore
async function test_createUsers() {
  const userService = getUserService();
  
  // Create Alice
  const alice = await userService.createUser({
    email: 'alice@stanford.edu',
    name: 'Alice Chen',
    timezone: 'America/Los_Angeles',
    calendars: [{
      provider: 'google',
      calendarId: 'primary',
      isPrimary: true,
      readOnly: false,
      syncedAt: new Date()
    }]
  });
  
  // Assert: User created with correct fields
  expect(alice.id).toBeDefined();
  expect(alice.email).toBe('alice@stanford.edu');
  expect(alice.timezone).toBe('America/Los_Angeles');
  
  // Verify in Firestore
  const firestoreDoc = await getDoc(doc(db, 'users', alice.id));
  expect(firestoreDoc.exists()).toBe(true);
  expect(firestoreDoc.data().email).toBe('alice@stanford.edu');
}
```

#### Step 2: Create EventSession
```typescript
// Test: Initialize scheduling session
async function test_createEventSession() {
  const sessionService = getEventSessionService();
  
  const session = await sessionService.createSession({
    hostUserId: 'alice_stanford',
    inviteeIds: ['bob_stanford'],
    title: 'Coffee Chat',
    duration: 30,
    status: 'pending',
    constraints: {
      daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timeRange: { start: '09:00', end: '17:00' },
      excludeDates: ['2025-11-20'] // Thanksgiving week
    }
  });
  
  // Assert: Session created with correct structure
  expect(session.id).toMatch(/^session_/);
  expect(session.hostUserId).toBe('alice_stanford');
  expect(session.inviteeIds).toContain('bob_stanford');
  expect(session.status).toBe('pending');
  
  // Verify constraints are stored correctly
  expect(session.constraints?.daysOfWeek).toHaveLength(5);
  expect(session.constraints?.excludeDates).toContain('2025-11-20');
}
```

#### Step 3: Process Natural Language Input
```typescript
// Test: Store user message in subcollection
async function test_storeMessage() {
  const messageService = getMessageService();
  
  const message = await messageService.addMessage('session_001', {
    sessionId: 'session_001',
    role: 'user',
    content: 'Schedule coffee with Bob next week, preferably Tuesday or Wednesday afternoon',
    metadata: {
      extractedEntities: {
        attendees: ['Bob'],
        timeframe: 'next week',
        preference: 'Tuesday or Wednesday afternoon',
        dates: ['2025-11-19', '2025-11-20'],
        times: ['14:00-17:00']
      }
    }
  });
  
  // Assert: Message stored with metadata
  expect(message.id).toBeDefined();
  expect(message.metadata?.extractedEntities?.attendees).toContain('Bob');
  
  // Verify subcollection structure
  const messages = await messageService.getMessages('session_001');
  expect(messages).toHaveLength(1);
  expect(messages[0].role).toBe('user');
}
```

#### Step 4: Compute Availability
```typescript
// Test: Generate AvailabilityBlocks (runtime computation)
async function test_computeAvailability() {
  // This is computed, not stored, but we test the logic
  const blocks = computeAvailabilityBlocks('alice_stanford', {
    startDate: '2025-11-18',
    endDate: '2025-11-22',
    workingHours: { start: '09:00', end: '17:00' }
  });
  
  // Alice's busy blocks from calendar
  const expectedBusyBlocks = [
    { start: '2025-11-18T09:00:00', end: '2025-11-18T10:00:00', isBusy: true },
    { start: '2025-11-18T14:00:00', end: '2025-11-18T15:00:00', isBusy: true }
  ];
  
  // Assert: Busy times are marked correctly
  expect(blocks).toContainEqual(expect.objectContaining({
    userId: 'alice_stanford',
    source: 'calendar',
    isBusy: true,
    metadata: expect.objectContaining({ eventTitle: 'CS161 Lecture' })
  }));
  
  // Assert: Free times are identified
  const freeBlocks = blocks.filter(b => !b.isBusy);
  expect(freeBlocks.length).toBeGreaterThan(0);
}
```

#### Step 5: Propose Time Slots
```typescript
// Test: Update EventSession with proposed times
async function test_proposeTimeSlots() {
  const sessionService = getEventSessionService();
  
  const proposedTimes = [
    {
      start: new Date('2025-11-19T15:00:00'),
      end: new Date('2025-11-19T15:30:00'),
      confidence: 0.95,
      conflicts: []
    },
    {
      start: new Date('2025-11-20T14:00:00'),
      end: new Date('2025-11-20T14:30:00'),
      confidence: 0.88,
      conflicts: []
    },
    {
      start: new Date('2025-11-20T16:00:00'),
      end: new Date('2025-11-20T16:30:00'),
      confidence: 0.82,
      conflicts: ['Close to end of workday']
    }
  ];
  
  await sessionService.updateSession('session_001', {
    proposedTimes,
    status: 'pending' // Still pending until accepted
  });
  
  // Assert: Proposed times are stored
  const updatedSession = await sessionService.getSession('session_001');
  expect(updatedSession?.proposedTimes).toHaveLength(3);
  expect(updatedSession?.proposedTimes?.[0].confidence).toBe(0.95);
}
```

#### Step 6: Accept Time Slot
```typescript
// Test: Finalize scheduling
async function test_acceptTimeSlot() {
  const sessionService = getEventSessionService();
  const eventService = getSchedulingEventService();
  
  // Alice accepts the first proposed time
  await sessionService.updateSession('session_001', {
    status: 'scheduled',
    finalTime: {
      start: new Date('2025-11-19T15:00:00'),
      end: new Date('2025-11-19T15:30:00')
    },
    scheduledAt: new Date()
  });
  
  // Log to analytics
  const analyticsEvent = await eventService.logEvent({
    sessionId: 'session_001',
    hostUserId: 'alice_stanford',
    numInvitees: 1,
    proposedSlots: [...], // The 3 proposals
    selectedSlot: { start: '2025-11-19T15:00:00', end: '2025-11-19T15:30:00' },
    outcome: 'scheduled',
    timeToSchedule: 5, // 5 minutes from creation to acceptance
    numMessages: 3
  });
  
  // Assert: Event logged successfully
  expect(analyticsEvent.id).toBeDefined();
  expect(analyticsEvent.outcome).toBe('scheduled');
  
  // Verify PostgreSQL storage
  const events = await eventService.getEventsByUser('alice_stanford');
  expect(events).toContainEqual(expect.objectContaining({
    sessionId: 'session_001',
    outcome: 'scheduled'
  }));
}
```

#### Expected Data State After Scenario
```yaml
Firestore:
  users/alice_stanford: { email, name, timezone, calendars }
  users/bob_stanford: { email, name, timezone, calendars }
  eventSessions/session_001:
    status: "scheduled"
    finalTime: { start: "2025-11-19T15:00:00", end: "2025-11-19T15:30:00" }
    proposedTimes: [3 options]
  eventSessions/session_001/messages:
    - { role: "user", content: "Schedule coffee with Bob..." }
    - { role: "assistant", content: "I found 3 available times..." }
    - { role: "user", content: "Let's do Tuesday at 3pm" }

PostgreSQL:
  scheduling_events:
    - { session_id: "session_001", outcome: "scheduled", time_to_schedule: 5 }
```

---

## Test Scenario 2: Multi-Person Meeting with Conflicts

### Scenario Description
Alice wants to schedule a 60-minute team meeting with Bob, Carol, and David. They have different timezones and busy schedules.

### Test Steps

#### Step 1: Create Complex EventSession
```typescript
// Test: Multi-invitee session with longer duration
async function test_createTeamMeeting() {
  const session = await sessionService.createSession({
    hostUserId: 'alice_stanford',
    inviteeIds: ['bob_stanford', 'carol_stanford', 'david_stanford'],
    title: 'Team Project Sync',
    duration: 60,
    status: 'pending',
    constraints: {
      minDuration: 60,
      maxDuration: 90,
      location: 'Zoom',
      isVirtual: true
    }
  });
  
  // Assert: Multiple invitees stored
  expect(session.inviteeIds).toHaveLength(3);
  expect(session.duration).toBe(60);
}
```

#### Step 2: Handle Timezone Conversions
```typescript
// Test: Availability across timezones
async function test_timezoneHandling() {
  // Carol is in London (8 hours ahead of PST)
  const carolAvailability = computeAvailabilityBlocks('carol_stanford', {
    timezone: 'Europe/London',
    localWorkingHours: { start: '09:00', end: '17:00' } // 9am-5pm London
  });
  
  // Convert to PST for comparison
  const carolAvailabilityPST = carolAvailability.map(block => ({
    ...block,
    start: convertToTimezone(block.start, 'America/Los_Angeles'),
    end: convertToTimezone(block.end, 'America/Los_Angeles')
  }));
  
  // Assert: Carol's 9am London = 1am PST (not suitable)
  // Carol's 5pm London = 9am PST (suitable)
  const suitableBlocks = carolAvailabilityPST.filter(
    b => !b.isBusy && 
    getHour(b.start) >= 9 && 
    getHour(b.end) <= 17
  );
  
  expect(suitableBlocks.length).toBeLessThan(carolAvailability.length);
}
```

#### Step 3: Find Mutual Availability
```typescript
// Test: Intersection of all participants' availability
async function test_mutualAvailability() {
  const participants = ['alice_stanford', 'bob_stanford', 'carol_stanford', 'david_stanford'];
  
  const mutualSlots = findMutualAvailability(participants, {
    duration: 60,
    startDate: '2025-11-18',
    endDate: '2025-11-22'
  });
  
  // Assert: Fewer slots due to multiple constraints
  expect(mutualSlots.length).toBeLessThanOrEqual(3);
  
  // Assert: Each slot is 60 minutes
  mutualSlots.forEach(slot => {
    const durationMinutes = (slot.end - slot.start) / (1000 * 60);
    expect(durationMinutes).toBe(60);
  });
}
```

#### Expected Challenges
- Limited overlap due to Carol's timezone (London)
- Bob has back-to-back meetings reducing availability
- Need to handle edge case where no mutual slots exist

---

## Test Scenario 3: Failed Scheduling - No Availability

### Scenario Description
Alice tries to schedule with someone who has no availability in the requested timeframe.

### Test Steps

#### Step 1: Create Impossible Session
```typescript
// Test: Handle scheduling failure gracefully
async function test_noAvailability() {
  const session = await sessionService.createSession({
    hostUserId: 'alice_stanford',
    inviteeIds: ['busy_executive'],
    title: 'Mentorship Meeting',
    duration: 60,
    status: 'pending'
  });
  
  // Compute availability - executive is fully booked
  const slots = findMutualAvailability(['alice_stanford', 'busy_executive'], {
    duration: 60,
    startDate: '2025-11-18',
    endDate: '2025-11-22'
  });
  
  // Assert: No available slots
  expect(slots).toHaveLength(0);
}
```

#### Step 2: Update Session with Failure
```typescript
// Test: Mark session as failed with metadata
async function test_recordFailure() {
  await sessionService.updateSession('session_failed', {
    status: 'failed',
    proposedTimes: [],
    metadata: {
      failureReason: 'No mutual availability found in the next 7 days',
      suggestions: [
        'Try expanding the search window to 14 days',
        'Consider reducing the meeting duration to 30 minutes',
        'Check if the meeting can be asynchronous'
      ]
    }
  });
  
  // Log failure to analytics
  await eventService.logEvent({
    sessionId: 'session_failed',
    hostUserId: 'alice_stanford',
    numInvitees: 1,
    outcome: 'failed',
    numMessages: 2
  });
  
  // Assert: Failure is recorded properly
  const session = await sessionService.getSession('session_failed');
  expect(session?.status).toBe('failed');
  expect(session?.metadata?.failureReason).toContain('No mutual availability');
}
```

---

## Test Scenario 4: Preference Learning (Stage 3)

### Scenario Description
After 20+ scheduled events, the system learns Alice's scheduling preferences.

### Test Steps

#### Step 1: Seed Historical Data
```typescript
// Test: Create historical scheduling events
async function test_seedHistoricalData() {
  const historicalEvents = [];
  
  for (let i = 0; i < 20; i++) {
    const event = await eventService.logEvent({
      sessionId: `historical_${i}`,
      hostUserId: 'alice_stanford',
      numInvitees: 1,
      selectedSlot: {
        // 80% on Tue/Wed, mostly at 2-3pm
        start: generatePreferredTime(i),
        end: generateEndTime(i)
      },
      outcome: i % 10 === 0 ? 'cancelled' : 'scheduled',
      timeToSchedule: Math.floor(Math.random() * 30),
      numMessages: Math.floor(Math.random() * 10) + 1
    });
    historicalEvents.push(event);
  }
  
  // Assert: 20 events created
  expect(historicalEvents).toHaveLength(20);
}
```

#### Step 2: Compute Preference Profile
```typescript
// Test: Analyze patterns from historical data
async function test_computePreferences() {
  const preferenceService = getPreferenceService();
  
  const profile = await preferenceService.computeProfile('alice_stanford');
  
  // Assert: Preferences match seeded patterns
  expect(profile.dayOfWeekPatterns.tuesday).toBeGreaterThan(0.7);
  expect(profile.dayOfWeekPatterns.wednesday).toBeGreaterThan(0.7);
  expect(profile.dayOfWeekPatterns.saturday).toBeLessThan(0.2);
  
  // Assert: Time preferences show afternoon preference
  expect(profile.timeOfDayPatterns['14']).toBeGreaterThan(0.7); // 2pm
  expect(profile.timeOfDayPatterns['15']).toBeGreaterThan(0.6); // 3pm
  expect(profile.timeOfDayPatterns['09']).toBeLessThan(0.3); // 9am
  
  // Assert: Acceptance rate is reasonable
  expect(profile.acceptanceRate).toBeGreaterThan(70);
  expect(profile.acceptanceRate).toBeLessThan(95);
  
  // Verify PostgreSQL storage
  const result = await query(
    'SELECT * FROM preference_profiles WHERE user_id = $1',
    ['alice_stanford']
  );
  expect(result.rows).toHaveLength(1);
  expect(result.rows[0].sample_size).toBe(20);
}
```

#### Step 3: Use Preferences for Ranking
```typescript
// Test: Rank proposed slots using learned preferences
async function test_rankByPreferences() {
  const slots = [
    { start: '2025-11-19T09:00:00', end: '2025-11-19T09:30:00' }, // Tuesday 9am
    { start: '2025-11-19T14:00:00', end: '2025-11-19T14:30:00' }, // Tuesday 2pm
    { start: '2025-11-21T15:00:00', end: '2025-11-21T15:30:00' }, // Thursday 3pm
  ];
  
  const rankedSlots = rankSlotsByPreference(slots, profile);
  
  // Assert: Tuesday 2pm ranks highest
  expect(rankedSlots[0].start).toContain('14:00');
  expect(rankedSlots[0].preferenceScore).toBeGreaterThan(0.8);
  
  // Assert: Tuesday 9am ranks lowest (early morning)
  expect(rankedSlots[2].start).toContain('09:00');
  expect(rankedSlots[2].preferenceScore).toBeLessThan(0.4);
}
```

---

## Test Scenario 5: Real-time Updates & Sync

### Scenario Description
Bob reschedules an accepted meeting, triggering updates across all participants.

### Test Steps

#### Step 1: Detect Schedule Change
```typescript
// Test: Handle rescheduling request
async function test_rescheduleEvent() {
  // Bob requests reschedule
  await messageService.addMessage('session_001', {
    sessionId: 'session_001',
    role: 'user',
    content: 'Sorry, need to reschedule. Can we do Thursday instead?'
  });
  
  // Update session status
  await sessionService.updateSession('session_001', {
    status: 'pending', // Back to pending
    metadata: {
      rescheduledBy: 'bob_stanford',
      rescheduledAt: new Date(),
      previousTime: { start: '2025-11-19T15:00:00', end: '2025-11-19T15:30:00' }
    }
  });
  
  // Assert: Status reverted to pending
  const session = await sessionService.getSession('session_001');
  expect(session?.status).toBe('pending');
  expect(session?.metadata?.rescheduledBy).toBe('bob_stanford');
}
```

#### Step 2: Notify Participants
```typescript
// Test: Trigger notifications
async function test_notifyReschedule() {
  const notifications = await notifyParticipants('session_001', {
    type: 'reschedule_requested',
    requestedBy: 'bob_stanford',
    message: 'Bob has requested to reschedule. Please review new time options.'
  });
  
  // Assert: Notifications sent to all participants
  expect(notifications).toHaveLength(2); // Alice and Bob
  expect(notifications[0].recipient).toBe('alice_stanford');
  expect(notifications[0].channel).toBe('email'); // or SMS
}
```

---

## Edge Cases & Error Handling

### Test: Concurrent Updates
```typescript
async function test_concurrentUpdates() {
  // Two users try to accept different slots simultaneously
  const promise1 = sessionService.updateSession('session_001', {
    finalTime: { start: '2025-11-19T14:00:00', end: '2025-11-19T14:30:00' }
  });
  
  const promise2 = sessionService.updateSession('session_001', {
    finalTime: { start: '2025-11-19T15:00:00', end: '2025-11-19T15:30:00' }
  });
  
  // One should succeed, one should fail (or use transaction)
  const results = await Promise.allSettled([promise1, promise2]);
  
  // Assert: Only one update succeeded
  const succeeded = results.filter(r => r.status === 'fulfilled');
  expect(succeeded).toHaveLength(1);
}
```

### Test: Invalid Data Validation
```typescript
async function test_dataValidation() {
  // Test: Duration too short
  await expect(
    sessionService.createSession({
      hostUserId: 'alice_stanford',
      inviteeIds: [],
      title: 'Quick Chat',
      duration: 5, // 5 minutes - too short
      status: 'pending'
    })
  ).rejects.toThrow('Duration must be at least 15 minutes');
  
  // Test: Invalid timezone
  await expect(
    userService.createUser({
      email: 'test@stanford.edu',
      name: 'Test User',
      timezone: 'Invalid/Timezone'
    })
  ).rejects.toThrow('Invalid timezone');
}
```

### Test: Data Consistency
```typescript
async function test_dataConsistency() {
  // If EventSession is deleted, messages should also be deleted
  await sessionService.deleteSession('session_to_delete');
  
  // Assert: Messages are also gone
  const messages = await messageService.getMessages('session_to_delete');
  expect(messages).toHaveLength(0);
  
  // Assert: Analytics events remain (for historical analysis)
  const events = await eventService.getEventsByUser('alice_stanford');
  const relatedEvents = events.filter(e => e.sessionId === 'session_to_delete');
  expect(relatedEvents.length).toBeGreaterThan(0); // Still in PostgreSQL
}
```

---

## Performance Tests

### Test: Query Performance
```typescript
async function test_queryPerformance() {
  const startTime = Date.now();
  
  // Fetch user's last 100 sessions
  const sessions = await sessionService.getSessionsByUser('alice_stanford');
  
  const duration = Date.now() - startTime;
  
  // Assert: Query completes in reasonable time
  expect(duration).toBeLessThan(1000); // Less than 1 second
  
  // Test pagination for large datasets
  const page1 = await sessionService.getSessionsByUser('alice_stanford', {
    limit: 20,
    offset: 0
  });
  expect(page1).toHaveLength(20);
}
```

### Test: Bulk Operations
```typescript
async function test_bulkOperations() {
  // Create 100 events in batch
  const startTime = Date.now();
  
  const promises = Array.from({ length: 100 }, (_, i) => 
    eventService.logEvent({
      sessionId: `bulk_${i}`,
      hostUserId: 'alice_stanford',
      numInvitees: 1,
      outcome: 'scheduled',
      numMessages: 3
    })
  );
  
  await Promise.all(promises);
  const duration = Date.now() - startTime;
  
  // Assert: Bulk insert is reasonably fast
  expect(duration).toBeLessThan(5000); // Less than 5 seconds for 100 records
}
```

---

## Test Coverage Requirements

### Unit Test Coverage
- ✅ All service methods (CRUD operations)
- ✅ Data validation logic
- ✅ Timezone conversion utilities
- ✅ Availability computation algorithms
- ✅ Preference calculation functions

### Integration Test Coverage
- ✅ Firestore ↔ Service Layer
- ✅ PostgreSQL ↔ Service Layer
- ✅ Cross-database operations (e.g., session in Firestore, analytics in PostgreSQL)
- ✅ Transaction rollback scenarios

### End-to-End Test Coverage
- ✅ Complete scheduling flow (create → propose → accept)
- ✅ Rescheduling flow
- ✅ Cancellation flow
- ✅ Multi-participant coordination
- ✅ Preference learning and application

---

## Test Data Cleanup

```typescript
async function cleanupTestData() {
  // Clean Firestore test data
  const testUsers = await getDocs(
    query(collection(db, 'users'), where('email', '==', 'test@stanford.edu'))
  );
  
  for (const doc of testUsers.docs) {
    await deleteDoc(doc.ref);
  }
  
  // Clean PostgreSQL test data
  await query('DELETE FROM scheduling_events WHERE host_user_id LIKE $1', ['test_%']);
  await query('DELETE FROM preference_profiles WHERE user_id LIKE $1', ['test_%']);
  
  console.log('✅ Test data cleaned up');
}
```

---

## Success Criteria

The persistence layer is considered successfully tested when:

1. **All CRUD operations work correctly** for each entity type
2. **Data relationships are maintained** (e.g., user → sessions → messages)
3. **Concurrent operations are handled** without data corruption
4. **Performance benchmarks are met** (< 1s for queries, < 5s for bulk ops)
5. **Edge cases are handled gracefully** with appropriate error messages
6. **Data can be migrated** between schema versions without loss
7. **Privacy requirements are met** (PII is properly protected)
8. **Analytics queries return accurate results** for preference learning

---

## Test Execution Schedule

### Phase 1: Unit Tests (Week 1)
- Service layer methods
- Data validation
- Utility functions

### Phase 2: Integration Tests (Week 2)
- Database connections
- Cross-service operations
- Transaction handling

### Phase 3: End-to-End Tests (Week 3)
- Complete user flows
- Edge cases
- Performance testing

### Phase 4: Stage 3 Features (Week 4)
- Preference learning
- RL model integration
- Advanced analytics

---

## Monitoring & Observability

### Metrics to Track
- Query latency (p50, p95, p99)
- Error rates by operation type
- Database connection pool utilization
- Storage growth rate

### Alerts to Configure
- Failed database connections
- Slow queries (> 2s)
- High error rates (> 1%)
- Storage approaching limits

---

## Conclusion

This comprehensive test plan ensures that the Gatherly persistence layer can:
1. **Support all Stage 1-3 functionality** as designed
2. **Handle real-world scheduling scenarios** with multiple participants
3. **Learn from user behavior** to improve suggestions
4. **Scale to production workloads** without performance degradation
5. **Maintain data consistency** across distributed systems

The test scenarios validate that our hybrid Firestore + PostgreSQL approach provides both real-time responsiveness and analytical depth required for an intelligent scheduling agent.
