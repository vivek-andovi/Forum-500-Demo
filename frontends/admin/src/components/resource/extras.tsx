"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Clock, ExternalLink, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, humanize } from "@/lib/format";
import { useMeta } from "@/lib/meta";
import { cn } from "@/lib/utils";
import type { AdminRecord, ResourceMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog, NoteDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";

type ExtrasProps = { resource: ResourceMeta; record: AdminRecord; onChanged: () => Promise<void> | void };

export function ResourceExtras(props: ExtrasProps) {
  switch (props.resource.name) {
    case "applications":
      return <ApplicationActions {...props} />;
    case "profile-revisions":
      return <RevisionReview {...props} />;
    case "pitches":
      return <PitchActions {...props} />;
    case "users":
      return <UserActions {...props} />;
    case "audit-logs":
      return <AuditDetail {...props} />;
    default:
      return null;
  }
}

function WorkflowCard({
  title,
  status,
  children,
  footer,
}: {
  title: string;
  status?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="font-display text-lg">{title}</p>
            {status && <StatusBadge value={status} />}
          </div>
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}

async function run<T>(fn: () => Promise<T>, success: string): Promise<T> {
  try {
    const res = await fn();
    toast.success(success);
    return res;
  } catch (e) {
    toast.error(errorMessage(e));
    throw e;
  }
}

// ───────────────────────── Applications ─────────────────────────

function ApplicationActions({ record, onChanged }: ExtrasProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "approve" | "rejected" | "waitlisted">(null);
  // Kept in sessionStorage: approving refreshes the record, which re-mounts this panel.
  const inviteKey = `approved-invite:${String(record.id)}`;
  const [invite, setInviteState] = useState<{ email: string; devLink?: string } | null>(() => {
    try {
      const raw = sessionStorage.getItem(inviteKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setInvite = (value: { email: string; devLink?: string }) => {
    setInviteState(value);
    try {
      sessionStorage.setItem(inviteKey, JSON.stringify(value));
    } catch {
      /* storage unavailable: panel just won't survive a refresh */
    }
  };
  const status = String(record.status ?? "");
  const decided = record.decidedAt ? formatDateTime(record.decidedAt) : null;

  return (
    <>
      <WorkflowCard
        title="Application decision"
        status={status}
        footer={
          <div className="space-y-2">
            {(record.decisionNote || decided) && (
              <p className="text-sm text-muted-foreground">
                {decided && <>Decided {decided}. </>}
                {record.decisionNote ? <>Note: “{String(record.decisionNote)}”</> : null}
              </p>
            )}
            {invite && (
              <div className="space-y-1 rounded-md border border-accent/40 bg-background p-3 text-sm">
                <p>
                  An invite to set a password was emailed to <strong>{invite.email}</strong>. The link is valid for 7 days.
                </p>
                {invite.devLink && (
                  <p className="break-all font-mono text-xs">
                    Development only (emails are not sent locally):{" "}
                    <a className="underline" href={invite.devLink} target="_blank" rel="noreferrer">{invite.devLink}</a>{" "}
                    <button
                      type="button"
                      className="ml-1 rounded border px-1.5 py-0.5 font-sans text-[11px] hover:bg-muted"
                      onClick={() => navigator.clipboard.writeText(invite.devLink!).then(() => toast.success("Invite link copied"))}
                    >
                      Copy
                    </button>
                  </p>
                )}
              </div>
            )}
            {status === "approved" && !invite && (
              <p className="text-sm text-muted-foreground">
                The member was emailed a set-password invite. To resend it, open the member’s login under System → Users & Logins and use “Send invite link”.
              </p>
            )}
          </div>
        }
      >
        <Button type="button" disabled={status === "approved"} onClick={() => setDialog("approve")}>
          <Check /> Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={status === "waitlisted" || status === "approved"}
          onClick={() => setDialog("waitlisted")}
        >
          <Clock /> Waitlist
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={status === "rejected" || status === "approved"}
          onClick={() => setDialog("rejected")}
        >
          <X /> Reject
        </Button>
      </WorkflowCard>
      <NoteDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Approve application?"
        description="This creates an invited user account and a member profile."
        confirmLabel="Approve"
        onConfirm={async (note) => {
          const res = await run(
            () =>
              api<{ application: AdminRecord; member?: AdminRecord; invite?: { sent: boolean; devLink?: string } }>(
                `/admin/applications/${record.id}/approve`,
                { method: "POST", body: note ? { note } : {} },
              ),
            "Application approved",
          );
          setInvite({ email: String(record.email ?? ""), devLink: res?.invite?.devLink });
          await onChanged();
          const memberId = res?.member?.id;
          if (memberId) {
            toast("Member created", {
              action: { label: "Open member", onClick: () => router.push(`/r/members/${memberId}`) },
            });
          }
        }}
      />
      <NoteDialog
        open={dialog === "rejected" || dialog === "waitlisted"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === "waitlisted" ? "Waitlist application?" : "Reject application?"}
        confirmLabel={dialog === "waitlisted" ? "Waitlist" : "Reject"}
        destructive={dialog === "rejected"}
        onConfirm={async (note) => {
          const st = dialog === "waitlisted" ? "waitlisted" : "rejected";
          await run(
            () =>
              api(`/admin/applications/${record.id}/reject`, {
                method: "POST",
                body: { status: st, ...(note ? { note } : {}) },
              }),
            st === "waitlisted" ? "Application waitlisted" : "Application rejected",
          );
          await onChanged();
        }}
      />
    </>
  );
}

// ───────────────────────── Profile revisions ─────────────────────────

function renderValue(v: unknown) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (Array.isArray(v) && v.every((x) => typeof x !== "object")) {
    return v.length ? v.join(", ") : <span className="text-muted-foreground">—</span>;
  }
  if (typeof v === "object") {
    return (
      <pre className="max-h-56 overflow-auto whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  }
  return <span className="whitespace-pre-wrap break-words">{String(v)}</span>;
}

function RevisionReview({ record, onChanged }: ExtrasProps) {
  const meta = useMeta();
  const memberMeta = meta.data?.resources.find((r) => r.name === "members");
  const memberId = record.memberId as string | undefined;
  const member = useQuery({
    queryKey: ["record", "members", memberId],
    queryFn: () => api<AdminRecord>(`/admin/r/members/${memberId}`),
    enabled: !!memberId,
  });
  const [dialog, setDialog] = useState<null | "approve" | "reject">(null);
  const status = String(record.status ?? "");

  let changes: Record<string, unknown> = {};
  const raw = record.changes;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) changes = raw as Record<string, unknown>;
  else if (typeof raw === "string") {
    try {
      changes = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  const keys = Object.keys(changes);
  const labelFor = (k: string) => memberMeta?.fields.find((f) => f.name === k)?.label ?? humanize(k);

  return (
    <>
      <WorkflowCard
        title="Profile revision"
        status={status}
        footer={
          <div className="space-y-3">
            {memberId && (
              <p className="text-sm text-muted-foreground">
                Member:{" "}
                <Link href={`/r/members/${memberId}`} className="font-semibold text-primary hover:underline">
                  {record._relations?.memberId ?? (member.data?._label as string) ?? memberId}
                </Link>
                {record.reviewerNote ? <> · Note: “{String(record.reviewerNote)}”</> : null}
              </p>
            )}
            <div className="overflow-x-auto rounded-lg border bg-card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-semibold">Field</th>
                    <th className="px-3 py-2 font-semibold">Current</th>
                    <th className="px-3 py-2 font-semibold">Proposed</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                        No changes in this revision.
                      </td>
                    </tr>
                  )}
                  {keys.map((k) => {
                    const current = member.data?.[k];
                    const proposed = changes[k];
                    const changed =
                      member.data !== undefined && JSON.stringify(current ?? null) !== JSON.stringify(proposed ?? null);
                    return (
                      <tr key={k} className={cn("border-b align-top last:border-0", changed && "bg-amber-50/60")}>
                        <td className="whitespace-nowrap px-3 py-2 font-semibold">{labelFor(k)}</td>
                        <td className="max-w-xs px-3 py-2 text-muted-foreground">
                          {member.isLoading ? <Skeleton className="h-4 w-24" /> : renderValue(current)}
                        </td>
                        <td className={cn("max-w-xs px-3 py-2", changed && "font-medium")}>
                          {renderValue(proposed)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        }
      >
        <Button type="button" disabled={status !== "pending"} onClick={() => setDialog("approve")}>
          <Check /> Approve & publish
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={status !== "pending"}
          onClick={() => setDialog("reject")}
        >
          <X /> Reject
        </Button>
      </WorkflowCard>
      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Approve revision?"
        description="The proposed changes will be applied to the member profile and published."
        confirmLabel="Approve"
        onConfirm={async () => {
          await run(
            () => api(`/admin/profile-revisions/${record.id}/approve`, { method: "POST", body: {} }),
            "Revision approved",
          );
          await onChanged();
        }}
      />
      <NoteDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Reject revision?"
        confirmLabel="Reject"
        destructive
        onConfirm={async (note) => {
          await run(
            () =>
              api(`/admin/profile-revisions/${record.id}/reject`, {
                method: "POST",
                body: note ? { note } : {},
              }),
            "Revision rejected",
          );
          await onChanged();
        }}
      />
    </>
  );
}

// ───────────────────────── Pitches ─────────────────────────

function extractArticleId(res: unknown): string | undefined {
  if (!res || typeof res !== "object") return undefined;
  const r = res as Record<string, unknown>;
  const article = r.article as Record<string, unknown> | undefined;
  if (article && typeof article.id === "string") return article.id;
  if (typeof r.articleId === "string") return r.articleId;
  if (typeof r.publication === "string" && typeof r.id === "string") return r.id;
  return undefined;
}

function PitchActions({ record, onChanged }: ExtrasProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "accept" | "decline">(null);
  const status = String(record.status ?? "");
  const articleId = record.articleId as string | undefined;

  return (
    <>
      <WorkflowCard
        title="Pitch review"
        status={status}
        footer={
          articleId && (
            <p className="text-sm">
              <Link
                href={`/r/articles/${articleId}`}
                className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
              >
                <FileText className="size-4" />
                {record._relations?.articleId ?? "Open draft article"}
                <ExternalLink className="size-3" />
              </Link>
            </p>
          )
        }
      >
        <Button type="button" disabled={status === "approved" || !!articleId} onClick={() => setDialog("accept")}>
          <Check /> Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={status === "rejected"}
          onClick={() => setDialog("decline")}
        >
          <X /> Decline
        </Button>
      </WorkflowCard>
      <ConfirmDialog
        open={dialog === "accept"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Accept pitch?"
        description="A draft article will be created from this pitch."
        confirmLabel="Accept"
        onConfirm={async () => {
          const res = await run(
            () => api<unknown>(`/admin/pitches/${record.id}/accept`, { method: "POST", body: {} }),
            "Pitch accepted — draft article created",
          );
          await onChanged();
          const id = extractArticleId(res);
          if (id) {
            toast("Draft article ready", {
              action: { label: "Open article", onClick: () => router.push(`/r/articles/${id}`) },
            });
          }
        }}
      />
      <ConfirmDialog
        open={dialog === "decline"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Decline pitch?"
        confirmLabel="Decline"
        destructive
        onConfirm={async () => {
          await run(
            () => api(`/admin/pitches/${record.id}/decline`, { method: "POST", body: {} }),
            "Pitch declined",
          );
          await onChanged();
        }}
      />
    </>
  );
}

// ───────────────────────── Users ─────────────────────────

function UserActions({ record, onChanged }: ExtrasProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const id = String(record.id);
  const status = String(record.status ?? "");

  const sendInvite = async () => {
    setBusy("invite");
    try {
      const res = await run(
        () => api<{ sent: boolean; devLink?: string }>(`/admin/users/${id}/send-invite`, { method: "POST" }),
        "Set-password link sent by email",
      );
      setDevLink(res.devLink ?? null);
      await onChanged();
    } catch {
      /* toast shown */
    } finally {
      setBusy(null);
    }
  };

  const revoke = async () => {
    setBusy("revoke");
    try {
      await run(() => api(`/admin/users/${id}/revoke-sessions`, { method: "POST" }), "User signed out of all devices");
      await onChanged();
    } catch {
      /* toast shown */
    } finally {
      setBusy(null);
      setConfirmRevoke(false);
    }
  };

  return (
    <WorkflowCard
      title="Account access"
      status={status}
      footer={
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            {status === "invited"
              ? "This member has not set a password yet. Send them a fresh set-password link (valid 7 days)."
              : "Send a set-password link if they forgot their password, or sign them out everywhere if a device is lost. Setting the status (top right) to Suspended blocks access immediately."}
          </p>
          {devLink && (
            <p className="break-all rounded-md border border-dashed border-accent/50 bg-background p-2 font-mono text-xs">
              Development only — invite link: <a className="underline" href={devLink} target="_blank" rel="noreferrer">{devLink}</a>
            </p>
          )}
        </div>
      }
    >
      <Button size="sm" onClick={sendInvite} disabled={!!busy || status === "suspended"}>
        {busy === "invite" ? "Sending…" : status === "invited" ? "Send invite link" : "Send password link"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirmRevoke(true)} disabled={!!busy}>
        Sign out everywhere
      </Button>
      <ConfirmDialog
        open={confirmRevoke}
        onOpenChange={setConfirmRevoke}
        title="Sign this user out of every device?"
        description="All their current sessions end immediately. They can sign in again with their password."
        confirmLabel="Sign out everywhere"
        destructive
        onConfirm={revoke}
      />
    </WorkflowCard>
  );
}

// ───────────────────────── Audit log ─────────────────────────

type AuditChange = { field: string; label: string; from: unknown; to: unknown };

function renderAuditValue(v: unknown) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground/70">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : <span className="text-muted-foreground/70">—</span>;
  if (typeof v === "object") return <code className="text-xs">{JSON.stringify(v)}</code>;
  const str = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return formatDateTime(str);
  return str;
}

function AuditDetail({ record }: ExtrasProps) {
  const changes = (Array.isArray(record.changes) ? record.changes : []) as AuditChange[];
  const who = [record.actorName, record.actorEmail].filter(Boolean).join(" · ") || "System";
  const entityLink =
    record.entityId && record.action !== "delete" && record.entity
      ? `/r/${String(record.entity)}/${String(record.entityId)}`
      : null;
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-1">
          <p className="font-display text-xl">{String(record.summary ?? record.action)}</p>
          <p className="text-sm text-muted-foreground">
            {who} · {formatDateTime(String(record.createdAt))}
            {record.ip ? ` · IP ${String(record.ip)}` : ""}
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Action</dt>
            <dd className="mt-1 capitalize">{humanize(String(record.action ?? ""))}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Type</dt>
            <dd className="mt-1">{String(record.entityType ?? record.entity ?? "")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Record</dt>
            <dd className="mt-1">
              {entityLink ? (
                <Link href={entityLink} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                  {String(record.entityLabel ?? "Open record")} <ExternalLink className="size-3" />
                </Link>
              ) : (
                String(record.entityLabel ?? "—")
              )}
            </dd>
          </div>
        </dl>
        {changes.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Field</th>
                  <th className="px-3 py-2 font-medium">Before</th>
                  <th className="px-3 py-2 font-medium">After</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => (
                  <tr key={c.field} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">{c.label}</td>
                    <td className="max-w-xs px-3 py-2 text-muted-foreground line-through decoration-muted-foreground/40">{renderAuditValue(c.from)}</td>
                    <td className="max-w-xs px-3 py-2">{renderAuditValue(c.to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No field-level changes recorded for this action.</p>
        )}
      </CardContent>
    </Card>
  );
}
