import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InforumEdition } from "@/features/media/types";
import { fmtDate } from "@/lib/format";

/** "Current edition" / "Archive edition" strip above the section tabs. */
export function EditionBanner({
  edition,
  isCurrent,
  isLoading,
  onBackToCurrent,
}: {
  edition: InforumEdition | undefined;
  isCurrent: boolean;
  isLoading: boolean;
  onBackToCurrent: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-secondary/40 px-5 py-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
          {isCurrent ? "Current edition" : "Archive edition"}
        </p>
        <p className="mt-1 font-display text-xl font-medium">
          {edition ? `${edition.label} edition` : isLoading ? "Loading…" : "No edition published yet"}
        </p>
        {edition ? (
          <p className="text-sm text-muted-foreground">Published {fmtDate(edition.publishedOn, "d MMMM yyyy")}</p>
        ) : null}
      </div>
      {edition?.pdfUrl || !isCurrent ? (
        <div className="flex flex-wrap items-center gap-2">
          {edition?.pdfUrl ? (
            <Button asChild variant="outline">
              <a href={edition.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" /> Read the PDF
              </a>
            </Button>
          ) : null}
          {!isCurrent ? (
            <Button variant="outline" onClick={onBackToCurrent}>
              Back to current edition
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
