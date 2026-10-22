import { QueryState } from "@/components/QueryState";
import type { InforumEdition } from "@/features/media/types";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Grid of every published edition; the one being read is outlined. */
export function PreviousEditions({
  editionList,
  activeSlug,
  isLoading,
  error,
  onSelect,
}: {
  editionList: InforumEdition[];
  activeSlug: string | undefined;
  isLoading: boolean;
  error: unknown;
  onSelect: (edition: InforumEdition) => void;
}) {
  return (
    <section className="border-t border-border pt-8">
      <h3 className="font-display text-2xl font-medium">Previous editions</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Every In:Forum edition stays open to members. Click an edition to read it in full.
      </p>
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={!editionList.length}
        emptyText="No editions published yet."
        className="mt-5"
      >
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {editionList.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                onSelect(e);
              }}
              className={cn(
                "group overflow-hidden rounded-lg border text-left transition-colors",
                e.slug === activeSlug ? "border-accent" : "border-border hover:border-accent",
              )}
            >
              {e.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.coverUrl}
                  alt={`${e.label} edition cover`}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="h-32 w-full bg-muted" aria-hidden />
              )}
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.label}</p>
                {e.coverLine ? (
                  <p className="mt-1 font-display text-base leading-snug group-hover:underline">{e.coverLine}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  Published {fmtDate(e.publishedOn, "d MMMM yyyy")}
                  {e.articles ? ` · ${e.articles.length} stories` : ""}
                </p>
              </div>
            </button>
          ))}
        </div>
      </QueryState>
    </section>
  );
}
