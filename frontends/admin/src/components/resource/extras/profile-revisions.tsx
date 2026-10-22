"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { humanize } from "@/lib/format";
import { recordHref, useMeta } from "@/lib/meta";
import { useRecord } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog, NoteDialog } from "@/components/common/confirm-dialog";
import { useWorkflowMutation } from "@/components/resource/hooks";
import { WorkflowCard } from "@/components/resource/extras/workflow-card";
import type { ExtrasProps } from "@/components/resource/extras/types";

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
  const status = String(record.status ?? "");

  const changes = parseChanges(record.changes);
  const keys = Object.keys(changes);
  const labelFor = (k: string) => memberMeta?.fields.find((f) => f.name === k)?.label ?? humanize(k);

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
