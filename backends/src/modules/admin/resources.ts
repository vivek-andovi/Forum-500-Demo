/**
 * Admin resource registry. Each entry exposes one Prisma model to the generic admin
 * CRUD engine (`/admin/r/:resource`) and describes how the admin UI should present it.
 * Field types are derived from the Prisma DMMF; only presentation hints live here.
 */
export interface ResourceConfig {
  name: string;
  model: string;
  label: string;
  singular: string;
  group: 'Membership' | 'Events' | 'Media' | 'Communications' | 'Website' | 'Configuration' | 'System';
  labelField?: string;
  listColumns: string[];
  searchFields: string[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
  readOnly?: boolean;
  /** Records are created by workflows, not the generic form (e.g. assets via upload). */
  noCreate?: boolean;
  /** Query string applied when the resource is opened from the admin sidebar. */
  defaultQuery?: Record<string, string>;
  /** Display-label overrides for fields (defaults are humanised field names). */
  labels?: Record<string, string>;
  /** Fields shown but never writable through the admin (system-managed). */
  readOnlyFields?: string[];
  /** Fields hidden from forms and API responses. */
  hidden?: string[];
}

export const RESOURCES: ResourceConfig[] = [
  // ── Membership
  {
    name: 'members', model: 'Member', label: 'Members', singular: 'Member', group: 'Membership',
    labelField: 'fullName',
    listColumns: ['avatarUrl', 'fullName', 'company', 'chapterId', 'tierId', 'isPublished', 'profileStatus', 'featuredNewMember'],
    searchFields: ['fullName', 'company', 'headline', 'email'],
    defaultSort: { field: 'fullName', order: 'asc' },
  },
  {
    name: 'applications', model: 'Application', label: 'Applications', singular: 'Application', group: 'Membership',
    labelField: 'fullName',
    listColumns: ['fullName', 'email', 'company', 'city', 'recommenderName', 'status', 'createdAt'],
    searchFields: ['fullName', 'email', 'company', 'city'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'profile-revisions', model: 'ProfileRevision', label: 'Profile Reviews', singular: 'Profile Review', group: 'Membership',
    listColumns: ['memberId', 'status', 'createdAt', 'reviewedAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'member-interviews', model: 'MemberInterviewQA', label: 'New Member Interviews', singular: 'Interview Q&A', group: 'Membership',
    labelField: 'question',
    listColumns: ['memberId', 'question', 'sortOrder'],
    searchFields: ['question', 'answer'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'member-answers', model: 'MemberQuestionAnswer', label: 'Five Questions Answers', singular: 'Answer', group: 'Membership',
    listColumns: ['memberId', 'questionId', 'answer'],
    searchFields: ['answer'],
  },
  {
    name: 'benefit-offers', model: 'BenefitOffer', label: 'Benefit Offers', singular: 'Benefit Offer', group: 'Membership',
    labelField: 'title',
    listColumns: ['imageUrl', 'title', 'kind', 'categoryId', 'providerName', 'featured', 'status'],
    searchFields: ['title', 'offer', 'providerName'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'benefit-opt-ins', model: 'BenefitOptIn', label: 'Benefit Opt-ins', singular: 'Opt-in', group: 'Membership',
    listColumns: ['memberId', 'offerId', 'createdAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'groups', model: 'Group', label: 'Groups', singular: 'Group', group: 'Membership',
    labelField: 'name',
    listColumns: ['name', 'note', 'cadence', 'status', 'proposedById'],
    searchFields: ['name', 'note', 'purpose'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'group-memberships', model: 'GroupMembership', label: 'Group Memberships', singular: 'Group Membership', group: 'Membership',
    listColumns: ['groupId', 'memberId', 'status', 'createdAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },

  // ── Events
  {
    name: 'events', model: 'Event', label: 'Events', singular: 'Event', group: 'Events',
    labelField: 'title',
    listColumns: ['imageUrl', 'title', 'kind', 'city', 'startsAt', 'venueId', 'featured', 'status'],
    searchFields: ['title', 'city', 'description', 'venueText'],
    defaultSort: { field: 'startsAt', order: 'asc' },
  },
  {
    name: 'event-hosts', model: 'EventHost', label: 'Event Hosts', singular: 'Event Host', group: 'Events',
    listColumns: ['eventId', 'memberId'],
    searchFields: [],
  },
  {
    name: 'event-rsvps', model: 'EventRsvp', label: 'RSVPs', singular: 'RSVP', group: 'Events',
    listColumns: ['eventId', 'memberId', 'status', 'plusOnes', 'createdAt'],
    searchFields: ['dietaryNote'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'venues', model: 'Venue', label: 'Venues', singular: 'Venue', group: 'Events',
    labelField: 'name',
    listColumns: ['imageUrl', 'name', 'city', 'category', 'access', 'status'],
    searchFields: ['name', 'city', 'description'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'gallery-albums', model: 'GalleryAlbum', label: 'Gallery Albums', singular: 'Album', group: 'Events',
    labelField: 'title',
    listColumns: ['coverUrl', 'title', 'city', 'dateLabel', 'eventId', 'status'],
    searchFields: ['title', 'city'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'gallery-photos', model: 'GalleryPhoto', label: 'Gallery Photos', singular: 'Photo', group: 'Events',
    labelField: 'caption',
    listColumns: ['url', 'caption', 'albumId', 'kind', 'sortOrder'],
    searchFields: ['caption'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'photo-tags', model: 'MemberPhotoTag', label: 'Photo Tags', singular: 'Photo Tag', group: 'Events',
    listColumns: ['memberId', 'photoId', 'createdAt'],
    searchFields: [],
  },

  // ── Media
  {
    name: 'articles', model: 'Article', label: 'Articles', singular: 'Article', group: 'Media',
    labelField: 'title',
    listColumns: ['imageUrl', 'title', 'publication', 'sectionId', 'authorName', 'editorsChoice', 'status', 'publishedAt'],
    searchFields: ['title', 'standfirst', 'authorName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'inforum-editions', model: 'InforumEdition', label: 'In:Forum Editions', singular: 'Edition', group: 'Media',
    labelField: 'label',
    listColumns: ['coverUrl', 'label', 'publishedOn', 'coverLine', 'visibility', 'status'],
    searchFields: ['label', 'coverLine'],
    defaultSort: { field: 'publishedOn', order: 'desc' },
  },
  {
    name: 'edition-articles', model: 'EditionArticle', label: 'Edition Articles', singular: 'Edition Article', group: 'Media',
    listColumns: ['editionId', 'articleId', 'sortOrder'],
    searchFields: [],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'inforum-sections', model: 'InforumSection', label: 'In:Forum Sections', singular: 'Section', group: 'Media',
    labelField: 'label',
    listColumns: ['label', 'key', 'sortOrder'],
    searchFields: ['label', 'key'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'forecast-issues', model: 'ForecastIssue', label: 'Forecast Issues', singular: 'Forecast Issue', group: 'Media',
    labelField: 'title',
    listColumns: ['coverUrl', 'issue', 'title', 'dateLabel', 'status'],
    searchFields: ['title', 'issue'],
    defaultSort: { field: 'publishedOn', order: 'desc' },
  },
  {
    name: 'pitches', model: 'Pitch', label: 'Pitches', singular: 'Pitch', group: 'Media',
    labelField: 'headline',
    listColumns: ['headline', 'memberId', 'section', 'format', 'status', 'createdAt'],
    searchFields: ['headline', 'synopsis'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'recommendations', model: 'Recommendation', label: 'Member Recommendations', singular: 'Recommendation', group: 'Media',
    labelField: 'title',
    listColumns: ['imageUrl', 'title', 'category', 'memberName', 'status'],
    searchFields: ['title', 'place', 'memberName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'comments', model: 'Comment', label: 'Comments', singular: 'Comment', group: 'Media',
    labelField: 'body',
    listColumns: ['memberName', 'body', 'parentId', 'recommends', 'status', 'createdAt'],
    searchFields: ['body', 'memberName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'podcast-episodes', model: 'PodcastEpisode', label: 'Podcasts / Forum Radio', singular: 'Episode', group: 'Media',
    labelField: 'title',
    listColumns: ['number', 'title', 'guestName', 'durationMinutes', 'status', 'publishedAt'],
    searchFields: ['title', 'guestName', 'description'],
    defaultSort: { field: 'number', order: 'desc' },
  },
  {
    name: 'books', model: 'Book', label: 'Books', singular: 'Book', group: 'Media',
    labelField: 'title',
    listColumns: ['coverUrl', 'title', 'authorName', 'isMemberBook', 'status'],
    searchFields: ['title', 'authorName'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'book-recommendations', model: 'BookRecommendation', label: 'Reading Picks', singular: 'Reading Pick', group: 'Media',
    labelField: 'title',
    listColumns: ['title', 'recommendedByName', 'chapter', 'isCuratedPick', 'status'],
    searchFields: ['title', 'recommendedByName', 'note'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'library-items', model: 'LibraryItem', label: 'Library', singular: 'Library Item', group: 'Media',
    labelField: 'title',
    listColumns: ['title', 'kind', 'pages', 'status'],
    searchFields: ['title', 'description'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'feed-posts', model: 'FeedPost', label: 'Newsfeed Posts', singular: 'Post', group: 'Media',
    labelField: 'body',
    listColumns: ['authorName', 'body', 'imageUrl', 'likes', 'pinned', 'status', 'createdAt'],
    searchFields: ['body', 'authorName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },

  // ── Communications
  {
    name: 'introductions', model: 'Introduction', label: 'Introductions', singular: 'Introduction', group: 'Communications',
    listColumns: ['requesterId', 'targetId', 'introducerId', 'introducerName', 'status', 'createdAt'],
    searchFields: ['reason', 'introducerName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'whatsapp-groups', model: 'WhatsappGroup', label: 'WhatsApp Groups', singular: 'WhatsApp Group', group: 'Communications',
    labelField: 'name',
    listColumns: ['name', 'chapterId', 'moderatorId', 'inviteLink', 'active'],
    searchFields: ['name'],
    defaultSort: { field: 'name', order: 'asc' },
  },
  {
    name: 'whatsapp-memberships', model: 'WhatsappMembership', label: 'WhatsApp Join Requests', singular: 'WhatsApp Membership', group: 'Communications',
    listColumns: ['groupId', 'memberId', 'status', 'createdAt'],
    searchFields: [],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'email-campaigns', model: 'EmailCampaign', label: 'Emails', singular: 'Email Campaign', group: 'Communications',
    labelField: 'subject',
    listColumns: ['subject', 'senderLabel', 'status', 'sentAt'],
    searchFields: ['subject', 'body'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'notifications', model: 'Notification', label: 'Notifications', singular: 'Notification', group: 'Communications',
    labelField: 'title',
    listColumns: ['title', 'type', 'memberId', 'readAt', 'createdAt'],
    searchFields: ['title', 'body'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'action-items', model: 'ActionItem', label: 'Actions', singular: 'Action', group: 'Communications',
    labelField: 'title',
    listColumns: ['title', 'type', 'context', 'memberId', 'dueAt', 'amountCents', 'status'],
    searchFields: ['title', 'detail'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'concierge-requests', model: 'ConciergeRequest', label: 'Ask Zola Requests', singular: 'Concierge Request', group: 'Communications',
    labelField: 'body',
    listColumns: ['memberId', 'promptType', 'body', 'status', 'createdAt'],
    searchFields: ['body'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },

  {
    name: 'whatsapp-messages', model: 'WhatsappMessage', label: 'WhatsApp Group Chat', singular: 'Chat Message', group: 'Communications',
    labelField: 'body',
    listColumns: ['groupId', 'authorName', 'body', 'status', 'createdAt'],
    searchFields: ['body', 'authorName'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },

  // ── Website (public site + member-area content)
  {
    name: 'pages', model: 'Page', label: 'Pages & Page Headers', singular: 'Page', group: 'Website',
    labelField: 'title', listColumns: ['title', 'slug', 'eyebrow', 'heroImageUrl', 'status', 'updatedAt'], searchFields: ['title', 'slug', 'subtitle'],
    defaultSort: { field: 'slug', order: 'asc' },
  },
  {
    name: 'nav-items', model: 'NavItem', label: 'Navigation Menus', singular: 'Menu Item', group: 'Website',
    labelField: 'label', listColumns: ['label', 'menu', 'href', 'icon', 'highlight', 'sortOrder', 'active'], searchFields: ['label', 'href'],
    // Open on top-level items; each item's children are in its "Sub-items" tab.
    defaultQuery: { 'filter.parentId': 'null' },
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'content-cards', model: 'ContentCard', label: 'Page Cards', singular: 'Card', group: 'Website',
    labelField: 'title', listColumns: ['title', 'placement', 'icon', 'href', 'sortOrder', 'active'], searchFields: ['title', 'description'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'club-benefits', model: 'ClubBenefit', label: 'Club Benefits (About page)', singular: 'Club Benefit', group: 'Website',
    labelField: 'title', listColumns: ['title', 'description', 'sortOrder', 'active'], searchFields: ['title', 'description'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'quick-prompts', model: 'QuickPrompt', label: 'Ask Zola Prompts', singular: 'Quick Prompt', group: 'Website',
    labelField: 'label', listColumns: ['label', 'key', 'icon', 'sortOrder', 'active'], searchFields: ['label', 'template'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },

  // ── Configuration
  {
    name: 'chapters', model: 'Chapter', label: 'Chapters & Cities', singular: 'Chapter', group: 'Configuration',
    labelField: 'name',
    listColumns: ['name', 'country', 'isChapter', 'whatsappEnabled', 'sortOrder'],
    searchFields: ['name', 'country'],
    defaultSort: { field: 'name', order: 'asc' },
  },
  {
    name: 'sectors', model: 'Sector', label: 'Sectors', singular: 'Sector', group: 'Configuration',
    labelField: 'name', listColumns: ['name', 'sortOrder'], searchFields: ['name'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'membership-tiers', model: 'MembershipTier', label: 'Membership Tiers', singular: 'Tier', group: 'Configuration',
    labelField: 'name', listColumns: ['name', 'priceCents', 'currency', 'sortOrder'], searchFields: ['name'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'profile-questions', model: 'ProfileQuestion', label: 'Profile Questions', singular: 'Question', group: 'Configuration',
    labelField: 'text', listColumns: ['text', 'sortOrder', 'active'], searchFields: ['text'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'benefit-categories', model: 'BenefitCategory', label: 'Benefit Categories', singular: 'Benefit Category', group: 'Configuration',
    labelField: 'name', listColumns: ['name', 'kind', 'sortOrder'], searchFields: ['name'],
    defaultSort: { field: 'sortOrder', order: 'asc' },
  },
  {
    name: 'settings', model: 'Setting', label: 'Settings', singular: 'Setting', group: 'Configuration',
    labelField: 'key', listColumns: ['key', 'updatedAt'], searchFields: ['key'],
    defaultSort: { field: 'key', order: 'asc' },
  },

  // ── System
  {
    name: 'users', model: 'User', label: 'Users & Logins', singular: 'User', group: 'System',
    labelField: 'email', listColumns: ['email', 'role', 'status', 'lastLoginAt', 'createdAt'], searchFields: ['email'],
    hidden: ['passwordHash', 'tokenVersion', 'failedLogins'],
    readOnlyFields: ['lastLoginAt'],
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'assets', model: 'Asset', label: 'Media Library', singular: 'Asset', group: 'System',
    labelField: 'filename', listColumns: ['url', 'filename', 'mime', 'size', 'driver', 'createdAt'], searchFields: ['filename'],
    readOnlyFields: ['url', 'storageKey', 'driver', 'mime', 'size', 'uploadedBy'],
    noCreate: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'audit-logs', model: 'AuditLog', label: 'Audit Log', singular: 'Audit Entry', group: 'System',
    labelField: 'summary',
    listColumns: ['createdAt', 'actorEmail', 'action', 'entityType', 'entityLabel', 'summary'],
    searchFields: ['summary', 'entityLabel', 'actorEmail', 'entityType', 'action'],
    labels: {
      createdAt: 'When', actorEmail: 'Who', actorName: 'Name', entityType: 'Type', entityLabel: 'Record',
      entity: 'Resource', entityId: 'Record ID', actorId: 'User ID', ip: 'IP address',
    },
    readOnly: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
];

/** Long-form fields rendered as textareas. */
export const TEXT_FIELDS = new Set([
  'bio', 'description', 'about', 'detail', 'howToRedeem', 'body', 'synopsis', 'notes', 'note',
  'whyJoin', 'contribution', 'reason', 'standfirst', 'purpose', 'adminReply', 'decisionNote',
  'reviewerNote', 'reviewNote', 'answer', 'spotlightAnswer', 'text', 'preview', 'caption', 'offer',
  'subtitle', 'template', 'metaDescription',
]);

/** URL fields that are not images. */
export const LINK_FIELDS = new Set([
  'linkedinUrl', 'spotifyUrl', 'appleUrl', 'buyUrl', 'inviteLink', 'fileUrl', 'pdfUrl',
  'audioUrl', 'documentUrl', 'link', 'href', 'ctaHref',
]);
