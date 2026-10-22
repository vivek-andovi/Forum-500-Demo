"use client";

import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useReading } from "@/features/media/queries";

export default function ReadingPage() {
  const { data: picks = [], isLoading, error } = useReading();

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/reading"
        eyebrow="Media Hub"
        title="What to Read by Jess & Simon"
        description="A short, considered list from the Forum's founders, refreshed each month."
      />
      <QueryState isLoading={isLoading} error={error} empty={picks.length === 0} emptyText="No picks this month yet.">
        <div className="grid gap-4 sm:grid-cols-2">
          {picks.map((r) => (
            <div key={r.id} className="rounded-lg border border-border bg-card p-5">
              <h2 className="font-display text-lg font-medium">{r.title}</h2>
              {r.book?.authorName && <p className="text-xs text-muted-foreground">by {r.book.authorName}</p>}
              <p className="mt-1 text-sm text-muted-foreground">{r.note ?? ""}</p>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
