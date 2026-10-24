"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, Copy, ExternalLink, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { watchMedia } from "@/lib/media-watch";
import {
  clearFileProblems,
  closeProblem,
  problemFromError,
  problemText,
  showProblem,
  useCurrentProblem,
  useFileProblems,
  type Problem,
} from "@/lib/problems";

/** Error toast with a "Details" button that opens the explanation dialog. */
export function toastError(err: unknown, title?: string) {
  const problem = problemFromError(err, title);
  toast.error(err instanceof Error ? err.message : problem.title, {
    action: { label: "Details", onClick: () => showProblem(problem) },
  });
}

/** Small "Details" button next to an inline error message. */
export function ProblemDetailsButton({ error, title }: { error: unknown; title?: string }) {
  return (
    <button
      type="button"
      onClick={() => showProblem(problemFromError(error, title))}
      className="ml-2 font-semibold underline underline-offset-2 hover:no-underline"
    >
      Details
    </button>
  );
}

/**
 * Same as frontends/web/src/components/ProblemCenter.tsx.
 * Mounted once (components/providers.tsx): the explanation dialog, the "files couldn't load" tray, and the
 * page-wide watcher that catches failed images, audio and video.
 */
export function ProblemCenter() {
  const pathname = usePathname();
  useEffect(() => watchMedia(document, () => window.location.pathname), []);
  // The tray lists the current page's failures only.
  useEffect(() => clearFileProblems(), [pathname]);

  return (
    <>
      <ProblemDialog />
      <FileTray />
    </>
  );
}

function ProblemDialog() {
  const problem = useCurrentProblem();
  return (
    <Dialog open={problem !== null} onOpenChange={(open) => !open && closeProblem()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">{problem && <ProblemBody problem={problem} />}</DialogContent>
    </Dialog>
  );
}

function ProblemBody({ problem }: { problem: Problem }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(problemText(problem));
      toast.success("Details copied");
    } catch {
      toast.error("Couldn't copy: the browser blocked clipboard access.");
    }
  };
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
          {problem.title}
        </DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-foreground">{problem.reason}</DialogDescription>
      </DialogHeader>
      {problem.hint && <p className="text-sm text-muted-foreground">{problem.hint}</p>}
      {problem.pending && (
        <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold">Pending: </span>
            {problem.pending}
          </p>
        </div>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-secondary/50 p-3 text-xs">
        {problem.facts.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="break-all font-mono">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
        >
          <Copy className="h-4 w-4" /> Copy details
        </button>
        {problem.actions?.map((a) => (
          <a
            key={a.href}
            href={a.href}
            onClick={() => closeProblem()}
            {...(a.external && { target: "_blank", rel: "noopener noreferrer" })}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {a.external && <ExternalLink className="h-4 w-4" />} {a.label}
          </a>
        ))}
      </div>
    </>
  );
}

function FileTray() {
  const files = useFileProblems();
  const [open, setOpen] = useState(false);
  if (!files.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-md hover:bg-amber-100"
      >
        <ImageOff className="h-4 w-4" />
        {files.length === 1 ? "1 file couldn't load" : `${files.length} files couldn't load`} · Details
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageOff className="h-5 w-5 text-destructive" /> Files that couldn&apos;t load on this page
            </DialogTitle>
            <DialogDescription>Each file and the reason it failed. Click one for the full details.</DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border rounded-md border border-border">
            {files.map((f) => (
              <li key={f.url}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    showProblem(f);
                  }}
                  className="w-full px-3 py-2.5 text-left hover:bg-secondary/50"
                >
                  <p className="truncate font-mono text-xs text-muted-foreground">{f.url}</p>
                  <p className="mt-0.5 text-sm">{f.reason}</p>
                  {f.pending && <p className="mt-0.5 text-xs font-semibold text-amber-800">Pending integration</p>}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
