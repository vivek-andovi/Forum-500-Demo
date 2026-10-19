"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { usePageTitle } from "@/lib/use-debounce";
import type { ApprovalSummary } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { ApprovalCard } from "@/components/common/approval-card";

export default function ApprovalsPage() {
  usePageTitle("Approvals");
  const q = useQuery({
    queryKey: ["approvals"],
    queryFn: () => api<ApprovalSummary[]>("/admin/approvals"),
  });
  const items = [...(q.data ?? [])].sort((a, b) => b.count - a.count);
  const total = items.reduce((n, a) => n + a.count, 0);

  return (
    <>
      <PageHeader
        eyebrow="Workflow"
        title="Approvals"
        description={q.data ? `${total} item${total === 1 ? "" : "s"} awaiting review` : undefined}
      />
      {q.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-xl" />
          ))}
        </div>
      )}
      {q.error && <ErrorState error={q.error} onRetry={() => q.refetch()} />}
      {q.data && items.length === 0 && (
        <EmptyState icon={CheckCircle2} title="Nothing to review" description="You're all caught up." />
      )}
      {items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((a) => (
            <ApprovalCard key={a.key} a={a} />
          ))}
        </div>
      )}
    </>
  );
}
