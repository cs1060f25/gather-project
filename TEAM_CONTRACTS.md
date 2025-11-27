# Gatherly Team Contracts

**Purpose:** This document defines the interfaces and contracts between team members so everyone can work independently and integrate smoothly.

**Team responsibilities:**
- **Talha:** Backend APIs, scheduler agent, consensus coordinator, GCal integration
- **Friend (UI):** Frontend React Native app, host-facing UI
- **Friend (Messaging):** SMS/Twilio, RSVP web pages, message templates

---

## Data Models

### Event
```typescript
interface Event {
  id: string;
  ownerId: string;           // host user ID
  title: string;
  description?: string;
  location?: string | null;
  slots: string[];           // 1-3 ISO-8601 timestamps from scheduler
  requireAll: boolean;       // false = 50% rule, true = 100% rule
  status: "pending" | "confirmed" | "needs_reschedule";
  chosenSlot?: string | null; // final confirmed slot
  createdAt: string;         // ISO-8601
}
```

### Invite
```typescript
interface Invite {
  id: string;
  eventId: string;
  inviteeName: string;
  phone: string;             // E.164 format: +1555123456
  token: string;             // secure random token for RSVP links
  status: "pending" | "accepted" | "rejected";
  selectedSlot?: string | "none" | null; // ISO-8601 or "none"
  respondedAt?: string | null; // ISO-8601
}
```

---

## REST API Endpoints

### 1. Create Event + Send Invites
**Owner:** Talha (backend)  
**Consumer:** UI team

```
POST /api/schedule/suggest-and-invite
```

**Request:**
```typescript
{
  text: string;              // "Coffee with Alice and Bob next week"
  invitees: Array<{
    name: string;
    phone: string;           // E.164 format
  }>;
  preferences: {
    duration_minutes?: number; // default 60
    quiet_hours?: string[];    // ["22:00-07:00"]
    location_hint?: string;
  };
  requireAll: boolean;       // false = 50%, true = 100%
}
```

**Response:**
```typescript
{
  eventId: string;
  title: string;
  slots: string[];           // ISO-8601 timestamps
  invites: Array<{
    inviteId: string;
    name: string;
    rsvpUrl: string;         // https://app.gatherly.xyz/rsvp?token=...
  }>;
}
```

### 2. Get RSVP Info
**Owner:** Talha (backend)  
**Consumer:** Messaging team (RSVP web page)

```
GET /api/rsvp/:token
```

**Response:**
```typescript
{
  eventTitle: string;
  ownerName: string;
  location?: string | null;
  slots: string[];           // ISO-8601 timestamps
  requireAll: boolean;
  inviteeName: string;
  alreadyResponded: boolean;
  currentResponse?: string | "none" | null;
}
```

### 3. Submit RSVP
**Owner:** Talha (backend)  
**Consumer:** Messaging team (RSVP web page)

```
POST /api/rsvp/:token
```

**Request:**
```typescript
{
  selectedSlot: string | "none"; // ISO-8601 or "none"
}
```

**Response:**
```typescript
{
  status: "ok" | "error";
  message?: string;
}
```

---

## Internal Webhooks (Backend → Messaging)

### 1. Invites Created
**Trigger:** After event creation  
**Purpose:** Send initial SMS with RSVP links

```
POST /internal/notify/invites-created
```

**Payload:**
```typescript
{
  eventId: string;
  eventTitle: string;
  ownerName: string;
  location?: string | null;
  slots: string[];           // ISO-8601, for SMS copy
  invites: Array<{
    inviteId: string;
    name: string;
    phone: string;
    rsvpUrl: string;
  }>;
}
```

### 2. Event Confirmed
**Trigger:** When consensus reached  
**Purpose:** Send confirmation SMS to everyone

```
POST /internal/notify/event-confirmed
```

**Payload:**
```typescript
{
  eventId: string;
  eventTitle: string;
  chosenSlot: string;        // ISO-8601
  location?: string | null;
  ownerName: string;
  ownerPhone?: string;       // optional
  recipients: Array<{
    name: string;
    phone: string;
    wasAccepted: boolean;    // true if they voted for winning slot
  }>;
}
```

