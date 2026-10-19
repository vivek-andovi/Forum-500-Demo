"use client";

import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { errorMessage } from "@/lib/api";

/** Loading / error / empty placeholder used by every API-backed section. */
export function QueryState({
  isLoading,
  error,
  empty,
  emptyText = "Nothing here yet.",
  children,
  className = "",
}: {
  isLoading?: boolean;
  error?: unknown;
  empty?: boolean;
  emptyText?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  if (isLoading)
    return (
      <div className={`flex items-center gap-2 py-10 text-sm text-muted-foreground ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  if (error)
    return (
      <div className={`rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive ${className}`}>
        {errorMessage(error)}
      </div>
    );
  if (empty)
    return (
      <div className={`rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground ${className}`}>
        {emptyText}
      </div>
    );
  return <>{children}</>;
}
