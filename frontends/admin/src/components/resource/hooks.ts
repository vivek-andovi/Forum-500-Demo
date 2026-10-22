"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queries";
import type { AdminRecord } from "@/lib/types";

/** Marks everything derived from a resource as stale (lists, records, options, dashboard, approvals). */
export function useInvalidateResource() {
  const qc = useQueryClient();
  return (resource: string) => {
    qc.invalidateQueries({ queryKey: queryKeys.list(resource) });
    qc.invalidateQueries({ queryKey: queryKeys.record(resource) });
    qc.invalidateQueries({ queryKey: queryKeys.options(resource) });
    qc.invalidateQueries({ queryKey: queryKeys.optionIds(resource) });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard() });
    qc.invalidateQueries({ queryKey: queryKeys.approvals() });
  };
}

export function useStatusMutation(resource: string) {
  const invalidate = useInvalidateResource();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api<AdminRecord>(`/admin/r/${resource}/${encodeURIComponent(id)}/status`, { method: "POST", body: { status } }),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate(resource);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useDeleteMutation(resource: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidateResource();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: boolean }>(`/admin/r/${resource}/${encodeURIComponent(id ?? "")}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      // Drop the deleted record first so an open editor doesn't refetch it and flash a 404.
      qc.removeQueries({ queryKey: queryKeys.record(resource, id) });
      toast.success("Deleted");
      invalidate(resource);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/**
 * A workflow action (approve, reject, send invite…): toasts `success` or the error,
 * then runs `onSuccess` (usually a refresh). The mutation stays pending until
 * `onSuccess` resolves, and `mutateAsync` rejects on failure so dialogs stay open.
 */
export function useWorkflowMutation<TVars = void, TData = unknown>({
  mutationFn,
  success,
  onSuccess,
}: {
  mutationFn: (vars: TVars) => Promise<TData>;
  success: string | ((vars: TVars) => string);
  onSuccess?: (data: TData, vars: TVars) => unknown;
}) {
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      toast.success(typeof success === "function" ? success(vars) : success);
      await onSuccess?.(data, vars);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
