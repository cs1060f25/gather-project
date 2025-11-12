# Gatherly Database Layer

**Linear Task:** GATHER-27 (HW9)  
**Branch:** `edtechmilan-hw9`  
**Phase:** Stage 0 - Foundation

## Overview

This directory contains the persistence layer implementation for Gatherly's scheduling agent. The implementation uses a hybrid database approach combining Firestore (for real-time data) and PostgreSQL (for analytics and ML training data).

## Directory Structure

```
lib/db/
├── README.md                    # This file
├── firebase.config.ts           # Firebase/Firestore configuration
├── postgres.config.ts           # PostgreSQL configuration
└── services/
    ├── index.ts                 # Service exports
    ├── user.service.ts          # User CRUD operations (Firestore)
    ├── eventSession.service.ts  # EventSession operations (Firestore)
    ├── message.service.ts       # Message operations (Firestore subcollection)
    ├── preference.service.ts    # Preference profile (PostgreSQL)
    └── schedulingEvent.service.ts # Analytics logging (PostgreSQL)
```

## Quick Start

### 1. Install Dependencies

```bash
cd gatherly-app
npm install
```

Dependencies added:
- `firebase`: ^11.2.0 (Firestore + Auth)
- `pg`: ^8.13.1 (PostgreSQL client)
- `@types/pg`: ^8.11.10 (TypeScript types)

### 2. Set Up Environment Variables

Create a `.env.local` file in `gatherly-app/`:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=gatherly_dev
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
```

### 3. Initialize Databases

#### Firestore
1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Set up Firebase Auth (Google provider)
4. Copy configuration values to `.env.local`

#### PostgreSQL
1. Install PostgreSQL locally or use a cloud service
2. Create database: `createdb gatherly_dev`
3. Initialize schema:

```bash
# Run from gatherly-app directory
node -e "require('./lib/db/postgres.config').initializeSchema()"
```

### 4. Run Tests

```bash
npm test
```

## Usage Examples

### Creating a User

```typescript
import { getUserService } from '@/lib/db/services';

const userService = getUserService();

const newUser = await userService.createUser({
  email: 'alice@stanford.edu',
  name: 'Alice Smith',
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
```

### Creating a Scheduling Session

```typescript
import { getEventSessionService, getMessageService } from '@/lib/db/services';

const sessionService = getEventSessionService();
const messageService = getMessageService();

// Create session
const session = await sessionService.createSession({
  hostUserId: 'user_alice',
  inviteeIds: ['user_bob'],
  title: 'Coffee Chat',
  duration: 30,
  status: 'pending',
  constraints: {
    daysOfWeek: ['monday', 'tuesday', 'wednesday'],
    timeRange: {
      start: '14:00',
      end: '18:00',
    },
  },
});

// Add user message
await messageService.addMessage(session.id, {
  sessionId: session.id,
  role: 'user',
  content: 'Schedule coffee with Bob next week',
});
```

### Logging Analytics

```typescript
import { getSchedulingEventService } from '@/lib/db/services';

const eventService = getSchedulingEventService();

await eventService.logEvent({
  sessionId: session.id,
  hostUserId: 'user_alice',
  numInvitees: 1,
  outcome: 'scheduled',
  timeToSchedule: 8, // minutes
  numMessages: 4,
  selectedSlot: {
    start: new Date('2025-11-18T14:00:00Z'),
    end: new Date('2025-11-18T14:30:00Z'),
  },
});
```

### Computing Preference Profiles

```typescript
import { getPreferenceService } from '@/lib/db/services';

const preferenceService = getPreferenceService();

// Compute profile from user's historical data
const profile = await preferenceService.computeProfile('user_alice');

console.log(profile.dayOfWeekPatterns);
// { monday: 0.85, tuesday: 0.90, ... }

console.log(profile.acceptanceRate);
// 78.5
```

## Database Schema

See comprehensive documentation in:
- **Schema Details:** `/docs/schema.md`
- **Architecture Diagram:** `/docs/architecture.md`
- **TypeScript Types:** `/types/schema.ts`

## Testing

### Unit Tests
```bash
npm test schema.test.ts
```

Tests schema validation and type correctness.

### Integration Tests
```bash
npm test services.integration.test.ts
```

Tests end-to-end data flows (uses mocks, no actual DB required).

### Coverage
```bash
npm run test:coverage
```

## Production Considerations

### Firebase/Firestore
- **Free tier limits:** 50K reads, 20K writes per day
- **Paid tier:** $0.06 per 100K reads, $0.18 per 100K writes
- **Scaling:** Automatic horizontal scaling
- **Backups:** Automatic daily backups (paid tier)

### PostgreSQL
- **Local dev:** Use Docker or local install
- **Production:** Use managed service (e.g., Neon, Supabase, Cloud SQL)
- **Connection pooling:** Already configured (max 20 connections)
- **Indexes:** Created for common queries (see `postgres.config.ts`)

### Security
- **Firestore:** Use Firebase Security Rules (not implemented yet)
- **PostgreSQL:** Use connection string with SSL in production
- **OAuth tokens:** Encrypt sensitive data before storing

## Roadmap

### Stage 1 (Current - MVP)
- ✅ Schema design and documentation
- ✅ Database configuration files
- ✅ TypeScript types and interfaces
- ✅ Mock service implementations
- ✅ Unit and integration tests
- ⏳ Connect to real Firebase/PostgreSQL instances
- ⏳ Implement Firebase Security Rules

### Stage 2 (AI Suggestions)
- ⏳ Integrate Google Calendar API
- ⏳ Implement AvailabilityBlock computation
- ⏳ Build scheduling algorithm
- ⏳ Add caching layer (Redis)

### Stage 3 (RL Fine-Tuning)
- ⏳ Export training data pipeline
- ⏳ Train RL model on preference profiles
- ⏳ Deploy model to production
- ⏳ Continuous learning from user feedback

## Troubleshooting

### Firebase Connection Issues
```bash
# Check Firebase config
console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

# Test connection
import { getFirestoreDb } from '@/lib/db/firebase.config';
const db = getFirestoreDb();
console.log('Connected to Firestore:', db.type);
```

### PostgreSQL Connection Issues
```bash
# Test connection
psql -h localhost -U postgres -d gatherly_dev

# Check if tables exist
\dt

# View schema
\d preference_profiles
```

## Contributing

When adding new entities or modifying the schema:

1. Update `/docs/schema.md` with new entity definitions
2. Add TypeScript types to `/types/schema.ts`
3. Create/update service class in `/lib/db/services/`
4. Write tests in `/__tests__/`
5. Update this README with usage examples
6. Commit with message format: `HW9 GATHER-27: <description>`

## Support

For questions or issues:
- **Schema Questions:** See `/docs/schema.md`
- **Architecture:** See `/docs/architecture.md`
- **Linear Ticket:** GATHER-27 (Stage 0)
- **Branch:** `edtechmilan-hw9`

---

**Last Updated:** November 12, 2025  
**Implemented By:** Milan Naropanth (@edtechmilan)

