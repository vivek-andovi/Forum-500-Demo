// Every React Query key in the app, in one place, so overlapping prefixes are visible.
//
// invalidateQueries matches by prefix, so invalidating a short key also refetches the longer ones:
//   qk.events         ["events"]            → also qk.myEvents
//   qk.whatsapp       ["whatsapp"]          → also every qk.groupChat(id)
//   qk.conversations  ["messages"]          → also every qk.conversation(id)
//   qk.publicInforum  ["public", "inforum"] → also qk.publicInforumTabs
// Some mutations invalidate bare prefixes on purpose: ["members"] (every qk.members(f) and qk.newMembers),
// ["member"] (every qk.member(slug)) and ["event"] (every qk.event(slug)).
// qk.quickPrompts is deliberately not under ["concierge"]. Check this list when adding a key.

export interface MemberFilters {
  search?: string;
  sectorId?: string;
  chapterId?: string;
  interest?: string;
}

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
  // Not under ["concierge"], so sending a request doesn't refetch the prompts.
  quickPrompts: ["concierge-prompts"] as const,
  conversations: ["messages"] as const,
  conversation: (id: string) => ["messages", id] as const,
  groupChat: (groupId: string) => ["whatsapp", "chat", groupId] as const,
};
