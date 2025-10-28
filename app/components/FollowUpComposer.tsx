"use client";
import React, { useMemo, useState } from "react";
import { EventDetails, Attendee } from "@/types/event";
import { getNonResponders } from "@/lib/nonResponders";
import { Tone, buildSubject, buildBody } from "@/lib/templates";
import { formatEventDateTimeTZ } from "@/lib/time";

export default function FollowUpComposer({
  event,
  onClose
}: { event: EventDetails; onClose: () => void; }) {
  const [tone, setTone] = useState<Tone>("Friendly");
  const [includeLocation, setIncludeLocation] = useState<boolean>(!!event.locationOrLink);
  const nonResponders = useMemo(() => getNonResponders(event.attendees), [event.attendees]);

  const [subject, setSubject] = useState<string>(buildSubject(tone, event));
  const [body, setBody] = useState<string>(
    buildBody(tone, event, nonResponders[0] ?? {name:"there", email:"", responseStatus:"needsAction"}, includeLocation)
  );

  const regen = () => {
    setSubject(buildSubject(tone, event));
    setBody(buildBody(
      tone,
      event,
      nonResponders[0] ?? {name:"there", email:"", responseStatus:"needsAction"},
      includeLocation
    ));
  };

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{sent?: number; failed?: number; error?: string;} | null>(null);

  const handleSend = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/followup/send", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ event, tone, includeLocation })
      });
      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setResult({ error: e?.message ?? "Send failed" });
    } finally {
      setSending(false);
    }
  };

  const when = formatEventDateTimeTZ(event.startDateTimeISO, event.timezone);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Follow up with non-responders ({nonResponders.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="text-sm text-gray-700 border rounded p-3 bg-gray-50">
          <div><b>Event:</b> {event.title}</div>
          <div><b>When:</b> {when}</div>
          {event.locationOrLink ? (<div><b>Location/Link:</b> {event.locationOrLink}</div>) : null}
          <div><b>Sender:</b> {event.organizerName} (Scheduling Agent)</div>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm">Tone:</label>
          <select
            value={tone}
            onChange={(e) => { setTone(e.target.value as Tone); }}
            className="border rounded px-2 py-1"
          >
            <option>Friendly</option>
            <option>Formal</option>
            <option>Direct</option>
          </select>
          <label className="ml-4 text-sm flex items-center gap-2">
            <input type="checkbox" checked={includeLocation} onChange={(e)=>setIncludeLocation(e.target.checked)} />
            Include location/link
          </label>
          <button onClick={regen} className="ml-auto border rounded px-3 py-1">Regenerate</button>
        </div>

        <div className="space-y-2">
          <label className="text-sm">Subject</label>
          <input
            value={subject}
            onChange={(e)=>setSubject(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <label className="text-sm">Body (preview, editable per recipient if needed later)</label>
          <textarea
            value={body}
            onChange={(e)=>setBody(e.target.value)}
            rows={8}
            className="w-full border rounded px-3 py-2 font-[450]"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSend}
            disabled={sending || nonResponders.length === 0}
            className="border rounded px-4 py-2 bg-black text-white disabled:bg-gray-300"
          >
            {sending ? "Sending…" : `Send to ${nonResponders.length}`}
          </button>
          {result?.sent !== undefined && (
            <span className="text-sm">
              ✅ Sent: {result.sent} {result.failed ? ` • ❗ Failed: ${result.failed}` : ""}
            </span>
          )}
          {result?.error && <span className="text-sm text-red-600">Error: {result.error}</span>}
        </div>
      </div>
    </div>
  );
}

