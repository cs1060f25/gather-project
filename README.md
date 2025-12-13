<p align="center">
  <img src="public/favicon.svg" alt="Gatherly Logo" width="80" height="80">
</p>

<h1 align="center">Gatherly</h1>

<p align="center">
  <strong>Schedule meetings in seconds, not minutes.</strong>
</p>

<p align="center">
  <a href="https://gatherly.now">Live Demo</a> ·
  <a href="#how-gatherly-works">Features</a> ·
  <a href="#local-development">Get Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-live-22c55e?style=flat-square" alt="Status">
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/built%20at-Harvard-A51C30?style=flat-square" alt="Harvard">
</p>

<p align="center">
  <img src="public/og-image.png" alt="Gatherly Dashboard" width="700">
</p>

---

## The Problem We Solve

Scheduling is broken. Every week, millions of hours are wasted on the same tedious dance: "When works for you?" followed by endless email chains, When2Meet polls that nobody fills out, and calendar tabs open side-by-side trying to find a sliver of overlapping free time.

This is administrative work that adds zero value to your life. You dont enjoy scheduling a study session for your group project. You enjoy the study session itself. You dont enjoy coordinating a coffee catch-up with an old friend. You enjoy the conversation.

We built Gatherly because we believe AI should handle the tedious coordination so humans can focus on the face time that actually matters.

---

## Our Thesis

The scheduling problem has existed for decades, and existing tools like Calendly, Doodle, and When2Meet have only partially solved it. They digitized the process but kept the friction. You still click through forms. You still manually compare calendars. You still send follow-up reminders.

We asked a simple question: what if you could just tell your calendar what you want, and it figures out the rest?

Our thesis is that natural language AI can collapse the entire scheduling workflow into a single sentence. Type "dinner with the team next Friday" and the system should understand who, what, when, and where. It should check availability, suggest times, send invites, and confirm the event. All without forms, all without clicking through date pickers.

We chose to start by replacing When2Meet because thats where the pain is most acute. Group scheduling is exponentially harder than one-on-one meetings. Coordinating five peoples calendars manually is a nightmare. But for AI, its just a constraint satisfaction problem.

### The Philosophy: Limit User Choice

Traditional scheduling tools give invitees too many options. When2Meet asks everyone to paint their entire week. Doodle presents a grid of possibilities. The result is decision paralysis and low response rates.

Gatherly flips this model. The event organizer proposes specific times. Invitees simply accept or decline each option. This constraint is a feature, not a limitation. By limiting choice, we increase response rates. By centralizing control with the organizer, we reduce coordination overhead.

We are not currently supporting natural language back-and-forth via something like iMessage to survey participants. That comes later. For now, we survey people simply through structured response pages. The organizers perspective shapes the options. Everyone else just reacts.

This achieves the same goal as a fully conversational AI agent, just with simpler technology. All new fails. We start with what works, prove the value, then add sophistication.

### The Strategy: Vertical Expansion

Our roadmap is intentional. Replace When2Meet first. Prove that AI-powered scheduling is better than manual grid-painting. Capture the group scheduling use case.

Then expand vertically. Add more integrations. Replace not just When2Meet but Calendly. Then Doodle. Then the ad-hoc email chains and Slack threads. Eventually, replace the entire scheduling stack.

Rather than building from scratch, we integrated with the tools people already use and trust. Google Calendar holds your data securely. Gmail delivers your invitations. We add the intelligence layer on top, respecting the infrastructure you already have rather than asking you to migrate to yet another platform.

The goal is not to be another calendar app. The goal is to be the intelligence layer that sits on top of all calendar apps, all communication channels, all scheduling contexts. Start narrow, expand wide.

---

## How Gatherly Works

### The Chat Interface

At the center of Gatherly is a chat bar. You type what you want to schedule in plain English. The AI parses your request using OpenAI GPT-4o-mini and extracts the key details: event title, participants, proposed times, duration, and location.

For example, typing "lunch with Sarah and Mike next Tuesday around noon for an hour at Shake Shack" creates an event with all those details pre-filled. The AI understands context. It knows "next Tuesday" means a specific date. It knows "around noon" means flexible timing. It knows "Shake Shack" is a location, not a person.

If you leave details out, Gatherly asks clarifying questions or makes reasonable defaults. An unspecified duration defaults to 60 minutes. An unspecified location shows as TBD until you fill it in.

