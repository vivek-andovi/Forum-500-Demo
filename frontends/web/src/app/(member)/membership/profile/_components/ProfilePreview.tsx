"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { CollapsiblePanel } from "@/components/CollapsiblePanel";
import type { Article, PodcastEpisode } from "@/features/media/types";
import type { BenefitOffer, Group, GroupMembership, Member, ProfileQuestion } from "@/features/membership/types";
import { articleDate, fmtDate, readTime } from "@/lib/format";
import { statusLabel, type ProfileForm } from "./profile-form";

/**
 * How the profile reads to other Members (shown when not editing), from the current form values.
 * `children` are extra panels rendered at the end (gallery, activity).
 */
export function ProfilePreview({
  member,
  form,
  name,
  interestList,
  questions,
  pendingReview,
  groups,
  offers,
  articles,
  appearances,
  onEdit,
  children,
}: {
  member: Member;
  form: ProfileForm;
  name: string;
  interestList: string[];
  questions: ProfileQuestion[];
  pendingReview: boolean;
  groups: (GroupMembership & { group?: Group })[];
  offers: BenefitOffer[];
  articles: Article[];
  appearances: PodcastEpisode[];
  onEdit: () => void;
  children?: ReactNode;
}) {
  return (
    <>
      <div>
        <h2 className="mt-2 font-display text-4xl font-semibold">{name}</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          {form.headline || "Member, Forum500"}
          {form.company ? ` · ${form.company}` : ""}
        </p>
        <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
          {pendingReview
            ? "Changes awaiting Forum approval"
            : member.isPublished || member.profileStatus === "published"
              ? "Published in the Member Directory"
              : "Draft — not yet visible to Members"}
        </p>
      </div>

      <CollapsiblePanel title="About">
        <p className="leading-relaxed text-muted-foreground">
          {form.bio || "Add a short bio so fellow Members can find you in the directory."}
        </p>
      </CollapsiblePanel>

      <CollapsiblePanel title="Interests">
        {interestList.length ? (
          <div className="flex flex-wrap gap-2">
            {interestList.map((i) => (
              <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                {i}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No interests added yet.</p>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel title="My five questions">
        <div className="space-y-5">
          {questions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium">{q.text}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {form.answers[q.id] || "Not answered yet — edit your profile to add an answer."}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Edit my answers
        </button>
      </CollapsiblePanel>

      <CollapsiblePanel title="My groups">
        <div className="space-y-3">
          {groups.length === 0 && <p className="text-sm text-muted-foreground">You haven&apos;t joined any groups yet.</p>}
          {groups.map((gm) => (
            <div key={gm.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{gm.group?.name}</p>
                {(gm.group?.note || gm.group?.cadence) && (
                  <p className="text-xs text-muted-foreground">
                    {[gm.group?.note, gm.group?.cadence].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
          ))}
          <Link
            href="/membership/groups"
            className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Join a group
          </Link>
        </div>
      </CollapsiblePanel>

      <CollapsiblePanel title="Benefits I'm offering other Members">
        <div className="divide-y divide-border">
          {offers.length === 0 && (
            <p className="text-sm text-muted-foreground">You are not offering any benefits yet.</p>
          )}
          {offers.map((b) => (
            <div key={b.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-display text-lg font-medium leading-snug">{b.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{b.detail || b.offer}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {statusLabel[b.status] ?? b.status}
                </p>
              </div>
              <Link
                href="/membership/benefits"
                className="mt-1 flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
              >
                <Pencil className="h-3.5 w-3.5" />
                View
              </Link>
            </div>
          ))}
        </div>
        <Link
          href="/membership/benefits?offer=new"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Apply to offer a benefit
        </Link>
      </CollapsiblePanel>

      <CollapsiblePanel title="Articles I have published">
        <div className="divide-y divide-border">
          {articles.length === 0 && <p className="text-sm text-muted-foreground">No articles published yet.</p>}
          {articles.map((p) => (
            <div key={p.id} className="py-3 first:pt-0 last:pb-0">
              <p className="font-display text-lg font-medium leading-snug">{p.title}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {[
                  p.sectionLabel ?? (p.publication === "inforum" ? "InForum" : p.publication === "forecast" ? "Forecast" : "Member"),
                  articleDate(p),
                  p.readMinutes ? readTime(p) : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/media/inforum#make-an-idea-happen"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Publish an article
        </Link>
      </CollapsiblePanel>

      <CollapsiblePanel title="Interviews & podcasts">
        <div className="divide-y divide-border">
          {appearances.length === 0 && (
            <p className="text-sm text-muted-foreground">No interviews or podcast appearances yet.</p>
          )}
          {appearances.map((m) => (
            <div key={m.id} className="py-3 first:pt-0 last:pb-0">
              <p className="font-display text-lg font-medium leading-snug">{m.title}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                {[
                  `Podcast · Episode ${m.number}`,
                  fmtDate(m.publishedAt, "MMMM yyyy"),
                  m.durationMinutes ? `${m.durationMinutes} min` : "",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/comms/messages"
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Request an interview
        </Link>
      </CollapsiblePanel>
      {children}
    </>
  );
}
