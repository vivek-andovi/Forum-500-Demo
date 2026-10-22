"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { BenefitOffer } from "@/features/membership/types";

/** Full details of one benefit with the opt-in / opt-out button. */
export function OfferDialog({
  active,
  optedIn,
  toggling,
  onToggle,
  onClose,
}: {
  active: BenefitOffer | null;
  optedIn: boolean;
  toggling: boolean;
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!active} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        {active && (
          <>
            {(active.companyImageUrl ?? active.imageUrl) && (
              <div className="relative -mx-6 -mt-6 mb-2 h-48 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={(active.companyImageUrl ?? active.imageUrl)!}
                  alt={active.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}
            <DialogHeader>
              <p className="eyebrow">{active.category?.name ?? ""}</p>
              <DialogTitle className="font-display text-2xl font-medium">{active.title}</DialogTitle>
              <DialogDescription>{active.offer}</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4">
              {active.imageUrl && active.companyImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={active.imageUrl}
                  alt={active.providerName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Building2 className="h-7 w-7" />
                </span>
              )}
              <div>
                <p className="font-medium">{active.providerName}</p>
                {active.providerRole && (
                  <p className="text-sm text-muted-foreground">{active.providerRole}</p>
                )}
                {active.location && <p className="text-sm text-muted-foreground">{active.location}</p>}
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {active.about && (
                <div>
                  <h4 className="font-display text-base font-medium">About</h4>
                  <p className="mt-1 text-muted-foreground">{active.about}</p>
                </div>
              )}
              {active.detail && (
                <div>
                  <h4 className="font-display text-base font-medium">The offer</h4>
                  <p className="mt-1 text-muted-foreground">{active.detail}</p>
                </div>
              )}
              {active.howToRedeem && (
                <div>
                  <h4 className="font-display text-base font-medium">How it works</h4>
                  <p className="mt-1 text-muted-foreground">{active.howToRedeem}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => onToggle(active.id)}
                disabled={toggling}
                variant={optedIn ? "outline" : "default"}
              >
                {optedIn ? "Opt out" : "Opt in"}
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
