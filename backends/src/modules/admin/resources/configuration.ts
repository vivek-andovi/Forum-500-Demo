import { ResourceConfig } from './types';

/** Admin sidebar group: Configuration. Order here is the order in the sidebar. */
export const CONFIGURATION_RESOURCES: ResourceConfig[] = [
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
    labelField: 'key', listColumns: ['key', 'updatedAt'], searchFields: ['key'], createOnlyFields: ['key'],
    defaultSort: { field: 'key', order: 'asc' },
  },
];
