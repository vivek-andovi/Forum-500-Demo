"use client";

import Link from "next/link";
import { ArrowRight, Newspaper } from "lucide-react";
import { DynamicIcon } from "@/components/DynamicIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPage } from "@/lib/queries";
import type { ContentCard } from "@/lib/types";

export function HomeContent() {
  const q = usePublicPage("home");
  const page = q.data;
  const engage = page?.blocks?.find((b) => b.key === "engage");
  const inforum = page?.blocks?.find((b) => b.key === "inforum");
  const cards = [...(page?.cards ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);

  if (q.error && !page) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="text-muted-foreground">This page could not be loaded right now. Please try again shortly.</p>
      </section>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0">
          {page?.heroImageUrl ? (
            <img
              src={page.heroImageUrl}
              alt={page.heroImageAlt ?? ""}
              className="h-full w-full object-cover"
              width={1920}
              height={960}
            />
          ) : (
            <div className="h-full w-full bg-[#0a1f14]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f14]/95 via-[#0a1f14]/70 to-transparent" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-16 pt-40 sm:px-6 sm:pt-56">
          {page ? (
            <>
              <h1 className="max-w-2xl font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl">
                {page.title}
              </h1>
              {page.subtitle && <p className="mt-5 max-w-xl text-lg text-white/90">{page.subtitle}</p>}
              {page.eyebrow && <p className="eyebrow !text-accent mt-6">{page.eyebrow}</p>}
              {page.ctaLabel && page.ctaHref && (
                <Link
                  href={page.ctaHref}
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  {page.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-14 w-96 max-w-full bg-white/20" />
              <Skeleton className="h-5 w-[32rem] max-w-full bg-white/15" />
              <Skeleton className="h-5 w-80 max-w-full bg-white/15" />
            </div>
          )}
        </div>
      </section>

      {/* Engage with Forum */}
      {(q.isLoading || engage || cards.length > 0) && (
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            {q.isLoading ? (
              <>
                <Skeleton className="mx-auto mt-3 h-10 w-72" />
                <Skeleton className="mx-auto mt-4 h-4 w-96 max-w-full" />
              </>
            ) : (
              <>
                {engage?.eyebrow && <p className="eyebrow">{engage.eyebrow}</p>}
                {engage?.title && <h2 className="mt-3 font-display text-4xl font-medium">{engage.title}</h2>}
                {engage?.body && <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{engage.body}</p>}
              </>
            )}
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {q.isLoading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-lg" />)
              : cards.map((card) => <EngageCard key={card.id} card={card} />)}
          </div>
        </section>
      )}

      {/* In:Forum teaser */}
      {inforum && (
        <section className="relative">
          <div className="absolute inset-0">
            {inforum.imageUrl ? (
              <img
                src={inforum.imageUrl}
                alt={inforum.imageAlt ?? ""}
                className="h-full w-full object-cover"
                loading="lazy"
                width={1024}
                height={1024}
              />
            ) : (
              <div className="h-full w-full bg-primary" />
            )}
            <div className="absolute inset-0 bg-black/65" />
          </div>
          <div className="relative mx-auto flex max-w-6xl items-center gap-10 px-4 py-20 sm:px-6">
            <div className="max-w-xl">
              {inforum.eyebrow && (
                <div className="flex items-center gap-3">
                  <Newspaper className="h-5 w-5 text-accent" />
                  <p className="eyebrow">{inforum.eyebrow}</p>
                </div>
              )}
              {inforum.title && <h2 className="mt-3 font-display text-4xl font-medium text-white">{inforum.title}</h2>}
              {inforum.body && <p className="mt-4 text-white/85">{inforum.body}</p>}
              {inforum.ctaLabel && inforum.ctaHref && (
                <Link
                  href={inforum.ctaHref}
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                >
                  {inforum.ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function EngageCard({ card }: { card: ContentCard }) {
  const inner = (
    <>
      {card.imageUrl ? (
        <img src={card.imageUrl} alt="" loading="lazy" className="h-12 w-12 rounded-full object-cover" />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-accent">
          <DynamicIcon name={card.icon} className="h-6 w-6" />
        </div>
      )}
      <h3 className="mt-5 font-display text-xl font-medium">{card.title}</h3>
      {card.description && <p className="mt-2 flex-1 text-sm text-muted-foreground">{card.description}</p>}
      {card.href && (
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
          Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      )}
    </>
  );
  const base = "group flex flex-col rounded-lg border border-border bg-card p-6";
  if (!card.href) {
    return (
      <div data-testid="engage-card" className={base}>
        {inner}
      </div>
    );
  }
  return (
    <Link
      data-testid="engage-card"
      href={card.href}
      className={`${base} transition hover:-translate-y-1 hover:shadow-lg`}
    >
      {inner}
    </Link>
  );
}