### 3. Event Needs Reschedule
**Trigger:** When consensus fails  
**Purpose:** Notify host to try again

```
POST /internal/notify/event-needs-reschedule
```

**Payload:**
```typescript
{
  eventId: string;
  eventTitle: string;
  reason: "no_consensus" | "all_rejected" | "timeout";
  ownerName: string;
  ownerPhone?: string;
}
```

---

## Backend Services (Internal to Talha)

### Calendar Service
```typescript
interface CalendarService {
  // Get host's busy periods for scheduling
  getHostBusy(params: {
    hostId: string;
    timeMin: string;         // ISO-8601
    timeMax: string;         // ISO-8601
  }): Promise<Array<{
    start: string;           // ISO-8601
    end: string;             // ISO-8601
  }>>;

  // Create confirmed event on host's calendar
  createHostEvent(params: {
    hostId: string;
    slot: string;            // ISO-8601 start time
    title: string;
    location?: string | null;
    description?: string;
    durationMinutes: number;
    inviteeEmails?: string[]; // optional guest emails
  }): Promise<{
    eventId: string;
    calendarEventId: string; // Google Calendar event ID
  }>;
}
```

### Consensus Coordinator
```typescript
interface ConsensusCoordinator {
  // Called after each RSVP submission
  evaluateConsensus(eventId: string): Promise<{
    action: "wait" | "confirm" | "reschedule";
    chosenSlot?: string;     // if action = "confirm"
    reason?: string;         // if action = "reschedule"
  }>;
}
```

---

## Consensus Rules

### 50% Rule (`requireAll = false`)
- Wait for responses from invitees
- When `accepted_count / total_invites >= 0.5`:
  - Pick slot with most votes
  - Tie-breaker: earliest slot chronologically
  - Confirm event

### 100% Rule (`requireAll = true`)
- Wait until everyone responds
- If any `status = "rejected"` → reschedule
- If all `status = "accepted"`:
  - If everyone picked same slot → confirm
  - If votes split across slots → reschedule (or pick majority)

---

## Message Templates (Messaging Team)

### Initial Invite SMS
```
Hey {name}! {ownerName} invited you to: {eventTitle}

Pick your preferred time:
{slot1_formatted}
{slot2_formatted} 
{slot3_formatted}

RSVP: {rsvpUrl}
```

### Confirmation SMS
```
✅ Confirmed: {eventTitle}
📅 {chosenSlot_formatted}
📍 {location}

See you there!
```

### Reschedule SMS (to host)
```
❌ {eventTitle} needs rescheduling - {reason}

Try again with different times or fewer people.
```

---

## Environment Variables

### Backend (Talha)
```
OPENAI_API_KEY=sk-...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=postgresql://...
MESSAGING_WEBHOOK_URL=http://localhost:3001/webhooks
```

### Messaging Service
```
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1555...
BACKEND_WEBHOOK_SECRET=shared-secret-123
```

---

## Development Workflow

1. **Backend team (Talha):**
   - Implement REST endpoints
   - Stub webhook calls initially
   - Add real GCal integration
   - Implement consensus logic

2. **UI team:**
   - Build host-facing screens
   - Call `/api/schedule/suggest-and-invite`
   - Handle responses and show event status

3. **Messaging team:**
   - Implement webhook handlers
   - Build RSVP web pages using `/api/rsvp/:token`
   - Set up Twilio SMS sending

4. **Integration:**
   - Backend calls real webhook URLs
   - End-to-end testing with real SMS
   - Deploy all services

---

## Testing Contracts

Each team can build against these interfaces independently:

- **Backend:** Mock webhook calls, test with fake phone numbers
- **UI:** Mock API responses, test user flows
- **Messaging:** Mock webhook payloads, test SMS + RSVP pages

When ready to integrate, everything should "just work" because the contracts are defined.
