"use client";

// CMS copy, site settings, lookups and the dashboard bundle.
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import type { Dashboard, Lookups, MemberSite, Page, PageWithCards, PublicSite } from "@/features/site/types";

export const useLookups = () =>
  useQuery({ queryKey: qk.lookups, queryFn: () => api<Lookups>("/v1/lookups"), staleTime: 10 * 60_000 });

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: () => api<Dashboard>("/v1/dashboard") });

export const usePage = (slug: string) =>
  useQuery({
    queryKey: qk.page(slug),
    // A page that hasn't been created in the CMS yet is "empty", not an error.
    queryFn: () =>
      api<Page>(`/v1/pages/${encodeURIComponent(slug)}`).catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }),
  });

export const useMemberSite = () =>
  useQuery({ queryKey: qk.memberSite, queryFn: () => api<MemberSite>("/v1/site"), staleTime: 10 * 60_000 });

/** CMS copy for a member page (header, hero image, body, blocks) from /v1/site. */
export const usePageCopy = (pageKey: string) => useMemberSite().data?.pageHeaders?.[pageKey];

/** Site-wide settings (fallback images, blurbs) for member pages. */
export const useSiteSettings = () => useMemberSite().data?.settings;

export const usePublicSite = () =>
  useQuery({
    queryKey: qk.publicSite,
    queryFn: () => api<PublicSite>("/public/site", { auth: false }),
    staleTime: 5 * 60_000,
  });

export const usePublicPage = (slug: string) =>
  useQuery({
    queryKey: qk.publicPage(slug),
    queryFn: () => api<PageWithCards>(`/public/pages/${encodeURIComponent(slug)}`, { auth: false }),
    staleTime: 5 * 60_000,
  });
