# Gatherly Persistence Layer Schema Design

**Linear Task:** GATHER-27  
**Phase:** Stage 0 - Foundation  
**Last Updated:** November 12, 2025

## Overview

This document defines the persistence layer for Gatherly's scheduling agent. The schema supports:
- Stage 1: Manual scheduling (user inputs preferences)
- Stage 2: Semi-automated scheduling (AI suggests times)
- Stage 3: Fully automated scheduling with RL fine-tuning

We use a **hybrid database approach**:
- **Firestore**: Real-time user data, sessions, and scheduling state
- **PostgreSQL**: Analytics, preference profiles, and RL training data
- **Firebase Auth**: User authentication and identity management

---

## Entity Relationship Diagram

```
┌─────────────────┐
│  Firebase Auth  │
│   (Identity)    │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐         ┌──────────────────┐
│   User (FS)     │◄────────┤ EventSession (FS)│
│                 │  1:N    │                  │
│ - id            │         │ - id             │
│ - email         │         │ - hostUserId     │
│ - name          │         │ - inviteeIds[]   │
│ - timezone      │         │ - duration       │
│ - calendars[]   │         │ - status         │
└────────┬────────┘         └────────┬─────────┘
         │                           │
         │ 1:1                       │ 1:N
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│PreferenceProfile│         │   Message (FS)   │
│    (Postgres)   │         │                  │
│                 │         │ - id             │
│ - userId        │         │ - sessionId      │
│ - patterns      │         │ - content        │
│ - acceptRate    │         │ - role           │
└─────────────────┘         └──────────────────┘
                                     │
                                     │ computed
                                     ▼
                            ┌──────────────────┐
                            │AvailabilityBlock │
                            │   (Computed)     │
                            │                  │
                            │ - start          │
                            │ - end            │
                            │ - source         │
                            └──────────────────┘
```

---

## Schema Definitions

### 1. User (Firestore + Firebase Auth)

**Collection:** `users/{userId}`  
**Purpose:** Store user profile and calendar connection metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Firebase Auth UID |
| `email` | string | ✓ | User's email address |
| `name` | string | ✓ | Display name |
| `avatarURL` | string | ✗ | Profile picture URL |
| `timezone` | string | ✓ | IANA timezone (e.g., "America/New_York") |
| `googleAuthToken` | encrypted string | ✗ | Encrypted OAuth token for Google Calendar |
| `calendars` | CalendarConnection[] | ✗ | Array of connected calendar sources |
| `defaultPreferences` | object | ✗ | Default scheduling preferences |
| `createdAt` | timestamp | ✓ | Account creation time |
| `updatedAt` | timestamp | ✓ | Last profile update |

**CalendarConnection Schema:**
```typescript
{
  provider: "google" | "outlook" | "apple",
  calendarId: string,
  isPrimary: boolean,
  readOnly: boolean,
  syncedAt: timestamp
}
```

**Example Document:**
```json
{
  "id": "user_abc123",
  "email": "milan@stanford.edu",
  "name": "Milan Naropanth",
  "timezone": "America/Los_Angeles",
  "googleAuthToken": "encrypted_token_xyz",
  "calendars": [
    {
      "provider": "google",
      "calendarId": "primary",
      "isPrimary": true,
      "readOnly": false,
      "syncedAt": "2025-11-12T10:00:00Z"
    }
  ],
  "defaultPreferences": {
    "preferredDuration": 30,
    "bufferTime": 15,
    "workingHours": { "start": "09:00", "end": "17:00" }
  },
  "createdAt": "2025-11-01T08:00:00Z",
  "updatedAt": "2025-11-12T10:00:00Z"
}
```

---

### 2. EventSession (Firestore)

