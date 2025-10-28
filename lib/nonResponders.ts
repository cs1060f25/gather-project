import { Attendee } from "@/types/event";

export function getNonResponders(attendees: Attendee[]): Attendee[] {
  return attendees.filter(a => a.responseStatus === "needsAction");
}

