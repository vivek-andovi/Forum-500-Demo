"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Eye,
  FileSignature,
  ListChecks,
  MessageSquare,
  Newspaper,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { EventsCalendar } from "@/components/EventsCalendar";
import { downloadCalendarEvent } from "@/lib/event-calendar";
import { useDashboard } from "@/lib/queries";
import { articleDate, eventDate, eventTime, eventVenue, fmtDate, money, readTime, timeAgo } from "@/lib/format";
import type {
  ActionType,
  Article,
  BenefitOffer,
  EmailCampaign,
  ForumEvent,
  Group,
  Introduction,
  Member,
} from "@/lib/types";

const typeMeta: Record<ActionType, { label: string; icon: typeof Eye }> = {
  review: { label: "Review", icon: Eye },
  approve: { label: "Approve", icon: CheckCircle2 },
  sign: { label: "Sign", icon: FileSignature },
  pay: { label: "Pay", icon: CreditCard },
  fill: { label: "Fill", icon: ClipboardList },
};

function Empty({ children = "Nothing here yet." }: { children?: ReactNode }) {
  return <p className="px-2 py-2 text-xs text-muted-foreground">{children}</p>;
}

function Img({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  if (!src) return <div className={`${className} bg-muted`} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`${className} object-cover`} />;
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [eventsCollapsed, setEventsCollapsed] = useState(true);
  const [membershipCollapsed, setMembershipCollapsed] = useState(true);
  const [mediaCollapsed, setMediaCollapsed] = useState(true);
  const [commsCollapsed, setCommsCollapsed] = useState(true);
  const [actionsCollapsed, setActionsCollapsed] = useState(true);

  const me = data?.member ?? null;
  const firstName = me?.fullName?.split(" ")[0] || "Member";
  const isAdmin = !isLoading && !!data && !me;

  if (isLoading || error || !data) {
    return (
      <div className="space-y-16">
        <PageHeader pageKey="dashboard" eyebrow="Dashboard" title="Welcome back" description="Stay up to date with your Membership" />
        <QueryState isLoading={isLoading} error={error} />
      </div>
    );
  }

  const upcoming = data.upcomingEvents ?? [];
  const attending = data.attending ?? [];
  const hosting = data.hosting ?? [];
  const hostingIds = new Set(hosting.map((e) => e.id));
  const myGatherings = [...hosting, ...attending.filter((e) => !hostingIds.has(e.id))];
  const newMembers = data.newMembers ?? [];
  const featuredOffers = data.featuredOffers ?? [];
  const myOffers = data.myOffers ?? [];
  const myGroups = data.myGroups ?? [];
  const memberArticles = data.memberArticles ?? [];
  const podcasts = data.podcasts ?? [];
  const inforumArticles = data.inforumArticles ?? [];
  const whatsappGroups = data.whatsappGroups ?? [];
  const introductions = data.introductions ?? [];
  const actions = data.actions ?? [];
  const emails = data.emails ?? [];

  return (
    <div className="space-y-16">
      <div>
        <PageHeader
          pageKey="dashboard"
          eyebrow="Dashboard"
          title="Welcome back"
          titleOverride={me ? `Welcome back, ${firstName}` : undefined}
          description={isAdmin ? "Admin account — no member profile" : "Stay up to date with your Membership"}
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
          cta={me ? { to: "/events/my-events", label: "Organize an Event" } : undefined}
        />
        {eventsCollapsed ? (
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
              {newMembers.length === 0 && <Empty />}
              {newMembers.slice(0, 1).map((m) => (
                <NewMemberCard
                  key={m.id}
                  m={m}
                  open={openMember === m.id}
                  onToggle={() => setOpenMember(openMember === m.id ? null : m.id)}
                  compact
                />
              ))}
            </Panel>
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Benefits in Focus" to="/membership/benefits" compact>
                {featuredOffers.length === 0 && <Empty />}
                {featuredOffers.slice(0, 1).map((o) => (
                  <OfferRow key={o.id} offer={o} compact />
                ))}
              </Panel>
              <Panel title="My Benefits" to="/membership/benefits" compact>
                {myOffers.length === 0 && <Empty>You haven&apos;t opted into any benefits yet.</Empty>}
                {myOffers.slice(0, 1).map((o) => (
                  <OfferRow key={o.id} offer={o} badge="Opted in" compact />
                ))}
              </Panel>
              <Panel title="My Groups" to="/membership/groups" compact>
                {myGroups.length === 0 && <Empty>You haven&apos;t joined any groups yet.</Empty>}
                {myGroups.slice(0, 1).map((g) => (
                  <Link key={g.id} href="/membership/groups" className="block px-2 py-2">
                    <p className="font-display text-base font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{groupMeta(g, false)}</p>
                  </Link>
                ))}
              </Panel>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Panel title="New Members" to="/membership">
              {newMembers.length === 0 && <Empty />}
              {newMembers.map((m) => (
                <NewMemberCard
                  key={m.id}
                  m={m}
                  open={openMember === m.id}
                  onToggle={() => setOpenMember(openMember === m.id ? null : m.id)}
                />
              ))}
            </Panel>
            <div className="grid gap-4 lg:grid-cols-3">
              <Panel title="Benefits in Focus" to="/membership/benefits">
                {featuredOffers.length === 0 && <Empty />}
                {featuredOffers.slice(0, 3).map((o) => (
                  <OfferRow key={o.id} offer={o} />
                ))}
              </Panel>
              <Panel title="My Benefits" to="/membership/benefits">
                {myOffers.length === 0 && <Empty>You haven&apos;t opted into any benefits yet.</Empty>}
                {myOffers.map((o) => (
                  <OfferRow key={o.id} offer={o} badge="Opted in" />
                ))}
              </Panel>
              <Panel title="My Groups" to="/membership/groups">
                {myGroups.length === 0 && <Empty>You haven&apos;t joined any groups yet.</Empty>}
                {myGroups.slice(0, 4).map((g) => (
                  <Link key={g.id} href="/membership/groups" className="block px-2 py-2">
                    <p className="font-display text-base font-medium">{g.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {groupMeta(g, true)}
                    </p>
                  </Link>
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
          cta={me ? { to: "/media/articles", label: "Publish an Article" } : undefined}
        />
        {mediaCollapsed ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="New Articles by Members" to="/media/articles">
              {memberArticles.length === 0 && <Empty />}
              {memberArticles.slice(0, 1).map((a) => (
                <Link key={a.id} href="/media/articles" className="block px-2 py-2">
                  <Img src={a.imageUrl} alt={a.title} className="mb-2 h-28 w-full rounded-md" />
                  <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{articleMeta(a, false)}</p>
                </Link>
              ))}
            </Panel>
            <Panel title="New Podcasts" to="/media/podcasts">
              {podcasts.length === 0 && <Empty />}
              {podcasts.slice(0, 1).map((ep) => (
                <Link key={ep.id} href="/media/podcasts" className="flex gap-3 px-2 py-2">
                  <Img src={ep.coverUrl} alt={ep.title} className="h-16 w-16 shrink-0 rounded-md" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[ep.guestName, ep.durationMinutes ? `${ep.durationMinutes} min` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </Panel>
            <Panel title="New from In:Forum" to="/media/inforum">
              {inforumArticles.length === 0 && <Empty />}
              {inforumArticles.slice(0, 1).map((s) => (
                <Link key={s.id} href="/media/inforum" className="block px-2 py-2">
                  <Img src={s.imageUrl} alt={s.caption ?? s.title} className="mb-2 h-28 w-full rounded-md" />
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {s.sectionLabel ?? s.section?.label ?? ""}
                  </p>
                  <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{articleMeta(s, true)}</p>
                </Link>
              ))}
            </Panel>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="New Articles by Members" to="/media/articles">
              {memberArticles.length === 0 && <Empty />}
              {memberArticles.map((a) => (
                <Link key={a.id} href="/media/articles" className="flex gap-3 px-2 py-2">
                  <Img src={a.imageUrl} alt={a.title} className="h-14 w-20 shrink-0 rounded-md" />
                  <div>
                    <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{articleMeta(a, false)}</p>
                  </div>
                </Link>
              ))}
            </Panel>
            <Panel title="New Podcasts" to="/media/podcasts">
              {podcasts.length === 0 && <Empty />}
              {podcasts.map((ep) => (
                <Link key={ep.id} href="/media/podcasts" className="flex gap-3 px-2 py-2">
                  <Img src={ep.coverUrl} alt={ep.title} className="h-14 w-14 shrink-0 rounded-md" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {[ep.guestName, ep.durationMinutes ? `${ep.durationMinutes} min` : ""].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </Panel>
            <Panel title="New from In:Forum" to="/media/inforum">
              {inforumArticles.length === 0 && <Empty />}
              {inforumArticles.slice(0, 4).map((s) => (
                <Link key={s.id} href="/media/inforum" className="flex gap-3 px-2 py-2">
                  <Img src={s.imageUrl} alt={s.caption ?? s.title} className="h-14 w-20 shrink-0 rounded-md" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      {s.sectionLabel ?? s.section?.label ?? ""}
                    </p>
                    <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{articleMeta(s, true)}</p>
                  </div>
                </Link>
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
              {whatsappGroups.length === 0 ? (
                <p className="px-1 py-1 text-[10px] text-muted-foreground">You haven&apos;t joined any groups yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 px-1 py-1">
                  {whatsappGroups.map((g) => (
                    <WhatsappChip key={g.id} name={g.name} link={g.inviteLink} dense />
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Messages & Email" to="/comms/emails" compact dense>
              {emails.length === 0 && <p className="px-1 py-1 text-[10px] text-muted-foreground">No messages yet.</p>}
              {emails.slice(0, 1).map((t) => (
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
              {introductions.length === 0 && (
                <p className="px-1 py-1 text-[10px] text-muted-foreground">No introductions yet.</p>
              )}
              {introductions.slice(0, 1).map((i) => {
                const other = introOther(i, me);
                const by = introducedBy(i);
                return (
                  <div key={i.id} className="px-1 py-1">
                    <p className="font-display text-sm font-medium leading-tight">
                      {[other?.fullName, other?.chapter?.name].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {by ? `Introduced by ${by}` : introStatusLabel(i)}
                    </p>
                  </div>
                );
              })}
            </Panel>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="My WhatsApp Groups" to="/comms/whatsapp">
              {whatsappGroups.length === 0 ? (
                <Empty>You haven&apos;t joined any groups yet.</Empty>
              ) : (
                <div className="flex flex-wrap gap-2 px-2 py-2">
                  {whatsappGroups.map((g) => (
                    <WhatsappChip key={g.id} name={g.name} link={g.inviteLink} />
                  ))}
                </div>
              )}
            </Panel>
            <Panel title="Messages & Email" to="/comms/emails">
              {emails.length === 0 && <Empty>No messages yet.</Empty>}
              {emails.map((t) => (
                <ThreadRow
                  key={t.id}
                  t={t}
                  open={openThread === t.id}
                  onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                />
              ))}
            </Panel>
            <Panel title="Member Introductions" to="/comms/introductions" className="lg:col-span-2">
              {introductions.length === 0 && <Empty>No introductions yet.</Empty>}
              {introductions.map((i) => {
                const other = introOther(i, me);
                const by = introducedBy(i);
                return (
                  <div key={i.id} className="px-2 py-2">
                    <div className="flex items-center justify-between gap-2">
                      {other?.slug ? (
                        <Link href={`/membership/${other.slug}`} className="font-display text-base font-medium hover:underline">
                          {[other.fullName, other.chapter?.name].filter(Boolean).join(" · ")}
                        </Link>
                      ) : (
                        <p className="font-display text-base font-medium">{other?.fullName ?? ""}</p>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeAgo(i.createdAt)}</span>
                    </div>
                    <p className="text-xs font-semibold text-accent">
                      {by ? `Introduced by ${by}` : introStatusLabel(i)}
                    </p>
                    {i.reason && <p className="text-xs text-muted-foreground">{i.reason}</p>}
                  </div>
                );
              })}
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
        <Panel title={`Pending Actions (${actions.length})`} to="/comms/actions">
          {actions.length === 0 && <Empty>You&apos;re all caught up.</Empty>}
          <div className="divide-y divide-border">
            {(actionsCollapsed ? actions.slice(0, 1) : actions).map((a) => {
              const meta = typeMeta[a.type] ?? typeMeta.review;
              const Icon = meta.icon;
              const due = a.dueAt ? `Due ${fmtDate(a.dueAt, "d MMM")}` : "";
              const amount = money(a.amountCents, a.currency);
              return (
                <Link
                  key={a.id}
                  href="/comms/actions"
                  className="flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-muted"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-medium leading-tight">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground">{[a.context, due].filter(Boolean).join(" · ")}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {meta.label}
                  </span>
                  {amount && <span className="shrink-0 text-xs font-semibold text-accent">{amount}</span>}
                </Link>
              );
            })}
          </div>
          {actionsCollapsed && actions.length > 1 && (
            <button
              type="button"
              onClick={() => setActionsCollapsed(false)}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary"
            >
              Show all {actions.length} actions <ChevronDown className="h-3.5 w-3.5" />
            </button>
          )}
        </Panel>
      </section>
    </div>
  );
}

function groupMeta(g: Group & { memberCount?: number }, withNote: boolean): string {
  const count = typeof g.memberCount === "number" ? `${g.memberCount} Members` : "";
  return [count || g.cadence, withNote ? g.note : ""].filter(Boolean).join(" · ");
}

function articleMeta(a: Article, withDate: boolean): string {
  return [a.authorName, withDate ? articleDate(a) : "", readTime(a)].filter(Boolean).join(" · ");
}

function introOther(i: Introduction, me: Member | null): Member | null | undefined {
  if (me && i.targetId === me.id) return i.requester ?? i.target;
  return i.target ?? i.requester;
}

function introducedBy(i: Introduction): string | null {
  return i.introducer?.fullName ?? i.introducerName ?? null;
}

function introStatusLabel(i: Introduction): string {
  const s = i.status;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function WhatsappChip({ name, link, dense = false }: { name: string; link: string | null; dense?: boolean }) {
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

function OfferRow({
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

function NewMemberCard({
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

function ThreadRow({
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

function EventRow({
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
            href={cta.to}
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
        <Link href={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
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
  children: ReactNode;
}) {
  const padding = dense ? "p-3" : compact ? "p-4" : "p-5";
  const titleSize = dense ? "text-[10px]" : "text-xs";
  const gap = dense ? "mt-1.5" : compact ? "mt-2" : "mt-3";
  return (
    <div className={`flex flex-col rounded-lg border border-border bg-card ${padding} ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`font-bold uppercase tracking-[0.18em] text-muted-foreground ${titleSize}`}>{title}</h3>
        {to && (
          <Link href={to} className={`font-medium text-primary hover:underline ${dense ? "text-[10px]" : "text-xs"}`}>
            View all
          </Link>
        )}
      </div>
      <div className={`flex-1 divide-y divide-border ${gap}`}>{children}</div>
    </div>
  );
}
