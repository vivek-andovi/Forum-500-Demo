"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEmail, useEmails } from "@/features/comms/queries";
import { api } from "@/lib/api";
import { fmtDate, timeAgo } from "@/lib/format";
import { watchMedia } from "@/lib/media-watch";
import { diagnoseLink, showProblem } from "@/lib/problems";
import type { EmailCampaign } from "@/features/comms/types";

/** Opens links from an archived newsletter in a new tab (the iframe itself is sandboxed). */
function withBaseTarget(html: string): string {
  const base = '<base target="_blank">';
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}${base}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${base}</head>`);
  return `<!doctype html><html><head>${base}</head><body>${html}</body></html>`;
}

/** Where an old forum.club page lives in this app, if anywhere. */
const lookupRedirect = (path: string) =>
  api<{ to: string | null }>("/public/redirect", { auth: false, query: { path } }).then((r) => r.to);

/**
 * Explains failures inside an archived newsletter: images that don't load, and links that can't work (personal
 * links from the original email, unfilled placeholders, old forum.club pages) open the details dialog instead
 * of a dead page. Needs `allow-same-origin` on the iframe; scripts in the email still never run.
 */
function useNewsletterWatch(subject: string | undefined) {
  const cleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => cleanup.current?.(), []);
  return useCallback(
    (frame: HTMLIFrameElement) => {
      cleanup.current?.();
      const doc = frame.contentDocument;
      if (!doc) return;
      const where = () => `Newsletter: ${subject ?? ""}`;
      const stopMedia = watchMedia(doc, where);
      const onClick = (e: MouseEvent) => {
        const link = (e.target as Element | null)?.closest?.("a");
        if (!link || e.defaultPrevented) return;
        // Decide synchronously whether to stop the click; the explanation (which may look up a redirect) follows.
        const href = link.getAttribute("href");
        if (!mayBeBroken(href)) return;
        e.preventDefault();
        void diagnoseLink(href, subject ?? "", lookupRedirect).then((problem) => {
          if (problem) showProblem(problem);
          else window.open(link.href, "_blank", "noopener,noreferrer");
        });
      };
      doc.addEventListener("click", onClick);
      cleanup.current = () => {
        stopMedia();
        doc.removeEventListener("click", onClick);
      };
    },
    [subject],
  );
}

/** Links worth checking before opening: empty / "#", placeholders, local addresses and old-site pages. */
function mayBeBroken(href: string | null): boolean {
  const h = (href ?? "").trim();
  return !h || h === "#" || /\[|localhost|127\.0\.0\.1|forum\.club|sg-host\.com/i.test(h) || !/^(https?:|mailto:|tel:)/i.test(h);
}

export default function EmailsPage() {
  const { data: emails = [], isLoading, error } = useEmails();
  const [selected, setSelected] = useState<EmailCampaign | null>(null);
  // The list has no content; the full email (with its HTML) loads when opened.
  const detail = useEmail(selected?.id);
  const open = selected ? { ...selected, ...detail.data } : null;
  const watchFrame = useNewsletterWatch(open?.subject);

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
                onClick={() => setSelected(email)}
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

      <Dialog open={open !== null} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${open?.html ? "sm:max-w-3xl" : "sm:max-w-2xl"}`}>
          <DialogHeader>
            <DialogTitle>{open?.subject}</DialogTitle>
            <DialogDescription>
              {open?.senderLabel}
              {open && fmtDate(open.sentAt ?? open.createdAt, "d MMMM yyyy")
                ? ` · ${fmtDate(open.sentAt ?? open.createdAt, "d MMMM yyyy")}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {detail.isLoading || detail.error ? (
            <QueryState isLoading={detail.isLoading} error={detail.error} />
          ) : open?.html ? (
            <iframe
              title={open.subject}
              srcDoc={withBaseTarget(open.html)}
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
              onLoad={(e) => watchFrame(e.currentTarget)}
              referrerPolicy="no-referrer"
              className="h-[65vh] w-full rounded-md border border-border bg-white"
            />
          ) : (
            <div className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {open?.body || open?.preview || "This email has no content."}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
