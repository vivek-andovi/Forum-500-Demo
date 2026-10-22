"use client";

import Link from "next/link";
import { Newspaper } from "lucide-react";
import type { Dashboard } from "@/features/site/types";
import type { Member } from "@/features/membership/types";
import { articleMeta } from "./helpers";
import { Empty, Img, Panel, SectionHeading } from "./Panel";

/** Media: member articles, podcasts and In:Forum. Collapsed shows one stacked card each; expanded shows rows.
 * The two states use different item layouts (stacked vs. side image), so both trees are kept. */
export function MediaSection({
  data,
  me,
  collapsed,
  onToggleCollapsed,
}: {
  data: Dashboard;
  me: Member | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const memberArticles = data.memberArticles ?? [];
  const podcasts = data.podcasts ?? [];
  const inforumArticles = data.inforumArticles ?? [];

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={Newspaper}
        title="Media"
        to="/media"
        linkLabel="Media Hub"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        cta={me ? { to: "/media/articles", label: "Publish an Article" } : undefined}
      />
      {collapsed ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="New Articles by Members" to="/media/articles">
            {memberArticles.length === 0 && <Empty />}
            {memberArticles.slice(0, 1).map((a) => (
              <Link key={a.id} href="/media/articles" className="block px-2 py-2">
                <Img src={a.imageUrl} alt={a.title} className="mb-2 h-28 w-full rounded-md" />
                <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                <p className="text-xs text-muted-foreground">{articleMeta(a, false)}</p>
              </Link>
            ))}
          </Panel>
          <Panel title="New Podcasts" to="/media/podcasts">
            {podcasts.length === 0 && <Empty />}
            {podcasts.slice(0, 1).map((ep) => (
              <Link key={ep.id} href="/media/podcasts" className="flex gap-3 px-2 py-2">
                <Img src={ep.coverUrl} alt={ep.title} className="h-16 w-16 shrink-0 rounded-md" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                  <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[ep.guestName, ep.durationMinutes ? `${ep.durationMinutes} min` : ""].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </Panel>
          <Panel title="New from In:Forum" to="/media/inforum">
            {inforumArticles.length === 0 && <Empty />}
            {inforumArticles.slice(0, 1).map((s) => (
              <Link key={s.id} href="/media/inforum" className="block px-2 py-2">
                <Img src={s.imageUrl} alt={s.caption ?? s.title} className="mb-2 h-28 w-full rounded-md" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  {s.sectionLabel ?? s.section?.label ?? ""}
                </p>
                <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                <p className="text-xs text-muted-foreground">{articleMeta(s, true)}</p>
              </Link>
            ))}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="New Articles by Members" to="/media/articles">
            {memberArticles.length === 0 && <Empty />}
            {memberArticles.map((a) => (
              <Link key={a.id} href="/media/articles" className="flex gap-3 px-2 py-2">
                <Img src={a.imageUrl} alt={a.title} className="h-14 w-20 shrink-0 rounded-md" />
                <div>
                  <p className="font-display text-base font-medium leading-snug">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{articleMeta(a, false)}</p>
                </div>
              </Link>
            ))}
          </Panel>
          <Panel title="New Podcasts" to="/media/podcasts">
            {podcasts.length === 0 && <Empty />}
            {podcasts.map((ep) => (
              <Link key={ep.id} href="/media/podcasts" className="flex gap-3 px-2 py-2">
                <Img src={ep.coverUrl} alt={ep.title} className="h-14 w-14 shrink-0 rounded-md" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Episode {ep.number}</p>
                  <p className="mt-0.5 font-display text-base font-medium leading-snug">{ep.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {[ep.guestName, ep.durationMinutes ? `${ep.durationMinutes} min` : ""].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            ))}
          </Panel>
          <Panel title="New from In:Forum" to="/media/inforum">
            {inforumArticles.length === 0 && <Empty />}
            {inforumArticles.slice(0, 4).map((s) => (
              <Link key={s.id} href="/media/inforum" className="flex gap-3 px-2 py-2">
                <Img src={s.imageUrl} alt={s.caption ?? s.title} className="h-14 w-20 shrink-0 rounded-md" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {s.sectionLabel ?? s.section?.label ?? ""}
                  </p>
                  <p className="mt-0.5 font-display text-base font-medium leading-snug">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{articleMeta(s, true)}</p>
                </div>
              </Link>
            ))}
          </Panel>
        </div>
      )}
    </section>
  );
}