**Collection:** `eventSessions/{sessionId}`  
**Purpose:** Represents a single scheduling attempt/conversation

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Unique session identifier |
| `hostUserId` | string | ✓ | User who initiated the scheduling |
| `inviteeIds` | string[] | ✓ | Array of invited user IDs |
| `title` | string | ✓ | Event title/description |
| `duration` | number | ✓ | Duration in minutes |
| `status` | enum | ✓ | "pending" \| "scheduled" \| "cancelled" \| "failed" |
| `proposedTimes` | TimeSlot[] | ✗ | AI-suggested time slots |
| `finalTime` | TimeSlot | ✗ | Confirmed meeting time |
| `constraints` | object | ✗ | Scheduling constraints (e.g., "after 2pm", "weekdays only") |
| `createdAt` | timestamp | ✓ | Session start time |
| `scheduledAt` | timestamp | ✗ | When event was successfully scheduled |
| `expiresAt` | timestamp | ✗ | Session expiration (e.g., 7 days) |

**TimeSlot Schema:**
```typescript
{
  start: timestamp,
  end: timestamp,
  confidence: number, // 0-1 score for AI suggestions
  conflicts: string[] // List of conflicting events/reasons
}
```

**Status Flow:**
```
pending → scheduled
        → cancelled
        → failed (no mutual availability found)
```

**Example Document:**
```json
{
  "id": "session_xyz789",
  "hostUserId": "user_abc123",
  "inviteeIds": ["user_def456", "user_ghi789"],
  "title": "CS194 Project Sync",
  "duration": 60,
  "status": "pending",
  "proposedTimes": [
    {
      "start": "2025-11-15T14:00:00Z",
      "end": "2025-11-15T15:00:00Z",
      "confidence": 0.92,
      "conflicts": []
    },
    {
      "start": "2025-11-15T16:00:00Z",
      "end": "2025-11-15T17:00:00Z",
      "confidence": 0.85,
      "conflicts": ["user_def456: Back-to-back meetings"]
    }
  ],
  "constraints": {
    "daysOfWeek": ["monday", "tuesday", "wednesday"],
    "timeRange": { "start": "14:00", "end": "18:00" },
    "excludeDates": ["2025-11-20"]
  },
  "createdAt": "2025-11-12T10:00:00Z",
  "expiresAt": "2025-11-19T10:00:00Z"
}
```

---

### 3. Message (Firestore Subcollection)

**Collection:** `eventSessions/{sessionId}/messages/{messageId}`  
**Purpose:** Store conversation history for each scheduling session

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✓ | Message ID |
| `sessionId` | string | ✓ | Parent session ID |
| `role` | enum | ✓ | "user" \| "assistant" \| "system" |
| `content` | string | ✓ | Message text content |
| `metadata` | object | ✗ | Extracted entities (dates, times, attendees) |
| `timestamp` | timestamp | ✓ | When message was sent |

**Example Document:**
```json
{
  "id": "msg_001",
  "sessionId": "session_xyz789",
  "role": "user",
  "content": "Schedule a meeting with Alice and Bob next week, preferably in the afternoon",
  "metadata": {
    "extractedEntities": {
      "attendees": ["Alice", "Bob"],
      "timeframe": "next week",
      "preference": "afternoon"
    }
  },
  "timestamp": "2025-11-12T10:05:00Z"
}
```

---

### 4. AvailabilityBlock (Computed, Not Stored)

**Purpose:** Ephemeral structure used by Scheduling Engine to compute mutual availability

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | Owner of the availability block |
| `start` | timestamp | Block start time |
| `end` | timestamp | Block end time |
| `source` | enum | "calendar" \| "preference" \| "constraint" |
| `isBusy` | boolean | True if user is unavailable |
| `metadata` | object | Additional context (e.g., event title if busy) |

**Example (Runtime Only):**
```typescript
const availabilityBlocks: AvailabilityBlock[] = [
  {
    userId: "user_abc123",
    start: new Date("2025-11-15T09:00:00Z"),
    end: new Date("2025-11-15T10:00:00Z"),
    source: "calendar",
    isBusy: true,
    metadata: { eventTitle: "CS lecture" }
  },
  {
    userId: "user_abc123",
    start: new Date("2025-11-15T14:00:00Z"),
    end: new Date("2025-11-15T17:00:00Z"),
    source: "preference",
    isBusy: false,
    metadata: { preferredTime: true }
  }
];
```

