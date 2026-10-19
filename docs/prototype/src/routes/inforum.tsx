import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  articlesForTab,
  currentEdition,
  inforumTabs,
  type InforumArticle,
} from "@/lib/inforum-data";

function Byline({ article }: { article: InforumArticle }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
      {article.authorPhoto ? (
        <img
          src={article.authorPhoto}
          alt={article.author}
          loading="lazy"
          width={40}
          height={40}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : null}
      <span>
        {article.author} · {article.dateline} · {article.date} · {article.readTime}
      </span>
    </div>
  );
}

export const Route = createFileRoute("/inforum")({
  head: () => ({
    meta: [
      { title: "In:Forum — The Forum500 Journal" },
      {
        name: "description",
        content:
          "In:Forum is the editorial journal of Forum500 — news, ideas and interviews written by and for members.",
      },
      { property: "og:title", content: "In:Forum — The Forum500 Journal" },
      { property: "og:description", content: "News, ideas and interviews written by and for Forum500 members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InForum,
});

function InForum() {
  const edition = currentEdition;
  const articles = articlesForTab("editors-choice");
  const lead = articles[0];
  const rest = articles.slice(1, 4);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Masthead */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
            <p className="eyebrow">The Forum500 journal</p>
            <h1 className="mt-3 font-display text-5xl font-semibold tracking-tight sm:text-6xl">In:Forum</h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              The full member edition — reporting, essays and dispatches from the Forum500 community.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {/* Current edition banner */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Current edition</p>
              <p className="mt-1 font-display text-xl font-medium">{edition.label} edition</p>
              <p className="text-sm text-muted-foreground">Published {edition.publishedOn}</p>
            </div>
          </div>

          {/* Subject tabs */}
          <div className="-mx-1 mt-6 overflow-x-auto border-y border-border">
            <div className="flex min-w-max items-center gap-1 px-1 py-2">
              {inforumTabs.map((t) => (
                <span
                  key={t.id}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${
                    t.id === "editors-choice"
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
                  src={lead.image}
                  alt={lead.caption}
                  width={1200}
                  height={800}
                  className="h-64 w-full rounded-md object-cover lg:h-full"
                />
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {lead.sectionLabel} · Lead story
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
                      src={a.image}
                      alt={a.caption}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="h-44 w-full rounded-md object-cover"
                    />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                      {a.sectionLabel}
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
              <h3 className="mt-5 font-display text-2xl font-medium">The full edition is for members</h3>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Members read every section, previous editions, comments, recommendations and the full weekly digest.
              </p>
              <Link
                to="/auth"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Sign in to read <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
