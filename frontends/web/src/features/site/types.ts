// CMS pages, navigation, site settings, lookups and the dashboard bundle.
import type { ContentStatus, Timestamps } from "@/lib/types/common";
import type { ActionItem, EmailCampaign, Introduction, WhatsappGroup } from "@/features/comms/types";
import type { ForumEvent } from "@/features/events/types";
import type { Article, PodcastEpisode } from "@/features/media/types";
import type { BenefitOffer, Chapter, Group, Member, ProfileQuestion, Sector } from "@/features/membership/types";

export interface PageBlock {
  key: string;
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}

export interface ContentCard extends Timestamps {
  id: string;
  placement: string;
  title: string;
  description: string | null;
  icon: string | null;
  href: string | null;
  imageUrl: string | null;
  sortOrder: number;
  active: boolean;
}

export interface Page extends Timestamps {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  /** Paragraphs separated by blank lines. */
  body: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  blocks: PageBlock[] | null;
  metaDescription: string | null;
  status: ContentStatus;
  cards?: ContentCard[];
}

export type PageWithCards = Page & { cards: ContentCard[] };

export interface NavItem extends Timestamps {
  id: string;
  menu: string;
  parentId: string | null;
  label: string;
  href: string | null;
  icon: string | null;
  highlight: boolean;
  sortOrder: number;
  active: boolean;
  children?: NavItem[];
}

export interface SiteSettings {
  name: string;
  tagline: string;
  footerBlurb: string;
  membershipBlurb: string;
  membershipHeading: string;
  copyright: string;
  fallbackEventImageUrl: string;
  fallbackCoverImageUrl: string;
}

export interface ClubBenefit extends Timestamps {
  id: string;
  title: string;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface PageHeaderCopy {
  title: string;
  eyebrow: string | null;
  subtitle: string | null;
  heroImageUrl: string | null;
  heroImageAlt: string | null;
  /** Extra copy for the page; paragraphs separated by blank lines. */
  body: string | null;
  blocks: PageBlock[] | null;
}

export interface MemberSite {
  navigation: { sidebar: NavItem[] };
  settings: SiteSettings;
  pageHeaders: Record<string, PageHeaderCopy>;
}

export interface Lookups {
  sectors: Sector[];
  chapters: Chapter[];
  allChapters: Chapter[];
  profileQuestions: ProfileQuestion[];
  eventKinds: string[];
  venueCategories: string[];
  inviteAudiences: string[];
  supportOptions: string[];
  pitchFormats: string[];
  recommendationCategories: { id: string; label: string }[];
}

export interface Dashboard {
  member: Member | null;
  upcomingEvents: ForumEvent[];
  attending: ForumEvent[];
  hosting: ForumEvent[];
  newMembers: Member[];
  featuredOffers: BenefitOffer[];
  myOffers: BenefitOffer[];
  myGroups: (Group & { memberCount?: number })[];
  memberArticles: Article[];
  podcasts: PodcastEpisode[];
  inforumArticles: Article[];
  whatsappGroups: WhatsappGroup[];
  introductions: Introduction[];
  actions: ActionItem[];
  emails: EmailCampaign[];
}

export interface PublicSite {
  chapters: Chapter[];
  benefits: ClubBenefit[];
  settings: SiteSettings;
  navigation: { header: NavItem[]; footer: NavItem[] };
}
