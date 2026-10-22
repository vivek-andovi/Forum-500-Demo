import { QueryState } from "@/components/QueryState";
import { ArticleImage } from "@/components/media/ArticleImage";
import { Byline } from "@/components/media/Byline";
import { sectionName } from "@/components/media/sectionName";
import type { Article } from "@/features/media/types";

/** The articles for the active tab of an edition: a lead story, then a grid of the rest. */
export function EditionView({
  articles,
  isLoading,
  error,
  onOpen,
}: {
  articles: Article[];
  isLoading: boolean;
  error: unknown;
  onOpen: (article: Article) => void;
}) {
  const lead = articles[0];
  const rest = articles.slice(1);
  return (
    <QueryState isLoading={isLoading} error={error}>
      {!lead ? (
        <p className="text-sm text-muted-foreground">
          No stories in this section yet — new commissions land each week.
        </p>
      ) : (
        <>
          <article
            className="group grid cursor-pointer gap-6 border-b border-border pb-8 lg:grid-cols-2"
            onClick={() => onOpen(lead)}
          >
            <ArticleImage article={lead} className="h-64 w-full rounded-md object-cover lg:h-full" />
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {[sectionName(lead), "Lead story"].filter(Boolean).join(" · ")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium leading-tight group-hover:underline sm:text-4xl">
                {lead.title}
              </h2>
              {lead.standfirst ? <p className="mt-3 text-muted-foreground">{lead.standfirst}</p> : null}
              <Byline article={lead} className="mt-4" />
            </div>
          </article>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <article key={a.id} className="group cursor-pointer" onClick={() => onOpen(a)}>
                <ArticleImage article={a} className="h-44 w-full rounded-md object-cover" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{sectionName(a)}</p>
                <h3 className="mt-1 font-display text-xl font-medium leading-snug group-hover:underline">
                  {a.title}
                </h3>
                {a.standfirst ? <p className="mt-2 text-sm text-muted-foreground">{a.standfirst}</p> : null}
                <Byline article={a} className="mt-3" />
              </article>
            ))}
          </div>
        </>
      )}
    </QueryState>
  );
}
