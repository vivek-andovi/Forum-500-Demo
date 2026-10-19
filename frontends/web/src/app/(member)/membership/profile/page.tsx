"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Check, X, ChevronDown, Copy, Download, Linkedin, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useCurrentMember } from "@/hooks/useAuth";
import { useLookups, useMyGallery, useSaveProfile, useSubmitProfile, useTagPhoto } from "@/lib/queries";
import { articleDate, fmtDate, initials as toInitials, readTime, timeAgo, toList } from "@/lib/format";
import type { ContentStatus, GalleryPhoto, Member, ProfileInput } from "@/lib/types";

interface ProfileForm {
  fullName: string;
  headline: string;
  company: string;
  chapterId: string;
  sectorId: string;
  bio: string;
  interests: string;
  travelCities: string;
  avatarUrl: string;
  linkedinUrl: string;
  joinedYear: string;
  answers: Record<string, string>;
}

const emptyForm: ProfileForm = {
  fullName: "",
  headline: "",
  company: "",
  chapterId: "",
  sectorId: "",
  bio: "",
  interests: "",
  travelCities: "",
  avatarUrl: "",
  linkedinUrl: "",
  joinedYear: "",
  answers: {},
};

function formFromMember(m: Member): ProfileForm {
  const answers: Record<string, string> = {};
  for (const a of m.answers ?? []) answers[a.questionId] = a.answer ?? "";
  return {
    fullName: m.fullName ?? "",
    headline: m.headline ?? "",
    company: m.company ?? "",
    chapterId: m.chapterId ?? "",
    sectorId: m.sectorId ?? "",
    bio: m.bio ?? "",
    interests: (m.interests ?? []).join(", "),
    travelCities: (m.travelCities ?? []).join(", "),
    avatarUrl: m.avatarUrl ?? "",
    linkedinUrl: m.linkedinUrl ?? "",
    joinedYear: m.joinedYear ? String(m.joinedYear) : "",
    answers,
  };
}

const statusLabel: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Scheduled",
  published: "Live",
  archived: "Archived",
  rejected: "Not approved",
};

const field =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function CollapsiblePanel({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <h3 className="font-display text-xl font-medium">{title}</h3>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

async function copyPhoto(photo: GalleryPhoto) {
  try {
    const blob = await (await fetch(photo.url)).blob();
    const png = blob.type === "image/png" ? blob : await toPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    toast.success("Photo copied — paste it wherever you need it.");
  } catch {
    toast.error("Your browser blocked copying. Use Download instead.");
  }
}

function toPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
    };
    img.onerror = () => reject(new Error("load failed"));
    img.src = URL.createObjectURL(blob);
  });
}

