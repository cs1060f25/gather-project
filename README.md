# Gatherly

Gatherly is a smart scheduling app that makes it easy to coordinate meetings with friends and colleagues. It integrates with Google Calendar and uses AI to help parse natural language scheduling requests.

## Features

- 📅 Google Calendar integration
- 🤖 AI-powered scheduling (natural language parsing)
- ✉️ Email invites via Resend
- 🔐 Secure authentication via Supabase
- 🌙 Dark mode support
- 📱 Responsive design

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase account
- Google Cloud Console project (for Calendar API)
- OpenAI API key (for AI features)
- Resend account (for email invites)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Frontend Variables (exposed to browser - safe for public keys)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Server-side Variables (NEVER exposed to frontend)
# These are only accessible in /api serverless functions
OPENAI_API_KEY=sk-your-openai-api-key
RESEND_API_KEY=re_your-resend-api-key
```

### Security Notes

- **VITE_** prefixed variables are bundled into the client-side JavaScript and visible to users
- **Non-VITE** variables (like `OPENAI_API_KEY` and `RESEND_API_KEY`) are only accessible in the `/api` serverless functions
- The Supabase anon key is designed to be public - actual security is enforced via Row Level Security (RLS) policies
- Never prefix sensitive API keys with `VITE_`

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Building

```bash
npm run build
```

### Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL` - For all environments
   - `VITE_SUPABASE_ANON_KEY` - For all environments
   - `OPENAI_API_KEY` - For Production/Preview
   - `RESEND_API_KEY` - For Production/Preview

## Architecture

```
gatherly/
├── api/                    # Vercel serverless functions (server-side)
│   ├── parse-scheduling.ts # OpenAI integration (secure)
│   └── send-invite.ts      # Resend email integration (secure)
├── src/
│   ├── components/         # React components
│   ├── lib/                # Client-side utilities
│   │   ├── openai.ts       # Calls /api/parse-scheduling
│   │   ├── invites.ts      # Calls /api/send-invite
│   │   └── supabase.ts     # Supabase client
│   └── pages/              # Page components
├── supabase/
│   └── migrations/         # Database schema
└── vercel.json             # Vercel configuration
```

## Database Setup

Run the migration in your Supabase SQL Editor:

```sql
-- See supabase/migrations/001_create_invites_table.sql
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: CSS (Neobrutalist design)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Google OAuth
- **AI**: OpenAI GPT-4o-mini
- **Email**: Resend

## License

MIT
