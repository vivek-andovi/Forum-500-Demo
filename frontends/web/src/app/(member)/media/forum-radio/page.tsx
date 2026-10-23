"use client";

import { useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { groupBySeries, paragraphs } from "@/lib/format";
import { usePodcasts } from "@/features/media/queries";
import { usePageCopy } from "@/features/site/queries";
import type { PodcastEpisode } from "@/features/media/types";

export default function ForumRadioPage() {
  const copy = usePageCopy("media/forum-radio");
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
        pageKey="media/forum-radio"
        eyebrow="Media Hub"
        title="Forum Radio"
        description="The weekly podcast — long conversations with members about the ideas they are making happen."
      />
      {copy?.heroImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={copy.heroImageUrl}
          alt={copy.heroImageAlt ?? ""}
          loading="lazy"
          width={1024}
          height={1024}
          className="h-56 w-full rounded-lg object-cover sm:h-72"
        />
      )}

      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />

      <QueryState isLoading={isLoading} error={error} empty={episodes.length === 0} emptyText="No episodes yet.">
        <div className="space-y-8">
          {groupBySeries(episodes).map((group) => (
            <section key={group.key} className="space-y-4">
              {group.title && <h2 className="font-display text-2xl font-medium">{group.title}</h2>}
              <div className="divide-y divide-border rounded-lg border border-border bg-card">
                {group.episodes.map((ep) => {
                  const playing = playingId === ep.id;
                  return (
                    <div key={ep.id} className="flex items-center gap-5 px-6 py-5">
                      <button
                        type="button"
                        onClick={() => toggle(ep)}
                        disabled={!ep.audioUrl}
                        title={ep.audioUrl ? undefined : "Audio coming soon"}
                        aria-label={`${playing ? "Pause" : "Play"} episode ${ep.number}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {playing ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          Episode {ep.number}
                          {ep.durationMinutes ? ` · ${ep.durationMinutes} min` : ""}
                        </p>
                        <h3 className="font-display text-lg font-medium">{ep.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          With {ep.guestName}
                          {ep.description ? ` — ${ep.description}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </QueryState>
      {paragraphs(copy?.body).map((p) => (
        <p key={p} className="text-sm text-muted-foreground">{p}</p>
      ))}
    </div>
  );
}
