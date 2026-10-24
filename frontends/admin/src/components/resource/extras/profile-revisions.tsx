"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { humanize } from "@/lib/format";
import { recordHref, useMeta } from "@/lib/meta";
import { useList, useRecord } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog, NoteDialog } from "@/components/common/confirm-dialog";
import { ReadableValue } from "@/components/common/readable-value";
import { useWorkflowMutation } from "@/components/resource/hooks";
import { WorkflowCard } from "@/components/resource/extras/workflow-card";
import type { ExtrasProps } from "@/components/resource/extras/types";

const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/** Equal for review purposes: empty values ("", null, []) match each other. */
function sameValue(a: unknown, b: unknown) {
  if (isEmpty(a) && isEmpty(b)) return true;
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** `changes` arrives as an object, or as a JSON string on older rows. */
function parseChanges(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  return {};
}

export function RevisionReview({ record, onChanged }: ExtrasProps) {
  const meta = useMeta();
  const memberMeta = meta.data?.resources.find((r) => r.name === "members");
  const memberId = record.memberId as string | undefined;
  const member = useRecord("members", memberId);
  const [dialog, setDialog] = useState<null | "approve" | "reject">(null);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const status = String(record.status ?? "");

  const changes = parseChanges(record.changes);
  const keys = Object.keys(changes);
  const labelFor = (k: string) => memberMeta?.fields.find((f) => f.name === k)?.label ?? humanize(k);
  // The member's current answers live in their own table, not on the member record.
  const answers = useList("member-answers", { "filter.memberId": memberId ?? "", pageSize: 100 });
  // Once approved, the revision is part of the profile; its audit entry recorded what changed.
  const approved = status === "approved";
  const audit = useList("audit-logs", { "filter.entityId": String(record.id), "filter.action": "approve", pageSize: 1 });
  const approval = audit.data?.data?.[0];
  const comparing = approved ? audit.isLoading : member.isLoading || answers.isLoading;

  // Members submit their whole profile, so compare each field with the live profile and show
  // only what changes. Answers are compared question by question.
  const currentAnswer = new Map((answers.data?.data ?? []).map((a) => [String(a.questionId), String(a.answer ?? "")]));
  const proposedAnswers = (Array.isArray(changes.answers) ? changes.answers : []) as { questionId: string; answer?: string }[];
  const changedAnswers = proposedAnswers.filter((a) => (currentAnswer.get(a.questionId) ?? "").trim() !== (a.answer ?? "").trim());
  const rows = keys.map((k) => {
    if (k === "answers") {
      const shown = changedAnswers.length ? changedAnswers : proposedAnswers;
      return {
        key: k,
        changed: changedAnswers.length > 0,
        current: shown.map((a) => ({ questionId: a.questionId, answer: currentAnswer.get(a.questionId) ?? "" })),
        proposed: shown,
      };
    }
    const current = member.data?.[k];
    return { key: k, changed: !sameValue(current, changes[k]), current, proposed: changes[k] };
  });
  const auditRows = ((approval?.changes as { field: string; from: unknown; to: unknown }[] | undefined) ?? []).map((c) => ({
    key: c.field,
    changed: true,
    current: c.from,
    proposed: c.to,
  }));
  const changedRows = approved && approval ? auditRows : rows.filter((r) => r.changed);
  const unchangedRows = approved && approval ? [] : rows.filter((r) => !r.changed);
  const visibleRows = comparing ? [] : showUnchanged ? [...changedRows, ...unchangedRows] : changedRows;

  // Names instead of ids: proposed values via the revision's `_refs`, current ones via the
  // member's (and answers') relation labels.
  const proposedRefs = record._refs;
  const currentRefs: Record<string, string | null> = {};
  for (const row of [member.data, ...(answers.data?.data ?? [])]) {
    for (const [fk, label] of Object.entries(row?._relations ?? {})) currentRefs[String(row?.[fk] ?? "")] = label;
  }

  const approve = useWorkflowMutation({
    mutationFn: () => api(`/admin/profile-revisions/${record.id}/approve`, { method: "POST", body: {} }),
    success: "Revision approved",
    onSuccess: () => onChanged(),
  });
  const reject = useWorkflowMutation({
    mutationFn: (note: string) =>
      api(`/admin/profile-revisions/${record.id}/reject`, { method: "POST", body: note ? { note } : {} }),
    success: "Revision rejected",
    onSuccess: () => onChanged(),
  });

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
                <Link href={recordHref("members", memberId)} className="font-semibold text-primary hover:underline">
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
                    <th className="px-3 py-2 font-semibold">{approved && approval ? "Before" : "Current"}</th>
                    <th className="px-3 py-2 font-semibold">{approved && approval ? "After" : "Proposed"}</th>
                  </tr>
                </thead>
                <tbody>
                  {comparing && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                    </tr>
                  )}
                  {!comparing && changedRows.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                        {approved ? "No field changes were recorded for this approval." : "No changes — this revision matches the current profile."}
                      </td>
                    </tr>
                  )}
                  {visibleRows.map((r) => (
                    <tr key={r.key} className={cn("border-b align-top last:border-0", !r.changed && "text-muted-foreground")}>
                      <td className="whitespace-nowrap px-3 py-2 font-semibold">{labelFor(r.key)}</td>
                      <td className="max-w-xs px-3 py-2 text-muted-foreground">
                        <ReadableValue value={r.current} refs={approved && approval ? approval._refs : currentRefs} />
                      </td>
                      <td className={cn("max-w-xs px-3 py-2", r.changed && "font-medium")}>
                        <ReadableValue value={r.proposed} refs={approved && approval ? approval._refs : proposedRefs} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!comparing && unchangedRows.length > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => setShowUnchanged((v) => !v)}
              >
                {showUnchanged ? "Hide" : "Show"} {unchangedRows.length} unchanged field{unchangedRows.length === 1 ? "" : "s"}
              </button>
            )}
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
        onConfirm={() => approve.mutateAsync()}
      />
      <NoteDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Reject revision?"
        confirmLabel="Reject"
        destructive
        onConfirm={(note) => reject.mutateAsync(note)}
      />
    </>
  );
}
