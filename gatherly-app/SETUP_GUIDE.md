# Gatherly Database Setup Guide

This guide will help you set up and test the Gatherly database layer with real Firebase and PostgreSQL instances.

## Quick Start (5 minutes)

### Step 1: Set Up Firebase (Free)

1. **Create Firebase Project:**
   ```bash
   # Open Firebase Console in browser
   open https://console.firebase.google.com
   ```

2. **Create a new project:**
   - Click "Add project"
   - Name it "gatherly-dev" (or any name)
   - Disable Google Analytics (optional)
   - Click "Create project"

3. **Enable Firestore:**
   - In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Start in **test mode** (we'll add security rules later)
   - Choose your region (us-central1 is fine)
   - Click "Enable"

4. **Enable Authentication:**
   - In the left sidebar, click "Authentication"
   - Click "Get started"
   - Enable "Google" sign-in method (optional for now)

5. **Get your Firebase config:**
   - Go to Project Settings (gear icon near "Project Overview")
   - Scroll down to "Your apps"
   - Click the web icon (</>) to add a web app
   - Register app with nickname "Gatherly Web"
   - Copy the config values (we'll use them next)

### Step 2: Set Up PostgreSQL

**Option A: Use Neon (Recommended - Free Cloud PostgreSQL)**

1. **Create Neon account:**
   ```bash
   open https://neon.tech
   ```

2. **Create a project:**
   - Sign up with GitHub
   - Create new project: "gatherly-dev"
   - Choose region closest to you
   - Copy the connection string

**Option B: Use Local PostgreSQL (if already installed)**

1. **Install PostgreSQL (if not installed):**
   ```bash
   # macOS with Homebrew
   brew install postgresql@16
   brew services start postgresql@16
   ```

2. **Create database:**
   ```bash
   createdb gatherly_dev
   ```

### Step 3: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cd gatherly-app
   cp .env.local.example .env.local
   ```

2. **Edit .env.local with your values:**
   ```bash
   nano .env.local  # or use any text editor
   ```

3. **Paste your Firebase config values:**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gatherly-dev.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=gatherly-dev
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gatherly-dev.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

4. **Add PostgreSQL config:**
   
   **If using Neon:**
   ```
   POSTGRES_HOST=your-project.neon.tech
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=neondb
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   ```
   
   **If using local PostgreSQL:**
   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=gatherly_dev
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=postgres
   ```

### Step 4: Install Dependencies and Test

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Test database connections:**
   ```bash
   npm run db:test
   ```
   
   Expected output:
   ```
   🧪 Testing Gatherly database connections...
   
   1️⃣  Testing Firebase/Firestore...
      ✅ Firebase initialized
      📦 Firestore ready
      🔐 Auth ready
   
   2️⃣  Testing PostgreSQL...
      ✅ PostgreSQL connected
      ⏰ Server time: 11/12/2025, 3:30:45 PM
      📊 Version: PostgreSQL 16.x
      📋 Tables found: 0
      ⚠️  No tables found. Run: npx ts-node scripts/setup-db.ts
   
   ✨ Connection test complete!
   ```

3. **Set up PostgreSQL schema:**
   ```bash
   npm run db:setup
   ```
   
   Expected output:
   ```
   🚀 Setting up Gatherly database...
   
   1️⃣  Connecting to PostgreSQL...
      ✅ Connected to PostgreSQL
   
   2️⃣  Creating tables...
      ✅ Tables created successfully
   
   3️⃣  Verifying tables...
      📊 Found tables:
         - preference_profiles
         - scheduling_events
   
   ✨ Database setup complete!
   ```

4. **Seed test data:**
   ```bash
   npm run db:seed
   ```
   
   Expected output:
   ```
   🌱 Seeding test data...
   
   1️⃣  Creating test user...
      ✅ Created user: test
   
   2️⃣  Creating test session...
      ✅ Created session: session_1731441234567_abc123
   
   3️⃣  Adding test message...
      ✅ Created message: msg_xyz789
   
   4️⃣  Creating preference profile...
      ✅ Created preference profile for: test
   
   5️⃣  Logging analytics event...
      ✅ Logged event: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   
   ✨ Test data seeded successfully!
   ```

### Step 5: Verify in Database Consoles

**Check Firestore:**
```bash
# Open Firebase Console
open https://console.firebase.google.com
```
- Go to Firestore Database
- You should see collections: `users`, `eventSessions`
- Click into them to see your test data

**Check PostgreSQL (Neon):**
```bash
# If using Neon, open their SQL editor
open https://console.neon.tech
```
- Go to SQL Editor
- Run query:
  ```sql
  SELECT * FROM preference_profiles;
  SELECT * FROM scheduling_events;
  ```

**Check PostgreSQL (Local):**
```bash
psql gatherly_dev

# Once in psql:
\dt                                    # List tables
SELECT * FROM preference_profiles;      # View profiles
SELECT * FROM scheduling_events;        # View events
\q                                      # Quit
```

### Step 6: Run the App

```bash
npm run dev
```

Visit http://localhost:3000 and test the UI!

---

## Troubleshooting

### Firebase Issues

**Error: "Firebase: Error (auth/configuration-not-found)"**
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set in `.env.local`
- Restart the dev server after changing env vars

**Error: "Missing or insufficient permissions"**
- Go to Firestore Database > Rules
- For testing, use:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
  ```
- **WARNING:** This allows all access. Use only for development!

### PostgreSQL Issues

**Error: "Connection refused"**
- If local: Make sure PostgreSQL is running
  ```bash
  brew services list  # Check status
  brew services start postgresql@16
  ```
- If Neon: Check your connection string is correct

**Error: "password authentication failed"**
- Double-check `POSTGRES_USER` and `POSTGRES_PASSWORD` in `.env.local`
- For local PostgreSQL, try `postgres` / `postgres` as defaults

**Error: "database does not exist"**
- Create the database:
  ```bash
  createdb gatherly_dev
  ```

### Environment Variables Not Loading

**Next.js not picking up .env.local:**
- Restart the dev server completely (Ctrl+C, then `npm run dev`)
- Make sure `.env.local` is in the `gatherly-app/` directory (not root)
- Check file isn't named `.env.local.example` (remove `.example`)

---

## CLI Commands Reference

```bash
# Database commands
npm run db:test          # Test connections to Firebase + PostgreSQL
npm run db:setup         # Create PostgreSQL tables
npm run db:seed          # Seed test data

# Development
npm run dev              # Start Next.js dev server
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode

# Production
npm run build            # Build for production
npm start                # Start production server
```

---

## Manual Testing Checklist

- [ ] Firebase connection successful
- [ ] PostgreSQL connection successful
- [ ] Tables created (preference_profiles, scheduling_events)
- [ ] Test user created in Firestore
- [ ] Test session created in Firestore
- [ ] Test message created in Firestore subcollection
- [ ] Preference profile created in PostgreSQL
- [ ] Analytics event logged in PostgreSQL
- [ ] UI loads at http://localhost:3000
- [ ] Chat bar works on dashboard

---

## Next Steps

Once everything is working:

1. **Add Firebase Security Rules** (see `/docs/schema.md`)
2. **Connect Google Calendar API** (Stage 2 feature)
3. **Implement availability computation** (Stage 2 feature)
4. **Deploy to Vercel** with environment variables

---

## Need Help?

- **Schema questions:** See `/docs/schema.md`
- **Architecture questions:** See `/docs/architecture.md`
- **Service usage:** See `/gatherly-app/lib/db/README.md`
- **Linear ticket:** GATHER-27

Good luck! 🚀

