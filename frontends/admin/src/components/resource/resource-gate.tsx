"use client";

import Link from "next/link";
import { useResourceMeta } from "@/lib/meta";
import type { ResourceMeta } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

/** Resolves a resource from /admin/meta and renders children with it. */
export function ResourceGate({
  name,
  children,
}: {
  name: string;
  children: (resource: ResourceMeta) => React.ReactNode;
}) {
  const { resource, isLoading, error } = useResourceMeta(name);
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} />;
  if (!resource) {
    return (
      <EmptyState
        title="Unknown resource"
        description={`There is no admin resource called “${name}”.`}
        action={
          <Button asChild variant="outline">
            <Link href="/">Back to dashboard</Link>
          </Button>
        }
      />
    );
  }
  return <>{children(resource)}</>;
}
