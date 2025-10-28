"use client";
import React, { useState } from "react";
import FollowUpComposer from "@/app/components/FollowUpComposer";
import { FollowUpButton } from "@/app/components/FollowUpButton";
import { EventDetails } from "@/types/event";

function DemoEvent(): EventDetails {
  return {
    id: "evt_123",
    title: "Product Feedback Session",
    startDateTimeISO: "2025-10-31T14:00:00",
    timezone: "America/New_York",
    locationOrLink: "Zoom: https://zoom.us/j/123456789",
    organizerName: "Scheduling Agent",
    attendees: [
      { name: "Alex Kim", email: "alex@example.com", responseStatus: "needsAction" },
      { name: "Sam Lee", email: "sam@example.com", responseStatus: "accepted" },
      { name: "Jordan Poe", email: "jordan@example.com", responseStatus: "needsAction" },
      { name: "Maya B", email: "maya@example.com", responseStatus: "accepted" },
      { name: "Chris T", email: "chris@example.com", responseStatus: "accepted" },
      { name: "Taylor R", email: "taylor@example.com", responseStatus: "accepted" },
      { name: "Pat R", email: "pat@example.com", responseStatus: "accepted" },
      { name: "Avi S", email: "avi@example.com", responseStatus: "accepted" },
      { name: "Jamie Z", email: "jamie@example.com", responseStatus: "needsAction" },
      { name: "Devon L", email: "devon@example.com", responseStatus: "accepted" },
    ]
  };
}

export default function EventPage() {
  const [open, setOpen] = useState(false);
  const event = DemoEvent();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{event.title}</h1>
      <FollowUpButton attendees={event.attendees} onClick={() => setOpen(true)} />
      {open && <FollowUpComposer event={event} onClose={() => setOpen(false)} />}
    </div>
  );
}

