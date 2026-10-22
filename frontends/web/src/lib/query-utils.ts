"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";

/** Poll interval for live views (direct messages, group chat). */
export const POLL_MS = 15_000;

/** Returns a function that invalidates every given query key (by prefix). */
export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: QueryKey[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}
