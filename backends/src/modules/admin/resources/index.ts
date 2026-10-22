/**
 * Admin resource registry. Each entry exposes one Prisma model to the generic admin
 * CRUD engine (`/admin/r/:resource`) and describes how the admin UI should present it.
 * One file per admin sidebar group; the order below (and inside each file) is the
 * sidebar order, so keep it stable.
 */
import { MEMBERSHIP_RESOURCES } from './membership';
import { EVENTS_RESOURCES } from './events';
import { MEDIA_RESOURCES } from './media';
import { COMMUNICATIONS_RESOURCES } from './communications';
import { WEBSITE_RESOURCES } from './website';
import { CONFIGURATION_RESOURCES } from './configuration';
import { SYSTEM_RESOURCES } from './system';
import { ResourceConfig } from './types';

export type { ResourceConfig } from './types';
export { LINK_FIELDS, TEXT_FIELDS } from './field-hints';

export const RESOURCES: ResourceConfig[] = [
  ...MEMBERSHIP_RESOURCES,
  ...EVENTS_RESOURCES,
  ...MEDIA_RESOURCES,
  ...COMMUNICATIONS_RESOURCES,
  ...WEBSITE_RESOURCES,
  ...CONFIGURATION_RESOURCES,
  ...SYSTEM_RESOURCES,
];
