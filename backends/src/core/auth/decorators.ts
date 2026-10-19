import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const IS_PUBLIC = 'isPublic';
export const ROLES = 'roles';

/** Skip authentication for this route. */
export const Public = () => SetMetadata(IS_PUBLIC, true);
/** Restrict to the given roles (checked after authentication). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES, roles);

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  memberId: string | null;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => ctx.switchToHttp().getRequest().user,
);

/** The current user plus request IP, for audit logging. */
export const CurrentActor = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const req = ctx.switchToHttp().getRequest();
  const user: AuthUser = req.user;
  return { id: user.id, email: user.email, memberId: user.memberId, ip: req.ip };
});
