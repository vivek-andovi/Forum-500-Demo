"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import type { AdminRecord, OptionItem } from "@/lib/types";

export function useRecord(resource: string, id: string | undefined) {
  return useQuery({
    queryKey: ["record", resource, id],
    queryFn: () => api<AdminRecord>(`/admin/r/${resource}/${encodeURIComponent(id ?? "")}`),
    enabled: !!id,
  });
}

export function useInvalidateResource() {
  const qc = useQueryClient();
  return (resource: string) => {
    qc.invalidateQueries({ queryKey: ["list", resource] });
    qc.invalidateQueries({ queryKey: ["record", resource] });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["approvals"] });
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
  const invalidate = useInvalidateResource();
  return useMutation({
    mutationFn: (id: string) => api<{ ok: boolean }>(`/admin/r/${resource}/${encodeURIComponent(id ?? "")}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Deleted");
      invalidate(resource);
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** Resolve labels for a set of ids via /admin/options/:resource?ids= */
export function useOptionLabels(resource: string | undefined, ids: string[]) {
  const key = ids.filter(Boolean).sort().join(",");
  return useQuery({
    queryKey: ["options-ids", resource, key],
    queryFn: () => api<OptionItem[]>(`/admin/options/${resource}`, { query: { ids: key } }),
    enabled: !!resource && !!key,
    staleTime: 5 * 60 * 1000,
  });
}
