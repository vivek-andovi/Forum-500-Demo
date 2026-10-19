"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useCurrentMember } from "@/hooks/useAuth";
import { SecuritySettings } from "@/components/SecuritySettings";

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground/90">
        {value === null || value === undefined || value === "" ? <span className="text-muted-foreground">—</span> : value}
      </p>
    </div>
  );
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  published: "Published",
};

export default function AccountPage() {
  const { user, member, pendingRevision, isLoading, error } = useCurrentMember();

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/account"
        eyebrow="Communications Hub"
        title="Account & Profile"
        description="What fellow members see in the directory. Keep it current — good introductions start here."
        action={
          member ? (
            <Button asChild>
              <Link href="/membership/profile">Edit profile</Link>
            </Button>
          ) : undefined
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        <div className="max-w-2xl space-y-5 rounded-lg border border-border bg-card p-6">
          <h2 className="font-display text-lg font-medium">Account</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Email" value={user?.email} />
            <Field label="Role" value={user?.role === "admin" ? "Administrator" : user?.role ? "Member" : ""} />
          </div>
        </div>

        {member ? (
          <div className="mt-8 max-w-2xl space-y-5 rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <MemberAvatar src={member.avatarUrl} name={member.fullName} className="h-14 w-14 rounded-full" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-medium">{member.fullName}</h2>
                <p className="text-sm text-muted-foreground">
                  {[member.headline, member.company].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Full name" value={member.fullName} />
              <Field label="Membership tier" value={member.tier?.name} />
              <Field label="Chapter" value={member.chapter?.name} />
              <Field label="Sector" value={member.sector?.name} />
              <Field label="Member since" value={member.joinedYear} />
              <Field label="Profile status" value={statusLabel[member.profileStatus] ?? member.profileStatus} />
            </div>
            {member.interests?.length ? <Field label="Interests" value={member.interests.join(", ")} /> : null}
            {member.bio && (
              <div>
                <p className="text-sm font-medium">About you</p>
                <p className="mt-1.5 whitespace-pre-line rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground/90">
                  {member.bio}
                </p>
              </div>
            )}
            {pendingRevision?.status === "pending" && (
              <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                Your latest profile changes are awaiting review by the Forum team.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild>
                <Link href="/membership/profile">Edit profile</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Profile edits are made on your membership profile and published after a quick review.
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-8 max-w-2xl rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Admin account — no member profile.
          </p>
        )}
        <SecuritySettings />
      </QueryState>
    </div>
  );
}
