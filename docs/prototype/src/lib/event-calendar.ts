import type { ForumEvent } from "@/lib/forum-data";

export function parseEventDate(date: string): Date | null {
  // e.g. "Thursday 24 September 2026"
  const m = date.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
  return isNaN(d.getTime()) ? null : d;
}

function formatIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function downloadCalendarEvent(event: ForumEvent) {
  const start = parseEventDate(event.date);
  if (!start) return;
  const isMultiDay = event.date.includes("–");
  const end = isMultiDay
    ? new Date(start.getFullYear(), start.getMonth(), start.getDate() + 2)
    : new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Forum500//Events//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@forum500.club`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART;VALUE=DATE:${start.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `DTEND;VALUE=DATE:${end.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    `LOCATION:${escapeIcs(event.venue)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.id}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
