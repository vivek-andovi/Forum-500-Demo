// Types mirror backends/prisma/schema.prisma (Prisma models serialised as JSON:
// camelCase fields, ISO date strings). Relations are optional because they are
// only included by specific endpoints (see docs/API_CONTRACT.md).

export type ISODate = string;

export type UserRole = "admin" | "member";
export type ContentStatus = "draft" | "in_review" | "scheduled" | "published" | "archived" | "rejected";
export type Visibility = "public" | "members";
export type ProfileStatus = "draft" | "pending_review" | "published";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type BenefitKind = "member" | "partner";
export type MembershipRequestStatus = "requested" | "approved" | "rejected" | "left";
export type EventKind = "Salon" | "Dinner" | "Reception" | "Roundtable";
export type RsvpStatus = "interested" | "confirmed" | "waitlisted" | "declined" | "cancelled";
export type VenueCategory = "Restaurants" | "Clubs" | "Studios" | "Salons" | "Hotels" | "Private_homes";
export type PhotoKind = "Curated" | "Candid";
export type Publication = "inforum" | "forecast" | "member";
export type PitchFormat = "article" | "dispatch" | "interview" | "photo_essay" | "opinion" | "forecast";
export type RecommendationCategory = "eat" | "stay" | "travel" | "read";
export type LibraryKind = "Annual_Report" | "Journal";
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

