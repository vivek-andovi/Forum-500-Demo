import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { podcastEpisodes } from "@/lib/forum-data";
import mediaPodcast from "@/assets/media-podcast.jpg";

export const Route = createFileRoute("/_authenticated/media/forum-radio")({
  component: Podcast,
});

function Podcast() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="Forum Radio"
        description="The weekly podcast — long conversations with members about the ideas they are making happen."
      />
      <img
        src={mediaPodcast}
        alt="A Forum Radio recording session"
        loading="lazy"
        width={1024}
        height={1024}
        className="h-56 w-full rounded-lg object-cover sm:h-72"
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {podcastEpisodes.map((ep) => (
          <div key={ep.id} className="flex items-center gap-5 px-6 py-5">
            <button
              aria-label={`Play episode ${ep.number}`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Play className="ml-0.5 h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Episode {ep.number} · {ep.duration}</p>
              <h3 className="font-display text-lg font-medium">{ep.title}</h3>
              <p className="text-sm text-muted-foreground">With {ep.guest} — {ep.description}</p>
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
