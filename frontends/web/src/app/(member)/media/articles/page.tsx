"use client";

import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useArticles } from "@/features/media/queries";
import { readTime } from "@/lib/format";

export default function MemberArticlesPage() {
  const { data: articles = [], isLoading, error } = useArticles("member");

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/articles"
        eyebrow="Media Hub"
        title="New Articles by Members"
        description="Essays, reporting and opinion written by Members for In:Forum and beyond."
      />
      <QueryState isLoading={isLoading} error={error} empty={articles.length === 0} emptyText="No member articles yet.">
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {articles.map((a) => {
            const rt = readTime(a);
            return (
              <article key={a.id} className="px-6 py-5">
                <h2 className="font-display text-xl font-medium leading-snug">{a.title}</h2>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {a.authorName}
                  {rt ? ` · ${rt}` : ""}
                </p>
              </article>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
