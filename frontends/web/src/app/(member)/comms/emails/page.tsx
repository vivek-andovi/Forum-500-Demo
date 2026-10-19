"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmails } from "@/lib/queries";
import { fmtDate, timeAgo } from "@/lib/format";
import type { EmailCampaign } from "@/lib/types";

export default function EmailsPage() {
  const { data: emails = [], isLoading, error } = useEmails();
  const [open, setOpen] = useState<EmailCampaign | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/emails"
        eyebrow="Communications Hub"
        title="Emails"
        description="Forum newsletters, chapter updates and member correspondence."
      />
      <QueryState isLoading={isLoading} error={error} empty={emails.length === 0} emptyText="No emails yet.">
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {emails.map((email) => {
            const unread = !!email.unread;
            return (
              <button
                key={email.id}
                type="button"
                onClick={() => setOpen(email)}
                className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
              >
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={`truncate text-sm ${unread ? "font-bold" : "font-medium"}`}>{email.subject}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(email.sentAt ?? email.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{email.senderLabel}</p>
                  {email.preview && (
                    <p className={`mt-1 truncate text-sm ${unread ? "text-foreground" : "text-muted-foreground"}`}>
                      {email.preview}
                    </p>
                  )}
                </div>
                {unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
              </button>
            );
          })}
        </div>
      </QueryState>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{open?.subject}</DialogTitle>
            <DialogDescription>
              {open?.senderLabel}
              {open && fmtDate(open.sentAt ?? open.createdAt, "d MMMM yyyy")
                ? ` · ${fmtDate(open.sentAt ?? open.createdAt, "d MMMM yyyy")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {open?.body || open?.preview || "This email has no content."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
