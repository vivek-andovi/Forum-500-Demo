/**
 * Front-end knowledge about specific resources. Everything else (fields, columns, labels,
 * groups, statuses) comes from GET /admin/meta, so most resources need no entry beyond an icon.
 *
 *   icon      sidebar / approval-card icon (falls back to a folder)
 *   related   child lists shown as tabs under a record, filtered by `fk` = this record's id
 *   Extras    a workflow panel rendered above the form (see components/resource/extras/)
 *   hideForm  hide the generic fields + "Record details" cards (the Extras panel shows everything)
 */
import type { ComponentType } from "react";
import {
  Activity,
  Award,
  BadgeCheck,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckSquare,
  ClipboardCheck,
  Crown,
  FileClock,
  FileText,
  FolderOpen,
  Gift,
  Globe,
  Handshake,
  HelpCircle,
  Image,
  Images,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Lightbulb,
  ListOrdered,
  type LucideIcon,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Mic,
  Mic2,
  Newspaper,
  Paperclip,
  Quote,
  ScrollText,
  Settings,
  Sparkles,
  Star,
  Tag,
  Tags,
  Ticket,
  TrendingUp,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  UsersRound,
  Wand2,
} from "lucide-react";
import type { ExtrasProps } from "@/components/resource/extras/types";
import { ApplicationActions } from "@/components/resource/extras/applications";
import { RevisionReview } from "@/components/resource/extras/profile-revisions";
import { PitchActions } from "@/components/resource/extras/pitches";
import { UserActions } from "@/components/resource/extras/users";
import { AuditDetail } from "@/components/resource/extras/audit-log";

export type RelatedTab = { resource: string; fk: string; label?: string };

export type ResourceConfig = {
  icon?: LucideIcon;
  related?: RelatedTab[];
  Extras?: ComponentType<ExtrasProps>;
  hideForm?: boolean;
};

const RESOURCES: Record<string, ResourceConfig> = {
  // Membership
  members: {
    icon: Users,
    related: [
      { resource: "event-rsvps", fk: "memberId", label: "RSVPs" },
      { resource: "group-memberships", fk: "memberId", label: "Groups" },
      { resource: "benefit-opt-ins", fk: "memberId", label: "Benefit opt-ins" },
      { resource: "action-items", fk: "memberId", label: "Action items" },
    ],
  },
  applications: { icon: UserPlus, Extras: ApplicationActions },
  // Decided only via Approve / Reject; the panel shows the whole revision.
  "profile-revisions": { icon: FileClock, Extras: RevisionReview, hideForm: true },
  "member-interviews": { icon: Mic2 },
  "member-answers": { icon: HelpCircle },
  "benefit-offers": {
    icon: Gift,
    related: [{ resource: "benefit-opt-ins", fk: "offerId", label: "Opt-ins" }],
  },
  "benefit-opt-ins": { icon: BadgeCheck },
  groups: {
    icon: UsersRound,
    related: [{ resource: "group-memberships", fk: "groupId", label: "Members" }],
  },
  "group-memberships": { icon: UserCheck },

  // Events
  events: {
    icon: CalendarDays,
    related: [
      { resource: "event-rsvps", fk: "eventId", label: "RSVPs" },
      { resource: "event-hosts", fk: "eventId", label: "Hosts" },
    ],
  },
  "event-hosts": { icon: Crown },
  "event-rsvps": { icon: Ticket },
  venues: { icon: MapPin },
  "gallery-albums": {
    icon: Images,
    related: [{ resource: "gallery-photos", fk: "albumId", label: "Photos" }],
  },
  "gallery-photos": { icon: Image },
  "photo-tags": { icon: Tag },

  // Media
  articles: { icon: FileText },
  "inforum-editions": {
    icon: Newspaper,
    related: [{ resource: "edition-articles", fk: "editionId", label: "Articles" }],
  },
  "edition-articles": { icon: ListOrdered },
  "inforum-sections": { icon: Layers },
  "forecast-issues": {
    icon: TrendingUp,
    related: [{ resource: "articles", fk: "forecastIssueId", label: "Articles" }],
  },
  pitches: { icon: Lightbulb, Extras: PitchActions },
  recommendations: { icon: Star },
  comments: { icon: MessageSquare },
  "podcast-episodes": { icon: Mic },
  books: { icon: BookOpen },
  "book-recommendations": { icon: BookMarked },
  "library-items": { icon: Library },
  "feed-posts": { icon: Megaphone },

  // Communications
  introductions: { icon: Handshake },
  "whatsapp-groups": {
    icon: MessageCircle,
    related: [
      { resource: "whatsapp-memberships", fk: "groupId", label: "Members" },
      { resource: "whatsapp-messages", fk: "groupId", label: "Chat messages" },
    ],
  },
  "whatsapp-memberships": { icon: UserCheck },
  "whatsapp-messages": { icon: MessagesSquare },
  "email-campaigns": { icon: Mail },
  notifications: { icon: Bell },
  "action-items": { icon: CheckSquare },
  "concierge-requests": { icon: Sparkles },

  // Website
  "nav-items": {
    icon: Menu,
    related: [{ resource: "nav-items", fk: "parentId", label: "Sub-items" }],
  },
  "content-cards": { icon: LayoutGrid },
  "club-benefits": { icon: Award },
  "quick-prompts": { icon: Wand2 },
  pages: { icon: ScrollText },

  // Configuration
  chapters: { icon: Globe },
  sectors: { icon: Briefcase },
  "membership-tiers": { icon: Crown },
  "profile-questions": { icon: Quote },
  "benefit-categories": { icon: Tags },
  settings: { icon: Settings },

  // System
  users: { icon: UserCog, Extras: UserActions },
  assets: { icon: Paperclip },
  "audit-logs": { icon: Activity, Extras: AuditDetail, hideForm: true },
};

export function resourceConfig(name: string): ResourceConfig {
  return RESOURCES[name] ?? {};
}

export function resourceIcon(name: string): LucideIcon {
  return RESOURCES[name]?.icon ?? FolderOpen;
}

/**
 * Custom (non-resource) pages, shown at the top of the sidebar.
 * `badge: "pendingApprovals"` shows the total pending approval count.
 */
export type NavPage = { href: string; label: string; icon: LucideIcon; badge?: "pendingApprovals" };

export const NAV_PAGES: NavPage[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck, badge: "pendingApprovals" },
];
