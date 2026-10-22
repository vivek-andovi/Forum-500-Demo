"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useWorkflowMutation } from "@/components/resource/hooks";
import { WorkflowCard } from "@/components/resource/extras/workflow-card";
import type { ExtrasProps } from "@/components/resource/extras/types";

export function UserActions({ record, onChanged }: ExtrasProps) {
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const id = String(record.id);
  const status = String(record.status ?? "");

  const sendInvite = useWorkflowMutation({
    mutationFn: () => api<{ sent: boolean; devLink?: string }>(`/admin/users/${id}/send-invite`, { method: "POST" }),
    success: "Set-password link sent by email",
    onSuccess: async (res) => {
      setDevLink(res.devLink ?? null);
      await onChanged();
    },
  });
  const revoke = useWorkflowMutation({
    mutationFn: () => api(`/admin/users/${id}/revoke-sessions`, { method: "POST" }),
    success: "User signed out of all devices",
    onSuccess: () => onChanged(),
  });
  const busy = sendInvite.isPending || revoke.isPending;

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
      <Button size="sm" onClick={() => sendInvite.mutate()} disabled={busy || status === "suspended"}>
        {sendInvite.isPending ? "Sending…" : status === "invited" ? "Send invite link" : "Send password link"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setConfirmRevoke(true)} disabled={busy}>
        Sign out everywhere
      </Button>
      <ConfirmDialog
        open={confirmRevoke}
        onOpenChange={setConfirmRevoke}
        title="Sign this user out of every device?"
        description="All their current sessions end immediately. They can sign in again with their password."
        confirmLabel="Sign out everywhere"
        destructive
        onConfirm={async () => {
          try {
            await revoke.mutateAsync();
          } catch {
            /* toast shown */
          } finally {
            setConfirmRevoke(false);
          }
        }}
      />
    </WorkflowCard>
  );
}
