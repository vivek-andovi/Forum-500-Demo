"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPage, usePublicSite } from "@/features/site/queries";
import { paragraphs } from "@/lib/format";

export function AboutContent() {
  const site = usePublicSite();
  const q = usePublicPage("about");
  const page = q.data;
  const chapters = site.data?.chapters ?? [];
  const benefits = [...(site.data?.benefits ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const block = (key: string) => page?.blocks?.find((b) => b.key === key);
  const chaptersBlock = block("chapters");
  const benefitsBlock = block("benefits");
  const ctaBlock = block("cta");
  const story = paragraphs(page?.body);
  const ctaLabel = ctaBlock?.ctaLabel ?? page?.ctaLabel;
  const ctaHref = ctaBlock?.ctaHref ?? page?.ctaHref;

  if (q.error && !page) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <p className="text-muted-foreground">This page could not be loaded right now. Please try again shortly.</p>
      </section>
    );
  }

  return (
    <>
      <section className="relative">
        <div className="absolute inset-0">
          {page?.heroImageUrl ? (
            <img
              src={page.heroImageUrl}
              alt={page.heroImageAlt ?? ""}
              className="h-full w-full object-cover"
              width={1024}
              height={1024}
            />
          ) : (
            <div className="h-full w-full bg-primary" />
          )}
          <div className="absolute inset-0 bg-black/55" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-14 pt-36 sm:px-6 sm:pt-48">
          {page ? (
            <>
              {page.eyebrow && <p className="eyebrow !text-accent">{page.eyebrow}</p>}
              <h1 className="mt-3 max-w-2xl font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
                {page.title}
              </h1>
              {page.subtitle && <p className="mt-4 max-w-xl text-lg text-white/90">{page.subtitle}</p>}
            </>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-12 w-[28rem] max-w-full bg-white/20" />
            </div>
          )}
        </div>
      </section>

      {(q.isLoading || story.length > 0) && (
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
            {q.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
              : story.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>
      )}

      <section className="border-y border-border bg-secondary/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="space-y-12">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
                {chaptersBlock?.imageUrl ? (
                  <img
                    src={chaptersBlock.imageUrl}
                    alt={chaptersBlock.imageAlt ?? ""}
                    className="h-full w-full object-cover"
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                ) : (
                  <Skeleton className="aspect-[3/2] h-full w-full rounded-none" />
                )}
              </div>
              <div>
                {chaptersBlock?.title ? (
                  <h3 className="font-display text-2xl font-medium">{chaptersBlock.title}</h3>
                ) : (
                  <Skeleton className="h-8 w-56" />
                )}
                {chaptersBlock?.body && <p className="mt-3 text-sm text-muted-foreground">{chaptersBlock.body}</p>}
                <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                  {site.isLoading &&
                    Array.from({ length: 12 }).map((_, i) => (
                      <li key={i}>
                        <Skeleton className="h-4 w-20" />
                      </li>
                    ))}
                  {chapters.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div className="lg:order-2 overflow-hidden rounded-lg border border-border bg-card">
                {benefitsBlock?.imageUrl ? (
                  <img
                    src={benefitsBlock.imageUrl}
                    alt={benefitsBlock.imageAlt ?? ""}
                    className="aspect-[3/2] w-full object-cover"
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                ) : (
                  <Skeleton className="aspect-[3/2] w-full rounded-none" />
                )}
              </div>
              <div className="lg:order-1">
                {benefitsBlock?.title ? (
                  <h3 className="font-display text-2xl font-medium">{benefitsBlock.title}</h3>
                ) : (
                  <Skeleton className="h-8 w-48" />
                )}
                {benefitsBlock?.body && <p className="mt-3 text-sm text-muted-foreground">{benefitsBlock.body}</p>}
                <ul className="mt-5 space-y-4">
                  {site.isLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                      <li key={i} className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-full" />
                      </li>
                    ))}
                  {benefits.map((b) => (
                    <li key={b.id} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p className="text-sm font-semibold">{b.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {(ctaBlock || (page?.ctaLabel && page?.ctaHref)) && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-border bg-primary/5 p-8 text-center sm:p-12">
            {ctaBlock?.title && <h3 className="font-display text-2xl font-medium">{ctaBlock.title}</h3>}
            {ctaBlock?.body && <p className="mx-auto max-w-xl text-muted-foreground">{ctaBlock.body}</p>}
            {ctaLabel && ctaHref && (
              <Link
                href={ctaHref}
                className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}
