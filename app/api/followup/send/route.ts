import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/messagingService";
import { EventDetails, Attendee } from "@/types/event";
import { Tone, buildSubject, buildBody } from "@/lib/templates";
import { getNonResponders } from "@/lib/nonResponders";

export async function POST(req: NextRequest) {
  try {
    const { event, tone = "Friendly", includeLocation = true }:
      { event: EventDetails; tone?: Tone; includeLocation?: boolean } = await req.json();

    const nonResponders = getNonResponders(event.attendees);
    if (!nonResponders.length) {
      return NextResponse.json({ sent: 0, results: [] });
    }

    const subject = buildSubject(tone, event);

    const results = await Promise.all(nonResponders.map(async (r: Attendee) => {
      const body = buildBody(tone, event, r, includeLocation);
      const res = await sendMessage({
        from: `${event.organizerName} <no-reply@scheduler.com>`,
        to: r,
        subject,
        body,
        metadata: { eventId: event.id }
      });
      return { recipient: r.email, ...res };
    }));

    const success = results.filter(r => r.status === "sent").length;
    const failure = results.length - success;

    return NextResponse.json({ sent: success, failed: failure, results });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "unknown error" }, { status: 500 });
  }
}

