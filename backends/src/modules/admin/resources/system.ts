import { ResourceConfig } from './types';

/** Admin sidebar group: System. Order here is the order in the sidebar. */
export const SYSTEM_RESOURCES: ResourceConfig[] = [
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
    readOnlyFields: ['url', 'driver', 'mime', 'size', 'uploadedBy'],
    // Internal storage path (uploads/<date>/<random>.ext); the filename is what admins recognise.
    hidden: ['storageKey'],
    noCreate: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'audit-logs', model: 'AuditLog', label: 'Audit Log', singular: 'Audit Entry', group: 'System',
    labelField: 'summary',
    idLabels: { from: { actorId: 'actorEmail', entityId: 'entityLabel' }, json: { changes: 'audit' } },
    listColumns: ['createdAt', 'actorEmail', 'action', 'entityType', 'entityLabel', 'summary'],
    searchFields: ['summary', 'entityLabel', 'actorEmail', 'entityType', 'action'],
    labels: {
      createdAt: 'When', actorEmail: 'Who', actorName: 'Name', entityType: 'Type', entityLabel: 'Record',
      entity: 'Resource', entityId: 'Record ID', actorId: 'User ID', ip: 'IP address',
    },
    readOnly: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
  {
    name: 'legacy-map', model: 'LegacyMap', label: 'Import Map (WordPress)', singular: 'Import Map Entry', group: 'System',
    labelField: 'legacyId',
    listColumns: ['entity', 'legacyId', 'model', 'newId', 'oldUrl', 'newUrl'],
    searchFields: ['entity', 'legacyId', 'oldUrl', 'newId'],
    readOnly: true,
    defaultSort: { field: 'createdAt', order: 'desc' },
  },
];
