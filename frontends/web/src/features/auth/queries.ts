"use client";

// Sign-in and the current user.
// Mutations invalidate the queries they affect; errors are toasted globally by the MutationCache
// in components/providers.tsx, so pages only add their own success toast.
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { LoginResponse, MeResponse } from "@/features/auth/types";

export function useLogin() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<LoginResponse>("/auth/login", { method: "POST", body, auth: false }),
    meta: { silent: true },
  });
}

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => api<MeResponse>("/v1/me") });