interface Timestamps {
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

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
  chapter?: Chapter | null;
  sector?: Sector | null;
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

export interface Venue extends Timestamps {
  id: string;
  slug: string;
  name: string;
  chapterId: string | null;
  city: string;
  category: VenueCategory;
  access: string | null;
  description: string | null;
  imageUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
}

export interface EventHost {
  id: string;
  eventId: string;
  memberId: string;
  member?: Member;
}

export interface EventRsvp extends Timestamps {
  id: string;
  eventId: string;
  memberId: string;
  status: RsvpStatus;
  plusOnes: number;
  dietaryNote: string | null;
}

export interface ForumEvent extends Timestamps {
  id: string;
  slug: string;
  title: string;
  kind: EventKind;
  city: string;
  chapterId: string | null;
  venueId: string | null;
  venueText: string | null;
  startsAt: ISODate;
  endsAt: ISODate | null;
  allDay: boolean;
  dateLabel: string | null;
  timeLabel: string | null;
  description: string | null;
  imageUrl: string | null;
  addressRevealHours: number;
  capacity: number | null;
  inviteAudiences: string[];
  supportRequested: string[];
  featured: boolean;
  status: ContentStatus;
  visibility: Visibility;
  proposedById: string | null;
  reviewNote: string | null;
  venue?: Venue | null;
  hosts?: EventHost[];
}

export interface EventDetail extends ForumEvent {
  myRsvp: EventRsvp | null;
  rsvpCount: number;
  address: string | null;
}

export interface GalleryPhoto extends Timestamps {
  id: string;
  albumId: string;
  caption: string | null;
  url: string;
  kind: PhotoKind;
  sortOrder: number;
  album?: GalleryAlbum;
}

export interface GalleryAlbum extends Timestamps {
  id: string;
  slug: string;
  title: string;
  eventId: string | null;
  chapterId: string | null;
  city: string;
  dateLabel: string;
  takenOn: ISODate | null;
  coverUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
  photos?: GalleryPhoto[];
}

export interface InforumSection extends Timestamps {
  id: string;
  key: string;
  label: string;
  sortOrder: number;
}

export interface Article extends Timestamps {
  id: string;
  slug: string;
  publication: Publication;
  title: string;
  standfirst: string | null;
  body: string[];
  sectionId: string | null;
  sectionLabel: string | null;
  forecastIssueId: string | null;
  authorMemberId: string | null;
  authorName: string;
  authorRole: string | null;
  authorPhotoUrl: string | null;
  isMember: boolean;
  editorsChoice: boolean;
  fromAroundWorld: boolean;
  dateline: string | null;
  dateLabel: string | null;
  readMinutes: number | null;
  imageUrl: string | null;
  caption: string | null;
  sortOrder: number;
  status: ContentStatus;
  visibility: Visibility;
  publishedAt: ISODate | null;
  section?: InforumSection | null;
}

export interface InforumEdition extends Timestamps {
  id: string;
  slug: string;
  label: string;
  publishedOn: ISODate;
  coverLine: string | null;
  coverUrl: string | null;
  status: ContentStatus;
  visibility: Visibility;
  articles?: Article[];
}

export interface ForecastIssue extends Timestamps {
  id: string;
  slug: string;
  issue: string;
  title: string;
  dateLabel: string;
  publishedOn: ISODate | null;
  coverUrl: string | null;
  letterTitle: string | null;
  letterBody: string[];
  letterSignoff: string | null;
  pdfUrl: string | null;
  status: ContentStatus;
  articles?: Article[];
}

export interface Recommendation extends Timestamps {
  id: string;
  category: RecommendationCategory;
  title: string;
  place: string | null;
  note: string | null;
  memberId: string | null;
  memberName: string;
  memberPhotoUrl: string | null;
  memberChapter: string | null;
  imageUrl: string | null;
  status: ContentStatus;
}

export interface Comment extends Timestamps {
  id: string;
  targetType: "edition" | "article" | "feed_post";
  targetId: string | null;
  parentId: string | null;
  memberId: string | null;
  memberName: string;
  memberPhotoUrl: string | null;
  memberChapter: string | null;
  body: string;
  recommends: number;
  status: ContentStatus;
  replies?: Comment[];
}

export interface PodcastEpisode extends Timestamps {
  id: string;
  slug: string;
  number: number;
  title: string;
  description: string | null;
  guestName: string;
  guestMemberId: string | null;
  durationMinutes: number | null;
  audioUrl: string | null;
  spotifyUrl: string | null;
  appleUrl: string | null;
  coverUrl: string | null;
  status: ContentStatus;
  publishedAt: ISODate | null;
}

export interface Book extends Timestamps {
  id: string;
  title: string;
  authorName: string;
  authorMemberId: string | null;
  isMemberBook: boolean;
  note: string | null;
  coverUrl: string | null;
  buyUrl: string | null;
  status: ContentStatus;
  sortOrder: number;
}

export interface BookRecommendation extends Timestamps {
  id: string;
  bookId: string | null;
  title: string;
  note: string | null;
  recommendedByName: string;
  recommendedById: string | null;
  chapter: string | null;
  isCuratedPick: boolean;
  status: ContentStatus;
  sortOrder: number;
  book?: Book | null;
}

export interface LibraryItem extends Timestamps {
  id: string;
  slug: string;
  title: string;
  kind: LibraryKind;
  pages: number | null;
  description: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  status: ContentStatus;
  publishedAt: ISODate | null;
}

export interface FeedPost extends Timestamps {
  id: string;
  memberId: string | null;
  authorName: string;
  authorMeta: string | null;
  authorPhotoUrl: string | null;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  likes: number;
  pinned: boolean;
  status: ContentStatus;
}

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
  body: string | null;
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

export interface InforumTab {
  id: string;
  label: string;
  type: "editorial" | "section";
  sectionKey?: string;
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
  otherMember: MessageMember;
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
  otherMember: MessageMember;
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

// ───────────── Envelopes ─────────────

export interface LoginResponse {
  accessToken: string;
  user: User;
  member: Member | null;
}

export interface MeResponse {
  user: User;
  member: Member | null;
  pendingRevision?: ProfileRevision | null;
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

export interface MyEventsResponse {
  hosting: ForumEvent[];
  attending: ForumEvent[];
  proposals: ForumEvent[];
}

export interface GalleryResponse {
  albums: GalleryAlbum[];
  taggedPhotoIds: string[];
}

export interface CommentsResponse {
  comments: Comment[];
  recommendedIds: string[];
}

export interface BooksResponse {
  memberBooks: Book[];
  recommended: BookRecommendation[];
}

export interface FeedResponse {
  posts: FeedPost[];
  likedIds: string[];
}

export interface WhatsappResponse {
  groups: WhatsappGroup[];
  memberships: WhatsappMembership[];
}

export interface PublicSite {
  chapters: Chapter[];
  benefits: ClubBenefit[];
  settings: SiteSettings;
  navigation: { header: NavItem[]; footer: NavItem[] };
}

// ───────────── Request bodies ─────────────

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

export interface EventProposalInput {
  title: string;
  kind: string;
  city: string;
  date: string;
  venueText?: string;
  description?: string;
  inviteAudiences: string[];
  supportRequested: string[];
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
