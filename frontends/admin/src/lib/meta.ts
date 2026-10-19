"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Meta, ResourceMeta } from "@/lib/types";

export function useMeta() {
  return useQuery({
    queryKey: ["admin-meta"],
    queryFn: () => api<Meta>("/admin/meta"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useResourceMeta(name: string): {
  resource: ResourceMeta | undefined;
  isLoading: boolean;
  error: unknown;
  meta: Meta | undefined;
} {
  const q = useMeta();
  return {
    resource: q.data?.resources.find((r) => r.name === name),
    isLoading: q.isLoading,
    error: q.error,
    meta: q.data,
  };
}

export const GROUP_ORDER = [
  "Membership",
  "Events",
  "Media",
  "Communications",
  "Website",
  "Configuration",
  "System",
];

export function groupResources(resources: ResourceMeta[]) {
  const groups = new Map<string, ResourceMeta[]>();
  for (const r of resources) {
    const list = groups.get(r.group) ?? [];
    list.push(r);
    groups.set(r.group, list);
  }
  return [...groups.entries()].sort(
    ([a], [b]) =>
      (GROUP_ORDER.indexOf(a) === -1 ? 99 : GROUP_ORDER.indexOf(a)) -
      (GROUP_ORDER.indexOf(b) === -1 ? 99 : GROUP_ORDER.indexOf(b)),
  );
}

/** Builds an admin list URL from an approval/filter object. `status` maps to the status param. */
export function resourceHref(resource: string, filter?: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(filter ?? {})) {
    sp.set(k === "status" ? "status" : `filter.${k}`, v);
  }
  const s = sp.toString();
  return `/r/${resource}${s ? `?${s}` : ""}`;
}