---

### 5. PreferenceProfile (PostgreSQL)

**Table:** `preference_profiles`  
**Purpose:** Store user scheduling patterns for RL fine-tuning (Stage 3)

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| `user_id` | VARCHAR(255) | ✓ | References Firebase Auth UID |
| `day_of_week_patterns` | JSONB | ✓ | Histogram of preferred days |
| `time_of_day_patterns` | JSONB | ✓ | Histogram of preferred hours |
| `duration_preferences` | JSONB | ✓ | Common meeting durations |
| `acceptance_rate` | DECIMAL(5,2) | ✓ | % of suggestions accepted (0-100) |
| `avg_response_time` | INTEGER | ✓ | Average minutes to respond |
| `last_updated` | TIMESTAMP | ✓ | Last profile computation |
| `sample_size` | INTEGER | ✓ | Number of data points used |

**Schema:**
```sql
CREATE TABLE preference_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  day_of_week_patterns JSONB NOT NULL, -- {"monday": 0.8, "tuesday": 0.6, ...}
  time_of_day_patterns JSONB NOT NULL, -- {"09": 0.2, "10": 0.5, ...}
  duration_preferences JSONB NOT NULL, -- {"30": 0.6, "60": 0.3, ...}
  acceptance_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  sample_size INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_id ON preference_profiles(user_id);
CREATE INDEX idx_last_updated ON preference_profiles(last_updated);
```

**Example Row:**
```json
{
  "user_id": "user_abc123",
  "day_of_week_patterns": {
    "monday": 0.85,
    "tuesday": 0.90,
    "wednesday": 0.88,
    "thursday": 0.82,
    "friday": 0.65,
    "saturday": 0.10,
    "sunday": 0.05
  },
  "time_of_day_patterns": {
    "09": 0.15,
    "10": 0.30,
    "11": 0.45,
    "14": 0.80,
    "15": 0.90,
    "16": 0.75
  },
  "duration_preferences": {
    "30": 0.60,
    "60": 0.35,
    "90": 0.05
  },
  "acceptance_rate": 78.5,
  "avg_response_time": 45,
  "last_updated": "2025-11-12T10:00:00Z",
  "sample_size": 42
}
```

---

### 6. SchedulingEvent (PostgreSQL - Analytics)

**Table:** `scheduling_events`  
**Purpose:** Log all scheduling attempts for analytics and RL training

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | VARCHAR(255) | Links to Firestore session |
| `host_user_id` | VARCHAR(255) | Host user ID |
| `num_invitees` | INTEGER | Number of attendees |
| `proposed_slots` | JSONB | Array of suggested times |
| `selected_slot` | JSONB | Final chosen time (if scheduled) |
| `outcome` | VARCHAR(50) | "scheduled" \| "cancelled" \| "failed" |
| `time_to_schedule` | INTEGER | Minutes from creation to scheduling |
| `num_messages` | INTEGER | Total messages in conversation |
| `created_at` | TIMESTAMP | Event creation time |

**Schema:**
```sql
CREATE TABLE scheduling_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  host_user_id VARCHAR(255) NOT NULL,
  num_invitees INTEGER NOT NULL,
  proposed_slots JSONB,
  selected_slot JSONB,
  outcome VARCHAR(50) NOT NULL,
  time_to_schedule INTEGER,
  num_messages INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_id ON scheduling_events(session_id);
CREATE INDEX idx_host_user_id ON scheduling_events(host_user_id);
CREATE INDEX idx_outcome ON scheduling_events(outcome);
CREATE INDEX idx_created_at ON scheduling_events(created_at);
```

---

## Database Selection Rationale

### Firestore (NoSQL)
**Use Cases:**
- Real-time updates for active scheduling sessions
- User profiles and authentication integration
- Message history (subcollections)
- Flexible schema for evolving features

