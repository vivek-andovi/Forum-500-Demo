import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resourceHref } from "@/lib/meta";
import { resourceIcon } from "@/lib/resource-registry";
import { cn } from "@/lib/utils";
import type { ApprovalSummary } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

export function ApprovalCard({ a }: { a: ApprovalSummary }) {
  const Icon = resourceIcon(a.resource);
  const pending = a.count > 0;
  return (
    <Link href={resourceHref(a.resource, a.filter)} className="group block">
      <Card
        className={cn(
          "h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md",
          pending && "border-accent/50",
        )}
      >
        <CardContent className="flex items-center gap-4 p-5">
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-lg",
              pending ? "bg-accent/15 text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{a.label}</p>
            <p className="text-xs text-muted-foreground">{pending ? "Awaiting review" : "All clear"}</p>
          </div>
          <span
            className={cn(
              "font-display text-3xl tabular-nums",
              pending ? "text-foreground" : "text-muted-foreground/50",
            )}
          >
            {a.count}
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </CardContent>
      </Card>
    </Link>
  );
}
