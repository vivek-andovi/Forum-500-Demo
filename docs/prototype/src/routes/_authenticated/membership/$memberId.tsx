import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { members } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/membership/$memberId")({
  loader: ({ params }) => {
    const member = members.find((m) => m.id === params.memberId);
    if (!member) throw notFound();
    return { member };
  },
  notFoundComponent: () => (
    <div className="py-20 text-center">
      <p className="font-display text-2xl">Member not found</p>
      <Link to="/membership" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
        Back to the directory
      </Link>
    </div>
  ),
  component: MemberProfile,
});

function MemberProfile() {
  const { member } = Route.useLoaderData();
  return (
    <div className="space-y-8">
      <Link to="/membership" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Directory
      </Link>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="eyebrow">{member.city} · {member.sector}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">{member.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">{member.headline}, {member.company}</p>
          <div className="mt-8">
            <h2 className="rule-top font-display text-xl font-medium">About</h2>
            <p className="mt-4 leading-relaxed text-foreground/85">{member.bio}</p>
          </div>
          <div className="mt-8">
            <h2 className="rule-top font-display text-xl font-medium">Interests</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {member.interests.map((i) => (
                <span key={i} className="rounded-full border border-border bg-card px-3 py-1 text-sm">{i}</span>
              ))}
            </div>
          </div>
        </div>
        <aside>
          <div className="rounded-lg border border-border bg-card p-6">
            <img
              src={member.photo}
              alt={`Portrait of ${member.name}`}
              loading="lazy"
              className="h-16 w-16 rounded-full border border-border object-cover"
            />
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Member since</dt><dd className="font-medium">{member.joined}</dd></div>
              <div><dt className="text-muted-foreground">Membership</dt><dd className="font-medium">{member.tier}</dd></div>
              <div><dt className="text-muted-foreground">Chapter</dt><dd className="font-medium">{member.city}</dd></div>
            </dl>
            <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              <MessageSquare className="h-4 w-4" /> Message member
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
