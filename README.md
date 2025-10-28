# Event Follow-up System

A compact feature for following up with calendar event non-responders via automated messaging.

## Features

- **Non-responder Detection**: Automatically identifies attendees with `responseStatus === "needsAction"`
- **Smart Templates**: Three tone options (Friendly, Formal, Direct) with <110 word limit
- **Timezone Support**: Displays event times in the correct timezone (e.g., America/New_York)
- **Editable Preview**: Review and customize subject/body before sending
- **Batch Messaging**: Sends follow-ups via Messaging Service adapter
- **Success Tracking**: Shows sent count and handles partial failures

## Project Structure

```
/app
  /api/followup/send/route.ts    # API endpoint for sending messages
  /components
    FollowUpButton.tsx            # Entry point button with count
    FollowUpComposer.tsx          # Modal composer UI
  /events/[id]/page.tsx           # Demo event page
  layout.tsx                      # Root layout
  page.tsx                        # Home page

/lib
  messagingService.ts             # Mock messaging adapter
  nonResponders.ts                # Filter logic
  templates.ts                    # Email templates
  time.ts                         # Timezone formatting

/types
  event.ts                        # TypeScript types

/tests
  nonResponders.test.ts           # Filter tests
  templates.test.ts               # Template tests
  time.test.ts                    # Time formatting tests
```

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the home page, then navigate to the demo event at [http://localhost:3000/events/evt_123](http://localhost:3000/events/evt_123).

### 3. Run Tests

```bash
npm run test
```

## Usage Flow

1. **Event Page**: Shows "Follow up with non-responders (N)" button when N > 0
2. **Composer Modal**: 
   - Displays read-only event info (title, date/time with timezone, location/link)
   - Tone selector (Friendly | Formal | Direct, default: Friendly)
   - "Include location/link" toggle
   - Editable preview of subject and body
3. **Send**: Calls Messaging Service for each non-responder
4. **Success Toast**: Shows "✅ Sent: N" with optional failure count

## Acceptance Criteria Met

✅ Finds non-responders (responseStatus === "needsAction")  
✅ Generates short follow-up (<110 words)  
✅ Includes event title, date/time with timezone, optional location  
✅ Single-screen composer modal  
✅ Tone selector with 3 options  
✅ Editable preview  
✅ Sends via Messaging Service  
✅ Success/failure UI  
✅ Timezone formatting  
✅ Basic tests for logic, templates, and time formatting  

## Customization

### Messaging Service

The `lib/messagingService.ts` file is currently mocked. To integrate with a real service:

```typescript
export async function sendMessage(input: SendInput) {
  // Replace with your actual messaging service API
  const response = await fetch('https://your-service.com/send', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  return response.json();
}
```

### Templates

Edit `lib/templates.ts` to customize the three tone variations or add new tones.

### Event Data

Replace the mock `DemoEvent()` function in `app/events/[id]/page.tsx` with your actual event fetching logic.

## Demo Scenario

The demo event has:
- 10 invited attendees
- 7 accepted
- 3 non-responders (Alex Kim, Jordan Poe, Jamie Z)

Click "Follow up with non-responders (3)" to test the full flow.

## Technologies

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Vitest** for testing
- **React Testing Library**

## License

MIT
