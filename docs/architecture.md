# Gatherly Architecture Diagram

**Linear Task:** GATHER-27  
**Last Updated:** November 12, 2025

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER (Next.js)                          │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │ Landing Page │    │  Dashboard   │    │  Chat Interface      │   │
│  │      (/)     │───▶│    (/app)    │───▶│ (Liquid Glass Bar)   │   │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘   │
│                                                      │                 │
└──────────────────────────────────────────────────────┼─────────────────┘
                                                       │
                                                       │ API Calls
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (Services)                       │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐ │
│  │  User Service    │  │ EventSession     │  │  Message Service   │ │
│  │  (Firestore)     │  │  Service         │  │  (Firestore Sub)   │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬───────────┘ │
│           │                     │                      │              │
│  ┌────────┴─────────────────────┴──────────────────────┴───────────┐ │
│  │                                                                   │ │
│  │              Scheduling Engine (Availability Logic)              │ │
│  │                                                                   │ │
│  │  - Computes AvailabilityBlocks from calendar data               │ │
│  │  - Finds mutual free time for all participants                  │ │
│  │  - Ranks suggestions using PreferenceProfile (Stage 3)          │ │
│  │                                                                   │ │
│  └───────────────────────────────┬───────────────────────────────────┘ │
│                                  │                                     │
│  ┌───────────────────────────────┼───────────────────────────────────┐ │
│  │                               │                                   │ │
│  │  ┌────────────────────┐      │      ┌─────────────────────────┐ │ │
│  │  │ Preference Service │◄─────┼─────▶│ SchedulingEvent Service │ │ │
│  │  │   (PostgreSQL)     │      │      │     (PostgreSQL)        │ │ │
│  │  └────────────────────┘      │      └─────────────────────────┘ │ │
│  │          ▲                    │                   │              │ │
│  │          │                    │                   │              │ │
│  │          └────────────────────┼───────────────────┘              │ │
│  │                Analytics      │     Logging                      │ │
│  │                               │                                   │ │
│  └───────────────────────────────┴───────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE LAYER                               │
│                                                                         │
│  ┌────────────────────────────┐      ┌─────────────────────────────┐ │
│  │      Firebase/Firestore     │      │       PostgreSQL            │ │
│  │                            │      │                             │ │
│  │  Collections:              │      │  Tables:                    │ │
│  │  • users                   │      │  • preference_profiles      │ │
│  │  • eventSessions           │      │  • scheduling_events        │ │
│  │    └─ messages (sub)       │      │                             │ │
│  │                            │      │                             │ │
│  │  Purpose:                  │      │  Purpose:                   │ │
│  │  • Real-time sync          │      │  • Analytics                │ │
│  │  • User profiles           │      │  • RL training data         │ │
│  │  • Active sessions         │      │  • Complex queries          │ │
│  │  • Chat history            │      │  • Preference patterns      │ │
│  └────────────────────────────┘      └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL INTEGRATIONS                             │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────┐│
│  │ Google Calendar│  │  Firebase Auth │  │  OpenAI API (Future)     ││
│  │      API       │  │                │  │  (Natural Language)      ││
│  └────────────────┘  └────────────────┘  └──────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Flow 1: User Creates Scheduling Session

```
┌─────────┐
│  User   │
│ (Client)│
└────┬────┘
     │
     │ 1. "Schedule lunch with Alice next Tuesday"
     │
     ▼
┌─────────────────────┐
│  EventSession       │
│  Service            │
└────┬────────────────┘
     │
     │ 2. Create EventSession
     │    - status: "pending"
     │    - hostUserId: current_user
     │    - inviteeIds: [alice_id]
     │
     ▼
┌─────────────────────┐
│   Firestore         │
│ eventSessions/      │
│   session_xyz789    │
└────┬────────────────┘
     │
     │ 3. Add user message
     │
     ▼
┌─────────────────────┐
│   Firestore         │
│ .../messages/       │
│   msg_001           │
└────┬────────────────┘
     │
     │ 4. Trigger Scheduling Engine
     │
     ▼
┌─────────────────────┐
│ Scheduling Engine   │
│                     │
│ a) Fetch calendars  │
│ b) Compute blocks   │
│ c) Find mutual time │
└────┬────────────────┘
     │
     │ 5. Propose 3 time slots
     │    [14:00, 15:00, 16:00]
     │
     ▼
┌─────────────────────┐
│  Update EventSession│
│  proposedTimes: [...│
└────┬────────────────┘
     │
     │ 6. Return suggestions
     │
     ▼
┌─────────┐
│  User   │
│ Sees 3  │
│ Options │
└─────────┘
```

