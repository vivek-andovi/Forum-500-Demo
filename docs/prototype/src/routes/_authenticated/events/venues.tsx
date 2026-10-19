import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import partnerRestaurants from "@/assets/partner-restaurants.jpg";
import partnerClubs from "@/assets/partner-clubs.jpg";
import partnerHotel from "@/assets/partner-hotel.jpg";
import mediaPodcast from "@/assets/media-podcast.jpg";
import heroSalon from "@/assets/hero-salon.jpg";
import benefitsLounge from "@/assets/benefits-lounge.jpg";
import eventSingapore from "@/assets/event-singapore.jpg";
import eventLondon from "@/assets/event-london.jpg";

interface Venue {
  id: string;
  name: string;
  city: string;
  category: "Restaurants" | "Clubs" | "Studios" | "Salons" | "Hotels" | "Private homes";
  access: string;
  description: string;
  image: string;
}

const venues: Venue[] = [
  {
    id: "mayfair-dining-room",
    name: "The Mayfair Dining Room",
    city: "London",
    category: "Restaurants",
    access: "Preferred partnership — private room held for Forum",
    description: "A panelled room for eighteen at a single table, used for the London evening salons.",
    image: partnerRestaurants,
  },
  {
    id: "st-james-club",
    name: "A private club, St James's",
    city: "London",
    category: "Clubs",
    access: "Reciprocal access for Members",
    description: "Drawing rooms and a library for receptions of up to sixty, with reciprocal access for travelling Members.",
    image: partnerClubs,
  },
  {
    id: "forum-radio-studio",
    name: "Forum Radio Studio",
    city: "London",
    category: "Studios",
    access: "Forum owned — book through the events team",
    description: "Two-seat recording booth for podcast interviews and Forum TV segments.",
    image: mediaPodcast,
  },
  {
    id: "chelsea-salon",
    name: "The Chelsea Salon",
    city: "London",
    category: "Salons",
    access: "Member's home — by invitation of the host",
    description: "An intimate drawing room for salons of twenty, with art from the host's collection.",
    image: heroSalon,
  },
  {
    id: "tribeca-loft",
    name: "Tribeca Loft",
    city: "New York",
    category: "Studios",
    access: "Preferred rate for Member events",
    description: "A daylight loft for launches, exhibitions and photography, seating up to eighty standing.",
    image: benefitsLounge,
  },
  {
    id: "marina-bay-terrace",
    name: "Marina Bay Rooftop Terrace",
    city: "Singapore",
    category: "Clubs",
    access: "Preferred partnership",
    description: "Open-air terrace over the bay, home of the Singapore chapter's autumn reception.",
    image: eventSingapore,
  },
  {
    id: "harbour-house",
    name: "Harbour House",
    city: "Nassau",
    category: "Hotels",
    access: "Preferred rates and private dining for Members",
    description: "Colonial harbour hotel used for the Forum weekend gathering, with terraces for dinners.",
    image: partnerHotel,
  },
  {
    id: "gamla-stan-house",
    name: "Gamla Stan House",
    city: "Stockholm",
    category: "Private homes",
    access: "Member's home — by arrangement",
    description: "An eighteenth-century house in the old town, used for roundtables of a dozen.",
    image: eventLondon,
  },
];

const categories = ["All", "Restaurants", "Clubs", "Studios", "Salons", "Hotels", "Private homes"] as const;

export const Route = createFileRoute("/_authenticated/events/venues")({
  head: () => ({
    meta: [
      { title: "Venues — Forum500" },
      { name: "description", content: "The restaurants, clubs, studios and salons Forum500 uses or has preferred access to." },
      { property: "og:title", content: "Venues — Forum500" },
      { property: "og:description", content: "The restaurants, clubs, studios and salons Forum500 uses or has preferred access to." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Venues,
});

function Venues() {
  const [category, setCategory] = useState<(typeof categories)[number]>("All");
  const [query, setQuery] = useState("");
  const list = venues.filter(
    (v) =>
      (category === "All" || v.category === category) &&
      (v.name + v.city + v.description).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
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
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((v) => (
          <article key={v.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <img src={v.image} alt={v.name} loading="lazy" width={1024} height={768} className="h-36 w-full object-cover" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{v.category}</p>
              <h2 className="mt-1 font-display text-lg font-medium">{v.name}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {v.city}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{v.description}</p>
              <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{v.access}</p>
            </div>
          </article>
        ))}
        {list.length === 0 && <p className="text-sm text-muted-foreground">No venues match that search yet.</p>}
      </div>
    </div>
  );
}
