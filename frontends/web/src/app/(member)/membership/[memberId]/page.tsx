"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Linkedin, MessageSquare } from "lucide-react";
import { MemberAvatar } from "@/components/Avatar";
import { QueryState } from "@/components/QueryState";
import { useMember } from "@/lib/queries";
import { useCurrentMember } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const { data: member, isLoading, error } = useMember(memberId);
  const { member: me } = useCurrentMember();

  if (isLoading || (error && !member)) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <div className="py-20 text-center">
          <p className="font-display text-2xl">Member not found</p>
          <Link href="/membership" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Back to the directory
          </Link>
        </div>
      );
    }
    return <QueryState isLoading={isLoading} error={error} />;
  }
  if (!member) return null;

  const role = [member.headline, member.company].filter(Boolean).join(", ");
  const eyebrow = [member.chapter?.name, member.sector?.name].filter(Boolean).join(" · ");
  const answers = (member.answers ?? []).filter((a) => a.answer?.trim());

  return (
    <div className="space-y-8">
      <Link href="/membership" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Directory
      </Link>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="mt-2 font-display text-4xl font-semibold">{member.fullName}</h1>
          {role && <p className="mt-2 text-lg text-muted-foreground">{role}</p>}
          {member.bio && (
            <div className="mt-8">
              <h2 className="rule-top font-display text-xl font-medium">About</h2>
              <p className="mt-4 leading-relaxed text-foreground/85">{member.bio}</p>
            </div>
          )}
          {answers.length > 0 && (
            <div className="mt-8">
              <h2 className="rule-top font-display text-xl font-medium">In their words</h2>
              <div className="mt-4 space-y-5">
                {answers.map((a) => (
                  <div key={a.id}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                      {a.question?.text ?? ""}
                    </p>
                    <blockquote className="mt-1 font-display text-base italic leading-relaxed">“{a.answer}”</blockquote>
                  </div>
                ))}
              </div>
            </div>
          )}
          {member.interests.length > 0 && (
            <div className="mt-8">
              <h2 className="rule-top font-display text-xl font-medium">Interests</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {member.interests.map((i) => (
                  <span key={i} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{i}</span>
                ))}
              </div>
            </div>
          )}
          {member.travelCities.length > 0 && (
            <div className="mt-8">
              <h2 className="rule-top font-display text-xl font-medium">Often in</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {member.travelCities.map((c) => (
                  <span key={c} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <aside>
          <div className="rounded-lg border border-border bg-card p-6">
            <MemberAvatar
              src={member.avatarUrl}
              name={member.fullName}
              className="h-16 w-16 rounded-full border border-border"
            />
            <dl className="mt-5 space-y-3 text-sm">
              {member.joinedYear && (
                <div><dt className="text-muted-foreground">Member since</dt><dd className="font-medium">{member.joinedYear}</dd></div>
              )}
              {member.tier?.name && (
                <div><dt className="text-muted-foreground">Membership</dt><dd className="font-medium">{member.tier.name}</dd></div>
              )}
              {member.chapter?.name && (
                <div><dt className="text-muted-foreground">Chapter</dt><dd className="font-medium">{member.chapter.name}</dd></div>
              )}
              {member.sector?.name && (
                <div><dt className="text-muted-foreground">Sector</dt><dd className="font-medium">{member.sector.name}</dd></div>
              )}
            </dl>
            {member.linkedinUrl && (
              <a
                href={member.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:border-accent hover:text-accent"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            )}
            {me ? (
              me.id !== member.id && (
                <Link
                  href={`/comms/messages?to=${member.id}`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <MessageSquare className="h-4 w-4" /> Message member
                </Link>
              )
            ) : member.email ? (
              <a
                href={`mailto:${member.email}`}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <MessageSquare className="h-4 w-4" /> Email member
              </a>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
