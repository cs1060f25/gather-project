# Scheduler API (Suggest Slots)

## Overview

The Scheduler Agent turns a natural-language request + host availability into a small set of conflict-free meeting options.

- Reads host busy periods from Google Calendar
- Uses an LLM with a strict system prompt to generate **up to 3 options**
- Enforces quiet hours and social norms (e.g., reasonable times for coffee chats)

Backend implementation lives in:

- Route: `agents/scheduler/api/scheduler.routes.ts`
- Core logic: `agents/scheduler/simple-scheduler.ts` (`suggestSlots`)

---

## HTTP Endpoint

- **Method:** `POST`
- **Path:** `/api/schedule/suggest`

### Request Body

```json
{
  "text": "Schedule a coffee chat with Milan at Spangler Cafe next week during business hours",
  "durationMinutes": 45,
  "hostId": "single_host_demo"
}
```

- **text** (string, required):
  - Natural-language scheduling request
  - Can include people, location, time hints, constraints, etc.
- **durationMinutes** (number, optional):
  - Desired meeting length in minutes
  - If omitted, the agent infers a reasonable default from the text (see Duration behavior)
- **hostId** (string, optional for now):
  - Identifier for the host whose calendar should be used for availability.
  - If omitted, the backend currently falls back to a demo host ID (`single_host_demo`). In a real system this would come from the authenticated user session.

Examples of accepted phrases:

- "next week", "tomorrow", "next Monday afternoon"
- "during business hours", "evening", "after 6pm"
- "coffee chat", "casual hangout", "1:1 with my manager"

### Response Body

```json
{
  "ok": true,
  "title": "Coffee chat with Milan",
  "where": "Spangler Cafe",
  "who": ["Milan"],
  "slots": [
    "2025-12-02T15:00:00.000Z",
    "2025-12-03T13:30:00.000Z",
    "2025-12-04T16:00:00.000Z"
  ]
}
```

Fields:

- **ok** (boolean): `true` on success
- **title** (string): Suggested event title inferred from the prompt
- **where** (string | null): Location inferred from the prompt, or `null` if unknown
- **who** (string[]): Names inferred from the text, if any
- **slots** (string[]):
  - 1–3 ISO-8601 timestamps in **ascending** order
  - Represent proposed start times

Error responses:

- `400` with `{ "error": "text is required and must be a string" }`
- `500` with `{ "error": "Failed to generate schedule" }` if something goes wrong server-side

---

## Behavioral Guarantees & Heuristics

These come from the `SYSTEM_PROMPT` in `simple-scheduler.ts` and from how we call the model.

### Hard rules

- Always returns **valid JSON** (enforced by `response_format: { type: "json_object" }`)
- Proposes **exactly 3** options unless fewer are truly available
- Uses host busy periods from Google Calendar to avoid conflicts
- Respects **quiet hours** (currently `22:00–07:00` by default in the agent call)

### Social appropriateness

- For **coffee chats / casual meetings / social events**:
  - Default window: **09:00–18:00 local time**
  - Avoids very early morning or late-night times unless explicitly allowed
- For **professional meetings** without explicit time hints:
  - Prefers standard business hours **09:00–18:00**

### Time window interpretation

The agent tries to honor natural language hints:

- **"afternoon"** → roughly 12:00–17:00
- **"evening"** → roughly 18:00–22:00 (but still respects quiet hours)
- **"morning"** → after quiet hours (≥ 07:00)
- **"see 3 more"** → expected behavior is to return 3 new options **later than** previously suggested ones (prompted behavior, not strictly enforced by the API contract yet)

### Duration behavior

- If `durationMinutes` is provided in the request body, that value is used directly.
- Otherwise, the agent infers a duration from the text:
  - Text mentioning **dinner** defaults to **90 minutes**.
  - Text mentioning **coffee** (e.g., coffee chats) defaults to **45 minutes**.
  - If no clear signal is present, it falls back to **45 minutes**.

---

## Example Usage (Frontend)

### Fetch call

```ts
async function fetchSuggestedSlots(text: string, durationMinutes?: number) {
  const res = await fetch('/api/schedule/suggest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      durationMinutes != null ? { text, durationMinutes } : { text }
    ),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate schedule');
  }

  const data = await res.json();
  return data as {
    ok: boolean;
    title: string;
    where: string | null;
    who: string[];
    slots: string[];
  };
}
```

### Typical UI flow

1. User types a natural-language request in a text box.
2. Frontend `POST`s to `/api/schedule/suggest` with `{ text }`.
3. UI displays:
   - Suggested title (editable)
   - Location (editable)
   - A list of 1–3 proposed time slots (with local-time formatting)
4. When the user selects a slot and confirms, the frontend calls the **Calendar Invite API** to actually create the event.
