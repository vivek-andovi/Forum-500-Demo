import { ResourceConfig } from './types';

/** Admin sidebar group: Events. Order here is the order in the sidebar. */
export const EVENTS_RESOURCES: ResourceConfig[] = [
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
];
