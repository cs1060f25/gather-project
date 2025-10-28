export function formatEventDateTimeTZ(iso: string, tz: string): string {
  // Example: Fri, Oct 31 • 2:00–2:30 PM ET (if you have end time, append range)
  // For v1, show start time only:
  const dt = new Date(iso);
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    }).format(dt);
  } catch {
    // fallback if tz invalid
    return dt.toLocaleString();
  }
}

