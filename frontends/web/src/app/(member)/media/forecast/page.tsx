"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryState } from "@/components/QueryState";
import { useForecast } from "@/lib/queries";
import { readTime } from "@/lib/format";
import type { Article, ForecastIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

// A "page" in the reader: 0 = cover, 1 = letter, 2 = contents, 3+ = articles
function pageLabel(page: number, total: number) {
  if (page === 0) return "Cover";
  if (page === 1) return "Letter";
  if (page === 2) return "Contents";
  return `Page ${page - 2} of ${total - 3}`;
}

function sectionName(a: Article) {
  return a.sectionLabel ?? a.section?.label ?? "";
}

function byline(a: Article) {
  return [a.authorName, a.dateline, readTime(a)].filter(Boolean).join(" · ");
}

function Cover({ issue, className }: { issue: ForecastIssue; className: string }) {
  if (!issue.coverUrl) return <div className={cn(className, "aspect-[3/4] bg-muted")} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={issue.coverUrl} alt={`${issue.title} cover`} loading="lazy" width={1024} height={1376} className={className} />
  );
}

export default function ForumForecastPage() {
  const q = useForecast();
  const issues = q.data ?? [];
  const [issueId, setIssueId] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0 cover, 1 letter, 2 contents, 3.. articles

  const edition = issues.find((i) => i.id === issueId) ?? issues[0];
  const contents = edition?.articles ?? [];
  const totalPages = contents.length + 3;
  const article = page >= 3 ? contents[page - 3] : null;

  function openEdition(e: ForecastIssue) {
    setIssueId(e.id);
    setPage(0);
  }

  function go(delta: number) {
    setPage((p) => Math.min(Math.max(p + delta, 0), totalPages - 1));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Media Hub</p>
          <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">Forum500 Forecast</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Our quarterly magazine, published electronically for members — read it cover to cover, or print a copy.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {edition?.pdfUrl ? (
            <Button variant="outline" className="gap-2" asChild>
              <a href={edition.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </Button>
          ) : (
            <Button variant="outline" className="gap-2" disabled title="No PDF available for this edition">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          )}
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print / save as PDF
          </Button>
        </div>
      </div>

      <QueryState isLoading={q.isLoading} error={q.error} empty={!edition} emptyText="No Forecast editions published yet.">
        {edition ? (
          <>
            {/* Edition selector / historic editions */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Editions</p>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {issues.map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => openEdition(e)}
                    className={cn("group w-32 shrink-0 text-left", edition.id === e.id ? "" : "opacity-70 hover:opacity-100")}
                  >
                    <Cover
                      issue={e}
                      className={cn(
                        "aspect-[3/4] w-full rounded-md border object-cover",
                        edition.id === e.id ? "border-accent ring-2 ring-accent" : "border-border",
                      )}
                    />
                    <p className="mt-2 text-xs font-bold uppercase tracking-wider">
                      {e.issue} · {e.dateLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{e.title}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Reader chrome */}
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <Button variant="ghost" size="sm" className="gap-1" disabled={page === 0} onClick={() => go(-1)}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <div className="text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {edition.issue} · {edition.dateLabel}
                  </p>
                  <p className="text-xs text-muted-foreground">{pageLabel(page, totalPages)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  disabled={page === totalPages - 1}
                  onClick={() => go(1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Cover */}
              {page === 0 && (
                <div className="mx-auto max-w-xl p-6">
                  <button type="button" onClick={() => go(1)} className="block w-full">
                    <Cover issue={edition} className="w-full rounded-md border border-border object-cover shadow-lg" />
                  </button>
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Click the cover or press Next to open the edition.
                  </p>
                </div>
              )}

              {/* Letter from the editors */}
              {page === 1 && (
                <div className="mx-auto max-w-2xl space-y-5 p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                    {edition.letterTitle ?? "From the editors"}
                  </p>
                  <h2 className="font-display text-3xl font-medium">{edition.title}</h2>
                  {(edition.letterBody ?? []).map((p, i) => (
                    <p key={i} className="leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                  {edition.letterSignoff ? (
                    <p className="font-display text-lg italic">{edition.letterSignoff}</p>
                  ) : null}
                </div>
              )}

              {/* Contents */}
              {page === 2 && (
                <div className="mx-auto max-w-2xl p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">In this edition</p>
                  <h2 className="mt-2 font-display text-3xl font-medium">Contents</h2>
                  {contents.length ? (
                    <div className="mt-6 divide-y divide-border border-y border-border">
                      {contents.map((a, i) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setPage(3 + i)}
                          className="group flex w-full items-baseline gap-4 py-4 text-left"
                        >
                          <span className="w-8 shrink-0 font-display text-lg text-muted-foreground">{i + 1}</span>
                          <span className="flex-1">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                              {sectionName(a)}
                            </span>
                            <span className="block font-display text-xl font-medium leading-snug group-hover:underline">
                              {a.title}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-wider text-muted-foreground">
                              {byline(a)}
                            </span>
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-muted-foreground">No articles in this edition yet.</p>
                  )}
                </div>
              )}

              {/* Article page */}
              {article && (
                <article className="mx-auto max-w-2xl p-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{sectionName(article)}</p>
                  <h2 className="mt-2 font-display text-3xl font-medium leading-tight">{article.title}</h2>
                  {article.standfirst ? (
                    <p className="mt-3 text-lg text-muted-foreground">{article.standfirst}</p>
                  ) : null}
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{byline(article)}</p>
                  {article.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.imageUrl}
                      alt={article.caption ?? article.title}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="mt-6 w-full rounded-md border border-border object-cover"
                    />
                  ) : null}
                  {article.caption ? <p className="mt-1 text-xs text-muted-foreground">{article.caption}</p> : null}
                  <div className="mt-6 space-y-4 leading-relaxed">
                    {(article.body ?? []).map((p, i) => (
                      <p key={i} className={i === 0 ? "text-lg" : "text-muted-foreground"}>
                        {p}
                      </p>
                    ))}
                  </div>
                </article>
              )}

              {/* Page dots */}
              <div className="flex justify-center gap-1.5 border-t border-border py-3">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to ${pageLabel(i, totalPages)}`}
                    onClick={() => setPage(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === page ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground",
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        ) : null}
      </QueryState>

      <div className="rounded-lg border border-border bg-secondary/50 p-6">
        <h3 className="font-display text-lg font-medium">Contribute to the Forecast</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Members can submit a trend, a market signal, or a contrarian view for the next edition. The editorial team
          reviews every pitch.
        </p>
        <Button className="mt-4" variant="outline" asChild>
          <Link href="/media/inforum#make-an-idea-happen">Pitch a forecast</Link>
        </Button>
      </div>
    </div>
  );
}
