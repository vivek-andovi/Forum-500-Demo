import { ResourceConfig } from './types';

/** Admin sidebar group: Website (public site + member-area content). Order here is the order in the sidebar. */
export const WEBSITE_RESOURCES: ResourceConfig[] = [
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
];
