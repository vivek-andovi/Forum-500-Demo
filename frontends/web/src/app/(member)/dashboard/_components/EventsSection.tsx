"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EventsCalendar } from "@/components/EventsCalendar";
import type { Dashboard } from "@/features/site/types";
import type { Member } from "@/features/membership/types";
import { eventDate } from "@/lib/format";
import { EventRow } from "./rows";
import { Empty, Img, Panel, SectionHeading } from "./Panel";

/** Events: next gatherings and calendar (collapsed); attending, hosting and My Gatherings too (expanded).
 * The two states use different grids and panels, so both trees are kept. */
export function EventsSection({
  data,
  me,
  collapsed,
  onToggleCollapsed,
  openEvent,
  setOpenEvent,
}: {
  data: Dashboard;
  me: Member | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  openEvent: string | null;
  setOpenEvent: (id: string | null) => void;
}) {
  const upcoming = data.upcomingEvents ?? [];
  const attending = data.attending ?? [];
  const hosting = data.hosting ?? [];
  const hostingIds = new Set(hosting.map((e) => e.id));
  const myGatherings = [...hosting, ...attending.filter((e) => !hostingIds.has(e.id))];

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={CalendarDays}
        title="Events"
        to="/events"
        linkLabel="Events Hub"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        cta={me ? { to: "/events/my-events", label: "Organize an Event" } : undefined}
      />
      {collapsed ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Panel title="Next Gatherings" to="/events" compact>
            {upcoming.length === 0 && <Empty>No upcoming gatherings.</Empty>}
            {upcoming.slice(0, 1).map((e) => (
              <EventRow
                key={e.id}
                event={e}
                open={openEvent === e.id}
                onToggle={() => setOpenEvent(openEvent === e.id ? null : e.id)}
                showRsvp
                compact
              />
            ))}
          </Panel>
          <EventsCalendar compact list={upcoming} />
        </div>
      ) : (
        <div className="grid items-stretch gap-4 lg:grid-cols-3">
          <div className="flex h-full flex-col gap-4 lg:col-span-2">
            <Panel title="Next Gatherings" to="/events">
              {upcoming.length === 0 && <Empty>No upcoming gatherings.</Empty>}
              {upcoming.slice(0, 2).map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  open={openEvent === e.id}
                  onToggle={() => setOpenEvent(openEvent === e.id ? null : e.id)}
                  showRsvp
                />
              ))}
            </Panel>
            <Panel title="Gatherings I'm Attending" to="/events/my-events">
              {attending.length === 0 && <Empty>You haven&apos;t RSVP&apos;d to any gatherings yet.</Empty>}
              {attending.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  open={openEvent === e.id}
                  onToggle={() => setOpenEvent(openEvent === e.id ? null : e.id)}
                  showCalendar
                />
              ))}
            </Panel>
            <Panel title="Gatherings I'm Hosting" to="/events/my-events" className="flex-1">
              {hosting.length === 0 && <Empty>You aren&apos;t hosting any gatherings.</Empty>}
              {hosting.map((e) => (
                <EventRow
                  key={e.id}
                  event={e}
                  open={openEvent === e.id}
                  onToggle={() => setOpenEvent(openEvent === e.id ? null : e.id)}
                  showCalendar
                />
              ))}
            </Panel>
          </div>
          <div className="flex h-full flex-col gap-4">
            <EventsCalendar list={upcoming} />
            <Panel title="My Gatherings" to="/events" className="flex-1">
              {myGatherings.length === 0 && <Empty />}
              {myGatherings.map((e) => {
                const role = hostingIds.has(e.id) ? "Hosting" : "Attending";
                return (
                  <Link
                    key={e.id}
                    href={`/events/${e.slug}`}
                    className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                  >
                    <Img src={e.imageUrl} alt={e.title} className="h-14 w-20 shrink-0 rounded-md" />
                    <div className="flex-1">
                      <p className="font-display text-sm font-medium leading-snug">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.city} · {eventDate(e)}
                      </p>
                      <span className="mt-0.5 inline-block rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                        {role}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </Panel>
          </div>
        </div>
      )}
    </section>
  );
}
