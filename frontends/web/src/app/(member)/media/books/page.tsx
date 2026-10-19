"use client";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useBooks } from "@/lib/queries";

function Cover({ src, title }: { src: string | null | undefined; title: string }) {
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Book cover: ${title}`}
          loading="lazy"
          width={600}
          height={900}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <BookOpen className="h-10 w-10" />
        </div>
      )}
    </div>
  );
}

function DetailsLink({ href }: { href: string | null | undefined }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex w-fit items-center rounded-md bg-[#C9A86A] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#b8985a]"
    >
      View details
    </a>
  );
}

export default function BooksPage() {
  const { data, isLoading, error } = useBooks();
  const memberBooks = data?.memberBooks ?? [];
  const recommended = data?.recommended ?? [];

  return (
    <div className="space-y-10">
      <PageHeader
        pageKey="media/books"
        eyebrow="Media Hub"
        title="Member Books"
        description="Books written by Members, and the books they recommend."
      />

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-medium">Books written by Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recently published work from across the Forum.</p>
        </div>
        <QueryState isLoading={isLoading} error={error} empty={memberBooks.length === 0} emptyText="No member books yet.">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {memberBooks.map((b) => (
              <div
                key={b.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                <Cover src={b.coverUrl} title={b.title} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-medium leading-tight">{b.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">by {b.authorName}</p>
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{b.note ?? ""}</p>
                  <DetailsLink href={b.buyUrl} />
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-medium">Books recommended by Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The titles Members keep pressing into each other's hands.
          </p>
        </div>
        <QueryState
          isLoading={isLoading}
          error={error}
          empty={recommended.length === 0}
          emptyText="No recommendations yet."
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((r) => (
              <div
                key={r.id}
                className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
              >
                <Cover src={r.book?.coverUrl} title={r.title} />
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-medium leading-tight">{r.title}</h3>
                  {r.book?.authorName && <p className="mt-1 text-sm text-muted-foreground">by {r.book.authorName}</p>}
                  <p className="mt-3 flex-1 text-sm italic text-muted-foreground">{r.note ? `“${r.note}”` : ""}</p>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                    Recommended by {r.recommendedByName}
                    {r.chapter ? ` · ${r.chapter} chapter` : ""}
                  </p>
                  <DetailsLink href={r.book?.buyUrl} />
                </div>
              </div>
            ))}
          </div>
        </QueryState>
      </section>
    </div>
  );
}
