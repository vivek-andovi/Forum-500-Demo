"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  Gift,
  Ticket,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { recordHref } from "@/lib/meta";
import { useDashboard } from "@/lib/queries";
import { formatDate, formatDateTime } from "@/lib/format";
import { usePageTitle } from "@/lib/use-page-title";
import type { DashboardResponse } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { ApprovalCard } from "@/components/common/approval-card";

const KPIS: {
  key: keyof DashboardResponse["counts"];
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "members", label: "Members", href: "/r/members", icon: Users },
  { key: "publishedMembers", label: "Published profiles", href: "/r/members?filter.isPublished=true", icon: BadgeCheck },
  { key: "applicationsNew", label: "New applications", href: "/r/applications?status=new", icon: UserPlus },
  { key: "upcomingEvents", label: "Upcoming events", href: "/r/events?status=published", icon: CalendarDays },
  { key: "rsvps", label: "RSVPs", href: "/r/event-rsvps?status=confirmed", icon: Ticket },
  { key: "benefitOffers", label: "Benefit offers", href: "/r/benefit-offers?status=published", icon: Gift },
  { key: "articles", label: "Articles", href: "/r/articles?status=published", icon: FileText },
  { key: "groups", label: "Groups", href: "/r/groups?status=published", icon: UsersRound },
];

export default function DashboardPage() {
  usePageTitle("Dashboard");
  const q = useDashboard();

  if (q.error) {
    return (
      <>
        <PageHeader eyebrow="Overview" title="Dashboard" />
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      </>
    );
  }

  const d = q.data;
  const approvals = (d?.approvals ?? []).filter((a) => a.count > 0);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Dashboard" description="The state of the club at a glance." />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPIS.map(({ key, label, href, icon: Icon }) => (
          <Link key={key} href={href} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <Icon className="size-4 text-accent" />
                </div>
                {d ? (
                  <p className="mt-2 font-display text-3xl tabular-nums">{d.counts?.[key] ?? 0}</p>
                ) : (
                  <Skeleton className="mt-3 h-8 w-16" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Approvals */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl">Needs your attention</h2>
          <Link href="/approvals" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            All approvals <ArrowRight className="size-4" />
          </Link>
        </div>
        {!d && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[84px] rounded-xl" />
            ))}
          </div>
        )}
        {d && approvals.length === 0 && (
          <Card>
            <EmptyState icon={CheckCircle2} title="All caught up" description="Nothing is waiting for review." className="py-8" />
          </Card>
        )}
        {approvals.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {approvals.map((a) => (
              <ApprovalCard key={a.key} a={a} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Upcoming events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-display text-lg font-medium">Upcoming events</CardTitle>
            <Link href="/r/events" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {!d && <ListSkeleton />}
            {d && !d.upcomingEvents?.length && <EmptyState title="No upcoming events" className="py-8" />}
            <ul className="divide-y">
              {(d?.upcomingEvents ?? []).map((e) => (
                <li key={e.id}>
                  <Link href={recordHref("events", e.id)} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50">
                    <div className="flex w-12 shrink-0 flex-col items-center rounded-md border bg-background py-1">
                      <span className="text-[10px] font-bold uppercase text-accent">
                        {formatDate(e.startsAt).split(" ")[1] ?? ""}
                      </span>
                      <span className="font-display text-lg leading-none">
                        {formatDate(e.startsAt).split(" ")[0] ?? ""}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{String(e.title ?? e._label ?? "Untitled")}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[e.kind, e.city, formatDateTime(e.startsAt)].filter(Boolean).map(String).join(" · ")}
                      </p>
                    </div>
                    {typeof e.status === "string" && <StatusBadge value={e.status} />}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-display text-lg font-medium">Recent applications</CardTitle>
            <Link href="/r/applications" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {!d && <ListSkeleton />}
            {d && !d.recentApplications?.length && <EmptyState title="No applications yet" className="py-8" />}
            <ul className="divide-y">
              {(d?.recentApplications ?? []).map((a) => (
                <li key={a.id}>
                  <Link href={recordHref("applications", a.id)} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/50">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {String(a.fullName ?? "?").slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{String(a.fullName ?? a._label ?? "Applicant")}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[a.role, a.company, a.city].filter(Boolean).map(String).join(" · ")}
                        {a.createdAt ? ` · ${formatDate(a.createdAt)}` : ""}
                      </p>
                    </div>
                    {typeof a.status === "string" && <StatusBadge value={a.status} />}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 px-6 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
