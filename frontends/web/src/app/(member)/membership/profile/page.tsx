"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useCurrentMember } from "@/hooks/useAuth";
import { useMyGallery, useTagPhoto } from "@/features/events/queries";
import { useSaveProfile, useSubmitProfile } from "@/features/membership/queries";
import type { ProfileInput } from "@/features/membership/types";
import { useLookups } from "@/features/site/queries";
import { fmtDate, toList } from "@/lib/format";
import { ActivityPanel } from "./_components/ActivityPanel";
import { GalleryPanel } from "./_components/GalleryPanel";
import { ProfileEditForm } from "./_components/ProfileEditForm";
import { ProfilePreview } from "./_components/ProfilePreview";
import { ProfileSidebar } from "./_components/ProfileSidebar";
import { emptyForm, formFromMember, type ProfileForm } from "./_components/profile-form";

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
          toast.success(
            member?.isPublished
              ? "Draft saved. Members see your changes once you submit them for review and they're approved."
              : "Profile saved.",
          );
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
            <ProfileEditForm
              form={form}
              setForm={setForm}
              chapterOptions={chapterOptions}
              sectors={sectors}
              questions={questions}
              questionsLoading={lookups.isLoading}
              questionsError={lookups.error}
              saving={saving}
              savingDraft={saveM.isPending}
              onSaveDraft={() => save(false)}
            />
          ) : (
            <ProfilePreview
              member={member}
              form={form}
              name={name}
              interestList={interestList}
              questions={questions}
              pendingReview={pendingReview}
              groups={groups}
              offers={offers}
              articles={articles}
              appearances={appearances}
              onEdit={() => setEditing(true)}
            >
              <GalleryPanel
                photos={photos}
                isLoading={gallery.isLoading}
                error={gallery.error}
                removing={tagM.isPending}
                onRemove={(photo) =>
                  tagM.mutate({ id: photo.id, tag: false }, { onSuccess: () => toast("Removed from My Gallery") })
                }
              />
              <ActivityPanel articles={articles} appearances={appearances} offers={offers} groups={groups} />
            </ProfilePreview>
          )}
        </div>

        <aside>
          <ProfileSidebar
            member={member}
            form={form}
            name={name}
            chapterName={chapterName}
            sectorName={sectors.find((s) => s.id === form.sectorId)?.name ?? member.sector?.name ?? "—"}
            travelList={travelList}
            onEdit={() => setEditing(true)}
          />
        </aside>
      </div>
    </div>
  );
}
