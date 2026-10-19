import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Newspaper } from "lucide-react";
import { inforumArticles } from "@/lib/inforum-data";
import inforumHero from "@/assets/inforum-hero.jpg";

export function InforumBanner() {
  const [expanded, setExpanded] = useState(false);
  return (
    <section className="relative overflow-hidden rounded-xl">
      <img
        src={inforumHero}
        alt="The In:Forum journal on a reading table"
        className="absolute inset-0 h-full w-full object-cover"
        width={1024}
        height={1024}
      />
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-accent" />
            <span className="eyebrow">The Forum's journal</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-medium text-white">In:Forum</h2>
          <p className="mt-2 max-w-md text-sm text-white/85">
            The weekly editorial digest written by and for members — news, ideas worth making happen, and the people behind them.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide In:Forum headlines" : "Show In:Forum headlines"}
            className="inline-flex items-center gap-1.5 rounded-md border border-white/40 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
          >
            Headlines
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <Link
            to="/media/inforum"
            className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
          >
            Read In:Forum <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      {expanded && (
        <div className="relative divide-y divide-white/15 border-t border-white/20">
          {inforumArticles.slice(0, 4).map((a) => (
            <Link
              key={a.id}
              to="/media/inforum"
              className="block px-6 py-3.5 transition-colors hover:bg-white/5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{a.sectionLabel}</p>
              <p className="mt-0.5 font-display text-base font-medium leading-snug text-white">{a.title}</p>
              <p className="mt-0.5 text-xs text-white/70">{a.author} · {a.date} · {a.readTime}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