**Advantages:**
- Automatic synchronization across clients
- Offline support
- Scales horizontally
- Native Firebase Auth integration

**Limitations:**
- Limited query capabilities
- No complex joins
- Not ideal for analytics

### PostgreSQL (Relational)
**Use Cases:**
- Historical analytics and reporting
- Preference profiles (structured data)
- RL training data
- Complex aggregations

**Advantages:**
- ACID transactions
- Complex queries and joins
- JSON support (JSONB)
- Mature tooling and ORMs

**Limitations:**
- No real-time sync out of the box
- Requires manual scaling

---

## Data Flow Examples

### Example 1: Creating a New Scheduling Session

```
1. User: "Schedule lunch with alice@stanford.edu next Tuesday"
   ├─> Create EventSession in Firestore
   │   └─> status: "pending"
   │   └─> hostUserId: current_user_id
   │   └─> inviteeIds: [resolved_alice_id]
   │
   ├─> Create Message in subcollection
   │   └─> role: "user"
   │   └─> content: original message
   │
   ├─> Scheduling Engine computes AvailabilityBlocks
   │   ├─> Fetch User calendar from Firestore
   │   ├─> Fetch invitee calendars
   │   └─> Generate free/busy blocks (in-memory)
   │
   ├─> AI proposes 3 time slots
   │   └─> Update EventSession.proposedTimes
   │
   └─> Create Message (assistant response)
       └─> "I found 3 options for lunch next Tuesday..."
```

### Example 2: Accepting a Suggested Time

```
1. User: "Let's do 12:30pm"
   ├─> Create Message (user acceptance)
   │
   ├─> Update EventSession
   │   ├─> status: "pending" → "scheduled"
   │   ├─> finalTime: { start: ..., end: ... }
   │   └─> scheduledAt: now()
   │
   ├─> Create calendar events via Google Calendar API
   │   └─> For host and all invitees
   │
   ├─> Log to PostgreSQL scheduling_events
   │   ├─> outcome: "scheduled"
   │   ├─> time_to_schedule: 8 minutes
   │   └─> num_messages: 4
   │
   └─> Update PreferenceProfile in PostgreSQL
       └─> Increment acceptance_rate
       └─> Update time_of_day_patterns (boost 12:30pm slot)
```

### Example 3: Querying User Preferences for RL

```sql
-- Get users with high acceptance rates for training
SELECT 
  user_id,
  day_of_week_patterns,
  time_of_day_patterns,
  acceptance_rate
FROM preference_profiles
WHERE 
  sample_size >= 10 AND
  acceptance_rate >= 70.0
ORDER BY sample_size DESC
LIMIT 1000;
```

---

## Migration Strategy

### Phase 1: Foundation (Current)
- Set up Firebase project and Firestore
- Create PostgreSQL database
- Implement basic User and EventSession CRUD

### Phase 2: Stage 1 Support
- Add Message subcollection
- Implement calendar API integration
- Build AvailabilityBlock computation logic

### Phase 3: Analytics (Stage 2)
- Populate scheduling_events table
- Build basic analytics dashboard
- Start collecting preference data

### Phase 4: RL Integration (Stage 3)
- Implement preference_profiles computation
- Export training data from PostgreSQL
- Feed into RL model

---

## Acceptance Criteria Checklist

- [x] Schema document exists and is committed to repo
- [ ] Architecture diagram shows entity relationships
- [ ] All entities support Stage 1–3 functionality
- [ ] Walk-through example confirms data model completeness
- [ ] Database configuration files created
- [ ] TypeScript types/interfaces defined
- [ ] Basic CRUD operations implemented
- [ ] Unit tests written for schema validation

---

## Test Plan

### Test Scenario 1: Simple 1-on-1 Scheduling

**Setup:**
- User A (host): Free Mon-Fri 2-5pm
- User B (invitee): Free Mon-Fri 3-6pm

