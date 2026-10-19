"use client";

import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EventsCalendar } from "@/components/EventsCalendar";
import { QueryState } from "@/components/QueryState";
import { useEvents, useSiteSettings } from "@/lib/queries";
import { eventDate, eventTime, eventVenue } from "@/lib/format";

export default function EventsCalendarPage() {
  const fallbackImage = useSiteSettings()?.fallbackEventImageUrl;
  const { data: events = [], isLoading, error } = useEvents();
  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="events"
        eyebrow="Events Hub"
        title="Events Calendar"
        description="Salons, dinners, receptions and roundtables across the chapters. RSVP from any event page."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <QueryState
            isLoading={isLoading}
            error={error}
            empty={events.length === 0}
            emptyText="No upcoming gatherings yet — check back soon."
          >
            {events.map((e) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent sm:flex-row sm:items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.imageUrl ?? fallbackImage}
                  alt={e.title}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="h-28 w-full shrink-0 rounded-md object-cover sm:h-24 sm:w-40"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.city} · {e.kind}</p>
                  <h2 className="mt-1 font-display text-xl font-medium">{e.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{eventDate(e)} · {eventTime(e)}</p>
                  <p className="text-sm text-muted-foreground">{eventVenue(e)}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm font-medium sm:self-center">
                  <CalendarPlus className="h-4 w-4" /> Details & RSVP
                </span>
              </Link>
            ))}
          </QueryState>
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <EventsCalendar list={events} />
        </div>
      </div>
    </div>
  );
}
