import { ResourceConfig } from './types';

/** Admin sidebar group: Communications. Order here is the order in the sidebar. */
export const COMMUNICATIONS_RESOURCES: ResourceConfig[] = [
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
];
