"use client";

import { useState } from "react";
import { ThumbsUp, Reply } from "lucide-react";
import { toast } from "sonner";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { MemberOnly } from "@/components/MemberOnly";
import { Button } from "@/components/ui/button";
import { editorialFieldClass } from "@/components/form";
import { useCurrentMember } from "@/hooks/useAuth";
import { useComments, usePostComment, useRecommendComment } from "@/features/media/queries";
import type { Comment } from "@/features/media/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

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

function RecommendButton({
  c,
  active,
  disabled,
  onRecommend,
  className,
}: {
  c: Comment;
  active: boolean;
  disabled: boolean;
  onRecommend: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onRecommend}
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

/** The "Comments" tab: post form, sort toggle and moderated comment threads with replies. */
export function CommentsSection() {
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

  const recommendProps = (c: Comment) => ({
    active: recommendedIds.has(c.id),
    disabled: !member || (recommend.isPending && recommend.variables === c.id),
    onRecommend: () => recommend.mutate(c.id),
  });

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

      <MemberOnly
        member={member}
        className="rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted-foreground"
        message="Admin account — no member profile. Commenting is available to members only."
      >
        {(member) => (
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
                className={cn(editorialFieldClass, "resize-none")}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{draft.length}/400 · comments appear after review</p>
                <Button type="submit" size="sm" disabled={!draft.trim() || post.isPending}>
                  Post
                </Button>
              </div>
            </div>
          </form>
        )}
      </MemberOnly>

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
                    <RecommendButton c={c} {...recommendProps(c)} />
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
                        className={cn(editorialFieldClass, "min-w-0 flex-1 w-auto")}
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
                            <RecommendButton c={r} {...recommendProps(r)} className="mt-2" />
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
