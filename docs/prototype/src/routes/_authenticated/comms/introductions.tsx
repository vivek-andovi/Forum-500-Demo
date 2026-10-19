import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { members } from "@/lib/forum-data";
import { Handshake } from "lucide-react";

const introductions = members.slice(1, 5).map((m, i) => ({
  id: `intro-${i}`,
  member: m,
  introducer: members[i],
  reason: [
    "Both working on climate tech ventures in London and New York.",
    "Shared interest in hospitality investment across Southeast Asia.",
    "Looking for advice on scaling a family office philanthropic arm.",
    "Both recently joined the Travel Network and are in Geneva this month.",
  ][i],
  status: ["Accepted", "Pending", "Accepted", "Pending"][i],
  date: ["2 days ago", "Last week", "2 weeks ago", "3 weeks ago"][i],
}));

export const Route = createFileRoute("/_authenticated/comms/introductions")({
  component: MemberIntroductions,
});

function MemberIntroductions() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Member Introductions"
        description="Introductions made by Simon, Jessica and fellow members."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {introductions.map((intro) => (
          <div key={intro.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Handshake className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm font-medium">Introduced by {intro.introducer?.name ?? "Forum Team"}</p>
                  <p className="text-xs text-muted-foreground">{intro.date}</p>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  intro.status === "Accepted"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                }`}
              >
                {intro.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{intro.reason}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-semibold">
                {intro.member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <Link
                  to="/membership/$memberId"
                  params={{ memberId: intro.member.id }}
                  className="text-sm font-medium hover:underline"
                >
                  {intro.member.name}
                </Link>
                <p className="text-xs text-muted-foreground">{intro.member.city}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
