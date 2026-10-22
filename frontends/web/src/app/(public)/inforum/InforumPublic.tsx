"use client";

import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicInforum, usePublicInforumTabs } from "@/features/media/queries";
import { usePublicPage } from "@/features/site/queries";
import { Byline } from "@/components/media/Byline";
import { fmtDate } from "@/lib/format";

export function InforumPublic() {
  const q = usePublicInforum();
  const edition = q.data;
  const all = edition?.articles ?? [];
  // Editor's choice first, then the rest of the public selection (API returns up to 4).
  const articles = [...all.filter((a) => a.editorsChoice), ...all.filter((a) => !a.editorsChoice)];
  const lead = articles[0];
  const rest = articles.slice(1, 4);
  const tabsQ = usePublicInforumTabs();
  const tabs = tabsQ.data ?? [];
  const pageQ = usePublicPage("inforum");
  const page = pageQ.data;
  const lockBlock = page?.blocks?.find((b) => b.key === "members-only");
  const fallbackImage = page?.heroImageUrl ?? undefined;

  return (
    <>
        {/* Masthead */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
            {page ? (
              <>
                {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
                <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">{page.title}</h1>
                {page.subtitle && <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{page.subtitle}</p>}
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-14 w-64" />
                <Skeleton className="h-4 w-[32rem] max-w-full" />
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Current edition banner */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Current edition</p>
              {q.isLoading ? (
                <p className="mt-1 text-sm text-muted-foreground">Loading…</p>
              ) : q.error || !edition ? (
                <p className="mt-1 text-sm text-muted-foreground">The current edition is not available right now.</p>
              ) : (
                <>
                  <p className="mt-1 font-display text-xl font-medium">{edition.label} edition</p>
                  <p className="text-sm text-muted-foreground">Published {fmtDate(edition.publishedOn, "d MMMM yyyy")}</p>
                </>
              )}
            </div>
          </div>

          {/* Subject tabs */}
          <div className="-mx-1 mt-6 overflow-x-auto border-y border-border">
            <div className="flex min-w-max items-center gap-1 px-1 py-2">
              {tabsQ.isLoading &&
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
              {tabs.map((t, i) => (
                <span
                  key={t.id}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
                    i === 0
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>

          {/* Visible preview */}
          {lead ? (
            <div className="mt-8">
              <article className="group grid gap-6 border-b border-border pb-8 lg:grid-cols-2">
                <img
                  src={lead.imageUrl ?? fallbackImage}
                  alt={lead.caption ?? lead.title}
                  width={1200}
                  height={800}
                  className="h-64 w-full rounded-md object-cover lg:h-full"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {lead.sectionLabel ?? lead.section?.label} · Lead story
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-medium leading-tight sm:text-4xl">
                    {lead.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{lead.standfirst}</p>
                  <Byline article={lead} />
                </div>
              </article>

              <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <article key={a.id} className="group">
                    <img
                      src={a.imageUrl ?? fallbackImage}
                      alt={a.caption ?? a.title}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="h-44 w-full rounded-md object-cover"
                    />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      {a.sectionLabel ?? a.section?.label}
                    </p>
                    <h3 className="mt-1 font-display text-xl font-medium leading-snug">{a.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{a.standfirst}</p>
                    <Byline article={a} />
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {/* Members-only grey-out */}
          <div className="relative mt-10 overflow-hidden rounded-lg border border-border">
            <div className="space-y-6 p-6 opacity-40 grayscale sm:p-10">
              <div className="h-6 w-40 rounded bg-muted" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-44 w-full rounded-md bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-6 w-full rounded bg-muted" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 p-6 text-center backdrop-blur-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card shadow-sm">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-medium">{lockBlock?.title}</h3>
              {lockBlock?.body && <p className="mt-2 max-w-md text-sm text-muted-foreground">{lockBlock.body}</p>}
              {lockBlock?.ctaLabel && (
                <Link
                  href={lockBlock.ctaHref ?? "/auth"}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {lockBlock.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
    </>
  );
}
