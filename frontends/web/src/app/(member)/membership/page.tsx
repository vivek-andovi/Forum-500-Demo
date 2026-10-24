"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { useMembers, useNewMembers } from "@/features/membership/queries";
import { useLookups } from "@/features/site/queries";

const PAGE_SIZE = 24;

function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function MembershipDirectoryPage() {
  const [query, setQuery] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [chapterId, setChapterId] = useState("");
  const [interest, setInterest] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [newMembersOpen, setNewMembersOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const search = useDebounced(query.trim());

  const lookups = useLookups();
  const newMembers = useNewMembers();
  const membersQ = useMembers({
    search: search || undefined,
    sectorId: sectorId || undefined,
    chapterId: chapterId || undefined,
  });

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector("[data-new-member-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 360;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const loaded = useMemo(() => membersQ.data ?? [], [membersQ.data]);
  // Interest is filtered here (the list already holds every match) so its options come from the loaded members.
  const interestOptions = useMemo(() => {
    const set = new Set<string>();
    for (const m of loaded) for (const i of m.interests) if (i.trim()) set.add(i.trim());
    if (interest) set.add(interest);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [loaded, interest]);
  const results = useMemo(
    () => (interest ? loaded.filter((m) => m.interests.some((i) => i.trim() === interest)) : loaded),
    [loaded, interest],
  );
  const shown = results.slice(0, visible);

  // Start from the first page whenever the filters change.
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, sectorId, chapterId, interest]);

  const intake = newMembers.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="membership"
        eyebrow="Membership Hub"
        title="Member Directory"
        description="Search fellow members by profession, city or interest — and be found by them."
      />

      {(newMembers.isLoading || intake.length > 0) && (
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

          <QueryState isLoading={newMembers.isLoading} className="py-4">
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
                  {intake.map((member) => (
                    <article
                      key={member.id}
                      data-new-member-card
                      className="w-[min(340px,85vw)] shrink-0 scroll-snap-align-start rounded-lg border border-border bg-background p-5"
                    >
                      <Link href={`/membership/${member.slug}`} className="flex items-center gap-4">
                        <MemberAvatar
                          src={member.avatarUrl}
                          name={member.fullName}
                          className="h-14 w-14 rounded-full border border-border"
                        />
                        <div>
                          <h3 className="font-display text-xl font-medium">{member.fullName}</h3>
                          {member.chapter?.name && (
                            <p className="text-sm text-muted-foreground">{member.chapter.name} chapter</p>
                          )}
                        </div>
                      </Link>
                      <div className="mt-5 space-y-4">
                        {[...(member.interviews ?? [])]
                          .sort((a, b) => a.sortOrder - b.sortOrder)
                          .map((qa) => (
                            <div key={qa.id}>
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
                {intake.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setNewMembersOpen(true)}
                    className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-3 text-sm transition-colors hover:border-accent"
                  >
                    <MemberAvatar src={member.avatarUrl} name={member.fullName} className="h-7 w-7 rounded-full text-[10px]" />
                    <span>{member.fullName}</span>
                  </button>
                ))}
              </div>
            )}
          </QueryState>
        </section>
      )}

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
          value={sectorId}
          onChange={(e) => setSectorId(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2.5 text-sm"
        >
          <option value="">All sectors</option>
          {(lookups.data?.sectors ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={chapterId}
          onChange={(e) => setChapterId(e.target.value)}
          className="rounded-md border border-input bg-card px-3 py-2.5 text-sm"
        >
          <option value="">All cities</option>
          {(lookups.data?.chapters ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          aria-label="Filter by interest"
          className="rounded-md border border-input bg-card px-3 py-2.5 text-sm sm:max-w-[14rem]"
        >
          <option value="">All interests</option>
          {interestOptions.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>

      <QueryState
        isLoading={membersQ.isLoading}
        error={membersQ.error}
        empty={results.length === 0}
        emptyText="No members match your search."
      >
        <p className="text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "member" : "members"}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((m) => (
            <Link
              key={m.id}
              href={`/membership/${m.slug}`}
              className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
            >
              <MemberAvatar src={m.avatarUrl} name={m.fullName} className="h-12 w-12 rounded-full border border-border" />
              <h3 className="mt-3 font-display text-lg font-medium">{m.fullName}</h3>
              <p className="text-sm text-muted-foreground">
                {[m.headline, m.company].filter(Boolean).join(", ") || m.positionLine}
              </p>
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {[m.chapter?.name, m.sector?.name].filter(Boolean).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
        {results.length > shown.length && (
          <div className="mt-8 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="rounded-md border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              Show more
            </button>
            <p className="text-xs text-muted-foreground">
              Showing {shown.length} of {results.length}
            </p>
          </div>
        )}
      </QueryState>
    </div>
  );
}