### Continuous Editing Through Conversation

The chat interface is not a one-shot interaction. After your initial prompt creates an event, you can keep prompting to refine it. Say "actually make it 2pm instead" and the pending event updates. Say "add Jessica to the invite" and she gets added to the participant list. Say "change the location to Blue Bottle Coffee" and the location updates.

While you edit, the pending event appears on your calendar as a green overlay. You can see in real-time whether your proposed times conflict with existing commitments. No more switching between tabs to cross-reference. The conflict detection happens visually, right where your events live.

This conversational editing continues until you hit send. The AI maintains context across multiple prompts, so you can iterate naturally without starting over.

### Voice Dictation

For hands-free scheduling, Gatherly supports voice dictation. Click the microphone icon and speak your scheduling request. The browser's speech recognition transcribes your words into the chat input, and the AI processes it the same way it handles typed text. Schedule a meeting while walking to your next class. Add a reminder while cooking dinner. Voice input makes Gatherly accessible when your hands are occupied.

### The Calendar View

Your Google Calendar syncs in real-time through OAuth. Events from all your calendars appear in a weekly view, color-coded by calendar source. When you create a Gatherly event, the proposed time slots appear as green overlays on the calendar so you can instantly see conflicts.

The calendar is fully interactive. Click any time slot to manually add an option. Drag to adjust duration. Toggle individual calendars on or off to focus on specific commitments.

We handle Google Calendar sync with care. On initial load, Gatherly fetches your events for a rolling window around the current date. The OAuth token refreshes automatically in the background, so your session stays alive without re-authentication. Events you create through Gatherly sync back to Google Calendar immediately upon confirmation, appearing in your native calendar app within seconds.

### Persistence and State Management

Gatherly persists your preferences and recent activity across sessions. Your calendar toggle selections save to local storage, so if you prefer to hide your work calendar while scheduling personal events, that preference sticks. Your recent contacts save locally too, making it faster to add people you schedule with frequently.

Session state uses a combination of React state and Supabase real-time subscriptions. If you close the tab mid-edit and reopen it, pending events in the database restore automatically. Notifications you have not read remain unread until you explicitly dismiss them.

### The People Section

Gatherly tracks the people you schedule with most often. The recent contacts list appears when you start typing a participant name or email. Select from suggestions rather than typing full email addresses every time.

The contacts pull from two sources: your Google Contacts via the People API, and your Gatherly scheduling history. If you scheduled coffee with someone last month, they appear near the top of suggestions when you type their first letter.

We never show your own email in the recent contacts list. That would be redundant. The filter runs automatically.

### The Location API

Gatherly integrates with the Google Places API for location autocomplete. Start typing an address or venue name and suggestions appear instantly. Select one and the full address, plus a link to Google Maps, gets attached to your event. Invitees see the location in their invitation email with a clickable map link.

This matters because location is often the forgotten detail. How many times have you shown up to a meeting only to realize you dont know which conference room, which coffee shop, or which building entrance? Gatherly makes location a first-class citizen in the scheduling flow.

### Timezone Detection

Gatherly automatically detects your local timezone using the browser's Intl API. All times display in your local timezone without any configuration. When you schedule with someone in a different timezone, Gatherly handles the conversion automatically. The invitee sees the event in their local time. No more "Is that 3pm your time or mine?" confusion.

This is especially important for distributed teams and remote friendships. A meeting at 2pm Pacific shows as 5pm Eastern for participants on the East Coast. Everyone sees the time that matters to them.

### Local Weather

The dashboard displays your local weather conditions based on your detected location. See the current temperature and conditions at a glance. This context helps with scheduling decisions. Planning an outdoor lunch? Check if rain is expected. Scheduling a morning walk? See if it will be too cold.

Weather data pulls from a weather API using your approximate location from IP geolocation. This is intentional. We never request browser location permissions or precise GPS coordinates. You never see the annoying "Allow location access?" popup. The feature just works, respecting your privacy while still providing relevant local context. This friction-free approach improves user retention because people dont abandon the app at a permissions prompt.

### Smart Location Suggestions

When you start typing a location for your event, Gatherly prioritizes results near you. The Google Places API receives your approximate location from IP geolocation, so suggestions surface local coffee shops, restaurants, and venues first. Type "Blue Bottle" and the one down the street appears before locations in other cities.

Again, no location permissions required. Gatherly feels like its in your backyard without ever asking to track you. This creates a seamless experience where relevant results appear instantly without privacy trade-offs.

