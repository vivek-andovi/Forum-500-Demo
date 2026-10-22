"use client";

import Link from "next/link";
import { ArrowRight, CalendarPlus, ChevronDown } from "lucide-react";
import { MemberAvatar } from "@/components/Avatar";
import type { EmailCampaign } from "@/features/comms/types";
import type { ForumEvent } from "@/features/events/types";
import type { BenefitOffer, Member } from "@/features/membership/types";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import { eventDate, eventTime, eventVenue, timeAgo } from "@/lib/format";

// Row components shared by the dashboard sections. Each takes `compact` (collapsed section) and
// some take `dense` (the smallest, Communications collapsed) to tighten spacing.

/** A WhatsApp group pill; links to the invite when there is one. */
export function WhatsappChip({ name, link, dense = false }: { name: string; link: string | null; dense?: boolean }) {
  const cls = dense
    ? "rounded-full border border-border px-2 py-0.5 text-[10px] font-medium"
    : "rounded-full border border-border px-3 py-1 text-xs font-medium";
  return link ? (
    <a href={link} target="_blank" rel="noreferrer" className={`${cls} hover:border-accent hover:text-accent`}>
      {name}
    </a>
  ) : (
    <span className={cls}>{name}</span>
  );
}

/** A benefit offer row linking to the benefits page. */
export function OfferRow({
  offer,
  compact: _compact = false,
  badge,
}: {
  offer: BenefitOffer;
  compact?: boolean;
  badge?: string;
}) {
  const img = offer.companyImageUrl ?? offer.imageUrl;
  return (
    <Link href="/membership/benefits" className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted">
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={img}
          alt={offer.title}
          loading="lazy"
          className="h-14 w-20 shrink-0 rounded-md border border-border object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{offer.category?.name ?? ""}</p>
          {badge && (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-display text-base font-medium leading-snug">{offer.offer}</p>
        <p className="text-xs text-muted-foreground">
          {offer.title} · {offer.providerName}
        </p>
      </div>
    </Link>
  );
}

/** A new member with their spotlight answer and an expandable full interview. */
export function NewMemberCard({
  m,
  open,
  onToggle,
  compact = false,
}: {
  m: Member;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  const interviews = [...(m.interviews ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const spotlightQ = m.spotlightQuestion ?? interviews[0]?.question ?? null;
  const spotlightA = m.spotlightAnswer ?? interviews[0]?.answer ?? null;
  const rest = interviews.filter((qa) => qa.question !== spotlightQ);
  return (
    <div className={compact ? "px-2 py-1" : "px-2 py-2"}>
      <Link href={`/membership/${m.slug}`} className="flex items-center gap-3">
        <MemberAvatar src={m.avatarUrl} name={m.fullName} className="h-12 w-12 rounded-full border border-border" />
        <div>
          <p className="font-display text-base font-medium">{m.fullName}</p>
          <p className="text-xs text-muted-foreground">{m.chapter?.name ?? ""}</p>
        </div>
      </Link>
      {!compact && spotlightQ && spotlightA && (
        <>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{spotlightQ}</p>
          <blockquote className="mt-1 font-display text-base italic leading-snug">“{spotlightA}”</blockquote>
        </>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? `Hide ${m.fullName}'s interview` : `Show ${m.fullName}'s full interview`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent"
      >
        {open ? "Hide interview" : "Full interview"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 border-l-2 border-accent/40 pl-3">
          {(compact ? interviews : rest).map((qa) => (
            <div key={qa.id}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{qa.question}</p>
              <p className="mt-0.5 text-sm leading-relaxed">{qa.answer}</p>
            </div>
          ))}
          <Link
            href={`/membership/${m.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Read more in the Member Directory <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** An email campaign that expands to show its body. */
export function ThreadRow({
  t,
  open,
  onToggle,
  compact = false,
  dense = false,
}: {
  t: EmailCampaign;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
  dense?: boolean;
}) {
  const padding = dense ? "px-1 py-0.5" : compact ? "px-2 py-1" : "px-2 py-2";
  const labelSize = dense ? "text-[10px]" : "text-xs";
  const previewSize = dense ? "text-xs" : "text-sm";
  const metaSize = dense ? "text-[10px]" : "text-xs";
  return (
    <div className={padding}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-start gap-2 text-left">
        <span className="flex-1">
          <span className={`block font-bold uppercase tracking-[0.18em] text-accent ${labelSize}`}>
            Email · {t.senderLabel}
          </span>
          <span className={`mt-0.5 block leading-snug ${previewSize} ${t.unread ? "font-semibold" : ""}`}>
            {t.subject}
          </span>
          <span className={`block text-muted-foreground ${metaSize}`}>{timeAgo(t.sentAt ?? t.createdAt)}</span>
        </span>
        <ChevronDown className={`mt-1 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="mt-2 whitespace-pre-line border-l-2 border-accent pl-3 text-sm text-muted-foreground">
          {t.body ?? t.preview ?? ""}
        </p>
      )}
    </div>
  );
}

/** An event row with optional RSVP / calendar buttons and expandable details. */
export function EventRow({
  event,
  open,
  onToggle,
  showRsvp = false,
  showCalendar = false,
  compact = false,
}: {
  event: ForumEvent;
  open: boolean;
  onToggle: () => void;
  showRsvp?: boolean;
  showCalendar?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "px-2 py-1" : "px-2 py-2"}>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/events/${event.slug}`} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {event.city} · {event.kind}
          </p>
          <p className="mt-0.5 font-display text-base font-medium leading-snug">{event.title}</p>
          <p className="text-xs text-muted-foreground">{eventDate(event)}</p>
        </Link>
        <div className="flex items-center gap-2">
          {showRsvp && (
            <Link
              href={`/events/${event.slug}`}
              className="shrink-0 rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
            >
              RSVP
            </Link>
          )}
          {showCalendar && (
            <button
              type="button"
              onClick={() => downloadCalendarEvent(event)}
              aria-label={`Add ${event.title} to calendar`}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-primary hover:border-accent hover:text-accent"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Calendar
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-label={open ? "Hide event details" : "Show event details"}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {event.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt={event.title} loading="lazy" className="h-36 w-full rounded-md object-cover" />
          )}
          {event.description && <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>}
          <p className="text-xs text-muted-foreground">
            {[eventTime(event), eventVenue(event)].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </div>
  );
}
