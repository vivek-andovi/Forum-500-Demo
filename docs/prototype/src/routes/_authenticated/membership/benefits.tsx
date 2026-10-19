import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, Building2, Check, MapPin, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { memberOffers, partnerOffers, type BenefitOffer } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/membership/benefits")({
  validateSearch: (search: Record<string, unknown>) => ({
    offer: search["offer"] === "new" ? ("new" as const) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Member Benefits — Forum500" },
      {
        name: "description",
        content: "Benefits offered by Forum500 Members and external partners, and the ones you have opted in to.",
      },
      { property: "og:title", content: "Member Benefits — Forum500" },
      {
        property: "og:description",
        content: "Benefits offered by Forum500 Members and external partners, and the ones you have opted in to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Benefits,
});

function OfferCard({
  offer,
  optedIn,
  onOpen,
}: {
  offer: BenefitOffer;
  optedIn: boolean;
  onOpen: () => void;
}) {
  const band = offer.companyImage ?? offer.image;
  const portrait = offer.companyImage ? offer.image : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition hover:border-accent/60 hover:shadow-sm"
    >
      {band ? (
        <div className="relative h-36 w-full overflow-hidden">
          <img
            src={band}
            alt={offer.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75">{offer.category}</p>
            <h3 className="mt-1 truncate font-display text-lg font-medium text-white">{offer.title}</h3>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 border-b border-border/70 bg-secondary/40 p-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="eyebrow">{offer.category}</p>
            <h3 className="truncate font-display text-lg font-medium">{offer.title}</h3>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="font-medium">{offer.offer}</p>
        {portrait ? (
          <div className="flex items-center gap-3">
            <img
              src={portrait}
              alt={offer.provider}
              loading="lazy"
              className="h-9 w-9 rounded-full border border-border object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{offer.provider}</p>
              {offer.providerRole && (
                <p className="truncate text-xs text-muted-foreground">{offer.providerRole}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{offer.provider}</p>
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

function Benefits() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [optedIn, setOptedIn] = useState<string[]>(["plotify-membership", "harbour-house-nassau"]);
  const [active, setActive] = useState<BenefitOffer | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const offerOpen = search.offer === "new";
  const setOfferOpen = (open: boolean) =>
    navigate({ search: { offer: open ? "new" : undefined }, replace: true });

  const all = useMemo(() => [...memberOffers, ...partnerOffers], []);
  const mine = all.filter((o) => optedIn.includes(o.id));

  const toggle = (id: string) =>
    setOptedIn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const [pendingOffers, setPendingOffers] = useState<{ title: string; summary: string }[]>([]);

  const submitOffer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPendingOffers((prev) => [
      ...prev,
      {
        title: String(data.get("offer-title") ?? "New benefit"),
        summary: String(data.get("offer-summary") ?? ""),
      },
    ]);
    setSubmitted(true);
  };

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Membership Hub"
        title="Member Benefits"
        description="Benefits offered by Members and by external partners. Opt in to the ones you want — new offers are reviewed and approved by the Forum team before they appear."
        action={
          <Button variant="outline" className="gap-2" onClick={() => setOfferOpen(true)}>
            <Plus className="h-4 w-4" />
            Apply to offer a benefit
          </Button>
        }
      />

      {pendingOffers.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-medium">Awaiting Forum approval</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOffers.map((o) => (
              <div key={o.title} className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                <h3 className="font-display text-lg font-medium">{o.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{o.summary || "Benefit application submitted."}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <Clock className="h-3.5 w-3.5" /> Application in review
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-medium">My Benefits</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The specific benefits you have opted in to. Opt out at any time from the benefit itself.
          </p>
        </div>
        {mine.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            You have not opted in to any benefits yet. Choose one below to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mine.map((o) => (
              <OfferCard key={o.id} offer={o} optedIn onOpen={() => setActive(o)} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rule-top pt-6">
          <h2 className="font-display text-2xl font-medium">By Members, For Members</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Offers made by Forum500 Members to the rest of the community.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memberOffers.map((o) => (
            <OfferCard key={o.id} offer={o} optedIn={optedIn.includes(o.id)} onOpen={() => setActive(o)} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="rule-top pt-6">
          <h2 className="font-display text-2xl font-medium">External Partners</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hotels, flights, restaurants, reciprocal clubs, brands, education and services — VIP treatment and
            preferred rates.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partnerOffers.map((o) => (
            <OfferCard key={o.id} offer={o} optedIn={optedIn.includes(o.id)} onOpen={() => setActive(o)} />
          ))}
        </div>
      </section>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          {active && (
            <>
              {(active.companyImage ?? active.image) && (
                <div className="relative -mx-6 -mt-6 mb-2 h-48 overflow-hidden">
                  <img src={(active.companyImage ?? active.image)!} alt={active.title} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}
              <DialogHeader>
                <p className="eyebrow">{active.category}</p>
                <DialogTitle className="font-display text-2xl font-medium">{active.title}</DialogTitle>
                <DialogDescription>{active.offer}</DialogDescription>
              </DialogHeader>

              <div className="flex items-center gap-4 rounded-lg border border-border bg-secondary/40 p-4">
                {active.image && active.companyImage ? (
                  <img
                    src={active.image}
                    alt={active.provider}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent">
                    <Building2 className="h-7 w-7" />
                  </span>
                )}
                <div>
                  <p className="font-medium">{active.provider}</p>
                  {active.providerRole && (
                    <p className="text-sm text-muted-foreground">{active.providerRole}</p>
                  )}
                  {active.location && <p className="text-sm text-muted-foreground">{active.location}</p>}
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-display text-base font-medium">About</h4>
                  <p className="mt-1 text-muted-foreground">{active.about}</p>
                </div>
                <div>
                  <h4 className="font-display text-base font-medium">The offer</h4>
                  <p className="mt-1 text-muted-foreground">{active.detail}</p>
                </div>
                <div>
                  <h4 className="font-display text-base font-medium">How it works</h4>
                  <p className="mt-1 text-muted-foreground">{active.howToRedeem}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button onClick={() => toggle(active.id)} variant={optedIn.includes(active.id) ? "outline" : "default"}>
                  {optedIn.includes(active.id) ? "Opt out" : "Opt in"}
                </Button>
                <Button variant="ghost" onClick={() => setActive(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={offerOpen}
        onOpenChange={(open) => {
          setOfferOpen(open);
          if (!open) setSubmitted(false);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <p className="eyebrow">By Members, For Members</p>
            <DialogTitle className="font-display text-2xl font-medium">Apply to offer a benefit</DialogTitle>
            <DialogDescription>
              Define the offer you'd like to make to fellow Members. The Forum team reviews every benefit
              before it goes live.
            </DialogDescription>
          </DialogHeader>

          {submitted ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-5 text-sm">
                <p className="font-medium text-foreground">Thank you — your benefit has been submitted.</p>
                <p className="mt-1 text-muted-foreground">
                  Simon and Jessica will review it and be in touch before it appears in By Members, For
                  Members. You can edit it at any time from your profile.
                </p>
              </div>
              <Button variant="ghost" onClick={() => setOfferOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={submitOffer} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="offer-title">Benefit title</Label>
                <Input id="offer-title" name="offer-title" required placeholder="e.g. Preferred Membership Access to Plotify" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-category">Category</Label>
                <Input id="offer-category" name="offer-category" required placeholder="e.g. Technology, Travel, Dining…" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-summary">The offer in one line</Label>
                <Input id="offer-summary" name="offer-summary" required placeholder="e.g. 25% off membership for Forum500 Members" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-about">About you / your company</Label>
                <Textarea id="offer-about" rows={3} placeholder="A short description Members will see." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-detail">Detailed offer</Label>
                <Textarea
                  id="offer-detail"
                  rows={4}
                  placeholder="Exactly what Members receive, any terms, and how long it runs."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="offer-redeem">How Members redeem it</Label>
                <Textarea
                  id="offer-redeem"
                  rows={2}
                  placeholder="e.g. Email me directly, or opt in here and we'll make the introduction."
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button type="submit">Submit application</Button>
                <Button type="button" variant="ghost" onClick={() => setOfferOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
