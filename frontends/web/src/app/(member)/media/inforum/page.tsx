"use client";

import { useState } from "react";
import { Send, CheckCircle2, ThumbsUp, Reply } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentMember } from "@/hooks/useAuth";
import {
  useAddRecommendation,
  useComments,
  useEdition,
  useEditions,
  useInforumTabs,
  useLookups,
  usePostComment,
  useRecommendComment,
  useRecommendations,
  useSections,
  useSubmitPitch, usePageCopy } from "@/lib/queries";
import { articleDate, fmtDate, readTime, timeAgo } from "@/lib/format";
import type { Article, Comment, InforumTab } from "@/lib/types";
import { cn } from "@/lib/utils";

const fieldCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring";

function formatLabel(f: string) {
  const s = f.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function articlesForTab(tab: InforumTab | undefined, pool: Article[]): Article[] {
  if (!tab) return [];
  if (tab.type === "section") {
    const key = tab.sectionKey ?? tab.id.replace(/^section:/, "");
    return pool.filter((a) => a.section?.key === key);
  }
  if (tab.id === "editors-choice") return pool.filter((a) => a.editorsChoice);
  if (tab.id === "around-the-world") return pool.filter((a) => a.fromAroundWorld);
  if (tab.id === "by-members") return pool.filter((a) => a.isMember);
  return [];
}

function sectionName(a: Article) {
  return a.sectionLabel ?? a.section?.label ?? "";
}

function ArticleImage({ article, className }: { article: Article; className: string }) {
  if (!article.imageUrl) return <div className={cn(className, "bg-muted")} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={article.imageUrl}
      alt={article.caption ?? article.title}
      loading="lazy"
      width={1200}
      height={800}
      className={className}
    />
  );
}

function Byline({ article, className }: { article: Article; className?: string }) {
  const parts = [article.authorName, article.dateline, articleDate(article), readTime(article)].filter(Boolean);
  return (
    <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", className)}>
      {article.authorPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.authorPhotoUrl}
          alt={article.authorName}
          loading="lazy"
          width={40}
          height={40}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : null}
      <span>{parts.join(" · ")}</span>
    </div>
  );
}

