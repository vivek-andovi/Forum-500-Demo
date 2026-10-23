// Sign-in and the current user (/auth/*, /v1/me).
import type { Member, ProfileRevision } from "@/features/membership/types";

export type UserRole = "admin" | "member";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  member: Member | null;
}

export interface MeResponse {
  user: User;
  member: Member | null;
  pendingRevision?: ProfileRevision | null;
}

export interface MagicLinkResponse {
  ok: boolean;
  message: string;
}