### The Invite System

Once you finalize your event details, Gatherly sends email invitations through Resend. Each invitee receives a beautifully formatted email with the event details, proposed time options, and a unique response link.

The response page shows each time option as a card. Invitees select which times work for them. Their responses are recorded instantly and the organizer receives a real-time notification. No account creation required for invitees. No app download. Just click the link and respond.

When all invitees have responded, the organizer sees a summary of availability and can confirm the final time with one click. The confirmed event automatically syncs to Google Calendar for everyone involved.

### Reminders for Pending Events

Life gets busy and people forget to respond to invites. Gatherly lets organizers send reminder nudges to participants who have not yet submitted their availability. One click sends a friendly reminder email with the original invite link. The reminder system is smart enough to skip participants who already responded, so you never accidentally spam someone who already filled out their availability.

The reminder email includes the organizers name, the event title, the proposed time options, and a direct link to respond. Its formatted to feel personal, not automated. The goal is to gently nudge without being annoying.

You can send reminders from the event detail page or directly from the calendar view. The button appears on pending Gatherly events alongside options to view details or cancel.

### Notifications for Scheduled Events

When an event is confirmed, all participants receive notifications. The organizer gets an in-app notification confirming the event is scheduled. Each participant receives both an in-app notification and an email with the final details: date, time, location, and a Google Meet link if applicable.

The email notification ensures participants who dont check Gatherly regularly still know about their upcoming commitment. The event also syncs to Google Calendar, so it appears in their native calendar app with all the details.

If an event is cancelled, everyone gets notified immediately. The cancellation email explains that the organizer cancelled and includes contact information if participants have questions. No one shows up to a meeting that no longer exists.

### Google Meet Integration

For virtual meetings, Gatherly can automatically generate a Google Meet link. Toggle the option when creating an event and the meeting link gets embedded in the calendar invite. Attendees click to join without any additional setup.

### Notifications and Daily Summary

Gatherly includes a notification system powered by Supabase Realtime. When an invitee responds to your event, you see a notification instantly. When an event is confirmed, all participants get notified. When someone cancels, everyone knows immediately.

Beyond transactional notifications, Gatherly generates an AI-powered daily summary. Each morning, you see a briefing of whats on your calendar today, whats coming up this week, and suggested events based on your patterns. The AI might notice you havent scheduled a one-on-one with a teammate in a while, or that you have a free afternoon perfect for deep work. Suggested events appear as quick-add cards. Click one and it populates the create event form with sensible defaults.

You can dismiss individual notifications or clear all of them at once. The notification dropdown appears above everything else in the interface, so it never gets lost behind modals or overlays.

### Event Management

Every Gatherly event has a dedicated page where organizers can edit details, remind participants who havent responded, or cancel the event entirely. Cancellation sends a notification email to all invitees and removes the event from Google Calendar.

### Live Event Editing

Gatherly supports full event editing with live propagation to all participants. Change the event title, description, location, or proposed times, and updates sync immediately. Invitees see the new details the next time they open their response link. The organizer sees changes reflected instantly in the dashboard.

Edit the participant list after creation. Add someone you forgot and they receive a fresh invite with the current event details. Remove someone whose schedule changed and they receive a cancellation notice for just their participation while the event continues for others. The response count updates automatically. If you had 2/3 responses and remove one participant, it becomes 2/2.

Edit the proposed time options even after invitees have started responding. Change a date that no longer works. Adjust the duration. Add a third option if the first two arent getting traction. Existing responses remain valid for unchanged options. New options appear for invitees who havent responded yet.

This flexibility matters because plans change. Someone realizes they have a conflict. A new stakeholder needs to join. The venue falls through. Rather than cancelling and starting over, edit the existing event and keep the momentum going.

---

## Design and User Experience

### Dark Mode

Gatherly supports a full dark mode for users who prefer reduced eye strain or simply like the aesthetic. Toggle it from the header and the entire interface inverts: dark backgrounds, light text, adjusted accent colors that remain readable. The preference persists in local storage, so Gatherly remembers your choice across sessions and devices.

### Animations and Micro-interactions

We invested heavily in animations that make the interface feel alive without being distracting. The chat submit button pulses gently to draw attention. Calendar events fade in smoothly when the view changes. Notification badges bounce briefly when new notifications arrive. Modal overlays fade in with a subtle scale transform. Loading states use skeleton screens rather than spinners where possible.

