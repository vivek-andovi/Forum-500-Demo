export type FieldType =
  | "string"
  | "text"
  | "int"
  | "float"
  | "boolean"
  | "datetime"
  | "enum"
  | "string[]"
  | "json"
  | "relation"
  | "url"
  | "image";

export type FieldMeta = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  enumValues?: string[];
  relation?: { resource: string; labelField: string };
  /** Literal database default, applied to new-record forms. */
  default?: unknown;
  /** Set once on create, read-only afterwards (e.g. Setting.key). */
  createOnly?: boolean;
};

export type ResourceMeta = {
  name: string;
  label: string;
  singular: string;
  group: string;
  model: string;
  labelField: string;
  listColumns: string[];
  searchFields: string[];
  defaultSort: { field: string; order: "asc" | "desc" };
  hasStatus: boolean;
  statusEnum?: string[];
  readOnly?: boolean;
  /** Statuses only the workflow buttons (approve/reject) can set; the status select hides them. */
  workflowStatuses?: string[];
  /** Query string applied when opened from the sidebar, e.g. { "filter.parentId": "null" }. */
  defaultQuery?: Record<string, string>;
  fields: FieldMeta[];
};

export type Meta = { resources: ResourceMeta[] };

/** A row as returned by the generic admin API. */
export type AdminRecord = {
  id: string;
  _label?: string;
  _relations?: Record<string, string | null>;
  [key: string]: unknown;
};

export type ListResponse<T = AdminRecord> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type OptionItem = { id: string; label: string };

export type ApprovalSummary = {
  key: string;
  label: string;
  resource: string;
  count: number;
  filter: Record<string, string>;
};

export type DashboardResponse = {
  counts: {
    members: number;
    publishedMembers: number;
    upcomingEvents: number;
    applicationsNew: number;
    rsvps: number;
    benefitOffers: number;
    articles: number;
    groups: number;
  };
  approvals: ApprovalSummary[];
  upcomingEvents: AdminRecord[];
  recentApplications: AdminRecord[];
};

export type AuthUser = { id: string; email: string; role: "admin" | "member" };

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
  member: unknown | null;
};

/** Primary key of a record (most models use `id`; Setting uses `key`). */
export function recordId(row: AdminRecord): string {
  return String(row.id ?? (row as Record<string, unknown>).key ?? "");
}
