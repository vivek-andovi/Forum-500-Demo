"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Heart, ImagePlus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentMember } from "@/hooks/useAuth";
import { useFeed, useLikePost, usePostFeed } from "@/features/media/queries";
import { timeAgo } from "@/lib/format";
import type { FeedPost } from "@/features/media/types";

export default function NewsfeedPage() {
  const { member } = useCurrentMember();
  const { data, isLoading, error } = useFeed();
  const posts = data?.posts ?? [];
  const likedIds = data?.likedIds ?? [];
  const postFeed = usePostFeed();
  const like = useLikePost();

  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    postFeed.mutate(
      { body: text, imageUrl: imageUrl.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Thanks — your post is in review and will appear once approved");
          setBody("");
          setImageUrl("");
          setShowImage(false);
        },
      },
    );
  };

  const share = async (post: FeedPost) => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/media/newsfeed#${post.id}` : "";
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/newsfeed"
        eyebrow="Media Hub"
        title="Newsfeed"
        description="Posts, photos and updates shared by members across the chapters."
      />

      {member && (
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
          <div className="flex gap-3">
            <MemberAvatar src={member.avatarUrl} name={member.fullName} className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-3">
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                placeholder="Share an update with fellow members…"
                maxLength={2000}
                aria-label="Post text"
              />
              {showImage && (
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (https://…)"
                  aria-label="Image URL"
                />
              )}
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowImage((v) => !v)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ImagePlus className="h-4 w-4" /> {showImage ? "Remove image" : "Add image"}
                </button>
                <Button type="submit" disabled={!body.trim() || postFeed.isPending}>
                  {postFeed.isPending ? "Posting…" : "Post"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      <QueryState isLoading={isLoading} error={error} empty={posts.length === 0} emptyText="No posts yet.">
        <div className="space-y-6">
          {posts.map((post) => {
            const liked = likedIds.includes(post.id);
            return (
              <article key={post.id} id={post.id} className="rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3 px-5 pt-5">
                  <MemberAvatar src={post.authorPhotoUrl} name={post.authorName} className="h-11 w-11 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-tight">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[post.authorMeta, timeAgo(post.createdAt)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
                <p className="whitespace-pre-line px-5 pt-3 leading-relaxed text-foreground/90">{post.body}</p>
                {post.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.imageUrl}
                    alt={post.imageAlt ?? ""}
                    className="mt-4 max-h-96 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <div className="flex items-center gap-6 border-t border-border px-5 py-3 text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => like.mutate(post.id)}
                    disabled={like.isPending && like.variables === post.id}
                    aria-pressed={liked}
                    className={`inline-flex items-center gap-1.5 transition-colors hover:text-foreground ${
                      liked ? "text-accent" : ""
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} /> {post.likes}
                  </button>
                  <button
                    type="button"
                    onClick={() => share(post)}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Share2 className="h-4 w-4" /> Share
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </QueryState>

      <p className="text-sm text-muted-foreground">
        Want to post here?{" "}
        <Link href="/media/inforum#make-an-idea-happen" className="text-accent hover:underline">
          Publish an article
        </Link>{" "}
        or share from a hub — posts appear after a quick Forum review.
      </p>
    </div>
  );
}