These micro-interactions serve a purpose beyond aesthetics. They provide feedback that actions registered. They guide attention to important changes. They make waiting feel shorter. A well-timed animation can make the difference between an interface that feels sluggish and one that feels responsive.

The green border that appears around the calendar in edit mode pulses subtly to indicate that changes are pending. Response indicators on calendar events use color-coded dots with tooltips. Hover states on buttons shift with spring physics rather than instant transitions.

### Responsive Design

Gatherly works on desktop, tablet, and mobile. The layout adapts using CSS media queries. On mobile, the calendar collapses to a single-day view with swipe navigation. The create event panel becomes a bottom sheet. Touch targets are sized appropriately for fingers rather than mouse pointers.

The notification dropdown repositions itself on small screens to avoid getting clipped. The event detail modal becomes full-screen on mobile rather than a centered card. Date pickers use native mobile controls when available for better touch interaction.

### Accessibility

Keyboard navigation works throughout the app. Tab through interactive elements. Enter to confirm. Escape to cancel. Screen readers can parse the semantic HTML structure.

Color contrast meets WCAG AA standards. Interactive states are visually distinct. Error messages are clear and actionable. Focus rings appear on keyboard navigation but hide on mouse interaction to avoid visual clutter.

---

## Product Differentiation

### Versus When2Meet

When2Meet requires everyone to manually paint their availability on a grid. Its tedious. Its error-prone. People forget to fill it out. Gatherly flips the model: instead of asking everyone when theyre free, we look at their calendars and compute availability automatically for connected users, while still allowing manual responses for those without calendar integration.

### Versus Calendly

Calendly is optimized for one-on-one booking with external parties. It works well for sales calls and customer meetings but poorly for internal coordination or friend groups. Gatherly handles multi-party scheduling natively. Propose three time options and let the group vote.

### Versus Doodle

Doodle polls are passive. You create a poll, share a link, and wait. Gatherly is active. It sends reminders. It notifies you of responses. It suggests optimal times based on the responses received.

### Versus Manual Coordination

Email threads and Slack messages are how most scheduling actually happens today. Its inefficient but familiar. Gatherly keeps the natural language interface people prefer while automating the tedious follow-up.

---

## Technical Architecture

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Vercel-Serverless-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel">
  <img src="https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
</p>

Gatherly is a React single-page application deployed on Vercel. The frontend uses TypeScript for type safety and Vite for fast development builds. Styling is custom CSS following a neobrutalist design system with bold borders, high contrast, and playful animations.

The backend consists of Vercel Serverless Functions that handle sensitive operations. The parse-scheduling endpoint calls OpenAI to interpret natural language. The send-invite, send-reminder, and send-cancel-notification endpoints send transactional email through Resend. The daily-summary endpoint generates AI briefings.

Data lives in Supabase, a hosted PostgreSQL database with built-in authentication. User profiles, events, invites, and notifications are stored in relational tables with Row Level Security policies ensuring users only access their own data.

Authentication uses Supabase Auth with Google OAuth. When a user signs in with Google, we request Calendar API scopes and store the access token securely. The token refreshes automatically, keeping the calendar sync alive without user intervention.

Real-time features use Supabase Realtime subscriptions. When a row is inserted into the notifications table, the frontend receives a push update immediately. No polling required.

```
gatherly/
├── api/                          # Vercel Serverless Functions
│   ├── parse-scheduling.ts       # OpenAI natural language parsing
│   ├── daily-summary.ts          # AI-generated daily briefings
│   ├── send-invite.ts            # Email invitations via Resend
│   ├── send-reminder.ts          # Reminder emails for pending responses
│   ├── send-cancel-notification.ts
│   └── send-scheduled-notification.ts
├── src/
│   ├── components/
│   │   ├── WeeklyCalendar.tsx    # Interactive calendar with drag support
│   │   ├── CreateEventPanel.tsx  # AI chat interface and event form
│   │   └── GatherlyLogo.tsx      # Brand identity component
│   ├── lib/
│   │   ├── supabase.ts           # Database and auth client
│   │   └── invites.ts            # Invite creation and response logic
│   └── pages/
│       ├── Dashboard.tsx         # Main scheduling interface
│       ├── EventPage.tsx         # Event detail and management
│       ├── EventsPage.tsx        # Event list view
│       ├── InvitePage.tsx        # Public response page for invitees
│       ├── AuthPage.tsx          # Sign in and sign up
│       ├── MarketingPage.tsx     # Landing page
│       └── StoryPage.tsx         # About page
└── supabase/
    └── migrations/               # Database schema migrations
```

