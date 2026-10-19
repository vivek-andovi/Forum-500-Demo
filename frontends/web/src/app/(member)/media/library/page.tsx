"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useLibrary, useSiteSettings } from "@/lib/queries";
import type { LibraryKind } from "@/lib/types";

const kindLabel: Record<LibraryKind, string> = {
  Annual_Report: "Annual Report",
  Journal: "Journal",
};

export default function LibraryPage() {
  const fallbackCover = useSiteSettings()?.fallbackCoverImageUrl;
  const { data: items = [], isLoading, error } = useLibrary();

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/library"
        eyebrow="Media Hub"
        title="Library"
        description="The Forum's publications archive — the annual Forecast and every edition of IN:FORUM."
      />
      <QueryState isLoading={isLoading} error={error} empty={items.length === 0} emptyText="The library is empty.">
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => {
            const label = `Read${item.pages ? ` (${item.pages} pages)` : ""}`;
            return (
              <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.coverUrl ?? fallbackCover}
                    alt={item.title}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <span className="absolute left-3 top-3 rounded bg-background/90 px-2 py-1 text-xs font-bold uppercase tracking-wider">
                    {kindLabel[item.kind] ?? item.kind}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-medium">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description ?? ""}</p>
                  {item.fileUrl ? (
                    <a
                      href={item.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium hover:bg-secondary"
                    >
                      <BookOpen className="h-4 w-4" /> {label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      title="File coming soon"
                      className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium opacity-50"
                    >
                      <BookOpen className="h-4 w-4" /> {label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>
    </div>
  );
}
