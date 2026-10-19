import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { AuthUser, IS_PUBLIC, ROLES } from './decorators';

interface TokenPayload extends AuthUser {
  ver: number;
}

/**
 * Global guard: verifies the Bearer JWT unless the route is @Public, re-checks the
 * user in the database (so suspension, role changes and "sign out everywhere"
 * take effect immediately), then enforces @Roles.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: AuthRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;

    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('Missing access token');

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.users.findSessionUser(payload.id);
    if (!user || user.status === 'suspended' || user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException('Session is no longer valid. Please sign in again.');
    }
    req.user = { id: user.id, email: user.email, role: user.role, memberId: user.member?.id ?? null } satisfies AuthUser;

    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES, targets);
    if (roles?.length && !roles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
