"use client";

import Link from "next/link";
import { CheckCircle2, ChevronDown, ClipboardList, CreditCard, Eye, FileSignature, ListChecks } from "lucide-react";
import type { ActionType } from "@/features/comms/types";
import type { Dashboard } from "@/features/site/types";
import { fmtDate, money } from "@/lib/format";
import { Empty, Panel, SectionHeading } from "./Panel";

const typeMeta: Record<ActionType, { label: string; icon: typeof Eye }> = {
  review: { label: "Review", icon: Eye },
  approve: { label: "Approve", icon: CheckCircle2 },
  sign: { label: "Sign", icon: FileSignature },
  pay: { label: "Pay", icon: CreditCard },
  fill: { label: "Fill", icon: ClipboardList },
};

/** Pending actions (review, approve, sign, pay, fill). Collapsed shows the first one and a "Show all" button. */
export function ActionsSection({
  data,
  collapsed,
  onToggleCollapsed,
  onExpand,
}: {
  data: Dashboard;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onExpand: () => void;
}) {
  const actions = data.actions ?? [];

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={ListChecks}
        title="Actions"
        to="/comms/actions"
        linkLabel="See all"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
      />
      <Panel title={`Pending Actions (${actions.length})`} to="/comms/actions">
        {actions.length === 0 && <Empty>You&apos;re all caught up.</Empty>}
        <div className="divide-y divide-border">
          {(collapsed ? actions.slice(0, 1) : actions).map((a) => {
            const meta = typeMeta[a.type] ?? typeMeta.review;
            const Icon = meta.icon;
            const due = a.dueAt ? `Due ${fmtDate(a.dueAt, "d MMM")}` : "";
            const amount = money(a.amountCents, a.currency);
            return (
              <Link
                key={a.id}
                href="/comms/actions"
                className="flex items-center gap-3 px-2 py-2.5 transition-colors hover:bg-muted"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-medium leading-tight">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground">{[a.context, due].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {meta.label}
                </span>
                {amount && <span className="shrink-0 text-xs font-semibold text-accent">{amount}</span>}
              </Link>
            );
          })}
        </div>
        {collapsed && actions.length > 1 && (
          <button
            type="button"
            onClick={onExpand}
            className="mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-border py-2 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-primary"
          >
            Show all {actions.length} actions <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </Panel>
    </section>
  );
}
