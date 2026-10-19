import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { members } from "@/lib/forum-data";

const conversations = members.slice(0, 4).map((m, i) => ({
  member: m,
  preview: [
    "Would be wonderful to continue our conversation from the salon…",
    "Thank you for the introduction — we met yesterday.",
    "Are you in Singapore the week of the reception?",
    "The chapter committee loved your idea for the autumn dinner.",
  ][i],
  time: ["2h ago", "Yesterday", "Tuesday", "Last week"][i],
  unread: i === 0,
}));

export const Route = createFileRoute("/_authenticated/comms/messages")({
  component: Messages,
});

function Messages() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Messages"
        description="Introductions and conversations with fellow members."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {conversations.map(({ member, preview, time, unread }) => (
          <Link
            key={member.id}
            to="/membership/$memberId"
            params={{ memberId: member.id }}
            className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display font-semibold text-secondary-foreground">
              {member.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>{member.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
              </div>
              <p className={`truncate text-sm ${unread ? "text-foreground" : "text-muted-foreground"}`}>{preview}</p>
            </div>
            {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        Member-to-member messaging is being rebuilt for the new site; these are sample conversations.
      </p>
    </div>
  );
}
