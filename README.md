# Gatherly

**Smart scheduling made simple.** Gatherly helps you coordinate meetings with friends and colleagues using AI-powered scheduling suggestions and seamless Google Calendar integration.

🌐 **Live at**: [gatherly.now](https://gatherly.now)

## Features

- 📅 **Google Calendar Integration** - Sync your calendars automatically
- 🤖 **AI-Powered Scheduling** - Natural language parsing for quick event creation
- ✉️ **Email Invites** - Send beautiful invites with one click
- 🔐 **Secure Authentication** - Google OAuth via Supabase
- 🌙 **Dark Mode** - Easy on the eyes, day or night
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm
- [Supabase](https://supabase.com) account
- [Google Cloud Console](https://console.cloud.google.com) project (Calendar API)
- [OpenAI](https://platform.openai.com) API key
- [Resend](https://resend.com) account

### Installation

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`

### Environment Variables

Create `.env.local`:

```bash
# Frontend (safe - bundled into client)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server-side (secure - only in /api functions)
OPENAI_API_KEY=sk-your-key
RESEND_API_KEY=re_your-key
```

> ⚠️ Never prefix sensitive keys with `VITE_` - they would be exposed to browsers!

## Architecture

```
gatherly/
├── api/                    # Serverless functions (secure)
│   ├── parse-scheduling.ts # OpenAI integration
│   └── send-invite.ts      # Email via Resend
├── src/
│   ├── components/         # React components
│   ├── lib/                # Client utilities
│   └── pages/              # Page components
├── supabase/
│   └── migrations/         # Database schema
└── public/                 # Static assets
```

## Deployment

Deployed on [Vercel](https://vercel.com). Add these environment variables:

| Variable | Environment |
|----------|-------------|
| `VITE_SUPABASE_URL` | All |
| `VITE_SUPABASE_ANON_KEY` | All |
| `OPENAI_API_KEY` | Production |
| `RESEND_API_KEY` | Production |
| `RESEND_FROM_EMAIL` | Production (optional) |

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: CSS (Neobrutalist design)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + Google OAuth
- **AI**: OpenAI GPT-4o-mini
- **Email**: Resend

## Team

Built by the Gatherly team at Harvard.

## License

MIT
