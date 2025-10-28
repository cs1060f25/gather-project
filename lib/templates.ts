import { EventDetails, Attendee } from "@/types/event";
import { formatEventDateTimeTZ } from "./time";

export type Tone = "Friendly" | "Formal" | "Direct";

export function buildSubject(tone: Tone, event: EventDetails): string {
  const dateShort = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric"
  }).format(new Date(event.startDateTimeISO));
  switch (tone) {
    case "Formal": return `Follow-up on ${event.title} — RSVP requested`;
    case "Direct": return `RSVP for ${event.title} (${dateShort})`;
    default:       return `Quick nudge re: ${event.title} (${dateShort})`;
  }
}

function locLine(event: EventDetails): string {
  return event.locationOrLink ? `\n${event.locationOrLink}` : "";
}

export function buildBody(
  tone: Tone,
  event: EventDetails,
  recipient: Attendee,
  includeLocation: boolean
): string {
  const when = formatEventDateTimeTZ(event.startDateTimeISO, event.timezone);
  const firstName = recipient.name?.split(" ")[0] || "there";
  const loc = includeLocation ? locLine(event) : "";

  const friendly =
`Hi ${firstName} — just circling back on **${event.title}** on **${when}**.
We're finalizing headcount and would love to have you. Could you RSVP when you get a moment?
If you can't make it, a quick no is totally fine.${loc}
Thanks! — ${event.organizerName}`;

  const formal =
`Hello ${firstName},
This is a brief follow-up regarding **${event.title}** scheduled for **${when}**.
Please indicate your availability at your earliest convenience so we can finalize arrangements.
If you are unable to attend, a decline is appreciated.${loc}
Best regards,
${event.organizerName}`;

  const direct =
`${firstName} — can you RSVP for **${event.title}** on **${when}**?
If no, totally fine—just let me know.${loc} — ${event.organizerName}`;

  const raw = tone === "Formal" ? formal : tone === "Direct" ? direct : friendly;

  // keep under ~110 words (simple guard)
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length <= 110) return raw;
  return words.slice(0, 110).join(" ") + "…";
}

