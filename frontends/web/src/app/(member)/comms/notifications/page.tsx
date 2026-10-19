"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarDays, CheckCircle2, Newspaper, UserRound, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useMarkNotificationRead, useNotifications } from "@/lib/queries";
import { timeAgo } from "@/lib/format";
import type { Notification, NotificationType } from "@/lib/types";

const typeIcon: Record<NotificationType, typeof Bell> = {
  new_member: Users,
  rsvp_reminder: CalendarDays,
  publication: Newspaper,
  profile_view: UserRound,
  approval: CheckCircle2,
  general: Bell,
};

export default function NotificationsPage() {
  const router = useRouter();
  const { data: notifications = [], isLoading, error } = useNotifications();
  const markRead = useMarkNotificationRead();
  // Broadcast notifications (memberId null) aren't marked read server-side, so track reads locally too.
  const [readLocal, setReadLocal] = useState<Set<string>>(new Set());

  const open = (n: Notification) => {
    const unread = !n.readAt && !readLocal.has(n.id);
    if (unread) {
      setReadLocal((prev) => new Set(prev).add(n.id));
      markRead.mutate(n.id);
    }
    if (n.link) {
      if (n.link.startsWith("/")) router.push(n.link);
      else window.open(n.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/notifications"
        eyebrow="Communications Hub"
        title="Notifications"
        description="Chapter news, event reminders and journal editions."
      />
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={notifications.length === 0}
        emptyText="You're all caught up."
      >
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] ?? Bell;
            const unread = !n.readAt && !readLocal.has(n.id);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => open(n)}
                className="flex w-full gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${unread ? "font-bold" : "font-semibold"}`}>{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
                {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </button>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
