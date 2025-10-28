import { buildSubject, buildBody } from "@/lib/templates";
import { EventDetails } from "@/types/event";
import { expect, test } from "vitest";

const event: EventDetails = {
  id: "evt",
  title: "Demo",
  startDateTimeISO: "2025-10-31T14:00:00",
  timezone: "America/New_York",
  organizerName: "Scheduling Agent",
  attendees: [],
  locationOrLink: "Room 1"
};

test("subject friendly", () => {
  const s = buildSubject("Friendly", event);
  expect(s.toLowerCase()).toContain("demo");
});

test("body inserts context", () => {
  const b = buildBody("Friendly", event, {name:"Alex Kim", email:"a@x.com", responseStatus:"needsAction"}, true);
  expect(b).toMatch(/Demo/);
  expect(b).toMatch(/Scheduling Agent/);
});

