import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { X, Tag, Check, Images } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { useTaggedGallery } from "@/lib/my-gallery";
import heroSalon from "@/assets/hero-salon.jpg";
import eventSingapore from "@/assets/event-singapore.jpg";
import eventLondon from "@/assets/event-london.jpg";
import eventNassau from "@/assets/event-nassau.jpg";
import eventStockholm from "@/assets/event-stockholm.jpg";
import mediaPodcast from "@/assets/media-podcast.jpg";
import benefitsLounge from "@/assets/benefits-lounge.jpg";
import partnerRestaurants from "@/assets/partner-restaurants.jpg";
import partnerClubs from "@/assets/partner-clubs.jpg";
import candidLondonDinner from "@/assets/candid-london-dinner.jpg";
import candidLondonSpeaker from "@/assets/candid-london-speaker.jpg";
import candidSingaporeRooftop from "@/assets/candid-singapore-rooftop.jpg";
import candidNassauBoat from "@/assets/candid-nassau-boat.jpg";
import candidStockholmRoundtable from "@/assets/candid-stockholm-roundtable.jpg";
import candidParisDinner from "@/assets/candid-paris-dinner.jpg";

interface Photo {
  id: string;
  caption: string;
  src: string;
  kind: "Curated" | "Candid";
}

interface Album {
  id: string;
  event: string;
  city: string;
  date: string;
  cover: string;
  photos: Photo[];
}

const albums: Album[] = [
  {
    id: "london-salon",
    event: "London Evening Salon",
    city: "London",
    date: "February 2026",
    cover: heroSalon,
    photos: [
      { id: "ls-1", caption: "The single table at dinner", src: heroSalon, kind: "Curated" },
      { id: "ls-2", caption: "Drinks before the address", src: eventLondon, kind: "Curated" },
      { id: "ls-3", caption: "Mid-story at the table", src: candidLondonDinner, kind: "Candid" },
      { id: "ls-4", caption: "The address, off script", src: candidLondonSpeaker, kind: "Candid" },
    ],
  },
  {
    id: "singapore-rooftop",
    event: "Singapore Rooftop Reception",
    city: "Singapore",
    date: "October 2025",
    cover: eventSingapore,
    photos: [
      { id: "sg-1", caption: "Rooftop over the bay", src: eventSingapore, kind: "Curated" },
      { id: "sg-2", caption: "Sundowners with the chapter", src: candidSingaporeRooftop, kind: "Candid" },
    ],
  },
  {
    id: "nassau-weekend",
    event: "Nassau Weekend Gathering",
    city: "Nassau",
    date: "November 2025",
    cover: eventNassau,
    photos: [
      { id: "na-1", caption: "Weekend on the water", src: eventNassau, kind: "Curated" },
      { id: "na-2", caption: "Deck crew, golden hour", src: candidNassauBoat, kind: "Candid" },
    ],
  },
  {
    id: "stockholm-roundtable",
    event: "Stockholm Ideas Roundtable",
    city: "Stockholm",
    date: "September 2025",
    cover: eventStockholm,
    photos: [
      { id: "st-1", caption: "Roundtable in the old town", src: eventStockholm, kind: "Curated" },
      { id: "st-2", caption: "Coffee and a disagreement", src: candidStockholmRoundtable, kind: "Candid" },
    ],
  },
  {
    id: "paris-dinner",
    event: "Members' Dinner",
    city: "Paris",
    date: "May 2025",
    cover: partnerRestaurants,
    photos: [
      { id: "pa-1", caption: "Chef's table", src: partnerRestaurants, kind: "Curated" },
      { id: "pa-2", caption: "A toast at the counter", src: candidParisDinner, kind: "Candid" },
    ],
  },
  {
    id: "london-reception",
    event: "Chapter Reception",
    city: "London",
    date: "March 2025",
    cover: partnerClubs,
    photos: [
      { id: "lr-1", caption: "The drawing room", src: partnerClubs, kind: "Curated" },
      { id: "lr-2", caption: "Recording Forum Radio", src: mediaPodcast, kind: "Candid" },
      { id: "lr-3", caption: "Members' lounge", src: benefitsLounge, kind: "Candid" },
    ],
  },
];

export const Route = createFileRoute("/_authenticated/events/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Forum500" },
      { name: "description", content: "Photographs from Forum500 gatherings around the chapters." },
      { property: "og:title", content: "Gallery — Forum500" },
      { property: "og:description", content: "Photographs from Forum500 gatherings around the chapters." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  const [album, setAlbum] = useState<Album | null>(null);
  const [open, setOpen] = useState<Photo | null>(null);
  const { isTagged, toggle } = useTaggedGallery();

  const tagPhoto = (a: Album, p: Photo) => {
    const added = toggle({ id: p.id, caption: p.caption, event: a.event, date: a.date, src: p.src });
    if (added) {
      toast.success("Tagged — added to My Gallery on your profile", {
        action: { label: "View", onClick: () => { window.location.href = "/membership/profile"; } },
      });
    } else {
      toast("Removed from My Gallery");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Events Hub"
        title="Gallery"
        description="Photographs from gatherings around the Forum — the curated shots and the candid ones. Member photography is shared within the membership only."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {albums.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAlbum(a)}
            className="group overflow-hidden rounded-lg border border-border bg-card text-left"
          >
            <div className="relative">
              <img
                src={a.cover}
                alt={a.event}
                loading="lazy"
                width={1024}
                height={768}
                className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                <Images className="h-3.5 w-3.5" /> {a.photos.length} photos
              </span>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium leading-snug">{a.event}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {a.city} · {a.date}
              </p>
            </div>
          </button>
        ))}
      </div>

      {album && !open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setAlbum(null)}
        >
          <div
            className="max-h-full w-full max-w-4xl overflow-y-auto rounded-lg bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-display text-xl font-medium">{album.event}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {album.city} · {album.date} · {album.photos.length} photos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAlbum(null)}
                aria-label="Close album"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              {album.photos.map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-lg border border-border bg-background">
                  <button type="button" onClick={() => setOpen(p)} className="block w-full">
                    <img src={p.src} alt={p.caption} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  </button>
                  <figcaption className="flex items-start justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-medium leading-snug">{p.caption}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{p.kind}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={isTagged(p.id) ? "Remove from My Gallery" : "Tag to My Gallery"}
                      title={isTagged(p.id) ? "In My Gallery" : "Tag to My Gallery"}
                      onClick={() => tagPhoto(album, p)}
                      className={`shrink-0 rounded-full border p-2 transition ${
                        isTagged(p.id)
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border text-muted-foreground hover:border-accent/60 hover:text-accent"
                      }`}
                    >
                      {isTagged(p.id) ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                    </button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}

      {album && open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-lg bg-card" onClick={(e) => e.stopPropagation()}>
            <img src={open.src} alt={open.caption} className="max-h-[70vh] w-full object-cover" />
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-display text-lg font-medium">{open.caption}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {album.event} · {album.city} · {album.date} · {open.kind}
                </p>
                <button
                  type="button"
                  onClick={() => tagPhoto(album, open)}
                  className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isTagged(open.id)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border hover:border-accent/60 hover:text-accent"
                  }`}
                >
                  {isTagged(open.id) ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                  {isTagged(open.id) ? "In My Gallery" : "Tag to My Gallery"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setOpen(null)}
                aria-label="Back to album"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
