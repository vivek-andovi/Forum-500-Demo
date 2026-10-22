"use client";

// Member directory, profile editing, benefits, groups and membership applications.
// Mutations invalidate the queries they affect; errors are toasted globally by the MutationCache
// in components/providers.tsx, so pages only add their own success toast.
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useInvalidate } from "@/lib/query-utils";
import type { MeResponse } from "@/features/auth/types";
import type {
  ApplicationInput,
  BenefitsResponse,
  GroupsResponse,
  Member,
  ProfileInput,
} from "@/features/membership/types";
import type { MemberFilters } from "@/lib/query-keys";

export function useSaveProfile() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: ProfileInput) => api<MeResponse>("/v1/me/profile", { method: "PATCH", body }),
    onSuccess: () => inv(qk.me, qk.dashboard, ["members"], ["member"]),
  });
}

export function useSubmitProfile() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: ProfileInput) => api<MeResponse>("/v1/me/profile/submit", { method: "POST", body }),
    onSuccess: () => inv(qk.me),
  });
}

export const useMembers = (f: MemberFilters = {}) =>
  useQuery({
    queryKey: qk.members(f),
    queryFn: () =>
      api<Member[]>("/v1/members", { query: { search: f.search, sectorId: f.sectorId, chapterId: f.chapterId } }),
    placeholderData: (prev) => prev,
  });

export const useNewMembers = () =>
  useQuery({ queryKey: qk.newMembers, queryFn: () => api<Member[]>("/v1/members/new") });

export const useMember = (slug: string) =>
  useQuery({
    queryKey: qk.member(slug),
    queryFn: () => api<Member>(`/v1/members/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });

export const useBenefits = () =>
  useQuery({ queryKey: qk.benefits, queryFn: () => api<BenefitsResponse>("/v1/benefits") });

export function useToggleOptIn() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, optIn }: { id: string; optIn: boolean }) =>
      api(`/v1/benefits/${id}/optin`, { method: optIn ? "POST" : "DELETE" }),
    onSuccess: () => inv(qk.benefits, qk.dashboard),
  });
}

export function useSubmitOffer() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: {
      title: string;
      category: string;
      offer: string;
      about?: string;
      detail?: string;
      howToRedeem?: string;
    }) => api("/v1/benefits/submissions", { method: "POST", body }),
    onSuccess: () => inv(qk.benefits, qk.dashboard),
  });
}

export const useGroups = () => useQuery({ queryKey: qk.groups, queryFn: () => api<GroupsResponse>("/v1/groups") });

export function useJoinGroup() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/groups/${id}/join`, { method: "POST" }),
    onSuccess: () => inv(qk.groups, qk.dashboard, qk.me),
  });
}

export function useLeaveGroup() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/groups/${id}/membership`, { method: "DELETE" }),
    onSuccess: () => inv(qk.groups, qk.dashboard, qk.me),
  });
}

export function useProposeGroup() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { name: string; purpose: string; cadence?: string; members?: string }) =>
      api("/v1/groups/proposals", { method: "POST", body }),
    onSuccess: () => inv(qk.groups),
  });
}

export function useSubmitApplication() {
  return useMutation({
    mutationFn: (body: ApplicationInput) => api("/public/applications", { method: "POST", body, auth: false }),
  });
}
