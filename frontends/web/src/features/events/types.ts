// Events, RSVPs, venues and the photo gallery.
import type { ContentStatus, ISODate, Timestamps, Visibility } from "@/lib/types/common";
import type { Member } from "@/features/membership/types";

export type EventKind =
  | "Salon"
  | "Dinner"
  | "Reception"
  | "Roundtable"
  | "Breakfast"
  | "Lunch"
  | "Brunch"
  | "Drinks"
  | "Conference"
  | "Party"
  | "Other";

export type RsvpStatus = "interested" | "confirmed" | "waitlisted" | "declined" | "cancelled";

export type VenueCategory = "Restaurants" | "Clubs" | "Studios" | "Salons" | "Hotels" | "Private_homes";

export type PhotoKind = "Curated" | "Candid";

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

export interface MyEventsResponse {
  hosting: ForumEvent[];
  attending: ForumEvent[];
  proposals: ForumEvent[];
}

export interface GalleryResponse {
  albums: GalleryAlbum[];
  taggedPhotoIds: string[];
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