function PitchForm({ onClose }: { onClose: () => void }) {
  const lookups = useLookups();
  const pitch = useSubmitPitch();
  const sections = useSections();
  const formats = lookups.data?.pitchFormats ?? [];
  const [headline, setHeadline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [section, setSection] = useState("");
  const [format, setFormat] = useState("article");
  const [dateline, setDateline] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    const h = headline.trim();
    const s = synopsis.trim();
    if (!h) next["headline"] = "Please add a headline.";
    else if (h.length > 120) next["headline"] = "Headline must be under 120 characters.";
    if (!s) next["synopsis"] = "Please add a short synopsis.";
    else if (s.length > 800) next["synopsis"] = "Synopsis must be under 800 characters.";
    if (!section) next["section"] = "Please choose a section.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    pitch.mutate(
      {
        headline: headline.trim(),
        synopsis: synopsis.trim(),
        section,
        format,
        dateline: dateline.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Pitch sent to the editors");
          setSubmitted(true);
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="space-y-5 py-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-accent" />
        </div>
        <h3 className="font-display text-xl font-medium">Pitch received</h3>
        <p className="text-sm text-muted-foreground">
          Thank you. Jessica and Simon will review your story and be in touch within a few days.
        </p>
        <Button onClick={onClose} className="mt-2">
          Back to In:Forum
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="pitch-headline" className="block text-sm font-medium text-foreground">
          Proposed headline
        </label>
        <input
          id="pitch-headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={120}
          placeholder="e.g. The new rules of patient capital in Southeast Asia"
          className={fieldCls}
        />
        {errors["headline"] ? <p className="text-xs text-destructive">{errors["headline"]}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pitch-section" className="block text-sm font-medium text-foreground">
            Section
          </label>
          <select id="pitch-section" value={section} onChange={(e) => setSection(e.target.value)} className={fieldCls}>
            <option value="">Choose a section</option>
            {(sections.data ?? []).map((s) => (
              <option key={s.id} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
          {errors["section"] ? <p className="text-xs text-destructive">{errors["section"]}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="pitch-format" className="block text-sm font-medium text-foreground">
            Format
          </label>
          <select id="pitch-format" value={format} onChange={(e) => setFormat(e.target.value)} className={fieldCls}>
            {(formats.length ? formats : [format]).map((f) => (
              <option key={f} value={f}>
                {formatLabel(f)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pitch-synopsis" className="block text-sm font-medium text-foreground">
          Synopsis
        </label>
        <textarea
          id="pitch-synopsis"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          maxLength={800}
          placeholder="What is the story about, why does it matter, and what would members learn?"
          className={cn(fieldCls, "resize-none")}
        />
        <div className="flex items-center justify-between">
          {errors["synopsis"] ? <p className="text-xs text-destructive">{errors["synopsis"]}</p> : <span />}
          <p className="text-xs text-muted-foreground">{synopsis.length}/800</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pitch-dateline" className="block text-sm font-medium text-foreground">
            Dateline / city
          </label>
          <input
            id="pitch-dateline"
            type="text"
            value={dateline}
            onChange={(e) => setDateline(e.target.value)}
            maxLength={80}
            placeholder="e.g. London, Singapore, New York"
            className={fieldCls}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pitch-notes" className="block text-sm font-medium text-foreground">
          Notes for the editors
        </label>
        <textarea
          id="pitch-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Any sources, timing, photo availability, or questions for Jessica and Simon."
          className={cn(fieldCls, "resize-none")}
        />
        <p className="text-right text-xs text-muted-foreground">{notes.length}/600</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="inline-flex items-center gap-2" disabled={pitch.isPending}>
          <Send className="h-4 w-4" /> {pitch.isPending ? "Submitting…" : "Submit pitch"}
        </Button>
      </div>
    </form>
  );
}

function RecommendationForm({ onClose }: { onClose: () => void }) {
  const lookups = useLookups();
  const add = useAddRecommendation();
  const categories = lookups.data?.recommendationCategories ?? [];
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cat = category || categories[0]?.id || "";
    if (!cat || !title.trim()) {
      setError("Please choose a category and add a name.");
      return;
    }
    setError("");
    add.mutate(
      { category: cat, title: title.trim(), place: place.trim() || undefined, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Thank you — your recommendation is in review and will appear once approved.");
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="rec-category" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="rec-category"
            value={category || categories[0]?.id || ""}
            onChange={(e) => setCategory(e.target.value)}
            className={fieldCls}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="rec-place" className="block text-sm font-medium text-foreground">
            Place / city
          </label>
          <input
            id="rec-place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={80}
            placeholder="e.g. Lisbon"
            className={fieldCls}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="rec-title" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="rec-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="The table, hotel, trip or book"
          className={fieldCls}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="rec-note" className="block text-sm font-medium text-foreground">
          Why you recommend it
        </label>
        <textarea
          id="rec-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="A line or two for fellow members."
          className={cn(fieldCls, "resize-none")}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="inline-flex items-center gap-2" disabled={add.isPending}>
          <Send className="h-4 w-4" /> {add.isPending ? "Sending…" : "Share recommendation"}
        </Button>
      </div>
    </form>
  );
}

function CommentAvatar({ name, photo, size = "md" }: { name: string; photo: string | null; size?: "md" | "sm" }) {
  const cls = size === "md" ? "h-10 w-10" : "h-8 w-8";
  return (
    <MemberAvatar
      src={photo}
      name={name}
      className={cn(cls, "shrink-0 rounded-full", !photo && "bg-accent/20 text-xs text-accent")}
    />
  );
}

function CommentsSection() {
  const { member } = useCurrentMember();
  const q = useComments();
  const post = usePostComment();
  const recommend = useRecommendComment();
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState<"recommended" | "newest">("recommended");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const comments = q.data?.comments ?? [];
  const recommendedIds = new Set(q.data?.recommendedIds ?? []);
  const totalCount = comments.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0);
  const sorted = [...comments].sort((a, b) =>
    sort === "recommended" ? b.recommends - a.recommends : b.createdAt.localeCompare(a.createdAt),
  );

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    post.mutate(
      { body: text },
      {
        onSuccess: () => {
          toast.success("Thank you — comments are reviewed before they appear.");
          setDraft("");
        },
      },
    );
  }

  function handleReply(commentId: string, e: React.FormEvent) {
    e.preventDefault();
    const text = replyDraft.trim();
    if (!text) return;
    post.mutate(
      { body: text, parentId: commentId },
      {
        onSuccess: () => {
          toast.success("Reply sent — comments are reviewed before they appear.");
          setReplyingTo(null);
          setReplyDraft("");
        },
      },
    );
  }

  function RecommendButton({ c, className }: { c: Comment; className?: string }) {
    const active = recommendedIds.has(c.id);
    return (
      <button
        type="button"
        disabled={!member || (recommend.isPending && recommend.variables === c.id)}
        onClick={() => recommend.mutate(c.id)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
          active
            ? "border-accent bg-accent/10 text-accent"
            : "border-border text-muted-foreground hover:border-accent hover:text-accent",
          className,
        )}
      >
        <ThumbsUp className={cn("h-3.5 w-3.5", active && "fill-current")} />
        Recommend {c.recommends}
      </button>
    );
  }

  const meta = (c: Comment) => [c.memberChapter, timeAgo(c.createdAt)].filter(Boolean).join(" · ");

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-medium">Comments {totalCount}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Members' points of view on the week — moderated before publication, in the spirit of The Times' comment
            pages.
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-border p-1">
          {(
            [
              { id: "recommended", label: "Most recommended" },
              { id: "newest", label: "Newest" },
            ] as const
          ).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSort(s.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] transition-colors",
                sort === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {member ? (
        <form onSubmit={handlePost} className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-4">
          <CommentAvatar name={member.fullName} photo={member.avatarUrl ?? null} />
          <div className="min-w-0 flex-1">
            <label htmlFor="member-comment" className="sr-only">
              Add to the conversation
            </label>
            <textarea
              id="member-comment"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              maxLength={400}
              placeholder="Add to the conversation…"
              className={cn(fieldCls, "resize-none")}
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{draft.length}/400 · comments appear after review</p>
              <Button type="submit" size="sm" disabled={!draft.trim() || post.isPending}>
                Post
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          Admin account — no member profile. Commenting is available to members only.
        </p>
      )}

      <QueryState isLoading={q.isLoading} error={q.error} empty={!comments.length} emptyText="No comments yet.">
        <div className="divide-y divide-border border-y border-border">
          {sorted.map((c) => (
            <article key={c.id} className="py-5">
              <div className="flex gap-3">
                <CommentAvatar name={c.memberName} photo={c.memberPhotoUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-semibold">{c.memberName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{meta(c)}</span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed">{c.body}</p>
                  <div className="mt-2.5 flex items-center gap-4">
                    <RecommendButton c={c} />
                    {member ? (
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(replyingTo === c.id ? null : c.id);
                          setReplyDraft("");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Reply className="h-3.5 w-3.5" />
                        Reply
                      </button>
                    ) : null}
                  </div>

                  {replyingTo === c.id ? (
                    <form onSubmit={(e) => handleReply(c.id, e)} className="mt-3 flex gap-2">
                      <input
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        maxLength={400}
                        placeholder={`Reply to ${c.memberName.split(" ")[0] ?? ""}…`}
                        className={cn(fieldCls, "min-w-0 flex-1 w-auto")}
                      />
                      <Button type="submit" size="sm" disabled={!replyDraft.trim() || post.isPending}>
                        Reply
                      </Button>
                    </form>
                  ) : null}

                  {c.replies && c.replies.length > 0 ? (
                    <div className="mt-4 space-y-4 border-l-2 border-border pl-4">
                      {c.replies.map((r) => (
                        <div key={r.id} className="flex gap-3">
                          <CommentAvatar name={r.memberName} photo={r.memberPhotoUrl} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <span className="font-semibold">{r.memberName}</span>
                              <span className="ml-2 text-xs text-muted-foreground">{meta(r)}</span>
                            </p>
                            <p className="mt-1 text-sm leading-relaxed">{r.body}</p>
                            <RecommendButton c={r} className="mt-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
    </section>
  );
}

function RecommendationsSection({ onShare }: { onShare: () => void }) {
  const lookups = useLookups();
  const q = useRecommendations();
  const [recCategory, setRecCategory] = useState<string>("all");
  const categories = lookups.data?.recommendationCategories ?? [];
  const all = q.data ?? [];
  const visibleRecs = recCategory === "all" ? all : all.filter((r) => r.category === recCategory);

  return (
    <section className="space-y-6">
      <div>
        <h3 className="font-display text-2xl font-medium">Member Recommendations</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Places, stays and books members swear by — shared in confidence, from members who have actually been.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", label: "All" }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setRecCategory(c.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
              recCategory === c.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <QueryState
        isLoading={q.isLoading}
        error={q.error}
        empty={!visibleRecs.length}
        emptyText="No recommendations in this category yet."
      >
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {visibleRecs.map((r) => (
            <article key={r.id} className="group">
              {r.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-40 w-full rounded-md object-cover"
                />
              ) : (
                <div className="h-40 w-full rounded-md bg-muted" aria-hidden />
              )}
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {[categories.find((c) => c.id === r.category)?.label ?? r.category, r.place].filter(Boolean).join(" · ")}
              </p>
              <h3 className="mt-1 font-display text-lg font-medium leading-snug">{r.title}</h3>
              {r.note ? <p className="mt-2 text-sm italic text-muted-foreground">“{r.note}”</p> : null}
              <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <MemberAvatar src={r.memberPhotoUrl} name={r.memberName} className="h-7 w-7 rounded-full text-[10px]" />
                <span>
                  {r.memberName}
                  {r.memberChapter ? ` · ${r.memberChapter} chapter` : ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      </QueryState>
      <div className="rounded-lg border border-border bg-secondary/40 p-5">
        <p className="text-sm text-muted-foreground">
          Have a table, hotel or book worth sharing? Send it to Jessica and Simon and it will appear here after a quick
          review.
        </p>
        <Button variant="outline" className="mt-3" onClick={onShare}>
          Share a recommendation
        </Button>
      </div>
    </section>
  );
}

export default function MemberInForumPage() {
  const pitchBlock = usePageCopy("media/inforum")?.blocks?.find((b) => b.key === "pitch");
  const { member } = useCurrentMember();
  const [tab, setTab] = useState<string>("editors-choice");
  const [editionSlug, setEditionSlug] = useState<string>("current");
  const [open, setOpen] = useState<Article | null>(null);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  const editions = useEditions();
  const editionQ = useEdition(editionSlug);
  const edition = editionQ.data;
  const editionList = editions.data ?? [];
  const latestSlug = editionList[0]?.slug;
  const isCurrent = editionSlug === "current" || (!!latestSlug && editionSlug === latestSlug);
  const activeSlug = edition?.slug ?? (editionSlug === "current" ? latestSlug : editionSlug);

  const tabsQ = useInforumTabs();
  const tabs = tabsQ.data ?? [];
  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];
  const activeId = activeTab?.id;

  const articles = articlesForTab(activeTab, edition?.articles ?? []);
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/inforum"
        eyebrow="Media Hub"
        title="In:Forum"
        description="The full member edition — reporting, essays and dispatches from the Forum500 community."
      />

      <div id="make-an-idea-happen" className="rounded-lg border border-border bg-secondary/50 p-6">
        <h3 className="font-display text-lg font-medium">{pitchBlock?.title}</h3>
        {pitchBlock?.body && <p className="mt-2 text-sm text-muted-foreground">{pitchBlock.body}</p>}
        {member ? (
          <Button className="mt-4" variant="outline" onClick={() => setPitchOpen(true)}>
            {pitchBlock?.ctaLabel ?? "Pitch"}
          </Button>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">Admin account — no member profile.</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {isCurrent ? "Current edition" : "Archive edition"}
          </p>
          <p className="mt-1 font-display text-xl font-medium">
            {edition ? `${edition.label} edition` : editionQ.isLoading ? "Loading…" : "No edition published yet"}
          </p>
          {edition ? (
            <p className="text-sm text-muted-foreground">Published {fmtDate(edition.publishedOn, "d MMMM yyyy")}</p>
          ) : null}
        </div>
        {!isCurrent ? (
          <Button variant="outline" onClick={() => setEditionSlug("current")}>
            Back to current edition
          </Button>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto border-y border-border">
        <div className="flex min-w-max items-center gap-1 px-1 py-2">
          {tabsQ.isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                activeId === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeId === "recommendations" ? (
        <RecommendationsSection onShare={() => setRecOpen(true)} />
      ) : activeId === "comments" ? (
        <CommentsSection />
      ) : (
        <QueryState isLoading={editionQ.isLoading} error={editionQ.error}>
          {!lead ? (
            <p className="text-sm text-muted-foreground">
              No stories in this section yet — new commissions land each week.
            </p>
          ) : (
            <>
              <article
                className="group grid cursor-pointer gap-6 border-b border-border pb-8 lg:grid-cols-2"
                onClick={() => setOpen(lead)}
              >
                <ArticleImage article={lead} className="h-64 w-full rounded-md object-cover lg:h-full" />
                <div className="flex flex-col justify-center">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    {[sectionName(lead), "Lead story"].filter(Boolean).join(" · ")}
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-medium leading-tight group-hover:underline sm:text-4xl">
                    {lead.title}
                  </h2>
                  {lead.standfirst ? <p className="mt-3 text-muted-foreground">{lead.standfirst}</p> : null}
                  <Byline article={lead} className="mt-4" />
                </div>
              </article>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <article key={a.id} className="group cursor-pointer" onClick={() => setOpen(a)}>
                    <ArticleImage article={a} className="h-44 w-full rounded-md object-cover" />
                    <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{sectionName(a)}</p>
                    <h3 className="mt-1 font-display text-xl font-medium leading-snug group-hover:underline">
                      {a.title}
                    </h3>
                    {a.standfirst ? <p className="mt-2 text-sm text-muted-foreground">{a.standfirst}</p> : null}
                    <Byline article={a} className="mt-3" />
                  </article>
                ))}
              </div>
            </>
          )}
        </QueryState>
      )}

      <section className="border-t border-border pt-8">
        <h3 className="font-display text-2xl font-medium">Previous editions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Every In:Forum edition stays open to members. Click an edition to read it in full.
        </p>
        <QueryState
          isLoading={editions.isLoading}
          error={editions.error}
          empty={!editionList.length}
          emptyText="No editions published yet."
          className="mt-5"
        >
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {editionList.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => {
                  setEditionSlug(e.slug === latestSlug ? "current" : e.slug);
                  setTab("editors-choice");
                  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "group overflow-hidden rounded-lg border text-left transition-colors",
                  e.slug === activeSlug ? "border-accent" : "border-border hover:border-accent",
                )}
              >
                {e.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={e.coverUrl}
                    alt={`${e.label} edition cover`}
                    loading="lazy"
                    width={800}
                    height={600}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="h-32 w-full bg-muted" aria-hidden />
                )}
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.label}</p>
                  {e.coverLine ? (
                    <p className="mt-1 font-display text-base leading-snug group-hover:underline">{e.coverLine}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Published {fmtDate(e.publishedOn, "d MMMM yyyy")}
                    {e.articles ? ` · ${e.articles.length} stories` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </QueryState>
      </section>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl leading-snug">{open.title}</DialogTitle>
              </DialogHeader>
              {open.imageUrl ? <ArticleImage article={open} className="h-56 w-full rounded-md object-cover" /> : null}
              {open.caption ? <p className="text-xs text-muted-foreground">{open.caption}</p> : null}
              {open.standfirst ? <p className="text-base text-muted-foreground">{open.standfirst}</p> : null}
              <Byline article={open} />
              <div className="space-y-4 text-sm leading-relaxed">
                {(open.body ?? []).map((p, i) => (
                  <p key={i} className={i === 0 ? "text-base" : undefined}>
                    {p}
                  </p>
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={pitchOpen} onOpenChange={setPitchOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl leading-snug">Pitch a story</DialogTitle>
          </DialogHeader>
          {pitchOpen ? <PitchForm onClose={() => setPitchOpen(false)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl leading-snug">Share a recommendation</DialogTitle>
          </DialogHeader>
          {recOpen ? <RecommendationForm onClose={() => setRecOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
