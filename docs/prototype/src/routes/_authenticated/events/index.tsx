import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EventsCalendar } from "@/components/EventsCalendar";
import { events } from "@/lib/forum-data";
import heroSalon from "@/assets/hero-salon.jpg";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "Events Calendar — Forum500" },
      { name: "description", content: "Salons, dinners, receptions and roundtables across the Forum500 chapters." },
      { property: "og:title", content: "Events Calendar — Forum500" },
      { property: "og:description", content: "Salons, dinners, receptions and roundtables across the Forum500 chapters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventsCalendarPage,
});

function EventsCalendarPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events Hub"
        title="Events Calendar"
        description="Salons, dinners, receptions and roundtables across the chapters. RSVP from any event page."
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {events.map((e) => (
            <Link
              key={e.id}
              to="/events/$eventId"
              params={{ eventId: e.id }}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent sm:flex-row sm:items-center"
            >
              <img
                src={e.image ?? heroSalon}
                alt={e.title}
                loading="lazy"
                width={1024}
                height={768}
                className="h-28 w-full shrink-0 rounded-md object-cover sm:h-24 sm:w-40"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.city} · {e.kind}</p>
                <h2 className="mt-1 font-display text-xl font-medium">{e.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{e.date} · {e.time}</p>
                <p className="text-sm text-muted-foreground">{e.venue}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm font-medium sm:self-center">
                <CalendarPlus className="h-4 w-4" /> Details & RSVP
              </span>
            </Link>
          ))}
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <EventsCalendar />
        </div>
      </div>
    </div>
  );
}
