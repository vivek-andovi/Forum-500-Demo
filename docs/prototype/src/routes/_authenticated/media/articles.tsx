import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { memberArticles } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/media/articles")({
  head: () => ({
    meta: [
      { title: "New Articles by Members — Forum500" },
      { name: "description", content: "The latest writing published by Forum500 Members." },
      { property: "og:title", content: "New Articles by Members — Forum500" },
      { property: "og:description", content: "The latest writing published by Forum500 Members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberArticles,
});

function MemberArticles() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="New Articles by Members"
        description="Essays, reporting and opinion written by Members for In:Forum and beyond."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {memberArticles.map((a) => (
          <article key={a.id} className="px-6 py-5">
            <h2 className="font-display text-xl font-medium leading-snug">{a.title}</h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {a.author} · {a.readTime}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
