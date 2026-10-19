"use client";

// One React Query hook per API endpoint. Mutations invalidate the queries they
// affect; errors are toasted globally by the MutationCache in providers.tsx, so
// pages only need to add their own success toast.
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api } from "./api";
import type {
  ActionItem,
  ApplicationInput,
  Article,
  BenefitsResponse,
  BooksResponse,
  BookRecommendation,
  CommentsResponse,
  ConciergeRequest,
  ConversationSummary,
  ConversationThread,
  GroupChatMessage,
  InforumTab,
  MemberSite,
  PageWithCards,
  QuickPrompt,
  SendMessageResponse,
  Dashboard,
  EmailCampaign,
  EventDetail,
  EventProposalInput,
  EventRsvp,
  FeedResponse,
  ForecastIssue,
  ForumEvent,
  GalleryPhoto,
  GalleryResponse,
  GroupsResponse,
  InforumEdition,
  InforumSection,
  Introduction,
  LibraryItem,
  LoginResponse,
  Lookups,
  MeResponse,
  Member,
  MyEventsResponse,
  Notification,
  Page,
  PodcastEpisode,
  ProfileInput,
  PublicSite,
  Recommendation,
  Venue,
  WhatsappResponse,
} from "./types";

export const qk = {
  me: ["me"] as const,
  lookups: ["lookups"] as const,
  dashboard: ["dashboard"] as const,
  members: (f: MemberFilters = {}) => ["members", f] as const,
  newMembers: ["members", "new"] as const,
  member: (slug: string) => ["member", slug] as const,
  benefits: ["benefits"] as const,
  groups: ["groups"] as const,
  events: ["events"] as const,
  event: (slug: string) => ["event", slug] as const,
  myEvents: ["events", "mine"] as const,
  venues: ["venues"] as const,
  albums: ["gallery", "albums"] as const,
  myGallery: ["gallery", "mine"] as const,
  editions: ["inforum", "editions"] as const,
  edition: (slug: string) => ["inforum", "edition", slug] as const,
  sections: ["inforum", "sections"] as const,
  recommendations: ["inforum", "recommendations"] as const,
  comments: ["inforum", "comments"] as const,
  forecast: ["forecast"] as const,
  podcasts: ["podcasts"] as const,
  books: ["books"] as const,
  reading: ["reading"] as const,
  library: ["library"] as const,
  articles: (publication?: string) => ["articles", publication ?? "all"] as const,
  article: (slug: string) => ["article", slug] as const,
  feed: ["feed"] as const,
  introductions: ["introductions"] as const,
  whatsapp: ["whatsapp"] as const,
  emails: ["emails"] as const,
  notifications: ["notifications"] as const,
  actions: ["actions"] as const,
  concierge: ["concierge"] as const,
  page: (slug: string) => ["page", slug] as const,
  publicSite: ["public", "site"] as const,
  publicInforum: ["public", "inforum"] as const,
  publicPage: (slug: string) => ["public", "page", slug] as const,
  publicInforumTabs: ["public", "inforum", "tabs"] as const,
  memberSite: ["site"] as const,
  inforumTabs: ["inforum", "tabs"] as const,
  quickPrompts: ["concierge", "prompts"] as const,
  conversations: ["messages"] as const,
  conversation: (id: string) => ["messages", id] as const,
  groupChat: (groupId: string) => ["whatsapp", "chat", groupId] as const,
};

const POLL_MS = 15_000;

export interface MemberFilters {
  search?: string;
  sectorId?: string;
  chapterId?: string;
}

function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: QueryKey[]) => Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: k })));
}

// ─────────── Auth / me ───────────

export function useLogin() {
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<LoginResponse>("/auth/login", { method: "POST", body, auth: false }),
    meta: { silent: true },
  });
}

export const useMe = () => useQuery({ queryKey: qk.me, queryFn: () => api<MeResponse>("/v1/me") });
export const useLookups = () =>
  useQuery({ queryKey: qk.lookups, queryFn: () => api<Lookups>("/v1/lookups"), staleTime: 10 * 60_000 });

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

// ─────────── Dashboard / directory ───────────

export const useDashboard = () =>
  useQuery({ queryKey: qk.dashboard, queryFn: () => api<Dashboard>("/v1/dashboard") });

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

// ─────────── Benefits ───────────

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

// ─────────── Groups ───────────

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

// ─────────── Events ───────────

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

// ─────────── Media ───────────

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
export const useArticle = (slug: string) =>
  useQuery({
    queryKey: qk.article(slug),
    queryFn: () => api<Article>(`/v1/articles/${encodeURIComponent(slug)}`),
    enabled: !!slug,
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

// ─────────── Comms ───────────

export const useIntroductions = (enabled = true) =>
  useQuery({ queryKey: qk.introductions, queryFn: () => api<Introduction[]>("/v1/introductions"), enabled });

export function useRequestIntroduction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { targetMemberId: string; reason: string }) =>
      api("/v1/introductions", { method: "POST", body }),
    onSuccess: () => inv(qk.introductions, qk.dashboard),
  });
}

