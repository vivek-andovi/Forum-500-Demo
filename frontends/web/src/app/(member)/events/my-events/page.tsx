"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CalendarPlus, LifeBuoy, Plus, Send } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { EventsCalendar } from "@/components/EventsCalendar";
import { QueryState } from "@/components/QueryState";
import { useAskConcierge, useEvents, useLookups, useMyEvents, useProposeEvent, useWhatsapp, useSiteSettings } from "@/lib/queries";
import { eventDate, eventVenue } from "@/lib/format";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import { useCurrentMember } from "@/hooks/useAuth";
import type { ContentStatus, ForumEvent } from "@/lib/types";

const WHATSAPP_AUDIENCE = "WhatsApp chapter groups";

const proposalStatus: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Approved — scheduled",
  published: "Approved — published",
  archived: "Archived",
  rejected: "Not approved",
};

export default function MyEventsPage() {
  const [showForm, setShowForm] = useState(false);
  const { member, isLoading: authLoading } = useCurrentMember();
  const { data, isLoading, error } = useMyEvents(!!member);
  const { data: allEvents = [] } = useEvents();
  const askSupport = useAskConcierge();
  const hosting = data?.hosting ?? [];
  const attending = data?.attending ?? [];
  const proposals = data?.proposals ?? [];
  const mine = [...hosting, ...attending];

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="events/my-events"
        eyebrow="Events Hub"
        title="My Events"
        description="Everything you are attending or hosting, in one place — and where you propose a new gathering."
      />

      {member ? (
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
            disabled={askSupport.isPending}
            onClick={() =>
              askSupport.mutate(
                { promptType: "event_support", body: "I'd like support from the Forum events team with a gathering." },
                {
                  onSuccess: () =>
                    toast.success("Your request has been sent to the Forum events team — they'll be in touch shortly."),
                },
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            <LifeBuoy className="h-4 w-4" /> Request support from Forum
          </button>
        </div>
      ) : (
        !authLoading && (
          <p className="text-sm text-muted-foreground">Admin account — no member profile, so there are no personal events.</p>
        )
      )}

      {showForm && member && <CreateEventForm onClose={() => setShowForm(false)} />}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <QueryState isLoading={!!member && isLoading} error={member ? error : null}>
            <EventList title="I'm hosting" list={hosting} tone="Hosting" />
            <EventList title="I'm attending" list={attending} tone="Attending" />
            {proposals.length > 0 && <ProposalList list={proposals} />}
          </QueryState>
        </div>
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <EventsCalendar list={mine.length ? mine : allEvents} note="Your gatherings this month — select a day to open the event." />
        </div>
      </div>
    </div>
  );
}

function EventList({ title, list, tone }: { title: string; list: ForumEvent[]; tone: string }) {
  const fallbackImage = useSiteSettings()?.fallbackEventImageUrl;
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
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{tone} · {e.city}</p>
              <Link href={`/events/${e.slug}`} className="mt-1 block font-display text-lg font-medium hover:text-accent">
                {e.title}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">{eventDate(e)} · {eventVenue(e)}</p>
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

function ProposalList({ list }: { list: ForumEvent[] }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium">My proposals</h2>
      <div className="mt-4 space-y-4">
        {list.map((e) => (
          <div key={e.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.kind} · {e.city}</p>
                <p className="mt-1 font-display text-lg font-medium">{e.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{eventDate(e)} · {eventVenue(e)}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                  e.status === "rejected"
                    ? "border-destructive/40 text-destructive"
                    : e.status === "published" || e.status === "scheduled"
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground"
                }`}
              >
                {proposalStatus[e.status] ?? e.status}
              </span>
            </div>
            {e.reviewNote && (
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Note from Forum: </span>
                {e.reviewNote}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CreateEventForm({ onClose }: { onClose: () => void }) {
  const { data: lookups } = useLookups();
  const { data: whatsapp } = useWhatsapp();
  const propose = useProposeEvent();
  const kinds = lookups?.eventKinds ?? [];
  const inviteAudiences = lookups?.inviteAudiences ?? [];
  const supportOptions = lookups?.supportOptions ?? [];
  const joinedIds = new Set(
    (whatsapp?.memberships ?? []).filter((m) => m.status === "approved").map((m) => m.groupId),
  );
  const myWhatsappGroups = (whatsapp?.groups ?? [])
    .filter((g) => joinedIds.size === 0 || joinedIds.has(g.id))
    .map((g) => g.name);

  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [venueText, setVenueText] = useState("");
  const [description, setDescription] = useState("");
  const [audiences, setAudiences] = useState<string[]>([]);
  const [support, setSupport] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const field =
    "mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent";

  function toggle(list: string[], set: (v: string[]) => void, value: string) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const groupNote =
      audiences.includes(WHATSAPP_AUDIENCE) && groups.length ? `\n\nWhatsApp groups: ${groups.join(", ")}` : "";
    propose.mutate(
      {
        title: title.trim(),
        kind: kind || kinds[0] || "Salon",
        city: city.trim(),
        date,
        venueText: venueText.trim() || undefined,
        description: (description.trim() + groupNote).trim() || undefined,
        inviteAudiences: audiences,
        supportRequested: support,
      },
      {
        onSuccess: () => {
          toast.success("Sent to Forum for review — Simon and Jessica will approve before invitations go out.");
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={submit} className="rounded-lg border border-border bg-card p-6">
      <h2 className="font-display text-xl font-medium">Propose a gathering</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every Member event is reviewed by the Forum team before it is published or invitations are sent.
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Event title</label>
          <input
            className={field}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="An evening on the future of cities"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Type</label>
          <select className={field} value={kind || kinds[0] || ""} onChange={(e) => setKind(e.target.value)}>
            {kinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">City</label>
          <input className={field} required value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
        </div>
        <div>
          <label className="text-sm font-medium">Date</label>
          <input className={field} type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Venue</label>
          <input
            className={field}
            value={venueText}
            onChange={(e) => setVenueText(e.target.value)}
            placeholder="A private dining room, or ask Forum to source one"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">About the evening</label>
          <textarea
            className={field}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What you have in mind, and who it is for."
          />
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

      {audiences.includes(WHATSAPP_AUDIENCE) && myWhatsappGroups.length > 0 && (
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
          disabled={propose.isPending}
          className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {propose.isPending ? "Submitting…" : "Submit for Forum approval"}
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
