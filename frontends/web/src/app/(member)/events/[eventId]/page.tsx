"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, Check, MapPin } from "lucide-react";
import { toast } from "sonner";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { ApiError } from "@/lib/api";
import { useCancelRsvp, useEvent, useRsvp } from "@/features/events/queries";
import { eventDate, eventTime, eventVenue } from "@/lib/format";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import { useCurrentMember } from "@/hooks/useAuth";
import type { RsvpStatus } from "@/features/events/types";

const rsvpLabels: Record<RsvpStatus, string> = {
  confirmed: "RSVP confirmed — see you there.",
  interested: "RSVP received — the Forum team will confirm your place.",
  waitlisted: "You're on the waitlist — we'll be in touch if a place opens.",
  declined: "Your RSVP was declined for this gathering.",
  cancelled: "RSVP cancelled.",
};

export default function EventDetailPage() {
  const { eventId: slug } = useParams<{ eventId: string }>();
  const { data: event, isLoading, error } = useEvent(slug);
  const { member } = useCurrentMember();
  const rsvp = useRsvp();
  const cancel = useCancelRsvp();
  const [plusOnes, setPlusOnes] = useState(0);
  const [dietaryNote, setDietaryNote] = useState("");

  const notFound = error instanceof ApiError && error.status === 404;
  if (isLoading || (error && !notFound)) {
    return (
      <div className="space-y-8">
        <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Events calendar
        </Link>
        <QueryState isLoading={isLoading} error={error} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">Event not found</p>
        <Link href="/events" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to the calendar
        </Link>
      </div>
    );
  }

  const hosts = (event.hosts ?? []).filter((h) => h.member);
  const activeRsvp = event.myRsvp && event.myRsvp.status !== "cancelled" ? event.myRsvp : null;

  return (
    <div className="space-y-8">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Events calendar
      </Link>
      {event.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.imageUrl}
          alt={event.title}
          width={1024}
          height={1024}
          className="h-64 w-full rounded-lg object-cover sm:h-80"
        />
      )}
      <div>
        <p className="eyebrow">{event.city} · {event.kind}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">{event.title}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{eventDate(event)} · {eventTime(event)}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" /> {eventVenue(event)}
        </p>
        {event.rsvpCount > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            {event.rsvpCount} {event.rsvpCount === 1 ? "Member" : "Members"} attending
            {event.capacity ? ` · ${event.capacity} places` : ""}
          </p>
        )}
      </div>
      {event.description && (
        <p className="max-w-2xl whitespace-pre-line leading-relaxed text-foreground/85">{event.description}</p>
      )}

      {hosts.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {hosts.length === 1 ? "Host" : "Hosts"}
          </p>
          <div className="mt-3 flex flex-wrap gap-4">
            {hosts.map((h) => (
              <Link
                key={h.id}
                href={`/membership/${h.member!.slug}`}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 transition-colors hover:border-accent"
              >
                <MemberAvatar src={h.member!.avatarUrl} name={h.member!.fullName} className="h-9 w-9 rounded-full" />
                <div>
                  <p className="text-sm font-medium">{h.member!.fullName}</p>
                  {h.member!.headline && <p className="text-xs text-muted-foreground">{h.member!.headline}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {activeRsvp ? (
        <div className="max-w-2xl rounded-lg border border-accent/40 bg-accent/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-accent" /> {rsvpLabels[activeRsvp.status]}
          </p>
          {(activeRsvp.plusOnes > 0 || activeRsvp.dietaryNote) && (
            <p className="mt-1 text-sm text-muted-foreground">
              {activeRsvp.plusOnes > 0 && `+${activeRsvp.plusOnes} guest${activeRsvp.plusOnes === 1 ? "" : "s"}`}
              {activeRsvp.plusOnes > 0 && activeRsvp.dietaryNote && " · "}
              {activeRsvp.dietaryNote}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={() => downloadCalendarEvent(event, event.address)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              <CalendarPlus className="h-4 w-4" /> Add to calendar
            </button>
            <button
              disabled={cancel.isPending}
              onClick={() => cancel.mutate(event.id, { onSuccess: () => toast("RSVP cancelled.") })}
              className="rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-60"
            >
              {cancel.isPending ? "Cancelling…" : "Cancel RSVP"}
            </button>
          </div>
        </div>
      ) : member ? (
        <div className="max-w-2xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-[140px_minmax(0,1fr)]">
            <div>
              <label htmlFor="plus-ones" className="text-sm font-medium">Guests</label>
              <select
                id="plus-ones"
                value={plusOnes}
                onChange={(e) => setPlusOnes(Number(e.target.value))}
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value={0}>Just me</option>
                <option value={1}>+1 guest</option>
                <option value={2}>+2 guests</option>
              </select>
            </div>
            <div>
              <label htmlFor="dietary" className="text-sm font-medium">Dietary requirements (optional)</label>
              <input
                id="dietary"
                value={dietaryNote}
                onChange={(e) => setDietaryNote(e.target.value)}
                placeholder="Vegetarian, allergies…"
                className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              disabled={rsvp.isPending}
              onClick={() =>
                rsvp.mutate(
                  { id: event.id, plusOnes, dietaryNote: dietaryNote.trim() || undefined },
                  { onSuccess: (r) => toast.success(rsvpLabels[r?.status ?? "confirmed"] ?? "RSVP received.") },
                )
              }
              className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {rsvp.isPending ? "Sending…" : "RSVP"}
            </button>
            <button
              onClick={() => downloadCalendarEvent(event, event.address)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              <CalendarPlus className="h-4 w-4" /> Add to calendar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => downloadCalendarEvent(event, event.address)}
            className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
          >
            <CalendarPlus className="h-4 w-4" /> Add to calendar
          </button>
          <p className="text-sm text-muted-foreground">Admin account — no member profile, so RSVP is unavailable.</p>
        </div>
      )}

      {event.address ? (
        <p className="flex items-start gap-1.5 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <span>
            <span className="font-medium">Address: </span>
            {event.address}
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          The exact address is shared with confirmed guests {event.addressRevealHours ?? 48} hours before the event.
        </p>
      )}
    </div>
  );
}