export function useRespondIntroduction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      api(`/v1/introductions/${id}/respond`, { method: "POST", body: { accept } }),
    onSuccess: () => inv(qk.introductions, qk.dashboard),
  });
}

export const useWhatsapp = () =>
  useQuery({ queryKey: qk.whatsapp, queryFn: () => api<WhatsappResponse>("/v1/whatsapp") });

export function useJoinWhatsapp() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/whatsapp/${id}/join`, { method: "POST" }),
    onSuccess: () => inv(qk.whatsapp, qk.dashboard),
  });
}

export const useEmails = () => useQuery({ queryKey: qk.emails, queryFn: () => api<EmailCampaign[]>("/v1/emails") });

export const useNotifications = () =>
  useQuery({ queryKey: qk.notifications, queryFn: () => api<Notification[]>("/v1/notifications") });

export function useMarkNotificationRead() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => inv(qk.notifications),
  });
}

export const useActions = () => useQuery({ queryKey: qk.actions, queryFn: () => api<ActionItem[]>("/v1/actions") });

export function useCompleteAction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api(`/v1/actions/${id}/complete`, { method: "POST" }),
    onSuccess: () => inv(qk.actions, qk.dashboard),
  });
}

export const useConcierge = (enabled = true) =>
  useQuery({ queryKey: qk.concierge, queryFn: () => api<ConciergeRequest[]>("/v1/concierge"), enabled });

export function useAskConcierge() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { promptType?: string; body: string }) =>
      api<ConciergeRequest>("/v1/concierge", { method: "POST", body }),
    onSuccess: () => inv(qk.concierge),
  });
}

export const useQuickPrompts = () =>
  useQuery({
    queryKey: qk.quickPrompts,
    queryFn: () => api<QuickPrompt[]>("/v1/concierge/prompts"),
    staleTime: 10 * 60_000,
  });

export const usePage = (slug: string) =>
  useQuery({
    queryKey: qk.page(slug),
    queryFn: async () => (await api<Page | null>(`/v1/pages/${encodeURIComponent(slug)}`)) ?? null,
  });

export const useMemberSite = () =>
  useQuery({ queryKey: qk.memberSite, queryFn: () => api<MemberSite>("/v1/site"), staleTime: 10 * 60_000 });

/** CMS copy for a member page (header, hero image, body, blocks) from /v1/site. */
export const usePageCopy = (pageKey: string) => useMemberSite().data?.pageHeaders?.[pageKey];

/** Site-wide settings (fallback images, blurbs) for member pages. */
export const useSiteSettings = () => useMemberSite().data?.settings;

export const useInforumTabs = () =>
  useQuery({ queryKey: qk.inforumTabs, queryFn: () => api<InforumTab[]>("/v1/inforum/tabs"), staleTime: 10 * 60_000 });

// ─────────── Direct messages ───────────

export const useConversations = (enabled = true) =>
  useQuery({
    queryKey: qk.conversations,
    queryFn: () => api<ConversationSummary[]>("/v1/messages"),
    enabled,
    refetchInterval: POLL_MS,
  });

export const useConversation = (id: string | null | undefined) =>
  useQuery({
    queryKey: qk.conversation(id ?? ""),
    queryFn: () => api<ConversationThread>(`/v1/messages/${encodeURIComponent(id ?? "")}`),
    enabled: !!id,
    refetchInterval: POLL_MS,
  });

export function useSendMessage() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (body: { recipientMemberId: string; body: string }) =>
      api<SendMessageResponse>("/v1/messages", { method: "POST", body }),
    onSuccess: (res) => inv(qk.conversations, qk.conversation(res.conversationId)),
  });
}

export function useReply() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      api<SendMessageResponse>(`/v1/messages/${encodeURIComponent(conversationId)}`, { method: "POST", body: { body } }),
    onSuccess: (res) => inv(qk.conversations, qk.conversation(res.conversationId)),
  });
}

// ─────────── WhatsApp group chat ───────────

export const useGroupChat = (groupId: string | null | undefined, enabled = true) =>
  useQuery({
    queryKey: qk.groupChat(groupId ?? ""),
    queryFn: () => api<GroupChatMessage[]>(`/v1/whatsapp/${encodeURIComponent(groupId ?? "")}/messages`),
    enabled: !!groupId && enabled,
    refetchInterval: POLL_MS,
  });

export function usePostGroupMessage() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ groupId, body }: { groupId: string; body: string }) =>
      api<GroupChatMessage>(`/v1/whatsapp/${encodeURIComponent(groupId)}/messages`, { method: "POST", body: { body } }),
    onSuccess: (_res, vars) => inv(qk.groupChat(vars.groupId)),
  });
}

// ─────────── Public ───────────

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

export function useSubmitApplication() {
  return useMutation({
    mutationFn: (body: ApplicationInput) => api("/public/applications", { method: "POST", body, auth: false }),
  });
}
