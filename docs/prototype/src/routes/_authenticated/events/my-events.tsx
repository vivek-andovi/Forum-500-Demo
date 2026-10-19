import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, LifeBuoy, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EventsCalendar } from "@/components/EventsCalendar";
import { attendingEventIds, events, hostingEventIds, myWhatsappGroups } from "@/lib/forum-data";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import heroSalon from "@/assets/hero-salon.jpg";

export const Route = createFileRoute("/_authenticated/events/my-events")({
  head: () => ({
    meta: [
      { title: "My Events — Forum500" },
      { name: "description", content: "Forum500 gatherings you are attending or hosting, and the tools to propose a new one." },
      { property: "og:title", content: "My Events — Forum500" },
      { property: "og:description", content: "Forum500 gatherings you are attending or hosting, and the tools to propose a new one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyEvents,
});

const inviteAudiences = [
  "All Members",
  "My chapter",
  "Members travelling to the city",
  "Selected Members",
  "WhatsApp chapter groups",
  "Interest groups",
  "External network (guests of Members)",
  "Partners & sponsors",
];

const supportOptions = [
  "Venue sourcing",
  "Invitations & guest list",
  "Photography",
  "Catering & drinks",
  "Speaker introductions",
  "Budget & sponsorship",
];

function MyEvents() {
  const [showForm, setShowForm] = useState(false);
  const attending = events.filter((e) => attendingEventIds.includes(e.id));
  const hosting = events.filter((e) => hostingEventIds.includes(e.id));
  const mine = [...hosting, ...attending];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events Hub"
        title="My Events"
        description="Everything you are attending or hosting, in one place — and where you propose a new gathering."
      />

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="h-4 w-4" /> Create an event
        </button>
        <button
          type="button"
          onClick={() => toast.success("Your request has been sent to the Forum events team — they'll be in touch shortly.")}
          className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          <LifeBuoy className="h-4 w-4" /> Request support from Forum
        </button>
      </div>

      {showForm && <CreateEventForm onClose={() => setShowForm(false)} />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <EventList title="I'm hosting" list={hosting} tone="Hosting" />
          <EventList title="I'm attending" list={attending} tone="Attending" />
        </div>
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <EventsCalendar list={mine.length ? mine : events} note="Your gatherings this month — select a day to open the event." />
        </div>
      </div>
    </div>
  );
}

function EventList({ title, list, tone }: { title: string; list: typeof events; tone: string }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium">{title}</h2>
      <div className="mt-4 space-y-4">
        {list.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">
            Nothing here yet — browse the Events Calendar to find a gathering.
          </p>
        )}
        {list.map((e) => (
          <div
            key={e.id}
            className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center"
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
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{tone} · {e.city}</p>
              <Link to="/events/$eventId" params={{ eventId: e.id }} className="mt-1 block font-display text-lg font-medium hover:text-accent">
                {e.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{e.date} · {e.venue}</p>
            </div>
            <button
              type="button"
              onClick={() => downloadCalendarEvent(e)}
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-md border border-border px-3 py-2 text-sm font-medium hover:border-accent hover:text-accent sm:self-center"
            >
              <CalendarPlus className="h-4 w-4" /> Add to calendar
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CreateEventForm({ onClose }: { onClose: () => void }) {
  const [audiences, setAudiences] = useState<string[]>([]);
  const [support, setSupport] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const field =
    "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent";

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        toast.success("Sent to Forum for review — Simon and Jessica will approve before invitations go out.");
        onClose();
      }}
      className="rounded-lg border border-border bg-card p-6"
    >
      <h2 className="font-display text-xl font-medium">Propose a gathering</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every Member event is reviewed by the Forum team before it is published or invitations are sent.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Event title</label>
          <input className={field} required placeholder="An evening on the future of cities" />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <select className={field} defaultValue="Salon">
            <option>Salon</option>
            <option>Dinner</option>
            <option>Reception</option>
            <option>Roundtable</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">City</label>
          <input className={field} required placeholder="New York" />
        </div>
        <div>
          <label className="text-sm font-medium">Date</label>
          <input className={field} type="date" required />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Venue</label>
          <input className={field} placeholder="A private dining room, or ask Forum to source one" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">About the evening</label>
          <textarea className={field} rows={4} placeholder="What you have in mind, and who it is for." />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Who would you like to invite?</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {inviteAudiences.map((a) => (
            <Chip key={a} label={a} active={audiences.includes(a)} onClick={() => toggle(audiences, setAudiences, a)} />
          ))}
        </div>
      </fieldset>

      {audiences.includes("WhatsApp chapter groups") && (
        <fieldset className="mt-5">
          <legend className="text-sm font-medium">Which WhatsApp groups?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {myWhatsappGroups.map((g) => (
              <Chip key={g} label={g} active={groups.includes(g)} onClick={() => toggle(groups, setGroups, g)} />
            ))}
          </div>
        </fieldset>
      )}

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Support you would like from Forum</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {supportOptions.map((s) => (
            <Chip key={s} label={s} active={support.includes(s)} onClick={() => toggle(support, setSupport, s)} />
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex flex-wrap gap-3">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
        >
          <Send className="h-4 w-4" /> Submit for Forum approval
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-accent"
      }`}
    >
      {label}
    </button>
  );
}
