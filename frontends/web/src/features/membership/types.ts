// Members, profiles, benefits, groups and membership applications.
import type { ContentStatus, ISODate, MembershipRequestStatus, Timestamps } from "@/lib/types/common";
import type { Article, PodcastEpisode } from "@/features/media/types";

export type ProfileStatus = "draft" | "pending_review" | "published";

export type ReviewStatus = "pending" | "approved" | "rejected";

export type BenefitKind = "member" | "partner";

export interface Chapter extends Timestamps {
  id: string;
  name: string;
  country: string | null;
  isChapter: boolean;
  whatsappEnabled: boolean;
  sortOrder: number;
}

export interface Sector extends Timestamps {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MemberSector {
  id: string;
  sortOrder: number;
  sector: Sector;
}

export interface MembershipTier extends Timestamps {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  currency: string;
  sortOrder: number;
}

export interface ProfileQuestion extends Timestamps {
  id: string;
  text: string;
  sortOrder: number;
  active: boolean;
}

export interface MemberQuestionAnswer extends Timestamps {
  id: string;
  memberId: string;
  questionId: string;
  answer: string;
  question?: ProfileQuestion;
}

export interface MemberInterviewQA extends Timestamps {
  id: string;
  memberId: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export interface ProfileRevision extends Timestamps {
  id: string;
  memberId: string;
  changes: Record<string, unknown>;
  status: ReviewStatus;
  reviewerNote: string | null;
  reviewedAt: ISODate | null;
}

export interface Member extends Timestamps {
  id: string;
  userId: string | null;
  slug: string;
  fullName: string;
  headline: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  linkedinUrl: string | null;
  interests: string[];
  travelCities: string[];
  joinedYear: number | null;
  chapterId: string | null;
  sectorId: string | null;
  tierId: string | null;
  isPublished: boolean;
  profileStatus: ProfileStatus;
  featuredNewMember: boolean;
  spotlightQuestion: string | null;
  spotlightAnswer: string | null;
  /** Full position line as imported, e.g. "LONDON | Chairman | Acme | Private Equity". */
  positionLine: string | null;
  /** What the member's company does. */
  companyDescription: string | null;
  verified: boolean;
  /** Own profile only: saved-but-unsubmitted edits of a published member. */
  profileDraft?: ProfileInput | null;
  chapter?: Chapter | null;
  /** Primary sector (also listed in `sectors`). */
  sector?: Sector | null;
  /** Every sector the member works in, ordered by sortOrder (directory + profile). */
  sectors?: MemberSector[];
  tier?: MembershipTier | null;
  answers?: MemberQuestionAnswer[];
  interviews?: MemberInterviewQA[];
  groupMemberships?: (GroupMembership & { group?: Group })[];
  benefitOffers?: BenefitOffer[];
  articles?: Article[];
  podcastAppearances?: PodcastEpisode[];
}

export interface BenefitCategory extends Timestamps {
  id: string;
  name: string;
  kind: BenefitKind;
  sortOrder: number;
}

export interface BenefitOffer extends Timestamps {
  id: string;
  slug: string;
  kind: BenefitKind;
  title: string;
  offer: string;
  categoryId: string | null;
  providerMemberId: string | null;
  providerName: string;
  providerRole: string | null;
  location: string | null;
  about: string | null;
  detail: string | null;
  howToRedeem: string | null;
  imageUrl: string | null;
  companyImageUrl: string | null;
  featured: boolean;
  sortOrder: number;
  status: ContentStatus;
  category?: BenefitCategory | null;
}

export interface Group extends Timestamps {
  id: string;
  slug: string;
  name: string;
  note: string | null;
  purpose: string | null;
  cadence: string | null;
  coverUrl: string | null;
  status: ContentStatus;
  proposedById: string | null;
  sortOrder: number;
}

export interface GroupMembership extends Timestamps {
  id: string;
  groupId: string;
  memberId: string;
  status: MembershipRequestStatus;
}

export interface BenefitsResponse {
  memberOffers: BenefitOffer[];
  partnerOffers: BenefitOffer[];
  optedInIds: string[];
  mySubmissions: BenefitOffer[];
}

export type GroupWithStatus = Group & { memberCount: number; myStatus: MembershipRequestStatus | null };

export interface GroupsResponse {
  groups: GroupWithStatus[];
  myProposals: Group[];
}

export interface ProfileInput {
  fullName?: string;
  headline?: string;
  company?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  interests?: string[];
  travelCities?: string[];
  joinedYear?: number | null;
  chapterId?: string | null;
  sectorId?: string | null;
  answers?: { questionId: string; answer: string }[];
}

export interface ApplicationInput {
  fullName: string;
  email: string;
  phone?: string;
  linkedin?: string;
  role: string;
  company: string;
  sector: string;
  city: string;
  country: string;
  travelCities?: string[];
  recommenderName: string;
  recommenderRelation?: string;
  whyJoin: string;
  contribution: string;
  about?: string;
}
