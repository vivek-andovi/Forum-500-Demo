import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/decorators';

/** Member-only actions need a linked member profile (admins without one get a 403). */
export function requireMember(user: AuthUser): string {
  if (!user.memberId) throw new ForbiddenException('This action requires a member profile');
  return user.memberId;
}

export const PUBLISHED = { status: 'published' as const };

/**
 * Member contact/account fields other members must not receive. Use as Prisma `omit` on
 * every member-facing read of another member: `include: { member: { omit: MEMBER_PRIVATE } }`.
 * (The profile page keeps `email`, for the admin "Email member" fallback.)
 */
export const MEMBER_PRIVATE = { email: true, phone: true, userId: true, profileDraft: true } as const;

/** Placeholder id that never matches, for users without a member profile. */
export const NO_MEMBER = '00000000-0000-0000-0000-000000000000';
