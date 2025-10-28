"use client";
import React from "react";
import { Attendee } from "@/types/event";

export function FollowUpButton({
  attendees,
  onClick
}: {
  attendees: Attendee[];
  onClick: () => void;
}) {
  const count = attendees.filter(a => a.responseStatus === "needsAction").length;
  if (count === 0) {
    return (
      <button disabled title="Everyone has responded" className="opacity-50 cursor-not-allowed border rounded px-3 py-2">
        Follow up (0)
      </button>
    );
  }
  return (
    <button onClick={onClick} className="border rounded px-3 py-2 hover:bg-gray-50">
      Follow up with non-responders ({count})
    </button>
  );
}

