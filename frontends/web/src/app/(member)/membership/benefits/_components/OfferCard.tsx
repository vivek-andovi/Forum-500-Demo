import { Building2, Check, MapPin } from "lucide-react";
import type { BenefitOffer } from "@/features/membership/types";

/** A benefit tile: image band (or icon header), the offer, who provides it and opt-in state. */
export function OfferCard({
  offer,
  optedIn,
  onOpen,
}: {
  offer: BenefitOffer;
  optedIn: boolean;
  onOpen: () => void;
}) {
  const band = offer.companyImageUrl ?? offer.imageUrl;
  const portrait = offer.companyImageUrl ? offer.imageUrl : null;
  const category = offer.category?.name ?? "";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-accent/60 hover:shadow-sm"
    >
      {band ? (
        <div className="relative h-36 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={band}
            alt={offer.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">{category}</p>
            <h3 className="mt-1 truncate font-display text-lg font-medium text-white">{offer.title}</h3>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 border-b border-border/70 bg-secondary/40 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{category}</p>
            <h3 className="truncate font-display text-lg font-medium">{offer.title}</h3>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="font-medium">{offer.offer}</p>
        {portrait ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portrait}
              alt={offer.providerName}
              loading="lazy"
              className="h-9 w-9 rounded-full border border-border object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{offer.providerName}</p>
              {offer.providerRole && (
                <p className="truncate text-xs text-muted-foreground">{offer.providerRole}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{offer.providerName}</p>
        )}
        {offer.location && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {offer.location}
          </p>
        )}
        <span className="mt-auto pt-3 text-sm font-medium text-accent">
          {optedIn ? (
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4" /> Opted in
            </span>
          ) : (
            "View benefit"
          )}
        </span>
      </div>
    </button>
  );
}
