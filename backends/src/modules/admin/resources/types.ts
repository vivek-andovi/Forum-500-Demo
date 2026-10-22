/**
 * Shape of one admin resource registry entry. Each entry exposes one Prisma model to the
 * generic admin CRUD engine (`/admin/r/:resource`) and describes how the admin UI should
 * present it. Field types are derived from the Prisma DMMF; only presentation hints live here.
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
  /** Fields set on create and read-only afterwards (e.g. Setting.key, which code looks up). */
  createOnlyFields?: string[];
  /** Fields hidden from forms and API responses. */
  hidden?: string[];
  /**
   * Statuses that only a dedicated workflow endpoint (admin-workflows.controller) may set,
   * because the decision has side effects (create the member, apply the changes, create the
   * article, email the applicant). The generic status endpoint refuses to move a record into
   * or out of these statuses, and PATCH never changes status for these resources.
   */
  workflowStatuses?: string[];
}
