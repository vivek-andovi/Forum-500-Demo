// Shared base types. All API types mirror backends/prisma/schema.prisma (Prisma models serialised
// as JSON: camelCase fields, ISO date strings). Relations are optional because they are only included
// by specific endpoints (see docs/API_CONTRACT.md).

export type ISODate = string;

export type ContentStatus = "draft" | "in_review" | "scheduled" | "published" | "archived" | "rejected";

export type Visibility = "public" | "members";

export type MembershipRequestStatus = "requested" | "approved" | "rejected" | "left";

export interface Timestamps {
  createdAt: ISODate;
  updatedAt: ISODate;
}