### Flow 2: User Accepts Suggested Time

```
┌─────────┐
│  User   │
│ Clicks  │
│ "12:30" │
└────┬────┘
     │
     │ 1. Accept time slot
     │
     ▼
┌─────────────────────┐
│  EventSession       │
│  Service            │
└────┬────────────────┘
     │
     │ 2. Update EventSession
     │    - status: "scheduled"
     │    - finalTime: {...}
     │    - scheduledAt: now()
     │
     ▼
┌─────────────────────┐
│   Firestore         │
│ eventSessions/      │
│   (updated)         │
└────┬────────────────┘
     │
     │ 3. Create calendar events
     │    (via Google Calendar API)
     │
     ▼
┌─────────────────────┐
│  Google Calendar    │
│  Event Created      │
│  for host & invitees│
└────┬────────────────┘
     │
     │ 4. Log analytics event
     │
     ▼
┌─────────────────────┐
│  SchedulingEvent    │
│  Service            │
└────┬────────────────┘
     │
     │ 5. Insert into scheduling_events
     │    - outcome: "scheduled"
     │    - time_to_schedule: 8 min
     │
     ▼
┌─────────────────────┐
│   PostgreSQL        │
│ scheduling_events   │
│   (new row)         │
└────┬────────────────┘
     │
     │ 6. Update preference profile
     │
     ▼
┌─────────────────────┐
│  Preference         │
│  Service            │
└────┬────────────────┘
     │
     │ 7. Update patterns
     │    - Boost 12:30pm time
     │    - Increment acceptance_rate
     │
     ▼
┌─────────────────────┐
│   PostgreSQL        │
│ preference_profiles │
│   (updated)         │
└─────────────────────┘
```

### Flow 3: RL Model Training (Stage 3 - Future)

```
┌─────────────────────┐
│   PostgreSQL        │
│ scheduling_events   │
│ (Historical Data)   │
└────┬────────────────┘
     │
     │ 1. Export training data
     │    - 1000+ scheduling attempts
     │    - Features: time, day, duration
     │    - Labels: accepted vs rejected
     │
     ▼
┌─────────────────────┐
│  Data Pipeline      │
│  (Python Script)    │
└────┬────────────────┘
     │
     │ 2. Preprocess & feature engineering
     │
     ▼
┌─────────────────────┐
│  RL Training        │
│  (PPO Algorithm)    │
└────┬────────────────┘
     │
     │ 3. Train model on user preferences
     │
     ▼
┌─────────────────────┐
│  Trained Model      │
│  (Weights Saved)    │
└────┬────────────────┘
     │
     │ 4. Deploy to Scheduling Engine
     │
     ▼
┌─────────────────────┐
│  Scheduling Engine  │
│  (Enhanced Ranking) │
│                     │
│  Now ranks slots by:│
│  • Mutual avail.    │
│  • Learned prefs ✨ │
└─────────────────────┘
```

---

## Technology Stack by Layer

### Client Layer
- **Framework:** Next.js 16 (React)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** React Hooks (useState, useEffect)

### Application Layer
- **Language:** TypeScript
- **Services:** Custom service classes with singleton pattern
- **Scheduling Engine:** Custom algorithm (availability computation)
- **API:** Next.js API routes (future)

### Persistence Layer

#### Firestore
- **Real-time sync** for active sessions
- **Subcollections** for messages
- **Firebase Auth** integration
- **Offline support**

#### PostgreSQL
- **Structured analytics** data
- **JSONB columns** for flexible patterns
- **Indexes** for fast queries
- **ACID transactions**

