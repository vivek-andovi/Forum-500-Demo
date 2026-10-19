import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Send, CheckCircle2, ThumbsUp, Reply } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  articlesForTab,
  currentEdition,
  getEdition,
  inforumEditions,
  inforumTabs,
  memberComments,
  memberRecommendations,
  recommendationCategories,
  type InforumArticle,
  type InforumTabId,
  type MemberComment,
  type RecommendationCategory,
} from "@/lib/inforum-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/media/inforum")({
  component: MemberInForum,
});

const PITCH_SECTIONS = [
  { value: "", label: "Choose a section" },
  { value: "editors-choice", label: "Editor's Choice" },
  { value: "around-the-world", label: "From Around the World" },
  { value: "by-members", label: "Articles by Members" },
  { value: "geopolitics", label: "Geopolitics" },
  { value: "finance", label: "Finance" },
  { value: "philanthropy", label: "Philanthropy" },
  { value: "real-estate", label: "Real Estate" },
  { value: "travel", label: "Travel" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "impact", label: "Impact" },
  { value: "sport", label: "Sport" },
];

const PITCH_FORMATS = [
  { value: "article", label: "Article / Essay" },
  { value: "dispatch", label: "City dispatch" },
  { value: "interview", label: "Interview" },
  { value: "photo-essay", label: "Photo essay" },
  { value: "opinion", label: "Opinion piece" },
  { value: "forecast", label: "Forum500 Forecast feature" },
];

