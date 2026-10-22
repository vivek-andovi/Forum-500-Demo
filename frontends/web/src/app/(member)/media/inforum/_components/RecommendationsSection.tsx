"use client";

import { useState } from "react";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useRecommendations } from "@/features/media/queries";
import { useLookups } from "@/features/site/queries";
import { cn } from "@/lib/utils";

/** The "Recommendations" tab: category filter, member recommendations grid and a share prompt. */
export function RecommendationsSection({ onShare }: { onShare: () => void }) {
  const lookups = useLookups();
  const q = useRecommendations();
  const [recCategory, setRecCategory] = useState<string>("all");
  const categories = lookups.data?.recommendationCategories ?? [];
  const all = q.data ?? [];
  const visibleRecs = recCategory === "all" ? all : all.filter((r) => r.category === recCategory);

  return (
    <section className="space-y-6">
      <div>
        <h3 className="font-display text-2xl font-medium">Member Recommendations</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Places, stays and books members swear by — shared in confidence, from members who have actually been.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", label: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setRecCategory(c.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
              recCategory === c.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <QueryState
        isLoading={q.isLoading}
        error={q.error}
        empty={!visibleRecs.length}
        emptyText="No recommendations in this category yet."
      >
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {visibleRecs.map((r) => (
            <article key={r.id} className="group">
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div className="h-40 w-full rounded-md bg-muted" aria-hidden />
              )}
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {[categories.find((c) => c.id === r.category)?.label ?? r.category, r.place].filter(Boolean).join(" · ")}
              </p>
              <h3 className="mt-1 font-display text-lg font-medium leading-snug">{r.title}</h3>
              {r.note ? <p className="mt-2 text-sm italic text-muted-foreground">“{r.note}”</p> : null}
              <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <MemberAvatar src={r.memberPhotoUrl} name={r.memberName} className="h-7 w-7 rounded-full text-[10px]" />
                <span>
                  {r.memberName}
                  {r.memberChapter ? ` · ${r.memberChapter} chapter` : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <div className="rounded-lg border border-border bg-secondary/40 p-5">
        <p className="text-sm text-muted-foreground">
          Have a table, hotel or book worth sharing? Send it to Jessica and Simon and it will appear here after a quick
          review.
        </p>
        <Button variant="outline" className="mt-3" onClick={onShare}>
          Share a recommendation
        </Button>
      </div>
    </section>
  );
}
