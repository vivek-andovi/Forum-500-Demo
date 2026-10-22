"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, ExternalLink, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { recordHref } from "@/lib/meta";
import type { AdminRecord } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useWorkflowMutation } from "@/components/resource/hooks";
import { WorkflowCard } from "@/components/resource/extras/workflow-card";
import type { ExtrasProps } from "@/components/resource/extras/types";

/** POST /admin/pitches/:id/accept (backends/src/modules/media/inforum.repository.ts acceptPitch). */
type AcceptResponse = { pitch: AdminRecord; article: AdminRecord };

export function PitchActions({ record, onChanged }: ExtrasProps) {
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "accept" | "decline">(null);
  const status = String(record.status ?? "");
  const articleId = record.articleId as string | undefined;

  const accept = useWorkflowMutation({
    mutationFn: () => api<AcceptResponse>(`/admin/pitches/${record.id}/accept`, { method: "POST", body: {} }),
    success: "Pitch accepted — draft article created",
    onSuccess: async (res) => {
      await onChanged();
      const id = res?.article?.id;
      if (id) {
        toast("Draft article ready", {
          action: { label: "Open article", onClick: () => router.push(recordHref("articles", id)) },
        });
      }
    },
  });
  const decline = useWorkflowMutation({
    mutationFn: () => api(`/admin/pitches/${record.id}/decline`, { method: "POST", body: {} }),
    success: "Pitch declined",
    onSuccess: () => onChanged(),
  });

  return (
    <>
      <WorkflowCard
        title="Pitch review"
        status={status}
        footer={
          articleId && (
            <p className="text-sm">
              <Link
                href={recordHref("articles", articleId)}
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
        <Button type="button" disabled={status !== "pending" || !!articleId} onClick={() => setDialog("accept")}>
          <Check /> Accept
        </Button>
        <Button
          type="button"
          variant="outline"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={status !== "pending"}
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
        onConfirm={() => accept.mutateAsync()}
      />
      <ConfirmDialog
        open={dialog === "decline"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Decline pitch?"
        confirmLabel="Decline"
        destructive
        onConfirm={() => decline.mutateAsync()}
      />
    </>
  );
}
