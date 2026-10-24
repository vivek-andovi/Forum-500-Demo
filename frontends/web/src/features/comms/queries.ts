"use client";

// Introductions, WhatsApp, email, notifications, actions, concierge and direct messages.
// Mutations invalidate the queries they affect; errors are toasted globally by the MutationCache
// in components/providers.tsx, so pages only add their own success toast.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { qk } from "@/lib/query-keys";
import { POLL_MS, useInvalidate } from "@/lib/query-utils";
import type {
  ActionItem,
  ConciergeRequest,
  ConversationSummary,
  ConversationThread,
  EmailCampaign,
  GroupChatMessage,
  Introduction,
  Notification,
  QuickPrompt,
  SendMessageResponse,
  WhatsappResponse,
} from "@/features/comms/types";

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

/** One email with its content. Opening it marks it read, so the list and dashboard are refreshed. */
export function useEmail(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.email(id ?? ""),
    queryFn: async () => {
      const email = await api<EmailCampaign>(`/v1/emails/${id}`);
      // exact: a prefix match on ["emails"] would also refetch this query.
      void qc.invalidateQueries({ queryKey: qk.emails, exact: true });
      void qc.invalidateQueries({ queryKey: qk.dashboard });
      return email;
    },
    enabled: !!id,
  });
}

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
