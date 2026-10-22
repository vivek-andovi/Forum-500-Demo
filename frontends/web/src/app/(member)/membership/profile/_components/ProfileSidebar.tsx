"use client";

import Link from "next/link";
import { Linkedin } from "lucide-react";
import type { Member } from "@/features/membership/types";
import { initials as toInitials } from "@/lib/format";
import type { ProfileForm } from "./profile-form";

/** The sticky card beside the profile: photo, key facts, LinkedIn and a link to the directory. */
export function ProfileSidebar({
  member,
  form,
  name,
  chapterName,
  sectorName,
  travelList,
  onEdit,
}: {
  member: Member;
  form: ProfileForm;
  name: string;
  chapterName: string;
  sectorName: string;
  travelList: string[];
  onEdit: () => void;
}) {
  return (
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
        <button onClick={onEdit} className="mt-3 text-xs font-medium text-primary hover:underline">
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
              {sectorName}
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
            onClick={onEdit}
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
  );
}
