"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Building2, Check, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
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
import { useBenefits, useSubmitOffer, useToggleOptIn } from "@/lib/queries";
import type { BenefitOffer, ContentStatus } from "@/lib/types";

const submissionStatusLabel: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "Application in review",
  scheduled: "Approved — going live soon",
  published: "Approved — live",
  archived: "Archived",
  rejected: "Not approved",
};

function OfferCard({
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

export default function BenefitsPage() {
  return (
    <Suspense fallback={null}>
      <Benefits />
    </Suspense>
  );
}

function Benefits() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data, isLoading, error } = useBenefits();
  const toggleOptIn = useToggleOptIn();
  const submitOfferM = useSubmitOffer();
  const [active, setActive] = useState<BenefitOffer | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const offerOpen = searchParams.get("offer") === "new";
  const setOfferOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) params.set("offer", "new");
    else params.delete("offer");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const memberOffers = useMemo(() => data?.memberOffers ?? [], [data]);
  const partnerOffers = useMemo(() => data?.partnerOffers ?? [], [data]);
  const optedIn = useMemo(() => data?.optedInIds ?? [], [data]);
  const pendingOffers = data?.mySubmissions ?? [];

  const all = useMemo(() => [...memberOffers, ...partnerOffers], [memberOffers, partnerOffers]);
  const mine = all.filter((o) => optedIn.includes(o.id));

  const memberCategories = useMemo(
    () =>
      Array.from(
        new Set(
          memberOffers
            .filter((o) => !o.category || o.category.kind === "member")
            .map((o) => o.category?.name)
            .filter((n): n is string => !!n),
        ),
      ).sort(),
    [memberOffers],
  );

  const toggle = (id: string) => {
    const optIn = !optedIn.includes(id);
    toggleOptIn.mutate(
      { id, optIn },
      { onSuccess: () => toast.success(optIn ? "You have opted in to this benefit." : "You have opted out.") },
    );
  };

  const submitOffer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const opt = (k: string) => {
      const v = String(form.get(k) ?? "").trim();
      return v || undefined;
    };
    submitOfferM.mutate(
      {
        title: String(form.get("offer-title") ?? "").trim(),
        category: String(form.get("offer-category") ?? "").trim(),
        offer: String(form.get("offer-summary") ?? "").trim(),
        about: opt("offer-about"),
        detail: opt("offer-detail"),
        howToRedeem: opt("offer-redeem"),
      },
      {
        onSuccess: () => {
          toast.success("Benefit application submitted.");
          setSubmitted(true);
        },
      },
    );
  };

  const activeOptedIn = active ? optedIn.includes(active.id) : false;

  return (
    <div className="space-y-12">
      <PageHeader
        pageKey="membership/benefits"
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

      <QueryState isLoading={isLoading} error={error}>
        {pendingOffers.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-medium">My benefit applications</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingOffers.map((o) => (
                <div key={o.id} className="rounded-lg border border-primary/30 bg-primary/5 p-5">
                  <h3 className="font-display text-lg font-medium">{o.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{o.offer || "Benefit application submitted."}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                    {o.status === "published" ? <Check className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}{" "}
                    {submissionStatusLabel[o.status] ?? o.status}
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
          <QueryState empty={memberOffers.length === 0} emptyText="No Member offers yet.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberOffers.map((o) => (
                <OfferCard key={o.id} offer={o} optedIn={optedIn.includes(o.id)} onOpen={() => setActive(o)} />
              ))}
            </div>
          </QueryState>
        </section>

        <section className="space-y-4">
          <div className="rule-top pt-6">
            <h2 className="font-display text-2xl font-medium">External Partners</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hotels, flights, restaurants, reciprocal clubs, brands, education and services — VIP treatment and
              preferred rates.
            </p>
          </div>
          <QueryState empty={partnerOffers.length === 0} emptyText="No partner offers yet.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {partnerOffers.map((o) => (
                <OfferCard key={o.id} offer={o} optedIn={optedIn.includes(o.id)} onOpen={() => setActive(o)} />
              ))}
            </div>
          </QueryState>
        </section>
      </QueryState>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
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
                  onClick={() => toggle(active.id)}
                  disabled={toggleOptIn.isPending}
                  variant={activeOptedIn ? "outline" : "default"}
                >
                  {activeOptedIn ? "Opt out" : "Opt in"}
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
              <Button variant="ghost" onClick={() => setOfferOpen(false)}>
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={submitOffer} className="space-y-4">
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
                <Button type="submit" disabled={submitOfferM.isPending}>
                  {submitOfferM.isPending ? "Submitting…" : "Submit application"}
                </Button>
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
