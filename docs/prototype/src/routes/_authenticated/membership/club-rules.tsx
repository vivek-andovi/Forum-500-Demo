import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/membership/club-rules")({
  head: () => ({
    meta: [
      { title: "Club Rules — Forum500" },
      { name: "description", content: "Forum500 club rules and member guidelines." },
      { property: "og:title", content: "Club Rules — Forum500" },
      { property: "og:description", content: "Forum500 club rules and member guidelines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ClubRules,
});

function ClubRules() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Membership"
        title="Club Rules"
        description="The principles that guide how we gather, share and look after one another."
      />
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">Club Rules content coming soon.</p>
      </div>
    </div>
  );
}