---

## Authentication

Gatherly supports two authentication methods: Google SSO and email/password.

### Google Single Sign-On

Most users sign in with Google. One click, no password to remember. When you authenticate with Google, we request Calendar API scopes so Gatherly can read your events and create new ones on your behalf. The OAuth flow is handled by Supabase Auth, which stores tokens securely and refreshes them automatically.

### Email and Password

For users who prefer not to use Google SSO, Gatherly supports traditional email/password authentication. Create an account with any email address and set a password.

Before you can access your account, you must confirm your email. Gatherly sends a verification link to the address you signed up with. Click the link to activate your account. This prevents fake accounts and ensures we can reach you with important notifications about your events.

### Required Google Calendar Integration

Heres an important design decision: Gatherly requires Google Calendar integration to access scheduling features. This is intentional.

Without calendar access, Gatherly would just be another form. The intelligence comes from seeing your existing commitments, detecting conflicts, and suggesting times that actually work. We cannot provide smart scheduling without knowing when youre busy.

This requirement also ensures data quality. When we send invites, we know the organizers availability is accurate. When we compute group availability, we have real calendar data rather than self-reported guesses.

We recognize this creates friction at signup. Some users will bounce rather than grant calendar access. We accept this trade-off because the alternative is a worse product for users who do complete signup. Better to serve fewer users well than many users poorly.

### Forgot Password

If you forget your password, Gatherly sends a reset link to your email. Click the link, set a new password, and youre back in. The reset tokens are time-limited and single-use for security.

Heres where it gets interesting: if you originally signed up with Google SSO but later want to set a password, the forgot password flow handles this gracefully. Request a password reset for your Google account email, and Gatherly lets you set a password. Now you can sign in either way. This flexibility means youre never locked into a single authentication method.

---

## Security Model

Security was a design priority from day one.

### Google Cloud Security Integrations

Gatherly is registered as a Google Cloud application (verification in progress) with several security features enabled:

**OAuth 2.0 with PKCE.** We use Proof Key for Code Exchange for the OAuth flow, preventing authorization code interception attacks. The code verifier is generated client-side and never transmitted, ensuring that stolen authorization codes are useless without the original verifier.

**Restricted Scopes.** We request only the minimum scopes needed:
- `calendar.readonly` - Read calendar events
- `calendar.events` - Create/modify events
- `contacts.readonly` - Access contacts for suggestions
- `userinfo.email` and `userinfo.profile` - Basic profile info

We explicitly do not request sensitive scopes like `gmail.readonly` or `drive` access.

**RISC (Cross-Account Protection).** Gatherly is enrolled in Googles Risky Account Protection program. When Google detects suspicious activity on a users account (password change, account hijack attempt, sessions revoked), Google sends us a security event via webhook. We respond by:
- Invalidating the users Gatherly session
- Requiring re-authentication on next visit
- Logging the security event for audit

This protects users even if their Google account is compromised outside of Gatherly.

**Token Binding.** Access tokens are bound to the client application. A token issued to Gatherly cannot be used by other applications, even if intercepted.

**Consent Screen Verification.** Our OAuth consent screen is currently in the verification process with Google. Once approved, users will see our verified publisher name and approved scope descriptions, building trust during the authorization flow. During development, the app operates in testing mode with a limited user pool.

**API Quotas and Monitoring.** We monitor API usage in Google Cloud Console. Unusual spikes in API calls trigger alerts, helping us detect potential abuse or compromised credentials.

### Token Management

OAuth tokens from Google are stored in Supabase and never exposed to client-side JavaScript. The token lifecycle:

1. **Acquisition.** User completes OAuth flow. Supabase receives tokens via secure server-side callback.
2. **Storage.** Tokens are encrypted at rest in Supabase. The anon key cannot decrypt them.
3. **Usage.** When the frontend needs calendar data, it calls Supabase Auth to get a fresh access token. The token is used for immediate API calls, never stored in localStorage or cookies.
4. **Refresh.** Access tokens expire after 1 hour. Supabase automatically exchanges refresh tokens with Google. Users never see re-auth prompts unless they revoke access.
5. **Revocation.** When a user disconnects their Google account or deletes their Gatherly account, we revoke tokens with Google and delete all stored credentials.

