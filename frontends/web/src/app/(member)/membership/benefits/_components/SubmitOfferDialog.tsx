"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/** "Apply to offer a benefit" form; after submitting it shows a thank-you note until closed. */
export function SubmitOfferDialog({
  open,
  onOpenChange,
  onClose,
  submitted,
  submitting,
  memberCategories,
  onSubmit,
}: {
  open: boolean;
  /** Called by the dialog itself (Esc, overlay, ×). */
  onOpenChange: (open: boolean) => void;
  /** Called by the Close / Cancel buttons. */
  onClose: () => void;
  submitted: boolean;
  submitting: boolean;
  /** Existing member-offer categories, suggested in the category field. */
  memberCategories: string[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <p className="eyebrow">By Members, For Members</p>
          <DialogTitle className="font-display text-2xl font-medium">Apply to offer a benefit</DialogTitle>
          <DialogDescription>
            Define the offer you&apos;d like to make to fellow Members. The Forum team reviews every benefit
            before it goes live.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
              <p className="font-medium text-foreground">Thank you — your benefit has been submitted.</p>
              <p className="mt-1 text-muted-foreground">
                Simon and Jessica will review it and be in touch before it appears in By Members, For
                Members. You can follow its status on this page.
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="offer-title">Benefit title</Label>
              <Input
                id="offer-title"
                name="offer-title"
                required
                placeholder="e.g. Preferred Membership Access to Plotify"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-category">Category</Label>
              <Input
                id="offer-category"
                name="offer-category"
                required
                list="offer-category-options"
                placeholder="e.g. Technology, Travel, Dining…"
              />
              <datalist id="offer-category-options">
                {memberCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-summary">The offer in one line</Label>
              <Input
                id="offer-summary"
                name="offer-summary"
                required
                placeholder="e.g. 25% off membership for Forum500 Members"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-about">About you / your company</Label>
              <Textarea
                id="offer-about"
                name="offer-about"
                rows={3}
                placeholder="A short description Members will see."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-detail">Detailed offer</Label>
              <Textarea
                id="offer-detail"
                name="offer-detail"
                rows={4}
                placeholder="Exactly what Members receive, any terms, and how long it runs."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="offer-redeem">How Members redeem it</Label>
              <Textarea
                id="offer-redeem"
                name="offer-redeem"
                rows={2}
                placeholder="e.g. Email me directly, or opt in here and we'll make the introduction."
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
