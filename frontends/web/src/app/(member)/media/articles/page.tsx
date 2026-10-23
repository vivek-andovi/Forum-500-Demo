"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArticles } from "@/features/media/queries";
import { articleDate, readTime } from "@/lib/format";
import type { Article } from "@/features/media/types";

function ArticleList({
  articles,
  isLoading,
  error,
  emptyText,
  showDate,
}: {
  articles: Article[];
  isLoading: boolean;
  error: unknown;
  emptyText: string;
  showDate?: boolean;
}) {
  return (
    <QueryState isLoading={isLoading} error={error} empty={articles.length === 0} emptyText={emptyText}>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {articles.map((a) => {
          const meta = [showDate ? articleDate(a) : a.authorName, readTime(a)].filter(Boolean).join(" · ");
          return (
            <article key={a.id}>
              <Link
                href={`/media/articles/${encodeURIComponent(a.slug)}`}
                className="group block px-6 py-5 transition-colors hover:bg-secondary/40"
              >
                <h2 className="font-display text-xl font-medium leading-snug group-hover:underline">{a.title}</h2>
                {showDate && a.standfirst ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{a.standfirst}</p>
                ) : null}
                {meta ? <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{meta}</p> : null}
              </Link>
            </article>
          );
        })}
      </div>
    </QueryState>
  );
}

export default function MemberArticlesPage() {
  const memberQ = useArticles("member");
  const reportsQ = useArticles("report");

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/articles"
        eyebrow="Media Hub"
        title="New Articles by Members"
        description="Essays, reporting and opinion written by Members for In:Forum and beyond."
      />
      <Tabs defaultValue="member">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="member">By members</TabsTrigger>
          <TabsTrigger value="report">Club reports</TabsTrigger>
        </TabsList>
        <TabsContent value="member" className="mt-6">
          <ArticleList
            articles={memberQ.data ?? []}
            isLoading={memberQ.isLoading}
            error={memberQ.error}
            emptyText="No member articles yet."
          />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ArticleList
            articles={reportsQ.data ?? []}
            isLoading={reportsQ.isLoading}
            error={reportsQ.error}
            emptyText="No club reports yet."
            showDate
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
