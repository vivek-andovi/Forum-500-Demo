"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { recordHref } from "@/lib/meta";
import type { AdminRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NoteDialog } from "@/components/common/confirm-dialog";
import { useWorkflowMutation } from "@/components/resource/hooks";
import { WorkflowCard } from "@/components/resource/extras/workflow-card";
import type { ExtrasProps } from "@/components/resource/extras/types";

type Invite = { email: string; devLink?: string };
type ApproveResponse = {
  application: AdminRecord;
  member?: AdminRecord;
  invite?: { sent: boolean; devLink?: string };
};
type RejectStatus = "rejected" | "waitlisted";

/** The invite panel is kept in sessionStorage: approving refreshes the record, which re-mounts this panel. */
function useStoredInvite(applicationId: string) {
  const key = `approved-invite:${applicationId}`;
  const [invite, setState] = useState<Invite | null>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setInvite = (value: Invite) => {
    setState(value);
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable: panel just won't survive a refresh */
    }
  };
  return [invite, setInvite] as const;
}

export function ApplicationActions({ record, onChanged }: ExtrasProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "approve" | RejectStatus>(null);
  const [invite, setInvite] = useStoredInvite(String(record.id));
  const status = String(record.status ?? "");
  const decided = record.decidedAt ? formatDateTime(record.decidedAt) : null;

  const approve = useWorkflowMutation({
    mutationFn: (note: string) =>
      api<ApproveResponse>(`/admin/applications/${record.id}/approve`, {
        method: "POST",
        body: note ? { note } : {},
      }),
    success: "Application approved",
    onSuccess: async (res) => {
      setInvite({ email: String(record.email ?? ""), devLink: res?.invite?.devLink });
      await onChanged();
      const memberId = res?.member?.id;
      if (memberId) {
        toast("Member created", {
          action: { label: "Open member", onClick: () => router.push(recordHref("members", memberId)) },
        });
      }
    },
  });

  const reject = useWorkflowMutation({
    mutationFn: ({ status, note }: { status: RejectStatus; note: string }) =>
      api(`/admin/applications/${record.id}/reject`, {
        method: "POST",
        body: { status, ...(note ? { note } : {}) },
      }),
    success: ({ status }) => (status === "waitlisted" ? "Application waitlisted" : "Application rejected"),
    onSuccess: () => onChanged(),
  });

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
            {invite && <InviteNotice invite={invite} />}
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
        onConfirm={(note) => approve.mutateAsync(note)}
      />
      <NoteDialog
        open={dialog === "rejected" || dialog === "waitlisted"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={dialog === "waitlisted" ? "Waitlist application?" : "Reject application?"}
        confirmLabel={dialog === "waitlisted" ? "Waitlist" : "Reject"}
        destructive={dialog === "rejected"}
        onConfirm={(note) =>
          reject.mutateAsync({ status: dialog === "waitlisted" ? "waitlisted" : "rejected", note })
        }
      />
    </>
  );
}

function InviteNotice({ invite }: { invite: Invite }) {
  return (
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
  );
}