**Steps:**
1. User A creates session: "Meet with User B for 30min next week"
2. System creates EventSession with status="pending"
3. System creates Message (user input)
4. Scheduling Engine computes AvailabilityBlocks for both users
5. AI proposes 3 slots in overlapping 3-5pm window
6. User A accepts first suggestion
7. System updates EventSession status="scheduled"
8. System logs to scheduling_events table

**Expected Data:**
```json
// Firestore: eventSessions/session_001
{
  "status": "scheduled",
  "proposedTimes": [
    { "start": "2025-11-18T15:00:00Z", "end": "2025-11-18T15:30:00Z" }
  ],
  "finalTime": { "start": "2025-11-18T15:00:00Z", "end": "2025-11-18T15:30:00Z" }
}

// PostgreSQL: scheduling_events
{
  "outcome": "scheduled",
  "time_to_schedule": 5,
  "num_messages": 3
}
```

### Test Scenario 2: Complex Multi-Invitee Scheduling

**Setup:**
- Host + 4 invitees with varying timezones and calendars
- Constraint: "weekday afternoons only, 60min duration"

**Steps:**
1. Host creates session with constraints
2. System fetches all 5 calendars
3. System computes mutual availability (AvailabilityBlocks)
4. AI proposes 2 feasible slots (or none if impossible)
5. Host selects a slot
6. System creates 5 calendar events simultaneously

**Expected Behavior:**
- EventSession.inviteeIds.length === 4
- proposedTimes.length <= 3 (limited by complexity)
- All AvailabilityBlocks computed in < 2 seconds
- Calendar events created atomically (all or none)

### Test Scenario 3: No Availability Found

**Setup:**
- Host and invitee have zero overlapping free time in next 7 days

**Steps:**
1. Host creates session
2. System computes AvailabilityBlocks
3. No mutual slots found
4. System responds: "No availability found. Try these alternatives..."
5. EventSession.status = "failed"

**Expected Data:**
```json
{
  "status": "failed",
  "proposedTimes": [],
  "metadata": {
    "failureReason": "No mutual availability in next 7 days",
    "suggestions": ["Extend search window", "Reduce meeting duration"]
  }
}
```

### Test Scenario 4: Preference Learning (Stage 3)

**Setup:**
- User has 20 historical scheduling events in PostgreSQL

**Steps:**
1. Compute PreferenceProfile from scheduling_events
2. Identify patterns: 80% of meetings on Tue/Wed, 90% at 2-3pm
3. Update preference_profiles table
4. Next scheduling session uses this data to rank suggestions

**Expected Query:**
```sql
SELECT 
  AVG(CASE WHEN EXTRACT(DOW FROM (selected_slot->>'start')::timestamp) = 2 THEN 1 ELSE 0 END) as tuesday_rate
FROM scheduling_events
WHERE host_user_id = 'user_abc123' AND outcome = 'scheduled';
-- Result: 0.80
```

---

## Open Questions & Future Considerations

### Q1: How do we handle recurring events?
**Answer (TBD):** Add `recurrence` field to EventSession with RRULE format.

### Q2: Should we store rejected time suggestions for learning?
**Answer:** Yes, in Stage 3. Add `rejected_slots` JSONB column to scheduling_events.

### Q3: What's the data retention policy?
**Answer (Proposed):**
- Firestore: Keep sessions for 30 days after completion
- PostgreSQL: Retain scheduling_events indefinitely (anonymize after 2 years)

### Q4: How do we sync preference changes between Firestore and PostgreSQL?
**Answer:** Use Cloud Functions to trigger PostgreSQL updates on EventSession status changes.

---

## Conclusion

This schema provides a solid foundation for Gatherly's scheduling agent across all three stages. The hybrid Firestore + PostgreSQL approach balances real-time responsiveness with analytical depth, positioning us well for RL fine-tuning in Stage 3.

**Next Steps:**
1. Implement database services in `/gatherly-app/lib/db/`
2. Create TypeScript types in `/gatherly-app/types/schema.ts`
3. Write integration tests
4. Get team approval on schema design