function Byline({ article, className }: { article: InforumArticle; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", className)}>
      {article.authorPhoto ? (
        <img
          src={article.authorPhoto}
          alt={article.author}
          loading="lazy"
          width={40}
          height={40}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : null}
      <span>
        {article.author} · {article.dateline} · {article.date} · {article.readTime}
      </span>
    </div>
  );
}

function PitchForm({ onClose }: { onClose: () => void }) {
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
    if (!h) next['headline'] = "Please add a headline.";
    else if (h.length > 120) next['headline'] = "Headline must be under 120 characters.";
    if (!s) next['synopsis'] = "Please add a short synopsis.";
    else if (s.length > 800) next['synopsis'] = "Synopsis must be under 800 characters.";
    if (!section) next['section'] = "Please choose a section.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    // Placeholder: in production this would call a server function or send to editors
    setSubmitted(true);
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
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {errors['headline'] ? <p className="text-xs text-destructive">{errors['headline']}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pitch-section" className="block text-sm font-medium text-foreground">
            Section
          </label>
          <select
            id="pitch-section"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PITCH_SECTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {errors['section'] ? <p className="text-xs text-destructive">{errors['section']}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="pitch-format" className="block text-sm font-medium text-foreground">
            Format
          </label>
          <select
            id="pitch-format"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {PITCH_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
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
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <div className="flex items-center justify-between">
          {errors['synopsis'] ? <p className="text-xs text-destructive">{errors['synopsis']}</p> : <span />}
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
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
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
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <p className="text-right text-xs text-muted-foreground">{notes.length}/600</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="inline-flex items-center gap-2">
          <Send className="h-4 w-4" /> Submit pitch
        </Button>
      </div>
    </form>
  );
}

function CommentAvatar({ name, photo, size = "md" }: { name: string; photo: string; size?: "md" | "sm" }) {
  const cls = size === "md" ? "h-10 w-10" : "h-8 w-8";
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        width={40}
        height={40}
        className={cn(cls, "shrink-0 rounded-full object-cover")}
      />
    );
  }
  return (
    <div className={cn(cls, "flex shrink-0 items-center justify-center rounded-full bg-accent/20 font-display text-xs text-accent")}>
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </div>
  );
}

function CommentsSection() {
  const [comments, setComments] = useState<MemberComment[]>(memberComments);
  const [draft, setDraft] = useState("");
  const [sort, setSort] = useState<"recommended" | "newest">("recommended");
  const [recommendedIds, setRecommendedIds] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const totalCount = comments.reduce((n, c) => n + 1 + c.replies.length, 0);
  const sorted = [...comments].sort((a, b) =>
    sort === "recommended" ? b.recommends - a.recommends : 0,
  );

  function toggleRecommend(id: string) {
    setRecommendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function recommendCount(id: string, base: number) {
    return base + (recommendedIds.has(id) ? 1 : 0);
  }

  function handlePost(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      {
        id: `c-${Date.now()}`,
        text,
        member: "Anish Malhotra",
        memberPhoto: "",
        memberChapter: "London",
        date: "Just now",
        recommends: 0,
        replies: [],
      },
      ...prev,
    ]);
    setDraft("");
  }

  function handleReply(commentId: string, e: React.FormEvent) {
    e.preventDefault();
    const text = replyDraft.trim();
    if (!text) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              replies: [
                ...c.replies,
                {
                  id: `${commentId}-r-${Date.now()}`,
                  text,
                  member: "Anish Malhotra",
                  memberPhoto: "",
                  memberChapter: "London",
                  date: "Just now",
                  recommends: 0,
                },
              ],
            }
          : c,
      ),
    );
    setReplyingTo(null);
    setReplyDraft("");
  }

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

      <form onSubmit={handlePost} className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-4">
        <CommentAvatar name="Anish Malhotra" photo="" />
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
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{draft.length}/400 · comments appear after review</p>
            <Button type="submit" size="sm" disabled={!draft.trim()}>
              Post
            </Button>
          </div>
        </div>
      </form>

      <div className="divide-y divide-border border-y border-border">
        {sorted.map((c) => (
          <article key={c.id} className="py-5">
            <div className="flex gap-3">
              <CommentAvatar name={c.member} photo={c.memberPhoto} />
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  <span className="font-semibold">{c.member}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {c.memberChapter} · {c.date}
                  </span>
                </p>
                <p className="mt-1.5 text-sm leading-relaxed">{c.text}</p>
                <div className="mt-2.5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleRecommend(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      recommendedIds.has(c.id)
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-border text-muted-foreground hover:border-accent hover:text-accent",
                    )}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Recommend {recommendCount(c.id, c.recommends)}
                  </button>
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
                </div>

                {replyingTo === c.id ? (
                  <form onSubmit={(e) => handleReply(c.id, e)} className="mt-3 flex gap-2">
                    <input
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      maxLength={400}
                      placeholder={`Reply to ${c.member.split(" ")[0]}…`}
                      className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button type="submit" size="sm" disabled={!replyDraft.trim()}>
                      Reply
                    </Button>
                  </form>
                ) : null}

                {c.replies.length > 0 ? (
                  <div className="mt-4 space-y-4 border-l-2 border-border pl-4">
                    {c.replies.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <CommentAvatar name={r.member} photo={r.memberPhoto} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">
                            <span className="font-semibold">{r.member}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {r.memberChapter} · {r.date}
                            </span>
                          </p>
                          <p className="mt-1 text-sm leading-relaxed">{r.text}</p>
                          <button
                            type="button"
                            onClick={() => toggleRecommend(r.id)}
                            className={cn(
                              "mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                              recommendedIds.has(r.id)
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent hover:text-accent",
                            )}
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                            Recommend {recommendCount(r.id, r.recommends)}
                          </button>
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
    </section>
  );
}

function MemberInForum() {
  const [tab, setTab] = useState<InforumTabId>("editors-choice");
  const [editionId, setEditionId] = useState<string>(currentEdition.id);
  const [open, setOpen] = useState<InforumArticle | null>(null);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [recCategory, setRecCategory] = useState<RecommendationCategory | "all">("all");
  const visibleRecs =
    recCategory === "all" ? memberRecommendations : memberRecommendations.filter((r) => r.category === recCategory);

  const edition = getEdition(editionId);
  const isCurrent = edition.id === currentEdition.id;
  const articles = articlesForTab(tab, editionId);
  const lead = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="In:Forum"
        description="The full member edition — reporting, essays and dispatches from the Forum500 community."
      />

      <div id="make-an-idea-happen" className="rounded-lg border border-border bg-secondary/50 p-6">
        <h3 className="font-display text-lg font-medium">Make an idea happen</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Members can pitch a story, offer a dispatch from their city, or suggest a subject for the editors. Every
          submission is reviewed by Jessica and Simon before publication.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setPitchOpen(true)}>
          Pitch a story
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            {isCurrent ? "Current edition" : "Archive edition"}
          </p>
          <p className="mt-1 font-display text-xl font-medium">{edition.label} edition</p>
          <p className="text-sm text-muted-foreground">Published {edition.publishedOn}</p>
        </div>
        {!isCurrent ? (
          <Button variant="outline" onClick={() => setEditionId(currentEdition.id)}>
            Back to current edition
          </Button>
        ) : null}
      </div>

      <div className="-mx-1 overflow-x-auto border-y border-border">
        <div className="flex min-w-max items-center gap-1 px-1 py-2">
          {inforumTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                tab === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "recommendations" ? (
        <section className="space-y-6">
          <div>
            <h3 className="font-display text-2xl font-medium">Member Recommendations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Places, stays and books members swear by — shared in confidence, from members who have actually been.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRecCategory("all")}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
                recCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              All
            </button>
            {recommendationCategories.map((c) => (
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
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {visibleRecs.map((r) => (
              <article key={r.id} className="group">
                <img
                  src={r.image}
                  alt={r.title}
                  loading="lazy"
                  width={800}
                  height={600}
                  className="h-40 w-full rounded-md object-cover"
                />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">
                  {recommendationCategories.find((c) => c.id === r.category)?.label} · {r.place}
                </p>
                <h3 className="mt-1 font-display text-lg font-medium leading-snug">{r.title}</h3>
                <p className="mt-2 text-sm italic text-muted-foreground">“{r.note}”</p>
                <div className="mt-3 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                  <img
                    src={r.memberPhoto}
                    alt={r.member}
                    loading="lazy"
                    width={40}
                    height={40}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span>
                    {r.member} · {r.memberChapter} chapter
                  </span>
                </div>
              </article>
            ))}
          </div>
          <div className="rounded-lg border border-border bg-secondary/40 p-5">
            <p className="text-sm text-muted-foreground">
              Have a table, hotel or book worth sharing? Send it to Jessica and Simon and it will appear here after a
              quick review.
            </p>
            <Button variant="outline" className="mt-3" onClick={() => setPitchOpen(true)}>
              Share a recommendation
            </Button>
          </div>
        </section>
      ) : tab === "comments" ? (
        <CommentsSection />
      ) : !lead ? (
        <p className="text-sm text-muted-foreground">No stories in this section yet — new commissions land each week.</p>
      ) : (
        <>
          <article
            className="group grid cursor-pointer gap-6 border-b border-border pb-8 lg:grid-cols-2"
            onClick={() => setOpen(lead)}
          >
            <img
              src={lead.image}
              alt={lead.caption}
              width={1200}
              height={800}
              className="h-64 w-full rounded-md object-cover lg:h-full"
            />
            <div className="flex flex-col justify-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                {lead.sectionLabel} · Lead story
              </p>
              <h2 className="mt-3 font-display text-3xl font-medium leading-tight group-hover:underline sm:text-4xl">
                {lead.title}
              </h2>
              <p className="mt-3 text-muted-foreground">{lead.standfirst}</p>
              <Byline article={lead} className="mt-4" />
            </div>
          </article>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <article key={a.id} className="group cursor-pointer" onClick={() => setOpen(a)}>
                <img
                  src={a.image}
                  alt={a.caption}
                  loading="lazy"
                  width={1200}
                  height={800}
                  className="h-44 w-full rounded-md object-cover"
                />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-accent">{a.sectionLabel}</p>
                <h3 className="mt-1 font-display text-xl font-medium leading-snug group-hover:underline">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.standfirst}</p>
                <Byline article={a} className="mt-3" />
              </article>
            ))}
          </div>
        </>
      )}

      <section className="border-t border-border pt-8">
        <h3 className="font-display text-2xl font-medium">Previous editions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Every In:Forum edition stays open to members. Click an edition to read it in full.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {inforumEditions.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setEditionId(e.id);
                setTab("editors-choice");
                if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={cn(
                "group overflow-hidden rounded-lg border text-left transition-colors",
                e.id === editionId ? "border-accent" : "border-border hover:border-accent",
              )}
            >
              <img
                src={e.cover}
                alt={`${e.label} edition cover`}
                loading="lazy"
                width={800}
                height={600}
                className="h-32 w-full object-cover"
              />
              <div className="p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{e.label}</p>
                <p className="mt-1 font-display text-base leading-snug group-hover:underline">{e.coverLine}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Published {e.publishedOn} · {e.articles.length} stories
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          {open ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl leading-snug">{open.title}</DialogTitle>
              </DialogHeader>
              <img
                src={open.image}
                alt={open.caption}
                loading="lazy"
                width={1200}
                height={800}
                className="h-56 w-full rounded-md object-cover"
              />
              <p className="text-xs text-muted-foreground">{open.caption}</p>
              <p className="text-base text-muted-foreground">{open.standfirst}</p>
              <Byline article={open} />
              <div className="space-y-4 text-sm leading-relaxed">
                {open.body.map((p, i) => (
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
          <PitchForm onClose={() => setPitchOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
