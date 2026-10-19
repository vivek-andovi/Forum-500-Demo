"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Tag, Check, Images } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useGalleryAlbums, useTagPhoto } from "@/lib/queries";
import { useCurrentMember } from "@/hooks/useAuth";
import type { GalleryAlbum, GalleryPhoto } from "@/lib/types";

export default function GalleryPage() {
  const router = useRouter();
  const { member } = useCurrentMember();
  const { data, isLoading, error } = useGalleryAlbums();
  const tag = useTagPhoto();
  const albums = data?.albums ?? [];
  const tagged = new Set(data?.taggedPhotoIds ?? []);
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const album: GalleryAlbum | null = albums.find((a) => a.id === albumId) ?? null;
  const photos = album?.photos ?? [];
  const open: GalleryPhoto | null = photos.find((p) => p.id === openId) ?? null;
  const isTagged = (id: string) => tagged.has(id);

  const tagPhoto = (p: GalleryPhoto) => {
    if (!member) {
      toast("Admin account — no member profile to tag photos to.");
      return;
    }
    const add = !isTagged(p.id);
    tag.mutate(
      { id: p.id, tag: add },
      {
        onSuccess: () => {
          if (add) {
            toast.success("Tagged — added to My Gallery on your profile", {
              action: { label: "View", onClick: () => router.push("/membership/profile") },
            });
          } else {
            toast("Removed from My Gallery");
          }
        },
      },
    );
  };

  const close = () => {
    setAlbumId(null);
    setOpenId(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="events/gallery"
        eyebrow="Events Hub"
        title="Gallery"
        description="Photographs from gatherings around the Forum — the curated shots and the candid ones. Member photography is shared within the membership only."
      />

      <QueryState isLoading={isLoading} error={error} empty={albums.length === 0} emptyText="No albums have been shared yet.">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((a) => {
            const cover = a.coverUrl ?? a.photos?.[0]?.url ?? null;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAlbumId(a.id)}
                className="group overflow-hidden rounded-lg border border-border bg-card text-left"
              >
                <div className="relative overflow-hidden">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cover}
                      alt={a.title}
                      loading="lazy"
                      width={1024}
                      height={768}
                      className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center bg-muted">
                      <Images className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white">
                    <Images className="h-3.5 w-3.5" /> {a.photos?.length ?? 0} photos
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium leading-snug">{a.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {a.city} · {a.dateLabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </QueryState>

      {album && !open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="max-h-full w-full max-w-4xl overflow-y-auto rounded-lg bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-display text-xl font-medium">{album.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {album.city} · {album.dateLabel} · {photos.length} photos
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close album"
                className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
              {photos.map((p) => (
                <figure key={p.id} className="overflow-hidden rounded-lg border border-border bg-background">
                  <button type="button" onClick={() => setOpenId(p.id)} className="block w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.url} alt={p.caption ?? album.title} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  </button>
                  <figcaption className="flex items-start justify-between gap-3 p-3">
                    <div>
                      <p className="text-sm font-medium leading-snug">{p.caption ?? album.title}</p>
                      <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{p.kind}</p>
                    </div>
                    {member && (
                      <button
                        type="button"
                        aria-label={isTagged(p.id) ? "Remove from My Gallery" : "Tag to My Gallery"}
                        title={isTagged(p.id) ? "In My Gallery" : "Tag to My Gallery"}
                        disabled={tag.isPending}
                        onClick={() => tagPhoto(p)}
                        className={`shrink-0 rounded-full border p-2 transition disabled:opacity-60 ${
                          isTagged(p.id)
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border text-muted-foreground hover:border-accent/60 hover:text-accent"
                        }`}
                      >
                        {isTagged(p.id) ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                      </button>
                    )}
                  </figcaption>
                </figure>
              ))}
              {photos.length === 0 && <p className="text-sm text-muted-foreground">No photos in this album yet.</p>}
            </div>
          </div>
        </div>
      )}

      {album && open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenId(null)}
        >
          <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-lg bg-card" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={open.url} alt={open.caption ?? album.title} className="max-h-[70vh] w-full object-cover" />
            <div className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="font-display text-lg font-medium">{open.caption ?? album.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {album.title} · {album.city} · {album.dateLabel} · {open.kind}
                </p>
                {member && (
                  <button
                    type="button"
                    disabled={tag.isPending}
                    onClick={() => tagPhoto(open)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
                      isTagged(open.id)
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border hover:border-accent/60 hover:text-accent"
                    }`}
                  >
                    {isTagged(open.id) ? <Check className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
                    {isTagged(open.id) ? "In My Gallery" : "Tag to My Gallery"}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenId(null)}
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
