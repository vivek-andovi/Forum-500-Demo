// Introductions, WhatsApp groups, email, notifications, actions, concierge and direct messages.
import type { ISODate, MembershipRequestStatus, Timestamps } from "@/lib/types/common";
import type { Chapter, Member } from "@/features/membership/types";

export type IntroductionStatus = "requested" | "pending" | "accepted" | "declined";

export type ActionType = "review" | "approve" | "sign" | "pay" | "fill";

export type ActionContext = "Membership" | "Events" | "Media" | "Communications" | "Benefits";

export type ActionStatus = "pending" | "completed" | "dismissed" | "overdue";

export type NotificationType =
  | "new_member"
  | "rsvp_reminder"
  | "publication"
  | "profile_view"
  | "approval"
  | "general";

export type ConciergeStatus = "open" | "answered" | "closed";

export interface Introduction extends Timestamps {
  id: string;
  requesterId: string | null;
  targetId: string;
  introducerId: string | null;
  introducerName: string | null;
  reason: string | null;
  status: IntroductionStatus;
  respondedAt: ISODate | null;
  requester?: Member | null;
  target?: Member | null;
  introducer?: Member | null;
}

export interface WhatsappGroup extends Timestamps {
  id: string;
  name: string;
  chapterId: string | null;
  inviteLink: string | null;
  moderatorId: string | null;
  active: boolean;
  sortOrder: number;
  chapter?: Chapter | null;
  moderator?: Member | null;
}

export interface WhatsappMembership extends Timestamps {
  id: string;
  groupId: string;
  memberId: string;
  status: MembershipRequestStatus;
  group?: WhatsappGroup;
}

export interface EmailCampaign extends Timestamps {
  id: string;
  subject: string;
  senderLabel: string;
  preview: string | null;
  /** Only on GET /v1/emails/:id; the list leaves the content out. */
  body?: string | null;
  /** Full newsletter HTML document (imported archive); render sandboxed. Only on GET /v1/emails/:id. */
  html?: string | null;
  status: "draft" | "scheduled" | "sent";
  scheduledAt: ISODate | null;
  sentAt: ISODate | null;
  unread?: boolean;
}

export interface Notification extends Timestamps {
  id: string;
  memberId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  readAt: ISODate | null;
}

export interface ActionItem extends Timestamps {
  id: string;
  memberId: string | null;
  type: ActionType;
  context: ActionContext;
  title: string;
  detail: string | null;
  dueAt: ISODate | null;
  amountCents: number | null;
  currency: string | null;
  documentUrl: string | null;
  status: ActionStatus;
  completedAt: ISODate | null;
}

export interface ConciergeRequest extends Timestamps {
  id: string;
  memberId: string | null;
  promptType: string | null;
  body: string;
  status: ConciergeStatus;
  adminReply: string | null;
}

export interface QuickPrompt extends Timestamps {
  id: string;
  key: string;
  label: string;
  template: string;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

export interface MessageMember {
  id: string;
  slug: string;
  fullName: string;
  avatarUrl: string | null;
  headline: string | null;
  company: string | null;
}

export interface ConversationSummary {
  id: string;
  /** null when the other member has been deleted. */
  otherMember: MessageMember | null;
  lastMessage: { body: string; createdAt: ISODate; mine: boolean } | null;
  lastMessageAt: ISODate | null;
  unread: boolean;
}

export interface DirectMessage {
  id: string;
  conversationId?: string;
  senderId: string | null;
  senderName: string;
  body: string;
  createdAt: ISODate;
  mine: boolean;
}

export interface ConversationThread {
  id: string;
  /** null when the other member has been deleted (history stays readable, replies are off). */
  otherMember: MessageMember | null;
  messages: DirectMessage[];
}

export interface SendMessageResponse {
  conversationId: string;
  message: DirectMessage;
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  memberId: string | null;
  authorName: string;
  authorSlug: string | null;
  authorPhotoUrl: string | null;
  body: string;
  createdAt: ISODate;
  mine: boolean;
}

export interface WhatsappResponse {
  /** When true every group carries its inviteLink and members join directly in WhatsApp. */
  openAccess: boolean;
  groups: WhatsappGroup[];
  memberships: WhatsappMembership[];
}
