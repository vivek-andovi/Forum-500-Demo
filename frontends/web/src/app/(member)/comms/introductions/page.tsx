"use client";

import { useDeferredValue, useState, type FormEvent } from "react";
import Link from "next/link";
import { Check, Handshake, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { MemberOnly } from "@/components/MemberOnly";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentMember } from "@/hooks/useAuth";
import { useIntroductions, useRequestIntroduction, useRespondIntroduction } from "@/features/comms/queries";
import { useMembers } from "@/features/membership/queries";
import { timeAgo } from "@/lib/format";
import type { IntroductionStatus } from "@/features/comms/types";
import type { Member } from "@/features/membership/types";

const statusLabel: Record<IntroductionStatus, string> = {
  requested: "Requested",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

const statusClass: Record<IntroductionStatus, string> = {
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  declined: "bg-secondary text-muted-foreground",
  requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200",
};

function IntroductionList({ myId }: { myId: string }) {
  const { data: intros = [], isLoading, error } = useIntroductions();
  const respond = useRespondIntroduction();

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      empty={intros.length === 0}
      emptyText="No introductions yet — request one to get started."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {intros.map((intro) => {
          const iAmTarget = intro.targetId === myId || intro.target?.id === myId;
          const other: Member | null | undefined = iAmTarget ? intro.requester : intro.target;
          const introducer = intro.introducer?.fullName ?? intro.introducerName ?? "Forum Team";
          const canRespond = iAmTarget && (intro.status === "requested" || intro.status === "pending");
          const busy = respond.isPending && respond.variables?.id === intro.id;
          return (
            <div key={intro.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Handshake className="h-5 w-5 text-accent" />
                  <div>
                    <p className="text-sm font-medium">
                      {iAmTarget ? "Requested by" : "Introduced by"}{" "}
                      {iAmTarget ? (intro.requester?.fullName ?? "a member") : introducer}
                    </p>
                    <p className="text-xs text-muted-foreground">{timeAgo(intro.createdAt)}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[intro.status] ?? ""}`}>
                  {statusLabel[intro.status] ?? intro.status}
                </span>
              </div>
              {intro.reason && <p className="mt-4 text-sm text-muted-foreground">{intro.reason}</p>}
              {other && (
                <div className="mt-5 flex items-center gap-3">
                  <MemberAvatar
                    src={other.avatarUrl}
                    name={other.fullName}
                    className="h-10 w-10 shrink-0 rounded-full"
                  />
                  <div>
                    <Link href={`/membership/${other.slug}`} className="text-sm font-medium hover:underline">
                      {other.fullName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {[other.headline, other.chapter?.name].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              )}
              {canRespond && (
                <div className="mt-5 flex gap-2">
                  <Button
                    size="sm"
                    disabled={busy}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() =>
                      respond.mutate(
                        { id: intro.id, accept: true },
                        { onSuccess: () => toast.success("Introduction accepted") },
                      )
                    }
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      respond.mutate(
                        { id: intro.id, accept: false },
                        { onSuccess: () => toast.success("Introduction declined") },
                      )
                    }
                  >
                    Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </QueryState>
  );
}

function RequestDialog({ open, onOpenChange, myId }: { open: boolean; onOpenChange: (v: boolean) => void; myId: string }) {
  const [search, setSearch] = useState("");
  const deferred = useDeferredValue(search.trim());
  const { data: members = [], isLoading, error } = useMembers({ search: deferred || undefined });
  const [target, setTarget] = useState<Member | null>(null);
  const [reason, setReason] = useState("");
  const request = useRequestIntroduction();

  const options = members.filter((m) => m.id !== myId).slice(0, 30);

  const reset = () => {
    setSearch("");
    setTarget(null);
    setReason("");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!target || !reason.trim()) return;
    request.mutate(
      { targetMemberId: target.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Introduction requested", { description: `We'll be in touch about ${target.fullName}.` });
          reset();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Request an introduction</DialogTitle>
            <DialogDescription>
              Choose a member and tell Simon or Jessica why you would like to meet.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="intro-search">Member</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="intro-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, company or city"
                className="pl-9"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-border">
              <QueryState
                isLoading={isLoading}
                error={error}
                empty={options.length === 0}
                emptyText="No members match your search."
                className="border-0 py-4"
              >
                <ul>
                  {options.map((m) => {
                    const selected = target?.id === m.id;
                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setTarget(m)}
                          aria-pressed={selected}
                          className={`flex w-full items-center gap-3 border-b border-border px-3 py-2 text-left last:border-0 transition-colors ${
                            selected ? "bg-secondary" : "hover:bg-secondary/60"
                          }`}
                        >
                          <MemberAvatar src={m.avatarUrl} name={m.fullName} className="h-8 w-8 shrink-0 rounded-full" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{m.fullName}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {[m.headline, m.company, m.chapter?.name].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          {selected && <Check className="h-4 w-4 text-accent" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </QueryState>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intro-reason">Why would you like to meet?</Label>
            <Textarea
              id="intro-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="A sentence or two on what you have in common or hope to discuss."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!target || !reason.trim() || request.isPending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {request.isPending ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function IntroductionsPage() {
  const { member, isLoading } = useCurrentMember();
  const [open, setOpen] = useState(false);
  const myId = member?.id;

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/introductions"
        eyebrow="Communications Hub"
        title="Member Introductions"
        description="Introductions made by Simon, Jessica and fellow members."
        action={
          myId ? (
            <Button onClick={() => setOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <UserPlus className="mr-2 h-4 w-4" /> Request an introduction
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <QueryState isLoading />
      ) : (
        <MemberOnly
          member={myId}
          fallback={<QueryState empty emptyText="Admin account — no member profile, so there are no introductions to show." />}
        >
          {(myId) => (
            <>
              <IntroductionList myId={myId} />
              <RequestDialog open={open} onOpenChange={setOpen} myId={myId} />
            </>
          )}
        </MemberOnly>
      )}
    </div>
  );
}
