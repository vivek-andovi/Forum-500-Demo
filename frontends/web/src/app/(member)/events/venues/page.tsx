"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useVenues } from "@/features/events/queries";
import { useLookups } from "@/features/site/queries";

const categoryLabel = (c: string) => c.replace(/_/g, " ");

export default function VenuesPage() {
  const { data: venues = [], isLoading, error } = useVenues();
  const { data: lookups } = useLookups();
  const categories = ["All", ...(lookups?.venueCategories ?? [])];
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");
  const list = venues.filter(
    (v) =>
      (category === "All" || v.category === category) &&
      (v.name + v.city + (v.description ?? "")).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="events/venues"
        eyebrow="Events Hub"
        title="Venues"
        description="Restaurants, clubs, studios, salons and homes the Forum uses, or has preferred partnership access to."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search venues or cities"
          className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === c ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:border-accent"
              }`}
            >
              {categoryLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <QueryState isLoading={isLoading} error={error}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <article key={v.id} className="overflow-hidden rounded-lg border border-border bg-card">
              {v.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.imageUrl} alt={v.name} loading="lazy" width={1024} height={768} className="h-36 w-full object-cover" />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-muted">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{categoryLabel(v.category)}</p>
                <h2 className="mt-1 font-display text-lg font-medium">{v.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {v.city}
                </p>
                {v.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.description}</p>}
                {v.access && <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{v.access}</p>}
              </div>
            </article>
          ))}
          {list.length === 0 && <p className="text-sm text-muted-foreground">No venues match that search yet.</p>}
        </div>
      </QueryState>
    </div>
  );
}
