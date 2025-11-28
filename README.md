# Gatherly MVP - AI-Powered Meeting Scheduler

A production-ready MVP for scheduling meetings using natural language processing with OpenAI GPT-4.

## Features

- 🤖 **AI-Powered Extraction** - Natural language processing for meeting details
- 📋 **Structured Review** - Human-verifiable meeting summaries before confirmation
- 🔄 **Conversational Flow** - Smart follow-up questions for missing information
- 📱 **Apple-Inspired UI** - Clean, modern interface with smooth interactions
- ✅ **Multi-Step Onboarding** - Account creation, calendar connection, preferences

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **AI**: OpenAI GPT-4 API
- **Styling**: Inline styles with Apple design system
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

1. Clone and navigate to the MVP directory:
```bash
cd src_mvp
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
# Add your OpenAI API key to .env.local
```

3. Start development server:
```bash
npm run dev
```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel --prod
```

3. **Set Environment Variables in Vercel Dashboard:**
   - `VITE_OPENAI_API_KEY` - Your OpenAI API key

### Environment Variables

- `VITE_OPENAI_API_KEY` - OpenAI API key for GPT-4 integration
- `VITE_API_BASE_URL` - Backend API URL (when ready)

## Usage

1. **Onboarding Flow:**
   - Create account or sign in
   - Connect Google Calendar
   - Set preferences (working hours, timezone)

2. **Scheduling:**
   - Use natural language: "Schedule lunch with Sarah tomorrow at 1pm"
   - Review extracted details in structured card
   - Confirm to send invitations

## Architecture

```
src_mvp/
├── components/           # Reusable UI components
│   ├── common/          # Button, Input, Card, etc.
│   └── onboarding/      # Onboarding-specific components
├── services/            # API integrations
│   └── schedulingService.ts  # OpenAI integration
├── prompts/             # System prompts for AI
├── styles/              # CSS theme and utilities
└── App.tsx              # Main application component
```

## API Integration

The app uses OpenAI GPT-4 with a structured system prompt to:
1. Extract meeting details from natural language
2. Identify missing required information
3. Generate conversational follow-up questions
4. Create structured review cards for confirmation

## Production Considerations

- ✅ Environment variable management
- ✅ Error handling and fallbacks
- ✅ TypeScript for type safety
- ✅ Responsive design
- ✅ SEO-friendly meta tags
- 🔄 Backend integration (planned)
- 🔄 User authentication (planned)
- 🔄 Database persistence (planned)

## License

MIT