async function downloadPhoto(photo: GalleryPhoto) {
  const name = `${(photo.caption || "forum500-photo").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
  let href = photo.url;
  let revoke = false;
  try {
    const blob = await (await fetch(photo.url)).blob();
    href = URL.createObjectURL(blob);
    revoke = true;
  } catch {
    // Cross-origin fetch blocked — fall back to opening the image directly.
  }
  const a = document.createElement("a");
  a.href = href;
  a.download = name;
  a.target = "_blank";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (revoke) setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export default function MyMemberProfilePage() {
  const { member, pendingRevision, isLoading, error } = useCurrentMember();
  const lookups = useLookups();
  const gallery = useMyGallery(!!member);
  const saveM = useSaveProfile();
  const submitM = useSubmitProfile();
  const tagM = useTagPhoto();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (member && !editing) setForm(formFromMember(member));
  }, [member, editing]);

  const questions = useMemo(
    () =>
      [...(lookups.data?.profileQuestions ?? [])]
        .filter((q) => q.active !== false)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [lookups.data],
  );
  const chapters = lookups.data?.chapters ?? [];
  const allChapters = lookups.data?.allChapters ?? [];
  const sectors = lookups.data?.sectors ?? [];

  const saving = saveM.isPending || submitM.isPending;

  function buildBody(): ProfileInput {
    const year = parseInt(form.joinedYear, 10);
    return {
      fullName: form.fullName.trim(),
      headline: form.headline.trim(),
      company: form.company.trim(),
      bio: form.bio,
      avatarUrl: form.avatarUrl.trim(),
      linkedinUrl: form.linkedinUrl.trim(),
      interests: toList(form.interests),
      travelCities: toList(form.travelCities),
      joinedYear: Number.isFinite(year) ? year : null,
      chapterId: form.chapterId || null,
      sectorId: form.sectorId || null,
      answers: questions.map((q) => ({ questionId: q.id, answer: form.answers[q.id] ?? "" })),
    };
  }

  function save(submitForReview: boolean) {
    const body = buildBody();
    if (submitForReview) {
      submitM.mutate(body, {
        onSuccess: () => {
          setEditing(false);
          toast.success("Submitted for review — the Forum team will approve your changes before Members see them.");
        },
      });
    } else {
      saveM.mutate(body, {
        onSuccess: () => {
          setEditing(false);
          toast.success("Profile saved as a draft.");
        },
      });
    }
  }

  function cancel() {
    if (member) setForm(formFromMember(member));
    setEditing(false);
  }

  if (isLoading || error) {
    return (
      <div className="space-y-8">
        <PageHeader pageKey="membership/profile" eyebrow="Membership Hub" title="My Member Profile" />
        <QueryState isLoading={isLoading} error={error} />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-8">
        <PageHeader
        pageKey="membership/profile"
          eyebrow="Membership Hub"
          title="My Member Profile"
          description="How you appear to fellow Members in the directory."
        />
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">Admin account — no member profile.</p>
          <p className="mt-1 text-muted-foreground">
            You are signed in as a Forum administrator. Member profiles are edited by Members themselves, or from
            the admin console.
          </p>
        </div>
      </div>
    );
  }

  const pendingReview = !!pendingRevision || member.profileStatus === "pending_review";
  const submittedOn = pendingRevision?.createdAt ?? (member.profileStatus === "pending_review" ? member.updatedAt : null);

  const name = form.fullName || "Member";
  const interestList = toList(form.interests);
  const travelList = toList(form.travelCities);
  const chapterName =
    allChapters.find((c) => c.id === form.chapterId)?.name ??
    chapters.find((c) => c.id === form.chapterId)?.name ??
    (form.chapterId === member.chapterId ? member.chapter?.name : undefined) ??
    "";
  const chapterOptions =
    member.chapter && !chapters.some((c) => c.id === member.chapter?.id) ? [...chapters, member.chapter] : chapters;

  const groups = (member.groupMemberships ?? []).filter((gm) => gm.status === "approved" && gm.group);
  const offers = member.benefitOffers ?? [];
  const articles = member.articles ?? [];
  const appearances = member.podcastAppearances ?? [];
  const photos = gallery.data ?? [];

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
    <div className="space-y-8">
      <PageHeader
        pageKey="membership/profile"
        eyebrow="Membership Hub"
        title="My Member Profile"
        description="How you appear to fellow Members in the directory — edit it, then send your changes to the Forum team for approval."
        action={
          editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> {submitM.isPending ? "Sending…" : "Submit for review"}
              </button>
              <button
                onClick={cancel}
                className="flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" /> Edit profile
            </button>
          )
        }
      />

      {pendingReview && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">
            Your profile changes are with the Forum team{submittedOn ? ` — submitted ${fmtDate(submittedOn)}` : ""}.
          </p>
          <p className="mt-1 text-muted-foreground">
            Simon and Jessica review every profile update before it appears in the Member Directory. Members still
            see your last approved profile until then.
          </p>
        </div>
      )}

      {pendingRevision?.status === "rejected" && pendingRevision.reviewerNote && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="font-medium text-foreground">Note from the Forum team</p>
          <p className="mt-1 text-muted-foreground">{pendingRevision.reviewerNote}</p>
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {editing ? (
            <section className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-medium">Profile details</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Full name</label>
                  <input
                    className={field}
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Headline</label>
                  <input
                    className={field}
                    placeholder="e.g. Founder & Creative Director"
                    value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Where you work</label>
                  <input
                    className={field}
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Chapter / where you live</label>
                  <select
                    className={field}
                    value={form.chapterId}
                    onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
                  >
                    <option value="">Choose a city</option>
                    {chapterOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Sector</label>
                  <select
                    className={field}
                    value={form.sectorId}
                    onChange={(e) => setForm({ ...form, sectorId: e.target.value })}
                  >
                    <option value="">Choose a sector</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Member since (year)</label>
                  <input
                    className={field}
                    inputMode="numeric"
                    value={form.joinedYear}
                    onChange={(e) => setForm({ ...form, joinedYear: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Interests (comma separated)</label>
                  <input
                    className={field}
                    placeholder="Art, sailing, wine…"
                    value={form.interests}
                    onChange={(e) => setForm({ ...form, interests: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cities you travel to often (comma separated)</label>
                  <input
                    className={field}
                    placeholder="New York, Singapore…"
                    value={form.travelCities}
                    onChange={(e) => setForm({ ...form, travelCities: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">About you</label>
                <textarea
                  className={field}
                  rows={4}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                />
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">Photo link</label>
                <input
                  className={field}
                  placeholder="https://…"
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                />
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">LinkedIn profile</label>
                <input
                  className={field}
                  placeholder="https://www.linkedin.com/in/…"
                  value={form.linkedinUrl}
                  onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
                />
              </div>
              <div className="mt-8">
                <h4 className="rule-top font-display text-lg font-medium">The five questions</h4>
                <div className="mt-4 space-y-5">
                  <QueryState isLoading={lookups.isLoading} error={lookups.error} empty={questions.length === 0} emptyText="No questions configured yet.">
                    {questions.map((q) => (
                      <div key={q.id}>
                        <label className="text-sm font-medium">{q.text}</label>
                        <textarea
                          className={field}
                          rows={3}
                          value={form.answers[q.id] ?? ""}
                          onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}
                        />
                      </div>
                    ))}
                  </QueryState>
                </div>
              </div>
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="mt-6 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                {saveM.isPending ? "Saving…" : "Save draft"}
              </button>
            </section>
          ) : (
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
                  onClick={() => setEditing(true)}
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

              <CollapsiblePanel title="My gallery">
                <p className="text-sm text-muted-foreground">
                  Photos of you from Forum gatherings — copy or download any of them to share on LinkedIn or elsewhere.
                  Tag photos in the{" "}
                  <Link href="/events/gallery" className="font-medium text-primary underline underline-offset-4">
                    events Gallery
                  </Link>{" "}
                  to add them here.
                </p>
                <QueryState
                  isLoading={gallery.isLoading}
                  error={gallery.error}
                  empty={photos.length === 0}
                  emptyText="No photos tagged yet."
                  className="mt-5"
                >
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {photos.map((photo) => (
                      <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={photo.caption ?? photo.album?.title ?? "Forum gathering"}
                          loading="lazy"
                          className="h-44 w-full object-cover"
                        />
                        <figcaption className="p-4">
                          <p className="text-sm font-medium leading-snug">
                            {photo.caption || photo.album?.title || "Forum gathering"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                            {[photo.album?.title, photo.album?.dateLabel].filter(Boolean).join(" · ")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copyPhoto(photo)}
                              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                            >
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadPhoto(photo)}
                              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                            >
                              <Download className="h-3.5 w-3.5" /> Download
                            </button>
                            <button
                              type="button"
                              disabled={tagM.isPending}
                              onClick={() =>
                                tagM.mutate(
                                  { id: photo.id, tag: false },
                                  { onSuccess: () => toast("Removed from My Gallery") },
                                )
                              }
                              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-60"
                            >
                              <X className="h-3.5 w-3.5" /> Remove
                            </button>
                          </div>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </QueryState>
                <Link
                  href="/events/gallery"
                  className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ImagePlus className="h-4 w-4" /> Find more photos
                </Link>
              </CollapsiblePanel>

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
            </>
          )}
        </div>

        <aside>
          <div className="rounded-lg border border-border bg-card p-6 lg:sticky lg:top-6">
            {form.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.avatarUrl} alt={`Portrait of ${name}`} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-display text-2xl font-semibold text-secondary-foreground">
                {toInitials(name)}
              </div>
            )}
            <button onClick={() => setEditing(true)} className="mt-3 text-xs font-medium text-primary hover:underline">
              Change photo
            </button>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Lives in</dt>
                <dd className="font-medium">{chapterName || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Works at</dt>
                <dd className="font-medium">{form.company || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sector</dt>
                <dd className="font-medium">
                  {sectors.find((s) => s.id === form.sectorId)?.name ?? member.sector?.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Travels often to</dt>
                <dd className="font-medium">{travelList.length ? travelList.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Chapter</dt>
                <dd className="font-medium">{chapterName || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Membership</dt>
                <dd className="font-medium">{member.tier?.name ?? "Member"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Member since</dt>
                <dd className="font-medium">{form.joinedYear || "—"}</dd>
              </div>
            </dl>
            {form.linkedinUrl ? (
              <a
                href={form.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn profile
              </a>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
              >
                <Linkedin className="h-4 w-4" /> Connect LinkedIn
              </button>
            )}
            <Link
              href="/membership"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              View Member Directory
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
