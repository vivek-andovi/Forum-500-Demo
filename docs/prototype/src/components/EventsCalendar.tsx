import { Link } from "@tanstack/react-router";
import { events as allEvents } from "@/lib/forum-data";
import type { ForumEvent } from "@/lib/forum-data";
import { parseEventDate } from "@/lib/event-calendar";

export function EventsCalendar({
  compact = false,
  list = allEvents,
  note,
}: {
  compact?: boolean;
  list?: ForumEvent[];
  note?: string;
}) {
  const eventDays = new Map<number, ForumEvent>();
  for (const e of list) {
    const d = parseEventDate(e.date);
    if (d) eventDays.set(d.getDate(), e);
  }
  const first = parseEventDate(list[0]?.date ?? "") ?? new Date();
  const year = first.getFullYear();
  const month = first.getMonth();
  const monthLabel = first.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const visibleCells = compact ? cells.slice(0, 7) : cells;
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
              to="/events/$eventId"
              params={{ eventId: ev.id }}
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
