// In:Forum, Forecast, articles, podcasts, books, library, newsfeed and comments.
import type { ContentStatus, ISODate, Timestamps, Visibility } from "@/lib/types/common";

/** `report` = write-ups of club events. */
export type Publication = "inforum" | "forecast" | "member" | "report";

export type RecommendationCategory = "eat" | "stay" | "travel" | "read";

export type LibraryKind = "Annual_Report" | "Journal" | "audio" | "video" | "document" | "link";

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
  pdfUrl: string | null;
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
  series: number | null;
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
  /** Download (document, report, journal) or destination (link). */
  fileUrl: string | null;
  /** Audio / video source. */
  mediaUrl: string | null;
  speaker: string | null;
  durationLabel: string | null;
  recordedOn: ISODate | null;
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

export interface InforumTab {
  id: string;
  label: string;
  type: "editorial" | "section";
  sectionKey?: string;
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
