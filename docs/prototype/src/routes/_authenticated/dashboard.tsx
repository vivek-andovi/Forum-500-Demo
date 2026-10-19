import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, CalendarPlus, ChevronDown, ListChecks, MessageSquare, Newspaper, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EventsCalendar } from "@/components/EventsCalendar";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import {
  allGroups,
  attendingEventIds,
  events,
  hostingEventIds,
  memberArticles,
  memberOffers,
  messageThreads,
  memberIntroductions,
  myWhatsappGroups,
  newMemberQandAs,
  partnerOffers,
  podcastEpisodes,
} from "@/lib/forum-data";
import { inforumArticles } from "@/lib/inforum-data";
import { initialActions, typeMeta } from "@/lib/actions-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [eventsCollapsed, setEventsCollapsed] = useState(true);
  const [membershipCollapsed, setMembershipCollapsed] = useState(true);
  const [mediaCollapsed, setMediaCollapsed] = useState(true);
  const [commsCollapsed, setCommsCollapsed] = useState(true);
  const [actionsCollapsed, setActionsCollapsed] = useState(true);
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const firstName =
    profile?.full_name?.split(" ")[0] ||
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.split(" ")[0] ||
    "Member";
  const whatsappThreads = messageThreads.filter((t) => t.kind === "WhatsApp");
  const emailThreads = messageThreads.filter((t) => t.kind === "Email");
  // Benefits this member has opted into — deliberately different from the featured offers in "Benefits in Focus".
  const myBenefitOffers = [memberOffers[1]!, partnerOffers[1]!];
  return (
    <div className="space-y-16">
      <div>
        <PageHeader
          eyebrow="Dashboard"
          title={`Welcome back, ${firstName}`}
          description="Stay up to date with your Membership"
        />
      </div>


      {/* Events */}
      <section className="space-y-4">
        <SectionHeading
          icon={CalendarDays}
          title="Events"
          to="/events"
          linkLabel="Events Hub"
          collapsed={eventsCollapsed}
          onToggle={() => setEventsCollapsed((v) => !v)}
          cta={{ to: "/events/my-events", label: "Organize an Event" }}
        />
        {eventsCollapsed ? (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Panel title="Next Gatherings" to="/events" compact>
              {events.slice(0, 1).map((e) => (
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
            <EventsCalendar compact />
          </div>
        ) : (
          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            <div className="flex h-full flex-col gap-4 lg:col-span-2">
              <Panel title="Next Gatherings" to="/events">
                {events.slice(0, 2).map((e) => (
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
                {events
                  .filter((e) => attendingEventIds.includes(e.id))
                  .map((e) => (
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
                {events
                  .filter((e) => hostingEventIds.includes(e.id))
                  .map((e) => (
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
              <EventsCalendar />
              <Panel title="My Gatherings" to="/events" className="flex-1">
                {events
                  .filter((e) => attendingEventIds.includes(e.id) || hostingEventIds.includes(e.id))
                  .map((e) => {
                    const role = hostingEventIds.includes(e.id) ? "Hosting" : "Attending";
                    return (
                      <Link
                        key={e.id}
                        to="/events/$eventId"
                        params={{ eventId: e.id }}
                        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
                      >
                        <img
                          src={e.image}
                          alt={e.title}
                          loading="lazy"
                          width={1024}
                          height={768}
                          className="h-14 w-20 shrink-0 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-display text-sm font-medium leading-snug">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.city} · {e.date}</p>
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

      {/* Membership */}
      <section className="space-y-4">
        <SectionHeading
          icon={Users}
          title="Membership"
          to="/membership"
          linkLabel="Membership Hub"
          collapsed={membershipCollapsed}
          onToggle={() => setMembershipCollapsed((v) => !v)}
          cta={{ to: "/membership", label: "Find a Member" }}
        />
        {membershipCollapsed ? (
          <div className="space-y-4">
            <Panel title="New Members" to="/membership" compact>
              {newMemberQandAs.slice(0, 1).map((q) => (
                <NewMemberCard
                  key={q.id}
                  q={q}
                  open={openMember === q.id}
                  onToggle={() => setOpenMember(openMember === q.id ? null : q.id)}
                  compact
                />
              ))}
            </Panel>
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Benefits in Focus" to="/membership/benefits" compact>
                {memberOffers
                  .filter((o) => o.featured)
                  .slice(0, 1)
                  .map((o) => (
                    <OfferRow key={o.id} offer={o} compact />
                  ))}
              </Panel>
              <Panel title="My Benefits" to="/membership/benefits" compact>
                {myBenefitOffers.slice(0, 1).map((o) => (
                  <OfferRow key={o.id} offer={o} badge="Opted in" compact />
                ))}
              </Panel>
              <Panel title="My Groups" to="/membership/groups" compact>
                {allGroups.slice(0, 1).map((g) => (
                  <div key={g.id} className="px-2 py-2">
                    <p className="font-display text-base font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.members} Members</p>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Panel title="New Members" to="/membership">
              {newMemberQandAs.map((q) => (
                <NewMemberCard
                  key={q.id}
                  q={q}
                  open={openMember === q.id}
                  onToggle={() => setOpenMember(openMember === q.id ? null : q.id)}
                />
              ))}
            </Panel>
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Benefits in Focus" to="/membership/benefits">
                {memberOffers
                  .filter((o) => o.featured)
                  .concat(partnerOffers.filter((o) => o.featured))
                  .slice(0, 3)
                  .map((o) => (
                    <OfferRow key={o.id} offer={o} />
                  ))}
              </Panel>
              <Panel title="My Benefits" to="/membership/benefits">
                {myBenefitOffers.map((o) => (
                  <OfferRow key={o.id} offer={o} badge="Opted in" />
                ))}
              </Panel>
              <Panel title="My Groups" to="/membership/groups">
                {allGroups.slice(0, 4).map((g) => (
                  <div key={g.id} className="px-2 py-2">
                    <p className="font-display text-base font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{g.members} Members · {g.note}</p>
                  </div>
                ))}
              </Panel>
            </div>
          </div>
        )}
      </section>

      {/* Media */}
      <section className="space-y-4">
        <SectionHeading
          icon={Newspaper}
          title="Media"
          to="/media"
          linkLabel="Media Hub"
          collapsed={mediaCollapsed}
          onToggle={() => setMediaCollapsed((v) => !v)}
          cta={{ to: "/media/articles", label: "Publish an Article" }}
        />
        {mediaCollapsed ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="New Articles by Members" to="/media/articles">
              {memberArticles.slice(0, 1).map((a) => (
                <div key={a.id} className="px-2 py-2">
                  <img
                    src={a.image}
                    alt={a.title}
                    loading="lazy"
                    className="mb-2 h-28 w-full rounded-md object-cover"
                  />
                  <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.author} · {a.readTime}</p>
                </div>
              ))}
            </Panel>
            <Panel title="New Podcasts" to="/media/podcasts">
              {podcastEpisodes.slice(0, 1).map((ep) => (
                <div key={ep.id} className="flex gap-3 px-2 py-2">
                  <img
                    src={ep.cover}
                    alt={ep.title}
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">{ep.guest} · {ep.duration}</p>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="New from In:Forum" to="/media/inforum">
              {inforumArticles.slice(0, 1).map((s) => (
                <div key={s.id} className="px-2 py-2">
                  <img
                    src={s.image}
                    alt={s.caption}
                    loading="lazy"
                    className="mb-2 h-28 w-full rounded-md object-cover"
                  />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{s.sectionLabel}</p>
                  <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.author} · {s.date} · {s.readTime}</p>
                </div>
              ))}
            </Panel>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="New Articles by Members" to="/media/articles">
              {memberArticles.map((a) => (
                <div key={a.id} className="flex gap-3 px-2 py-2">
                  <img
                    src={a.image}
                    alt={a.title}
                    loading="lazy"
                    className="h-14 w-20 shrink-0 rounded-md object-cover"
                  />
                  <div>
                    <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.author} · {a.readTime}</p>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="New Podcasts" to="/media/podcasts">
              {podcastEpisodes.map((ep) => (
                <div key={ep.id} className="flex gap-3 px-2 py-2">
                  <img
                    src={ep.cover}
                    alt={ep.title}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">{ep.guest} · {ep.duration}</p>
                  </div>
                </div>
              ))}
            </Panel>
            <Panel title="New from In:Forum" to="/media/inforum">
              {inforumArticles.slice(0, 4).map((s) => (
                <div key={s.id} className="flex gap-3 px-2 py-2">
                  <img
                    src={s.image}
                    alt={s.caption}
                    loading="lazy"
                    className="h-14 w-20 shrink-0 rounded-md object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{s.sectionLabel}</p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.author} · {s.date} · {s.readTime}</p>
                  </div>
                </div>
              ))}
            </Panel>
          </div>
        )}
      </section>

      {/* Communications */}
      <section className="space-y-4">
        <SectionHeading
          icon={MessageSquare}
          title="Communications"
          to="/comms"
          linkLabel="Communications Hub"
          collapsed={commsCollapsed}
          onToggle={() => setCommsCollapsed((v) => !v)}
          cta={{ to: "/membership", label: "Send a Message" }}
        />
        {commsCollapsed ? (
          <div className="grid gap-3 lg:grid-cols-3">
            <Panel title="My WhatsApp Groups" to="/comms/whatsapp" compact dense>
              <div className="flex flex-wrap gap-1.5 px-1 py-1">
                {myWhatsappGroups.map((g) => (
                  <span key={g} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium">
                    {g}
                  </span>
                ))}
              </div>
              {whatsappThreads.slice(0, 1).map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  open={openThread === t.id}
                  onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                  compact
                  dense
                />
              ))}
            </Panel>
            <Panel title="Messages & Email" to="/comms/emails" compact dense>
              {emailThreads.slice(0, 1).map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  open={openThread === t.id}
                  onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                  compact
                  dense
                />
              ))}
            </Panel>
            <Panel title="Member Introductions" to="/comms/introductions" compact dense>
              {memberIntroductions.slice(0, 1).map((i) => (
                <div key={i.id} className="px-1 py-1">
                  <p className="font-display text-sm font-medium leading-tight">{i.member} · {i.city}</p>
                  <p className="text-[10px] text-muted-foreground">Introduced by {i.introducedBy}</p>
                </div>
              ))}
            </Panel>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="My WhatsApp Groups" to="/comms/whatsapp">
              <div className="flex flex-wrap gap-2 px-2 py-2">
                {myWhatsappGroups.map((g) => (
                  <span key={g} className="rounded-full border border-border px-3 py-1 text-xs font-medium">
                    {g}
                  </span>
                ))}
              </div>
              <div className="divide-y divide-border">
                {whatsappThreads.map((t) => (
                  <ThreadRow
                    key={t.id}
                    t={t}
                    open={openThread === t.id}
                    onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                  />
                ))}
              </div>
            </Panel>
            <Panel title="Messages & Email" to="/comms/emails">
              {emailThreads.map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  open={openThread === t.id}
                  onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                />
              ))}
            </Panel>
            <Panel title="Member Introductions" to="/comms/introductions" className="lg:col-span-2">
              {memberIntroductions.map((i) => (
                <div key={i.id} className="px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-base font-medium">{i.member} · {i.city}</p>
                    <span className="text-[10px] text-muted-foreground">{i.time}</span>
                  </div>
                  <p className="text-xs font-semibold text-accent">Introduced by {i.introducedBy}</p>
                  <p className="text-xs text-muted-foreground">{i.note}</p>
                </div>
              ))}
            </Panel>
          </div>
        )}
      </section>

      {/* Actions */}
      <section className="space-y-4">
        <SectionHeading
          icon={ListChecks}
          title="Actions"
          to="/comms/actions"
          linkLabel="See all"
          collapsed={actionsCollapsed}
          onToggle={() => setActionsCollapsed((v) => !v)}
        />
        <Panel title={`Pending Actions (${initialActions.length})`} to="/comms/actions">
          <div className="divide-y divide-border">
            {(actionsCollapsed ? initialActions.slice(0, 1) : initialActions).map((a) => {
              const meta = typeMeta[a.type];
              const Icon = meta.icon;
              return (
                <Link
                  key={a.id}
                  to="/comms/actions"
                  className="flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-medium leading-tight">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {a.context} · {a.due}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta.label}
                  </span>
                  {a.amount && (
                    <span className="shrink-0 text-xs font-semibold text-accent">{a.amount}</span>
                  )}
                </Link>
              );
            })}
          </div>
          {actionsCollapsed && initialActions.length > 1 && (
            <button
              type="button"
              onClick={() => setActionsCollapsed(false)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary"
            >
              Show all {initialActions.length} actions <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </Panel>
      </section>
    </div>
  );
}

function OfferRow({
  offer,
  compact = false,
  badge,
}: {
  offer: (typeof memberOffers)[number];
  compact?: boolean;
  badge?: string;
}) {
  return (
    <Link
      to="/membership/benefits"
      search={{ offer: undefined }}
      className="flex gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted"
    >
      {(offer.companyImage || offer.image) && (
        <img
          src={offer.companyImage ?? offer.image}
          alt={offer.title}
          loading="lazy"
          className="h-14 w-20 shrink-0 rounded-md border border-border object-cover"
        />
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{offer.category}</p>
          {badge && (
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 font-display text-base font-medium leading-snug">{offer.offer}</p>
        <p className="text-xs text-muted-foreground">
          {offer.title} · {offer.provider}
        </p>
      </div>
    </Link>
  );
}

function NewMemberCard({
  q,
  open,
  onToggle,
  compact = false,
}: {
  q: (typeof newMemberQandAs)[number];
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "px-2 py-1" : "px-2 py-2"}>
      <div className="flex items-center gap-3">
        <img
          src={q.photo}
          alt={`Portrait of ${q.name}`}
          loading="lazy"
          width={768}
          height={960}
          className="h-12 w-12 rounded-full border border-border object-cover"
        />
        <div>
          <p className="font-display text-base font-medium">{q.name}</p>
          <p className="text-xs text-muted-foreground">{q.city}</p>
        </div>
      </div>
      {!compact && (
        <>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{q.question}</p>
          <blockquote className="mt-1 font-display text-base italic leading-snug">“{q.answer}”</blockquote>
        </>
      )}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={open ? `Hide ${q.name}'s interview` : `Show ${q.name}'s full interview`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent"
      >
        {open ? "Hide interview" : "Full interview"}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 space-y-3 border-l-2 border-accent/40 pl-3">
          {q.interview
            .filter((qa) => qa.question !== q.question)
            .map((qa) => (
              <div key={qa.question}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{qa.question}</p>
                <p className="mt-0.5 text-sm leading-relaxed">{qa.answer}</p>
              </div>
            ))}
          <Link
            to="/membership"
            className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
          >
            Read more in the Member Directory <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

function ThreadRow({
  t,
  open,
  onToggle,
  compact = false,
  dense = false,
}: {
  t: (typeof messageThreads)[number];
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
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-2 text-left"
      >
        <span className="flex-1">
          <span className={`block font-bold uppercase tracking-[0.18em] text-accent ${labelSize}`}>
            {t.kind} · {t.source}
          </span>
          <span className={`mt-0.5 block leading-snug ${previewSize}`}>{t.preview}</span>
          <span className={`block text-muted-foreground ${metaSize}`}>{t.time}</span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="mt-2 border-l-2 border-accent pl-3 text-sm text-muted-foreground">{t.body}</p>
      )}
    </div>
  );
}


function EventRow({
  event,
  open,
  onToggle,
  showRsvp = false,
  showCalendar = false,
  compact = false,
}: {
  event: (typeof events)[number];
  open: boolean;
  onToggle: () => void;
  showRsvp?: boolean;
  showCalendar?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "px-2 py-1" : "px-2 py-2"}>
      <div className="flex items-start justify-between gap-3">
        <Link to="/events/$eventId" params={{ eventId: event.id }} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{event.city} · {event.kind}</p>
          <p className="mt-0.5 font-display text-base font-medium leading-snug">{event.title}</p>
          <p className="text-xs text-muted-foreground">{event.date}</p>
        </Link>
        <div className="flex items-center gap-2">
          {showRsvp && (
            <Link
              to="/events/$eventId"
              params={{ eventId: event.id }}
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
      {open && event.image && (
        <div className="mt-3 space-y-2">
          <img
            src={event.image}
            alt={event.title}
            loading="lazy"
            width={1024}
            height={768}
            className="h-36 w-full rounded-md object-cover"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">{event.description}</p>
          <p className="text-xs text-muted-foreground">{event.time} · {event.venue}</p>
        </div>
      )}
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  to,
  linkLabel,
  collapsed,
  onToggle,
  cta,
}: {
  icon: typeof Users;
  title: string;
  to: string;
  linkLabel: string;
  collapsed?: boolean;
  onToggle?: () => void;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <h2 className="flex items-center gap-2 font-display text-xl font-medium">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </h2>
      <div className="flex items-center gap-3">
        {cta && (
          <Link
            to={cta.to}
            className="rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
          >
            {cta.label}
          </Link>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        )}
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Panel({
  title,
  to,
  className,
  compact = false,
  dense = false,
  children,
}: {
  title: string;
  to?: string;
  className?: string;
  compact?: boolean;
  dense?: boolean;
  children: React.ReactNode;
}) {
  const padding = dense ? "p-3" : compact ? "p-4" : "p-5";
  const titleSize = dense ? "text-[10px]" : "text-xs";
  const gap = dense ? "mt-1.5" : compact ? "mt-2" : "mt-3";
  return (
    <div className={`flex flex-col rounded-lg border border-border bg-card ${padding} ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`font-bold uppercase tracking-[0.18em] text-muted-foreground ${titleSize}`}>{title}</h3>
        {to && (
          <Link to={to} className={`font-medium text-primary hover:underline ${dense ? "text-[10px]" : "text-xs"}`}>
            View all
          </Link>
        )}
      </div>
      <div className={`flex-1 divide-y divide-border ${gap}`}>{children}</div>
    </div>
  );
}


