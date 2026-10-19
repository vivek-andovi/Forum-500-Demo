import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { memberBooks, recommendedBooks } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/media/books")({
  head: () => ({
    meta: [
      { title: "Member Books — Forum500" },
      { name: "description", content: "Books written by Forum500 Members and books they recommend." },
      { property: "og:title", content: "Member Books — Forum500" },
      { property: "og:description", content: "Books written by Forum500 Members and books they recommend." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Books,
});

function Books() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Media Hub"
        title="Member Books"
        description="Books written by Members, and the books they recommend."
      />

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-medium">Books written by Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">Recently published work from across the Forum.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {memberBooks.map((b) => (
            <div
              key={b.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                <img
                  src={b.cover}
                  alt={`Book cover: ${b.title}`}
                  loading="lazy"
                  width={600}
                  height={900}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-medium leading-tight">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {b.author}</p>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{b.note}</p>
                <button
                  type="button"
                  className="mt-4 inline-flex w-fit items-center rounded-md bg-[#C9A86A] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#b8985a]"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-medium">Books recommended by Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The titles Members keep pressing into each other's hands.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recommendedBooks.map((b) => (
            <div
              key={b.id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
                <img
                  src={b.cover}
                  alt={`Book cover: ${b.title}`}
                  loading="lazy"
                  width={600}
                  height={900}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="font-display text-lg font-medium leading-tight">{b.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">by {b.author}</p>
                <p className="mt-3 flex-1 text-sm italic text-muted-foreground">“{b.note}”</p>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-accent">
                  Recommended by {b.recommendedBy} · {b.chapter} chapter
                </p>
                <button
                  type="button"
                  className="mt-4 inline-flex w-fit items-center rounded-md bg-[#C9A86A] px-4 py-2 text-sm font-medium text-[#0F172A] transition-colors hover:bg-[#b8985a]"
                >
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
