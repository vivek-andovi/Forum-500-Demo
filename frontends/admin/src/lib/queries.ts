"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, type QueryValue } from "@/lib/api";
import type {
  AdminRecord,
  ApprovalSummary,
  DashboardResponse,
  ListResponse,
  OptionItem,
} from "@/lib/types";

/**
 * Every TanStack Query key the admin uses. Keys are prefix-matched on invalidation,
 * so `queryKeys.record("members")` covers every member record.
 */
export const queryKeys = {
  meta: () => ["admin-meta"] as const,
  dashboard: () => ["dashboard"] as const,
  approvals: () => ["approvals"] as const,
  list: (resource: string, query?: Record<string, QueryValue>) =>
    query ? (["list", resource, query] as const) : (["list", resource] as const),
  record: (resource: string, id?: string) =>
    id === undefined ? (["record", resource] as const) : (["record", resource, id] as const),
  /** Options searched by text (relation pickers). */
  options: (resource: string, search?: string) =>
    search === undefined ? (["options", resource] as const) : (["options", resource, search] as const),
  /** Option labels resolved for a set of ids. */
  optionIds: (resource: string | undefined, ids?: string) =>
    ids === undefined ? (["options-ids", resource] as const) : (["options-ids", resource, ids] as const),
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard(),
    queryFn: () => api<DashboardResponse>("/admin/dashboard"),
  });
}

/** Approval queues; shared by the sidebar badge and the approvals page. */
/**
 * Pending-approval counts. The sidebar badge tolerates a minute of staleness; the Approvals
 * page passes `{ fresh: true }` so it always refetches when opened.
 */
export function useApprovals({ fresh = false }: { fresh?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.approvals(),
    queryFn: () => api<ApprovalSummary[]>("/admin/approvals"),
    staleTime: 60_000,
    refetchOnMount: fresh ? "always" : true,
  });
}

/** One page of a resource list. Keeps the previous page on screen while the next loads. */
export function useList(resource: string, query: Record<string, QueryValue>) {
  return useQuery({
    queryKey: queryKeys.list(resource, query),
    queryFn: () => api<ListResponse>(`/admin/r/${resource}`, { query }),
    placeholderData: keepPreviousData,
  });
}

export function useRecord(resource: string, id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.record(resource, id),
    queryFn: () => api<AdminRecord>(`/admin/r/${resource}/${encodeURIComponent(id ?? "")}`),
    enabled: !!id,
  });
}

/** Search options for a relation picker (only fetched while `enabled`). */
export function useOptions(resource: string, search: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.options(resource, search),
    queryFn: () => api<OptionItem[]>(`/admin/options/${resource}`, { query: { search } }),
    enabled,
    staleTime: 30_000,
  });
}

/** Resolve labels for a set of ids via /admin/options/:resource?ids= */
export function useOptionLabels(resource: string | undefined, ids: string[]) {
  const key = ids.filter(Boolean).sort().join(",");
  return useQuery({
    queryKey: queryKeys.optionIds(resource, key),
    queryFn: () => api<OptionItem[]>(`/admin/options/${resource}`, { query: { ids: key } }),
    enabled: !!resource && !!key,
    staleTime: 5 * 60 * 1000,
  });
}
