import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, MapPin } from "lucide-react";
import { toast } from "sonner";
import { events } from "@/lib/forum-data";
import heroSalon from "@/assets/hero-salon.jpg";
import eventSingapore from "@/assets/event-singapore.jpg";

const images: Record<string, string> = {
  "london-evening-salon": heroSalon,
  "singapore-rooftop-reception": eventSingapore,
};

export const Route = createFileRoute("/_authenticated/events/$eventId")({
  loader: ({ params }) => {
    const event = events.find((e) => e.id === params.eventId);
    if (!event) throw notFound();
    return { event };
  },
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-display text-2xl">Event not found</p>
      <Link to="/events" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Back to the calendar
      </Link>
    </div>
  ),
  component: EventDetail,
});

function EventDetail() {
  const { event } = Route.useLoaderData();
  return (
    <div className="space-y-8">
      <Link to="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Events calendar
      </Link>
      {images[event.id] && (
        <img
          src={images[event.id]}
          alt={event.title}
          width={1024}
          height={1024}
          className="h-64 w-full rounded-lg object-cover sm:h-80"
        />
      )}
      <div>
        <p className="eyebrow">{event.city} · {event.kind}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{event.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{event.date} · {event.time}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {event.venue}
        </p>
      </div>
      <p className="max-w-2xl leading-relaxed text-foreground/85">{event.description}</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => toast.success("RSVP confirmed — see you there.")}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          RSVP
        </button>
        <button
          onClick={() => toast.success("Added to your calendar.")}
          className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        The exact address is shared with confirmed guests 48 hours before the event.
      </p>
    </div>
  );
}
