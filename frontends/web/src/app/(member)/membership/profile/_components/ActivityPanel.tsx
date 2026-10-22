"use client";

import Link from "next/link";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { Article, PodcastEpisode } from "@/features/media/types";
import type { BenefitOffer, Group, GroupMembership } from "@/features/membership/types";
import { timeAgo } from "@/lib/format";

/** "My activity": the latest 8 articles, podcast appearances, offers and group joins, newest first. */
export function ActivityPanel({
  articles,
  appearances,
  offers,
  groups,
}: {
  articles: Article[];
  appearances: PodcastEpisode[];
  offers: BenefitOffer[];
  groups: (GroupMembership & { group?: Group })[];
}) {
  const activity = [
    ...articles.map((a) => ({
      id: `a-${a.id}`,
      type: "Article",
      at: a.publishedAt ?? a.createdAt,
      text: `Published “${a.title}”`,
    })),
    ...appearances.map((p) => ({
      id: `p-${p.id}`,
      type: "Podcast",
      at: p.publishedAt ?? p.createdAt,
      text: `Appeared on episode ${p.number}: “${p.title}”`,
    })),
    ...offers.map((o) => ({
      id: `o-${o.id}`,
      type: "Benefit",
      at: o.createdAt,
      text: `Offered “${o.title}” to fellow Members`,
    })),
    ...groups.map((gm) => ({
      id: `g-${gm.id}`,
      type: "Group",
      at: gm.createdAt,
      text: `Joined ${gm.group?.name ?? "a group"}`,
    })),
  ]
    .sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""))
    .slice(0, 8);

  return (
    <CollapsiblePanel title="My activity">
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="space-y-4">
          {activity.map((f) => (
            <li key={f.id} className="border-l-2 border-border pl-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {f.type} · {timeAgo(f.at)}
              </p>
              <p className="mt-1 text-sm">{f.text}</p>
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/media/newsfeed"
        className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Share a post
      </Link>
    </CollapsiblePanel>
  );
}
