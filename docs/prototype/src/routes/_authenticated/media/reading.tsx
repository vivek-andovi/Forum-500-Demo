import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { readingPicks } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/media/reading")({
  head: () => ({
    meta: [
      { title: "What to Read — Forum500" },
      { name: "description", content: "Reading recommended by Jess and Simon for Forum500 Members." },
      { property: "og:title", content: "What to Read — Forum500" },
      { property: "og:description", content: "Reading recommended by Jess and Simon for Forum500 Members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reading,
});

function Reading() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="What to Read by Jess & Simon"
        description="A short, considered list from the Forum's founders, refreshed each month."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {readingPicks.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-display text-lg font-medium">{r.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