### Application Security

**API Keys.** OpenAI and Resend keys exist only in server-side environment variables. The Vercel Serverless Functions access them, but the browser cannot. VITE_ prefixed variables are the only ones bundled into the client.

**Invite Tokens.** Cryptographically random UUIDs (128 bits of entropy). Knowing an invite token lets you respond to that specific invitation but grants no other access. Tokens cannot be guessed or enumerated. Each token is single-use for the response action.

**Row Level Security.** Supabase RLS policies ensure that database queries return only rows the authenticated user owns. Even if someone crafted a malicious query, the database would refuse to return other users data. Policies are enforced at the PostgreSQL level, not in application code.

**Transport Security.** All traffic uses HTTPS with TLS 1.3. HSTS headers enforce secure connections. Cookies are HttpOnly (no JavaScript access) and Secure (HTTPS only). SameSite=Lax prevents CSRF attacks.

**CORS.** API endpoints only accept requests from our verified origins. Preflight requests validate the Origin header before processing.

**Content Security Policy.** We set CSP headers to prevent XSS attacks. Only scripts from our domain and trusted CDNs can execute.

---

## Future Roadmap

### More Agentic Scheduling

Today, Gatherly automates the scheduling workflow but still requires human confirmation at key steps. The next evolution is fully agentic scheduling where the AI acts on your behalf with minimal intervention.

Imagine an AI agent that monitors your incoming messages, detects scheduling intent, and proposes meetings automatically. Someone texts "we should grab lunch soon" and the agent drafts an invite with three available times before you even open the app. The agent knows your preferences: you like lunch meetings between 12 and 1pm, you prefer coffee shops over restaurants, you keep Fridays clear for deep work.

### iMessage and SMS Integration

Email invites work but they are not where conversations happen. The future of Gatherly is native integration with iMessage and SMS. One central agent coordinates scheduling across all participants, messaging each person individually in their preferred channel.

The agent handles the back-and-forth naturally. "Does Tuesday work?" "No, Im busy." "How about Wednesday?" "That works!" The agent aggregates these individual conversations into a group consensus without requiring everyone to visit a web page or check their email.

This is the true vision: scheduling that happens in the flow of conversation, invisible to the participants, surfaced only when a decision is needed.

### Serendipitous Suggestions

With user consent, Gatherly could pre-load data from additional integrations to make smarter suggestions. Connect your Spotify and we notice you both love the same artist playing a show next month. Connect your fitness tracker and we suggest a walking meeting during your usual afternoon slump. Connect your location history and we recommend a coffee shop equidistant from both participants.

These serendipitous suggestions transform scheduling from a chore into a discovery mechanism. The AI doesnt just find a time that works. It finds an experience that enhances the relationship.

### Calendar Intelligence

Beyond scheduling, Gatherly could become your calendar copilot. Flag meetings that could be emails. Suggest which recurring meetings to cancel based on attendance patterns. Block focus time automatically when your calendar gets too fragmented. Remind you to follow up with people you havent seen in a while.

The calendar contains rich signal about how you spend your time. Today that signal is mostly ignored. We want to surface insights that help you be more intentional.

### Learning Your Preferences

The next evolution of Gatherly learns from your behavior to make smarter suggestions. The AI observes patterns: you never take meetings before 10am, you protect Friday afternoons for deep work, you prefer coffee meetings over lunch meetings, you like walking meetings when the weather is nice.

Over time, Gatherly stops suggesting times that violate your preferences. When someone asks to schedule with you, the AI automatically filters out slots you would reject. No more manually declining 8am meeting requests. The system knows.

This extends to event types too. Gatherly learns that you prefer video calls for quick syncs but in-person meetings for brainstorms. It suggests Google Meet for a 15-minute check-in but proposes a coffee shop for a strategy session.

The preferences are inferred, not configured. You dont fill out a form listing your meeting preferences. Gatherly watches what you accept, what you decline, what you reschedule, and builds a model. The more you use it, the smarter it gets.

### Accountability Buddy

Our ultimate vision is for Gatherly to be a proactive agent that keeps you accountable to your commitments and relationships.

For group projects, the agent tracks deadlines and nudges the team when milestones approach. It notices when someone hasnt contributed in a while and suggests a check-in. It schedules standups automatically based on everyones availability rather than waiting for someone to take initiative. It knows the project timeline and proactively blocks time for deliverables before crunch time hits.

