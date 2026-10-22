"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArticleImage } from "@/components/media/ArticleImage";
import { Byline } from "@/components/media/Byline";
import type { Article } from "@/features/media/types";

/** Full-text reader for an In:Forum article. */
export function ArticleDialog({ open, onClose }: { open: Article | null; onClose: () => void }) {
  return (
    <Dialog open={!!open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        {open ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl leading-snug">{open.title}</DialogTitle>
            </DialogHeader>
            {open.imageUrl ? <ArticleImage article={open} className="h-56 w-full rounded-md object-cover" /> : null}
            {open.caption ? <p className="text-xs text-muted-foreground">{open.caption}</p> : null}
            {open.standfirst ? <p className="text-base text-muted-foreground">{open.standfirst}</p> : null}
            <Byline article={open} />
            <div className="space-y-4 text-sm leading-relaxed">
              {(open.body ?? []).map((p, i) => (
                <p key={i} className={i === 0 ? "text-base" : undefined}>
                  {p}
                </p>
              ))}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
