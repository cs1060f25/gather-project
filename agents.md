````markdown
# Gatherly (Agents). ChatGPT used to adapt original MD document for formatting purposes.

## 🧭 Project Overview

**Name:** Gatherly  
**Short summary:** Gatherly is a scheduling agent that helps people leverage relationships to achieve goals by reducing the activation energy in coordinating events.

### 🎯 Primary Users & Personas
- **University students** coordinating hangouts with peers who have differing schedules  
- **Students** aiming to build deeper relationships with family or community members  
- **Students** scheduling coffee chats with people in their network to advance career goals  

### 💡 Problem & Success Metrics
**Problem:** High activation energy in scheduling meetups with busy individuals who have vastly different schedules.  
**Success metrics:**
- Percentage of successful scheduling matches  
- Average time to find a mutually available slot  
- User retention rate  

**Repository / Monorepo Path:** [https://github.com/cs1060f25/gather-project](https://github.com/cs1060f25/gather-project)  
**Status:** Prototype  
**Owners:** Talha Minhas, Milan Naropanth, Ikenna  

---

## ⚙️ System Architecture

**Frontend / Client:** React Native (with React Native Web for responsive web) — mobile-first webapp  
**Backend / API:** Node.js (TypeScript) + Express (or Fastify) with REST endpoints  
**Orchestration / Workers:** BullMQ + Redis for background jobs (reminders, notifications)  
**LLM Providers:** OpenAI API (placeholder: `gpt-4.1` or `o4-mini` for cost-sensitive flows)  
**Vector / Retrieval:** (Optional) Supabase pgvector for prompt memory and meeting templates  
**Datastores:**  
- PostgreSQL (Supabase) — core relational data  
- Redis — short-lived state  
**Observability:** pino logs, OpenTelemetry traces, feature-flagged prompt/response capture  
**Infra:** Cloud deployment (see Deployment section)

---

## 🔐 Data Sources

- **Auth:** Firebase Authentication (email/password + OAuth)
- **Calendar:** Google Calendar API (OAuth per-user)
- **Messaging:** Twilio (SMS for nudges, RSVP links, confirmations)

### 🗄️ Database Schemas (initial)
| Table | Columns |
|--------|----------|
| users | id, email, name, auth_provider, created_at |
| contacts | id, user_id, name, phone, email |
| events | id, owner_id, title, description, location, desired_window, status |
| event_slots | id, event_id, start_ts, end_ts, score, source |
| invites | id, event_id, invitee_id, channel, token, status |
| availability_cache | id, user_id, date, blocks_json, source, refreshed_at |

---

## 💬 Interaction Model & UI

- **Primary surface:** Responsive web app (React Native Web)
- **Category colors:**  
  - Academic `#7C3AED`  
  - Career `#0EA5E9`  
  - Social/Family `#10B981`
- **Message links:** Signed deep links open RSVP/availability pages without login (short-lived tokens)

---

## 🧠 Agents

### 🗓️ Agent: Calendar Classifier
**Purpose:** Categorize Google Calendar events (Academic, Career, Social/Family).  
**Inputs:** Event objects (summary, description, attendees, etc.) + user hints  
**Outputs:** Records with category, priority_score, can_override  

**Heuristics (Academic):**
- Course codes (e.g., `CS\d{2,3}` / `ECON\d+`)  
- Keywords: lecture, seminar, lab, exam, section, tutorial, office hours  
- Calendar names like “Classes” / “Course”  
- Attendees with `.edu` emails  
- Known classroom buildings  
- Fallback to user confirmation if confidence < 0.7  

---

### ⚙️ Agent: Preference Manager
**Purpose:** Collect and enforce user rules (ignored categories, quiet hours, overrides).  
**Inputs:** Onboarding selections, natural-language preferences  
**Outputs:** Normalized policy object used by other agents  
**Notes:** No hardcoded cross-category overrides — learned from user behavior.  

---

### 🧩 Agent: Scheduling Engine
**Purpose:** Propose conflict-free open slots respecting user preferences and priorities.  
**Inputs:** Desired window, participants, constraints, classified calendars, preference policies  
**Outputs:** Up to 3 unranked options per round  

---

### 🤝 Agent: Consensus Coordinator
**Purpose:** Coordinate invites and reach consensus.  
**Policy:**  
- Default: Confirm when ≥50% accept one option  
- Override: “Require everyone to attend” → 100% acceptance  
- After 3 failed rounds, invitees may propose new times → rerun scheduling  

---

### 📱 Agent: Notifier
**Purpose:** Send SMS updates and confirmations.  
**Channels:** Twilio SMS, Google Calendar updates  
**Behavior:** Sends event summary + secure link listing 3 options; updates on confirm/reschedule  

---

### 🔁 Agent: Calendar Sync
**Purpose:** Maintain bi-directional sync (GCal ↔ Gatherly).  
**Behavior (MVP):** Reactive updates — when the host reschedules, update participants via Notifier.  

---

### 🛡️ Agent: Consent & Privacy Guard
**Purpose:** Enforce minimal scopes, redact PII in logs, and apply user-level privacy policies.  

---

## 🧩 Prompts & Grounding

- **System prompts:** `/prompts/scheduler.system.md`, `/prompts/availability.system.md` (placeholders)  
- **Few-shot examples:** `/prompts/examples/*.md` (RSVP flows)  
- **Retrieval:** Optional RAG for phrasing; rule-based otherwise  
- **Freshness:** Re-pull free/busy data when cache > 5 min old (TTL TBD)

---

## 🚀 Deployment & Environments

- **Environments:** Production only (for now)  
- **CI/CD:** GitHub Actions → build, test, lint, type-check, deploy on push to main  
- **Runtime config:** `.env` variables and defaults in `/config`  
- **Hosting:** TBD (see Open Questions)

---

## 💻 Local Development

### Requirements
- Node ≥ 20  
- pnpm preferred  

### Setup
```bash
pnpm install
cp .env.example .env  # fill OPENAI_API_KEY, GOOGLE_CLIENT_ID/SECRET, SUPABASE_URL/KEY, TWILIO_SID/TOKEN
````

### Run the App

```bash
# API
pnpm dev:api

# Web (React Native Web via Expo or Next.js)
pnpm dev:web
```

---

## 🧪 Testing Instructions

### Continuous Integration (CI)

**Provider:** GitHub Actions
**Triggers:**

* Pull requests to `main`
* Pushes to feature branches
* Optional nightly (02:00 UTC)

**Jobs:**

1. Setup
2. Lint + typecheck
3. Unit + integration tests
4. Security scan (`npm audit`, secret scan)
5. Build artifacts
6. Deploy to prod on merge

---

### Run Tests Locally

```bash
# Unit + integration with coverage
pnpm test -- --coverage

# Watch mode
pnpm test:watch

# Specific test
pnpm test -- src/agents/scheduler.test.ts -t "confirms at >=50% acceptance"
```

### Linters & Static Analysis

```bash
pnpm lint        # eslint .
pnpm format      # prettier --write .
pnpm typecheck   # tsc --noEmit
```

---

### When to Update Tests

* Changes to scheduling, slot creation, notifications, consensus thresholds
* Bug fixes (write failing test first)
* New features affecting public behavior

### Do **Not** Modify Existing Tests

* Don’t delete or skip tests to pass CI
* If flaky: mark as `@flaky/skip` with issue link and rationale

### Additional Testing Guidance

* Mock LLM calls (temperature=0)
* RSVP E2E tests: SMS → slot choice → confirm logic
* Fail tests on excessive token/latency
* Validate data contracts with Zod

---

## 🗺️ Roadmap (Next 90 Days)

* MVP: scheduler-centric flow with SMS invites + GCal sync
* Add “require everyone” toggle & consensus tuning
* Onboarding: ignore lists + natural-language preferences
* End-to-end RSVP flows + prompt regression tests

---

## ❓ Open Questions / Decisions Needed

* **DB:** Postgres (Supabase) vs Firestore → leaning Supabase
* **Availability cache TTL:** Proposed 5 min — confirm/change
* **Audit/logging:** Additional PII masking policies?
* **E2E coverage:** Include Playwright from day one?
* **Hosting:** Vercel+Fly+Supabase vs Render+Supabase vs Firebase Hosting+Cloud Run+Firestore

```
