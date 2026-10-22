import { parseISO } from "date-fns";
import type { ForumEvent } from "@/features/events/types";
import { eventVenue } from "./format";

export function eventStart(e: Pick<ForumEvent, "startsAt">): Date | null {
  const v = parseISO(e.startsAt);
  return isNaN(v.getTime()) ? null : v;
}

function formatIcsDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function formatIcsDay(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Generates and downloads an .ics file from startsAt/endsAt. */
export function downloadCalendarEvent(event: ForumEvent, address?: string | null) {
  const start = eventStart(event);
  if (!start) return;
  const endRaw = event.endsAt ? parseISO(event.endsAt) : null;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Forum500//Events//EN", "BEGIN:VEVENT"];
  lines.push(`UID:${event.id}@forum500.club`, `DTSTAMP:${formatIcsDate(new Date())}`);
  if (event.allDay) {
    const end = endRaw && !isNaN(endRaw.getTime()) ? new Date(endRaw) : new Date(start);
    end.setDate(end.getDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDay(start)}`, `DTEND;VALUE=DATE:${formatIcsDay(end)}`);
  } else {
    const end =
      endRaw && !isNaN(endRaw.getTime()) ? endRaw : new Date(start.getTime() + 3 * 60 * 60 * 1000);
    lines.push(`DTSTART:${formatIcsDate(start)}`, `DTEND:${formatIcsDate(end)}`);
  }
  lines.push(
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description ?? "")}`,
    `LOCATION:${escapeIcs(address || `${eventVenue(event)}, ${event.city}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  );
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
