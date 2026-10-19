"use client";

import Link from "next/link";
import type { ForumEvent } from "@/lib/types";
import { eventStart } from "@/lib/event-calendar";

export function EventsCalendar({
  compact = false,
  list,
  note,
}: {
  compact?: boolean;
  list: ForumEvent[];
  note?: string;
}) {
  // Show the month of the first upcoming event (or the current month).
  const now = new Date();
  const sorted = [...list].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const firstEvent = sorted.find((e) => (eventStart(e) ?? now) >= new Date(now.getFullYear(), now.getMonth(), 1)) ?? sorted[0];
  const first = (firstEvent && eventStart(firstEvent)) ?? now;
  const year = first.getFullYear();
  const month = first.getMonth();
  const eventDays = new Map<number, ForumEvent>();
  for (const e of sorted) {
    const d = eventStart(e);
    if (d && d.getFullYear() === year && d.getMonth() === month && !eventDays.has(d.getDate())) {
      eventDays.set(d.getDate(), e);
    }
  }
  const monthLabel = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Compact mode shows only the week that contains the first highlighted event.
  const focusIndex = firstEvent ? cells.indexOf(first.getDate()) : 0;
  const weekStart = Math.max(0, Math.floor(focusIndex / 7) * 7);
  const visibleCells = compact ? cells.slice(weekStart, weekStart + 7) : cells;
  return (
    <div className={`flex flex-col rounded-lg border border-border bg-card ${compact ? "p-4" : "p-5"}`}>
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{monthLabel}</h3>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {d}
          </span>
        ))}
        {visibleCells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const ev = eventDays.get(day);
          return ev ? (
            <Link
              key={day}
              href={`/events/${ev.slug}`}
              title={ev.title}
              className="flex h-8 items-center justify-center rounded-md bg-accent text-xs font-semibold text-accent-foreground hover:bg-accent/90"
            >
              {day}
            </Link>
          ) : (
            <span key={day} className="flex h-8 items-center justify-center text-xs text-muted-foreground">
              {day}
            </span>
          );
        })}
      </div>
      {!compact && (
        <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          {note ?? "Highlighted days have a Forum gathering — select one to view details and RSVP."}
        </p>
      )}
    </div>
  );
}
