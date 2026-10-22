"use client";

// Events, RSVPs, venues and the gallery.
// Mutations invalidate the queries they affect; errors are toasted globally by the MutationCache
// in components/providers.tsx, so pages only add their own success toast.
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { useInvalidate } from "@/lib/query-utils";
import type {
  EventDetail,
  EventProposalInput,
  EventRsvp,
  ForumEvent,
  GalleryPhoto,
  GalleryResponse,
  MyEventsResponse,
  Venue,
} from "@/features/events/types";

export const useEvents = () => useQuery({ queryKey: qk.events, queryFn: () => api<ForumEvent[]>("/v1/events") });

export const useEvent = (slug: string) =>
  useQuery({
    queryKey: qk.event(slug),
    queryFn: () => api<EventDetail>(`/v1/events/${encodeURIComponent(slug)}`),
    enabled: !!slug,
  });

export const useMyEvents = (enabled = true) =>
  useQuery({ queryKey: qk.myEvents, queryFn: () => api<MyEventsResponse>("/v1/events/mine"), enabled });

export function useRsvp() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, plusOnes, dietaryNote }: { id: string; plusOnes?: number; dietaryNote?: string }) =>
      api<EventRsvp>(`/v1/events/${id}/rsvp`, { method: "POST", body: { plusOnes, dietaryNote } }),
    onSuccess: () => inv(["event"], qk.myEvents, qk.dashboard),
  });
}

export function useCancelRsvp() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/events/${id}/rsvp`, { method: "DELETE" }),
    onSuccess: () => inv(["event"], qk.myEvents, qk.dashboard),
  });
}

export function useProposeEvent() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: EventProposalInput) => api("/v1/events/proposals", { method: "POST", body }),
    onSuccess: () => inv(qk.myEvents),
  });
}

export const useVenues = () => useQuery({ queryKey: qk.venues, queryFn: () => api<Venue[]>("/v1/venues") });

export const useGalleryAlbums = () =>
  useQuery({ queryKey: qk.albums, queryFn: () => api<GalleryResponse>("/v1/gallery/albums") });

export const useMyGallery = (enabled = true) =>
  useQuery({ queryKey: qk.myGallery, queryFn: () => api<GalleryPhoto[]>("/v1/gallery/mine"), enabled });

export function useTagPhoto() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, tag }: { id: string; tag: boolean }) =>
      api(`/v1/gallery/photos/${id}/tag`, { method: tag ? "POST" : "DELETE" }),
    onSuccess: () => inv(qk.albums, qk.myGallery),
  });
}
