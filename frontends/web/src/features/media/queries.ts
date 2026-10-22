"use client";

// In:Forum, Forecast, podcasts, books, library, articles and the newsfeed.
// Mutations invalidate the queries they affect; errors are toasted globally by the MutationCache
// in components/providers.tsx, so pages only add their own success toast.
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useInvalidate } from "@/lib/query-utils";
import type {
  Article,
  BookRecommendation,
  BooksResponse,
  CommentsResponse,
  FeedResponse,
  ForecastIssue,
  InforumEdition,
  InforumSection,
  InforumTab,
  LibraryItem,
  PodcastEpisode,
  Recommendation,
} from "@/features/media/types";

export const useEditions = () =>
  useQuery({ queryKey: qk.editions, queryFn: () => api<InforumEdition[]>("/v1/inforum/editions") });

export const useEdition = (slug = "current") =>
  useQuery({
    queryKey: qk.edition(slug),
    queryFn: () => api<InforumEdition>(`/v1/inforum/editions/${encodeURIComponent(slug)}`),
  });

export const useSections = () =>
  useQuery({ queryKey: qk.sections, queryFn: () => api<InforumSection[]>("/v1/inforum/sections") });

export const useRecommendations = () =>
  useQuery({ queryKey: qk.recommendations, queryFn: () => api<Recommendation[]>("/v1/inforum/recommendations") });

export function useAddRecommendation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { category: string; title: string; place?: string; note?: string }) =>
      api("/v1/inforum/recommendations", { method: "POST", body }),
    onSuccess: () => inv(qk.recommendations),
  });
}

export const useComments = () =>
  useQuery({ queryKey: qk.comments, queryFn: () => api<CommentsResponse>("/v1/inforum/comments") });

export function usePostComment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { body: string; parentId?: string }) =>
      api("/v1/inforum/comments", { method: "POST", body }),
    onSuccess: () => inv(qk.comments),
  });
}

export function useRecommendComment() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) =>
      api<{ recommended: boolean; recommends: number }>(`/v1/inforum/comments/${id}/recommend`, { method: "POST" }),
    onSuccess: () => inv(qk.comments),
  });
}

export function useSubmitPitch() {
  return useMutation({
    mutationFn: (body: {
      headline: string;
      synopsis: string;
      section: string;
      format: string;
      dateline?: string;
      notes?: string;
    }) => api("/v1/pitches", { method: "POST", body }),
  });
}

export const useForecast = () =>
  useQuery({ queryKey: qk.forecast, queryFn: () => api<ForecastIssue[]>("/v1/forecast") });

export const usePodcasts = () =>
  useQuery({ queryKey: qk.podcasts, queryFn: () => api<PodcastEpisode[]>("/v1/podcasts") });

export const useBooks = () => useQuery({ queryKey: qk.books, queryFn: () => api<BooksResponse>("/v1/books") });

export const useReading = () =>
  useQuery({ queryKey: qk.reading, queryFn: () => api<BookRecommendation[]>("/v1/reading") });

export const useLibrary = () => useQuery({ queryKey: qk.library, queryFn: () => api<LibraryItem[]>("/v1/library") });

export const useArticles = (publication?: string) =>
  useQuery({
    queryKey: qk.articles(publication),
    queryFn: () => api<Article[]>("/v1/articles", { query: { publication } }),
  });

export const useFeed = () => useQuery({ queryKey: qk.feed, queryFn: () => api<FeedResponse>("/v1/feed") });

export function usePostFeed() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { body: string; imageUrl?: string }) => api("/v1/feed", { method: "POST", body }),
    onSuccess: () => inv(qk.feed),
  });
}

export function useLikePost() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<{ liked: boolean; likes: number }>(`/v1/feed/${id}/like`, { method: "POST" }),
    onSuccess: () => inv(qk.feed),
  });
}

export const useInforumTabs = () =>
  useQuery({ queryKey: qk.inforumTabs, queryFn: () => api<InforumTab[]>("/v1/inforum/tabs"), staleTime: 10 * 60_000 });

export const usePublicInforumTabs = () =>
  useQuery({
    queryKey: qk.publicInforumTabs,
    queryFn: () => api<InforumTab[]>("/public/inforum/tabs", { auth: false }),
    staleTime: 10 * 60_000,
  });

export const usePublicInforum = () =>
  useQuery({
    queryKey: qk.publicInforum,
    queryFn: () => api<InforumEdition>("/public/inforum/current", { auth: false }),
  });