For social life, the agent remembers that you wanted to have dinner with your college roommate "sometime soon" and actually makes it happen. It notices youve been heads-down on work for three weeks and suggests scheduling something fun. It reminds you about a friends birthday next week and proposes a celebration. It tracks how long since youve seen certain people and gently nudges you to reconnect.

The agent becomes the friend who always remembers, always follows up, and never lets important relationships fall through the cracks. Humans are bad at maintaining relationships at scale. We forget. We procrastinate. We let months slip by. An AI agent can handle the logistics so you can focus on being present when you actually meet.

This is not about replacing human connection. Its about enabling more of it by removing the friction that prevents it from happening.

---

## Local Development

### Prerequisites

You need Node.js 20 or later, a Supabase project, a Google Cloud project with Calendar API enabled, an OpenAI API key, and a Resend account.

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/cs1060f25/gather-project.git
cd gather-project
npm install
```

Create a `.env.local` file with your credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-key
RESEND_API_KEY=re_your-key
RESEND_FROM_EMAIL=invites@yourdomain.com
SITE_URL=http://localhost:5173
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`. For serverless functions, use `vercel dev` to emulate the Vercel environment locally.

---

## Deployment

Push to the main branch to trigger automatic deployment on Vercel. Configure these environment variables in the Vercel dashboard:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `OPENAI_API_KEY` - For natural language parsing
- `RESEND_API_KEY` - For sending emails
- `RESEND_FROM_EMAIL` - The from address for outgoing emails
- `SITE_URL` - Your production URL for generating invite links

---

## Technical Deep Dive

### Google Calendar Integration

Gatherly integrates with Google Calendar through the Calendar API v3. Heres how the data flow works:

**Initial Sync.** When a user authenticates with Google OAuth, we request the following scopes: `calendar.readonly`, `calendar.events`, and `contacts.readonly`. The OAuth flow returns an access token and refresh token. Supabase stores these tokens encrypted in the user session.

**Fetching Events.** On dashboard load, Gatherly fetches events from all calendars the user has access to. We query the Google Calendar API with a time window of 30 days before and 90 days after the current date. This provides enough context for scheduling without overwhelming the API with historical data.

```
GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
  ?timeMin={30 days ago}
  &timeMax={90 days from now}
  &singleEvents=true
  &orderBy=startTime
```

**Refresh Rate.** Calendar data refreshes on three triggers:
1. Page load or navigation to dashboard
2. After creating, confirming, or canceling a Gatherly event
3. Manual refresh via the sync button

We intentionally avoid continuous polling. Google Calendar API has rate limits (typically 10 queries per second per user), and polling would drain that budget quickly. Instead, we trust that users will refresh when needed and that Gatherly events sync bidirectionally.

**Token Refresh.** Google access tokens expire after 1 hour. Supabase Auth handles token refresh automatically. When an API call returns a 401, the client requests a fresh token from Supabase, which exchanges the refresh token with Google behind the scenes. This happens transparently without user intervention.

**Writing Events.** When a Gatherly event is confirmed, we create a Google Calendar event using:

```
POST https://www.googleapis.com/calendar/v3/calendars/primary/events
  ?conferenceDataVersion=1 (if Google Meet requested)
  &sendUpdates=all
```

The `sendUpdates=all` parameter tells Google to send its own calendar invitations to attendees, providing a native calendar experience alongside Gatherly notifications.

### Persistence Architecture

Gatherly uses a three-tier persistence strategy:

**Tier 1: React State.** Ephemeral UI state lives in React useState and useReducer hooks. Form inputs, modal visibility, loading states, and temporary selections stay in memory. This state is lost on page refresh, which is intentional for security-sensitive data like partial form entries.

**Tier 2: Local Storage.** User preferences persist in browser localStorage:
- `gatherly_calendar_selections` - Which calendars are toggled on/off
- `gatherly_recent_people` - Recently scheduled contacts (up to 10)
- `gatherly_panel_width` - Create event panel resize position
- `gatherly_dark_mode` - Theme preference

Local storage survives page refreshes and browser restarts but is device-specific. A user on a different device starts fresh.

**Tier 3: Supabase (PostgreSQL).** Durable data lives in the database:
- User profiles (synced from auth)
- Gatherly events (all scheduling data)
- Invites (with response tokens)
- Notifications (with read status)

