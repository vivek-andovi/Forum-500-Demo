"use client";

import type { ReactNode } from "react";
import { useMemberSite } from "@/lib/queries";

/**
 * Member page header. Pass `pageKey` (the route path without the leading slash,
 * e.g. "membership/benefits") to read eyebrow/title/subtitle from the CMS
 * (`/v1/site` pageHeaders). The explicit props are used as a fallback while the
 * CMS copy loads or if a route has no header configured. `titleOverride` wins
 * over the CMS title (used for personalised titles such as the dashboard).
 */
export function PageHeader({
  pageKey,
  eyebrow,
  title,
  description,
  titleOverride,
  action,
}: {
  pageKey?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  titleOverride?: string;
  action?: ReactNode;
}) {
  const site = useMemberSite();
  const cms = pageKey ? site.data?.pageHeaders?.[pageKey] : undefined;
  const e = cms?.eyebrow ?? eyebrow;
  const t = titleOverride ?? cms?.title ?? title;
  const d = cms?.subtitle ?? description;
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
      <div>
        {e && <p className="eyebrow">{e}</p>}
        {t && <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t}</h1>}
        {d && <p className="mt-3 max-w-2xl text-muted-foreground">{d}</p>}
      </div>
      {action}
    </div>
  );
}
