import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { podcastEpisodes } from "@/lib/forum-data";
import mediaPodcast from "@/assets/media-podcast.jpg";

export const Route = createFileRoute("/_authenticated/media/podcasts")({
  component: Podcasts,
});

function Podcasts() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="Podcasts"
        description="Conversations with members, partners and the thinkers shaping our world — every episode in one place."
      />

      <div className="overflow-hidden rounded-lg border border-border">
        <img
          src={mediaPodcast}
          alt="Forum podcast recording in progress"
          className="h-44 w-full object-cover"
        />
      </div>

      <div className="rounded-lg border border-border bg-card">
        {podcastEpisodes.map((ep) => (
          <div
            key={ep.id}
            className="flex items-center gap-4 border-b border-border p-4 last:border-0"
          >
            <button
              type="button"
              aria-label={`Play episode ${ep.number}: ${ep.title}`}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Play className="h-4 w-4 fill-current" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Episode {ep.number} · {ep.duration}
              </p>
              <h3 className="truncate font-serif text-lg font-semibold">{ep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {ep.guest} — {ep.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Also on Spotify and Apple Podcasts — search “Forum Radio”.
      </p>
    </div>
  );
}
