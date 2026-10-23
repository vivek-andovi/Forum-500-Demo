"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useLibrary } from "@/features/media/queries";
import { useSiteSettings } from "@/features/site/queries";
import { fmtDate } from "@/lib/format";
import type { LibraryItem, LibraryKind } from "@/features/media/types";

const kindLabel: Record<LibraryKind, string> = {
  Annual_Report: "Annual Report",
  Journal: "Journal",
  audio: "Audio",
  video: "Video",
  document: "Document",
  link: "Link",
};

/** Section headings, in page order. */
const kindHeading: Record<LibraryKind, string> = {
  Annual_Report: "Annual Reports",
  Journal: "Journals",
  video: "Video",
  audio: "Audio",
  document: "Documents",
  link: "Links",
};
const kindOrder = Object.keys(kindHeading) as LibraryKind[];

/** "Speaker · 45 min · 3 March 2021" */
function mediaMeta(item: LibraryItem): string {
  return [item.speaker, item.durationLabel, fmtDate(item.recordedOn, "d MMMM yyyy")].filter(Boolean).join(" · ");
}

function MetaLine({ item }: { item: LibraryItem }) {
  const meta = mediaMeta(item);
  return meta ? <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{meta}</p> : null;
}

/** Cover card used for reports, journals and documents (Read / download). */
function PublicationCard({ item, fallbackCover }: { item: LibraryItem; fallbackCover: string | undefined }) {
  const label = `Read${item.pages ? ` (${item.pages} pages)` : ""}`;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.coverUrl ?? fallbackCover}
          alt={item.title}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-[4/3] w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded bg-background/90 px-2 py-1 text-xs font-bold uppercase tracking-wider">
          {kindLabel[item.kind] ?? item.kind}
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-medium">{item.title}</h3>
        {item.kind === "document" && <MetaLine item={item} />}
        <p className="mt-1 text-sm text-muted-foreground">{item.description ?? ""}</p>
        {item.fileUrl ? (
          <a
            href={item.fileUrl}
            target="_blank"
            rel="noreferrer"
            download
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium hover:bg-secondary"
          >
            <BookOpen className="h-4 w-4" /> {label}
          </a>
        ) : (
          <button
            type="button"
            disabled
            title="File coming soon"
            className="mt-4 inline-flex cursor-not-allowed items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium opacity-50"
          >
            <BookOpen className="h-4 w-4" /> {label}
          </button>
        )}
      </div>
    </div>
  );
}

function VideoCard({ item }: { item: LibraryItem }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {item.mediaUrl ? (
        <video
          controls
          preload="metadata"
          src={item.mediaUrl}
          poster={item.coverUrl ?? undefined}
          className="aspect-video w-full bg-black"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-muted text-sm text-muted-foreground">
          Video coming soon
        </div>
      )}
      <div className="p-5">
        <h3 className="font-display text-lg font-medium">{item.title}</h3>
        <MetaLine item={item} />
        {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
      </div>
    </div>
  );
}

function AudioCard({ item }: { item: LibraryItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-display text-lg font-medium">{item.title}</h3>
      <MetaLine item={item} />
      {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
      {item.mediaUrl ? (
        <audio controls preload="none" src={item.mediaUrl} className="mt-4 w-full" />
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Audio coming soon</p>
      )}
    </div>
  );
}

function LinkCard({ item }: { item: LibraryItem }) {
  const body = (
    <>
      <h3 className="flex items-center gap-2 font-display text-lg font-medium">
        {item.title}
        {item.fileUrl && <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </h3>
      <MetaLine item={item} />
      {item.description && <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>}
    </>
  );
  return item.fileUrl ? (
    <a
      href={item.fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-border bg-card p-5 transition-colors hover:border-accent"
    >
      {body}
    </a>
  ) : (
    <div className="rounded-lg border border-border bg-card p-5">{body}</div>
  );
}

export default function LibraryPage() {
  const fallbackCover = useSiteSettings()?.fallbackCoverImageUrl;
  const { data: items = [], isLoading, error } = useLibrary();

  const groups = kindOrder
    .map((kind) => ({ kind, items: items.filter((i) => i.kind === kind) }))
    .filter((g) => g.items.length > 0);
  const unknown = items.filter((i) => !kindOrder.includes(i.kind));
  if (unknown.length) groups.push({ kind: unknown[0].kind, items: unknown });

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/library"
        eyebrow="Media Hub"
        title="Library"
        description="The Forum's publications archive — the annual Forecast and every edition of IN:FORUM."
      />
      <QueryState isLoading={isLoading} error={error} empty={items.length === 0} emptyText="The library is empty.">
        <div className="space-y-10">
          {groups.map((g) => (
            <section key={g.kind} className="space-y-4">
              <h2 className="font-display text-2xl font-medium">{kindHeading[g.kind] ?? g.kind}</h2>
              <div className="grid gap-6 md:grid-cols-3">
                {g.items.map((item) =>
                  item.kind === "video" ? (
                    <VideoCard key={item.id} item={item} />
                  ) : item.kind === "audio" ? (
                    <AudioCard key={item.id} item={item} />
                  ) : item.kind === "link" ? (
                    <LinkCard key={item.id} item={item} />
                  ) : (
                    <PublicationCard key={item.id} item={item} fallbackCover={fallbackCover} />
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