### External Integrations
- **Firebase Auth:** User authentication
- **Google Calendar API:** Calendar read/write (future)
- **OpenAI API:** Natural language processing (future)

---

## Entity Placement in Architecture

| Entity | Layer | Storage | Purpose |
|--------|-------|---------|---------|
| **User** | Persistence | Firestore | Identity, profile, calendar connections |
| **EventSession** | Persistence | Firestore | Active scheduling attempts |
| **Message** | Persistence | Firestore (subcollection) | Chat history per session |
| **AvailabilityBlock** | Application | In-memory (computed) | Scheduling algorithm input |
| **PreferenceProfile** | Persistence | PostgreSQL | User behavior patterns (RL) |
| **SchedulingEvent** | Persistence | PostgreSQL | Analytics & training data |

---

## Stage-by-Stage Feature Support

### Stage 1: Manual Scheduling (MVP)
- ✓ User creates session via chat
- ✓ System stores in EventSession (Firestore)
- ✓ User manually selects time
- ✓ System logs to SchedulingEvent (PostgreSQL)

**Entities Used:** User, EventSession, Message, SchedulingEvent

### Stage 2: AI-Suggested Times
- ✓ Scheduling Engine computes AvailabilityBlocks
- ✓ AI proposes 3 best time slots
- ✓ User accepts or requests alternatives
- ✓ System updates EventSession.proposedTimes

**Entities Used:** All from Stage 1 + AvailabilityBlock

### Stage 3: Fully Automated + RL
- ✓ PreferenceProfile trained from historical data
- ✓ Scheduling Engine ranks slots by learned preferences
- ✓ RL model fine-tuned on user feedback
- ✓ Continuous improvement via PostgreSQL analytics

**Entities Used:** All entities (complete schema)

---

## Scalability Considerations

### Firestore
- **Horizontal scaling:** Automatic
- **Read/Write limits:** 1M ops/day (free tier) → Unlimited (paid)
- **Subcollection depth:** Max 1 level (messages under eventSessions)

### PostgreSQL
- **Vertical scaling:** Increase instance size
- **Read replicas:** For analytics queries
- **Partitioning:** Archive old scheduling_events (2 years+)

### Caching Strategy (Future)
- **Redis:** Cache computed AvailabilityBlocks (5 min TTL)
- **CDN:** Static assets (landing page)

---

## Security & Privacy

### Authentication
- Firebase Auth (Google OAuth)
- JWT tokens for API requests

### Authorization
- Users can only access their own EventSessions
- Invitees can view (but not edit) sessions they're invited to

### Data Encryption
- **At rest:** Firestore + PostgreSQL encrypted by default
- **In transit:** HTTPS/TLS
- **Sensitive data:** OAuth tokens encrypted with AES-256

### GDPR Compliance (Future)
- User data export API
- Right to deletion (cascade delete across Firestore + PostgreSQL)
- Data retention policy (30 days for sessions, 2 years for analytics)

---

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel (Frontend)                    │
│                                                             │
│  • Next.js app deployed via Vercel                         │
│  • Edge functions for API routes                           │
│  • CDN for static assets                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
     ┌───────────────┴──────────────────┐
     │                                  │
     ▼                                  ▼
┌─────────────────┐          ┌──────────────────────┐
│  Firebase       │          │  Cloud SQL           │
│  (Firestore     │          │  (PostgreSQL)        │
│   + Auth)       │          │                      │
│                 │          │  • Managed instance  │
│  • Auto-scaled  │          │  • Daily backups     │
│  • Multi-region │          │  • Read replicas     │
└─────────────────┘          └──────────────────────┘
```

---

## Conclusion

This architecture provides:
- ✅ Real-time responsiveness (Firestore)
- ✅ Powerful analytics (PostgreSQL)
- ✅ Scalability (Firebase + Cloud SQL)
- ✅ Stage 1–3 support (all entities in place)
- ✅ Clear separation of concerns (Client → Service → Persistence)

The hybrid database approach positions Gatherly for both immediate MVP functionality and future RL-powered scheduling intelligence.

