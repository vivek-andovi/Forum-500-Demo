"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { paragraphs } from "@/lib/format";
import { usePodcasts } from "@/features/media/queries";
import { usePageCopy } from "@/features/site/queries";
import type { PodcastEpisode } from "@/features/media/types";

export default function PodcastsPage() {
  const copy = usePageCopy("media/podcasts");
  const { data: episodes = [], isLoading, error } = usePodcasts();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const toggle = (ep: PodcastEpisode) => {
    const audio = audioRef.current;
    if (!audio || !ep.audioUrl) return;
    if (playingId === ep.id) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.src = ep.audioUrl;
    setPlayingId(ep.id);
    audio.play().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === "AbortError") return;
      toast.error("Could not play this episode");
      setPlayingId((cur) => (cur === ep.id ? null : cur));
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/podcasts"
        eyebrow="Media Hub"
        title="Podcasts"
        description="Conversations with members, partners and the thinkers shaping our world — every episode in one place."
      />

      {copy?.heroImageUrl && (
        <div className="overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={copy.heroImageUrl} alt={copy.heroImageAlt ?? ""} className="h-44 w-full object-cover" />
        </div>
      )}

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      <QueryState isLoading={isLoading} error={error} empty={episodes.length === 0} emptyText="No episodes yet.">
        <div className="rounded-lg border border-border bg-card">
          {episodes.map((ep) => {
            const playing = playingId === ep.id;
            return (
              <div key={ep.id} className="flex items-center gap-4 border-b border-border p-4 last:border-0">
                <button
                  type="button"
                  onClick={() => toggle(ep)}
                  disabled={!ep.audioUrl}
                  title={ep.audioUrl ? undefined : "Audio coming soon"}
                  aria-label={`${playing ? "Pause" : "Play"} episode ${ep.number}: ${ep.title}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                </button>
                {ep.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ep.coverUrl}
                    alt=""
                    loading="lazy"
                    className="hidden h-12 w-12 shrink-0 rounded object-cover sm:block"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Episode {ep.number}
                    {ep.durationMinutes ? ` · ${ep.durationMinutes} min` : ""}
                  </p>
                  <h3 className="truncate font-serif text-lg font-semibold">{ep.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {ep.guestName}
                    {ep.description ? ` — ${ep.description}` : ""}
                  </p>
                  {(ep.spotifyUrl || ep.appleUrl) && (
                    <div className="mt-1 flex gap-3 text-xs">
                      {ep.spotifyUrl && (
                        <a href={ep.spotifyUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          Spotify
                        </a>
                      )}
                      {ep.appleUrl && (
                        <a href={ep.appleUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                          Apple Podcasts
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </QueryState>

      {paragraphs(copy?.body).map((p) => (

        <p key={p} className="text-sm text-muted-foreground">{p}</p>

      ))}
    </div>
  );
}
