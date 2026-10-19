import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/decorators';

/** Member-only actions need a linked member profile (admins without one get a 403). */
export function requireMember(user: AuthUser): string {
  if (!user.memberId) throw new ForbiddenException('This action requires a member profile');
  return user.memberId;
}

export const PUBLISHED = { status: 'published' as const };

/** Placeholder id that never matches, for users without a member profile. */
export const NO_MEMBER = '00000000-0000-0000-0000-000000000000';
