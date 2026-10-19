import { createFileRoute } from "@tanstack/react-router";
import { Bell, CalendarDays, Newspaper, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

const notifications = [
  {
    icon: Users,
    title: "New member in your chapter",
    body: "Helena Borg has joined the Stockholm chapter.",
    time: "1h ago",
  },
  {
    icon: CalendarDays,
    title: "RSVP reminder",
    body: "The London Evening Salon & Dinner is on Thursday 24 September.",
    time: "5h ago",
  },
  {
    icon: Newspaper,
    title: "In:Forum is out",
    body: "This week's edition leads with “The return of the salon”.",
    time: "Yesterday",
  },
  {
    icon: Bell,
    title: "Your profile was viewed",
    body: "Two members viewed your profile this week.",
    time: "Tuesday",
  },
];

export const Route = createFileRoute("/_authenticated/comms/notifications")({
  component: Notifications,
});

function Notifications() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Notifications"
        description="Chapter news, event reminders and journal editions."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {notifications.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.title} className="flex gap-4 px-5 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Icon className="h-4 w-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