Supabase provides Row Level Security (RLS) at the database level. Every query automatically filters by `auth.uid()`, preventing users from accessing each others data even if the frontend code has bugs.

### Real-Time Notifications

Notifications use Supabase Realtime, which is built on PostgreSQL LISTEN/NOTIFY and WebSockets.

**Subscription Setup.** On dashboard mount, we subscribe to the notifications table:

```typescript
const channel = supabase
  .channel('notifications-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${authUser.id}`
  }, (payload) => {
    // Add notification to UI state
  })
  .subscribe();
```

**How It Works.** PostgreSQL triggers fire on INSERT to the notifications table. Supabase Realtime picks up these events and broadcasts them over WebSocket to connected clients. The filter ensures users only receive their own notifications.

**Latency.** Typical notification latency is 50-200ms from database insert to UI update, depending on network conditions.

### State Synchronization

Gatherly maintains consistency between local state and database through optimistic updates:

1. User initiates action (e.g., dismiss notification)
2. UI updates immediately (optimistic)
3. Database request fires asynchronously
4. On success: state remains as-is
5. On failure: state reverts to previous value

This pattern makes the UI feel instant while ensuring data integrity. Console logs track success/failure for debugging.

### Caching Strategy

We minimize redundant API calls through selective caching:

- **Calendar Events.** Cached in React state for the session. Re-fetched on explicit sync or after mutations.
- **User Profile.** Fetched once on auth, stored in context, never re-fetched unless user logs out.
- **Contacts.** Fetched once per session, merged from Google Contacts API and local history.
- **Daily Summary.** Cached in sessionStorage with date key. Re-fetched only on new day or explicit request.

No client-side cache invalidation timers. Users control when data refreshes.

---

## Database Schema

The core tables in Supabase are:

### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```
Synced from Supabase Auth on signup. Trigger updates `updated_at` on changes.

### gatherly_events
```sql
CREATE TABLE gatherly_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  options JSONB NOT NULL,        -- Array of {day, time, duration, color}
  participants TEXT[] NOT NULL,   -- Array of email addresses
  status TEXT DEFAULT 'pending',  -- pending | confirmed | cancelled
  confirmed_option JSONB,         -- The selected time option
  google_event_id TEXT,           -- ID of synced Google Calendar event
  add_google_meet BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
The `options` JSONB field stores up to 3 proposed time slots. Each option includes day (YYYY-MM-DD), time (HH:MM), duration (minutes), and color (hex).

### invites
```sql
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES gatherly_events(id),
  invitee_email TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_location TEXT,
  event_description TEXT,
  host_name TEXT NOT NULL,
  host_email TEXT NOT NULL,
  token UUID UNIQUE DEFAULT gen_random_uuid(),  -- Response link token
  status TEXT DEFAULT 'pending',  -- pending | accepted | declined
  selected_options INTEGER[],     -- Indices of accepted time options
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Each invite has a unique token for the response URL. No authentication required to respond, just the token.

### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,            -- invite_received | invitee_response | event_scheduled | event_cancelled
  title TEXT NOT NULL,
  message TEXT,
  event_id UUID,                 -- Optional reference for navigation
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```
Realtime-enabled table. INSERT triggers push notifications to connected clients.

### Row Level Security

All tables have RLS enabled with policies like:

```sql
-- Users can only view their own data
CREATE POLICY "Users can view own data"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only modify their own data
CREATE POLICY "Users can modify own data"
  ON table_name FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete own data"
  ON table_name FOR DELETE
  USING (auth.uid() = user_id);
```

The `invites` table has a special policy allowing unauthenticated access via token for the response page.

---

## The Team

Built at Harvard by students who were tired of scheduling group project meetings over text threads.

<p align="center">
  <img src="public/founders/milan.jpg" alt="Milan" width="120" style="border-radius: 50%; margin: 0 10px;">
  <img src="public/founders/ikenna.jpg" alt="Ikenna" width="120" style="border-radius: 50%; margin: 0 10px;">
  <img src="public/founders/talha.jpg" alt="Talha" width="120" style="border-radius: 50%; margin: 0 10px;">
</p>

<p align="center">
  <strong>Milan Naropanth</strong> · <strong>Ikenna Ogbogu</strong> · <strong>Talha Minhas</strong>
</p>

---

## License

MIT
