import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Clock, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { allGroups, myGroups } from "@/lib/forum-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/membership/groups")({
  head: () => ({
    meta: [
      { title: "Member Groups — Forum500" },
      { name: "description", content: "Interest-based Forum500 groups — join or apply to create one." },
      { property: "og:title", content: "Member Groups — Forum500" },
      { property: "og:description", content: "Interest-based Forum500 groups — join or apply to create one." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MemberGroups,
});

function MemberGroups() {
  const myIds = new Set(myGroups.map((g) => g.id));
  const [joined, setJoined] = useState<Set<string>>(myIds);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [proposals, setProposals] = useState<{ name: string; note: string }[]>([]);

  const toggle = (id: string) => {
    if (joined.has(id)) {
      setJoined((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }
    if (requested.has(id)) {
      setRequested((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast("Request withdrawn.");
      return;
    }
    setRequested((prev) => new Set(prev).add(id));
    toast.success("Request sent — the Forum team will approve your place in this group.");
  };

  const submitProposal = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setProposals((prev) => [
      ...prev,
      {
        name: String(data.get("group-name") ?? "New group"),
        note: String(data.get("group-purpose") ?? ""),
      },
    ]);
    setSubmitted(true);
  };

  const joinedGroups = allGroups.filter((g) => joined.has(g.id));
  const discoverGroups = allGroups.filter((g) => !joined.has(g.id));

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Membership Hub"
        title="Member Groups"
        description="Interest-based groups within the Forum — open to every Member, and only Members. New groups and new joiners are approved by the Forum team."
      />

      {/* Apply to create a group CTA */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-lg font-medium">Start something new</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Any Member can apply to start a group. Simon and Jessica review every application before the
            group goes live to the Membership.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setCreateOpen(true);
          }}
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Apply to create a group
        </button>
      </div>

      {/* Awaiting approval */}
      {(proposals.length > 0 || requested.size > 0) && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-medium">Awaiting Forum approval</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proposals.map((p) => (
              <div key={p.name} className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                <h3 className="font-display text-lg font-medium">{p.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.note || "Group application submitted."}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Clock className="h-3.5 w-3.5" /> Application in review
                </span>
              </div>
            ))}
            {allGroups
              .filter((g) => requested.has(g.id))
              .map((g) => (
                <div key={g.id} className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                  <h3 className="font-display text-lg font-medium">{g.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{g.note}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Clock className="h-3.5 w-3.5" /> Join request in review
                  </span>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* My groups */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium">My Groups</h2>
        {joinedGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">You haven't joined any groups yet — browse below.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {joinedGroups.map((g) => (
              <GroupCard key={g.id} group={g} state="joined" onToggle={() => toggle(g.id)} />
            ))}
          </div>
        )}
      </section>

      {/* Discover */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium">Discover Groups</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discoverGroups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              state={requested.has(g.id) ? "pending" : "open"}
              onToggle={() => toggle(g.id)}
            />
          ))}
        </div>
      </section>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setSubmitted(false);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <p className="eyebrow">Member Groups</p>
            <DialogTitle className="font-display text-2xl font-medium">Apply to create a group</DialogTitle>
            <DialogDescription>
              Tell us about the group you'd like to start. The Forum team reviews and approves every group
              before it is visible to the Membership.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
                <p className="font-medium text-foreground">Thank you — your application has been submitted.</p>
                <p className="mt-1 text-muted-foreground">
                  Simon and Jessica will review it and come back to you before the group is opened to other
                  Members.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={submitProposal} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="group-name">Group name</Label>
                <Input id="group-name" name="group-name" required placeholder="e.g. Forum Sailing" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-purpose">What is the group for?</Label>
                <Textarea
                  id="group-purpose"
                  name="group-purpose"
                  rows={3}
                  required
                  placeholder="A line or two Members will see when they discover the group."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-activity">How often would it meet or post?</Label>
                <Input id="group-activity" name="group-activity" placeholder="e.g. A dinner each quarter, plus a WhatsApp thread" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="group-members">Members who would join with you</Label>
                <Textarea id="group-members" name="group-members" rows={2} placeholder="Names of Members who have already shown interest." />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit">Submit application</Button>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GroupCard({
  group,
  state,
  onToggle,
}: {
  group: { id: string; name: string; members: number; note: string };
  state: "joined" | "pending" | "open";
  onToggle: () => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-medium">{group.name}</h3>
        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" /> {group.members}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{group.note}</p>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={state !== "open"}
        className={cn(
          "mt-4 inline-flex w-fit items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
          state === "open"
            ? "border-border text-foreground hover:border-primary/50 hover:text-primary"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
        )}
      >
        {state === "joined" ? (
          <>
            <Check className="h-3.5 w-3.5" /> Joined
          </>
        ) : state === "pending" ? (
          <>
            <Clock className="h-3.5 w-3.5" /> Request pending
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5" /> Request to join
          </>
        )}
      </button>
    </div>
  );
}
