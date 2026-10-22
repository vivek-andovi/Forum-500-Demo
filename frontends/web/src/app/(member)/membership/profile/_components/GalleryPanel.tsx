"use client";

import Link from "next/link";
import { Copy, Download, ImagePlus, X } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import { QueryState } from "@/components/QueryState";
import type { GalleryPhoto } from "@/features/events/types";
import { copyPhoto, downloadPhoto } from "@/lib/photo";

/** "My gallery": photos the member is tagged in, with copy / download / remove. */
export function GalleryPanel({
  photos,
  isLoading,
  error,
  removing,
  onRemove,
}: {
  photos: GalleryPhoto[];
  isLoading: boolean;
  error: unknown;
  removing: boolean;
  onRemove: (photo: GalleryPhoto) => void;
}) {
  return (
    <CollapsiblePanel title="My gallery">
      <p className="text-sm text-muted-foreground">
        Photos of you from Forum gatherings — copy or download any of them to share on LinkedIn or elsewhere.
        Tag photos in the{" "}
        <Link href="/events/gallery" className="font-medium text-primary underline underline-offset-4">
          events Gallery
        </Link>{" "}
        to add them here.
      </p>
      <QueryState
        isLoading={isLoading}
        error={error}
        empty={photos.length === 0}
        emptyText="No photos tagged yet."
        className="mt-5"
      >
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {photos.map((photo) => (
            <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption ?? photo.album?.title ?? "Forum gathering"}
                loading="lazy"
                className="h-44 w-full object-cover"
              />
              <figcaption className="p-4">
                <p className="text-sm font-medium leading-snug">
                  {photo.caption || photo.album?.title || "Forum gathering"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {[photo.album?.title, photo.album?.dateLabel].filter(Boolean).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyPhoto(photo)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPhoto(photo)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button
                    type="button"
                    disabled={removing}
                    onClick={() => onRemove(photo)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
                  >
                    <X className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </QueryState>
      <Link
        href="/events/gallery"
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        <ImagePlus className="h-4 w-4" /> Find more photos
      </Link>
    </CollapsiblePanel>
  );
}
