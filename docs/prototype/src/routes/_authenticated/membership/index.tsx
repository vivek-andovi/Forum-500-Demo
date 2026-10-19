import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { cities, members, newMemberQandAs, sectors } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/membership/")({
  head: () => ({
    meta: [
      { title: "Member Directory — Forum500" },
      { name: "description", content: "Search Forum500 Members and meet the newest intake." },
      { property: "og:title", content: "Member Directory — Forum500" },
      { property: "og:description", content: "Search Forum500 Members and meet the newest intake." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [newMembersOpen, setNewMembersOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("[data-new-member-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 360;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const results = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter(
      (m) =>
        (!q ||
          m.name.toLowerCase().includes(q) ||
          m.headline.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.interests.some((i) => i.toLowerCase().includes(q))) &&
        (!sector || m.sector === sector) &&
        (!city || m.city === city),
    );
  }, [query, sector, city]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Membership Hub"
        title="Member Directory"
        description="Search fellow members by profession, city or interest — and be found by them."
      />

      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setNewMembersOpen((o) => !o)}
          aria-expanded={newMembersOpen}
          className="flex w-full items-center justify-between gap-4 text-left"
        >
          <div>
            <h2 className="font-display text-2xl font-medium">New Members</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Every new Member answers the same five questions. Here is the latest intake.
            </p>
          </div>
          {newMembersOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
          )}
        </button>

        {newMembersOpen ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous new member"
              className="absolute -left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto rounded-lg border border-border bg-card px-6 py-6 scrollbar-hide"
              style={{ scrollSnapType: "x mandatory" }}
            >
              {newMemberQandAs.map((member) => (
                <article
                  key={member.id}
                  data-new-member-card
                  className="w-[min(340px,85vw)] shrink-0 scroll-snap-align-start rounded-lg border border-border bg-background p-5"
                >
                  <header className="flex items-center gap-4">
                    <img
                      src={member.photo}
                      alt={`Portrait of ${member.name}`}
                      loading="lazy"
                      width={768}
                      height={960}
                      className="h-14 w-14 rounded-full border border-border object-cover"
                    />
                    <div>
                      <h3 className="font-display text-xl font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.city} chapter</p>
                    </div>
                  </header>
                  <div className="mt-5 space-y-4">
                    {member.interview.map((qa) => (
                      <div key={qa.question}>
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">{qa.question}</p>
                        <blockquote className="mt-1 font-display text-base italic leading-relaxed">
                          “{qa.answer}”
                        </blockquote>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next new member"
              className="absolute -right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-sm transition-colors hover:border-accent hover:text-accent"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card px-4 py-3">
            {newMemberQandAs.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => setNewMembersOpen(true)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm transition-colors hover:border-accent"
              >
                <img
                  src={member.photo}
                  alt={`Portrait of ${member.name}`}
                  loading="lazy"
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span>{member.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, company or interest…"
            className="w-full rounded-md border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2.5 text-sm"
        >
          <option value="">All sectors</option>
          {sectors.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2.5 text-sm"
        >
          <option value="">All cities</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-sm text-muted-foreground">{results.length} members</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((m) => (
          <Link
            key={m.id}
            to="/membership/$memberId"
            params={{ memberId: m.id }}
            className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
          >
            <img
              src={m.photo}
              alt={`Portrait of ${m.name}`}
              loading="lazy"
              className="h-12 w-12 rounded-full border border-border object-cover"
            />
            <h3 className="mt-3 font-display text-lg font-medium">{m.name}</h3>
            <p className="text-sm text-muted-foreground">{m.headline}, {m.company}</p>
            <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">{m.city} · {m.sector}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
