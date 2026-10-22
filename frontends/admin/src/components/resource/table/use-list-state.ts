"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDebounce } from "@/lib/use-debounce";
import type { ResourceMeta } from "@/lib/types";

export type ListState = {
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
  search: string;
  status?: string;
  filters: Record<string, string>;
};

export type UpdateListState = (patch: Partial<ListState>) => void;

/**
 * List state stored in the URL (page mode: ?page, pageSize, sort, order, search, status, filter.<field>)
 * or in component state (embedded mode, e.g. related tabs).
 */
export function useListState(syncUrl: boolean, defaultPageSize: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [local, setLocal] = useState<ListState>({
    page: 1,
    pageSize: defaultPageSize,
    search: "",
    filters: {},
  });

  const fromUrl = useMemo<ListState>(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      if (k.startsWith("filter.")) filters[k.slice(7)] = v;
    });
    const order = searchParams.get("order");
    return {
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      pageSize: Number(searchParams.get("pageSize")) || defaultPageSize,
      sort: searchParams.get("sort") || undefined,
      order: order === "asc" || order === "desc" ? order : undefined,
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || undefined,
      filters,
    };
  }, [searchParams, defaultPageSize]);

  const state = syncUrl ? fromUrl : local;

  const update: UpdateListState = (patch) => {
    const next = { ...state, ...patch };
    if (!syncUrl) {
      setLocal(next);
      return;
    }
    const sp = new URLSearchParams();
    if (next.page > 1) sp.set("page", String(next.page));
    if (next.pageSize !== defaultPageSize) sp.set("pageSize", String(next.pageSize));
    if (next.sort) sp.set("sort", next.sort);
    if (next.sort && next.order) sp.set("order", next.order);
    if (next.search) sp.set("search", next.search);
    if (next.status) sp.set("status", next.status);
    for (const [k, v] of Object.entries(next.filters)) sp.set(`filter.${k}`, v);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return [state, update] as const;
}

/**
 * The search box's own value, debounced into the list state.
 * Returns [inputValue, setInputValue].
 */
export function useSearchInput(state: ListState, update: UpdateListState) {
  const [searchInput, setSearchInput] = useState(state.search);
  const debouncedSearch = useDebounce(searchInput, 350);

  // The last search we wrote to the list state. When the URL catches up with it we must not
  // reset the input, or characters typed during the round-trip are lost.
  const pushedSearch = useRef(state.search);

  useEffect(() => {
    if (debouncedSearch !== state.search) {
      pushedSearch.current = debouncedSearch;
      update({ search: debouncedSearch, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    // Keep the input in sync only when the URL changes externally (back button, sidebar link).
    if (state.search !== pushedSearch.current) {
      pushedSearch.current = state.search;
      setSearchInput(state.search);
    }
  }, [state.search]);

  return [searchInput, setSearchInput] as const;
}

/** The API query for a list: list state + sort defaults + fixed (embedded) filters. */
export function buildListQuery(
  resource: ResourceMeta,
  state: ListState,
  fixedFilter: Record<string, string> | undefined,
) {
  const sort = state.sort ?? resource.defaultSort?.field;
  const order = state.sort ? (state.order ?? "asc") : resource.defaultSort?.order;
  const query: Record<string, string | number | undefined> = {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    sort,
    order,
    status: state.status,
  };
  for (const [k, v] of Object.entries({ ...state.filters, ...(fixedFilter ?? {}) })) {
    query[`filter.${k}`] = v;
  }
  return { query, sort, order };
}
