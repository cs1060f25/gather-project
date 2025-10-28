export type Attendee = {
  name: string;
  email: string;
  responseStatus: "accepted" | "declined" | "tentative" | "needsAction";
};

export type EventDetails = {
  id: string;
  title: string;
  startDateTimeISO: string; // e.g., "2025-10-31T14:00:00"
  timezone: string;         // e.g., "America/New_York"
  locationOrLink?: string | null;
  organizerName: string;    // scheduling agent display name
  attendees: Attendee[];
};

