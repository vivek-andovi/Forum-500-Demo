"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { Button } from "@/components/ui/button";
import { useBenefits, useSubmitOffer, useToggleOptIn } from "@/features/membership/queries";
import type { BenefitOffer } from "@/features/membership/types";
import type { ContentStatus } from "@/lib/types/common";
import { OfferCard } from "./_components/OfferCard";
import { OfferDialog } from "./_components/OfferDialog";
import { SubmitOfferDialog } from "./_components/SubmitOfferDialog";

const submissionStatusLabel: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "Application in review",
  scheduled: "Approved — going live soon",
  published: "Approved — live",
  archived: "Archived",
  rejected: "Not approved",
};

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

      <OfferDialog
        active={active}
        optedIn={activeOptedIn}
        toggling={toggleOptIn.isPending}
        onToggle={toggle}
        onClose={() => setActive(null)}
      />

      <SubmitOfferDialog
        open={offerOpen}
        onOpenChange={(open) => {
          setOfferOpen(open);
          if (!open) setSubmitted(false);
        }}
        onClose={() => setOfferOpen(false)}
        submitted={submitted}
        submitting={submitOfferM.isPending}
        memberCategories={memberCategories}
        onSubmit={submitOffer}
      />
    </div>
  );
}
