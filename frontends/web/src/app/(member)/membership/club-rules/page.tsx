"use client";

import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { usePage } from "@/features/site/queries";
import { paragraphs as toParagraphs } from "@/lib/format";

export default function ClubRulesPage() {
  const { data: page, isLoading, error } = usePage("membership/club-rules");
  const paragraphs = toParagraphs(page?.body);

  return (
    <div className="space-y-8">
      {page ? (
        <PageHeader eyebrow={page.eyebrow ?? undefined} title={page.title} description={page.subtitle ?? undefined} />
      ) : (
        <PageHeader pageKey="membership/club-rules" />
      )}
      <QueryState isLoading={isLoading} error={error}>
        {paragraphs.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 sm:p-10">
            <div className="max-w-3xl space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="leading-relaxed text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">Nothing has been published here yet.</p>
          </div>
        )}
      </QueryState>
    </div>
  );
}
