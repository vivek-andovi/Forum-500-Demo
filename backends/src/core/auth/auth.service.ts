import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'crypto';
import { requestContext } from '../common/request-context';
import { env } from '../config/env';
import { MailService } from '../mail/mail.service';
import { AuthRepository } from './auth.repository';
import { AuthUser } from './decorators';
import { isLegacyHash, verifyLegacyPassword } from './legacy-password';

const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const TOKEN_TTL_HOURS: Record<AuthTokenType, number> = { invite: 24 * 7, password_reset: 1, magic_link: 0.25 };
const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

@Injectable()
export class AuthService {
  // Used to equalise timing when the email does not exist.
  private readonly dummyHash = argon2.hash('timing-equaliser-not-a-password');

  constructor(
    private readonly users: AuthRepository,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private issue(user: User & { member: { id: string } | null }) {
    const payload = { id: user.id, email: user.email, role: user.role, memberId: user.member?.id ?? null, ver: user.tokenVersion };
    return this.jwt.signAsync(payload);
  }

  private session(user: User & { member: any }, accessToken: string) {
    return { accessToken, user: { id: user.id, email: user.email, role: user.role }, member: user.member };
  }

  /** argon2, or a hash imported from the old WordPress site (upgraded on the next successful login). */
  private checkPassword(hash: string, password: string) {
    return isLegacyHash(hash) ? verifyLegacyPassword(password, hash) : argon2.verify(hash, password);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmailWithMember(email.trim().toLowerCase());
    const fail = new UnauthorizedException('Invalid email or password');
    if (!user?.passwordHash) {
      await argon2.verify(await this.dummyHash, password);
      throw fail;
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(`Too many failed attempts. Try again after ${user.lockedUntil.toISOString().slice(11, 16)} UTC.`);
    }
    if (!(await this.checkPassword(user.passwordHash, password))) {
      const failed = user.failedLogins + 1;
      await this.users.updateUser(user.id, {
        failedLogins: failed >= MAX_FAILED_LOGINS ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      });
      throw fail;
    }
    // Checked only after the password is verified, so it doesn't reveal which emails are suspended.
    if (user.status === 'suspended') throw new UnauthorizedException('This account is suspended');

    requestContext.setUser(user.id); // public route: the user is the actor from here on
    const updated = await this.users.updateUserWithMember(user.id, {
      lastLoginAt: new Date(), status: 'active', failedLogins: 0, lockedUntil: null,
      ...(isLegacyHash(user.passwordHash) && { passwordHash: await argon2.hash(password) }),
    });
    return this.session(updated, await this.issue(updated));
  }

  /** Email a one-click sign-in link (the old site's "magic login"). Same response whether or not the email exists. */
  async requestMagicLink(email: string) {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (user && user.status !== 'suspended') {
      const raw = await this.createToken(user.id, 'magic_link');
      await this.mail.sendMagicLink(user.email, `${env().WEB_APP_URL}/auth/magic?token=${raw}`);
    }
    return { ok: true, message: 'If that email belongs to an account, a sign-in link is on its way.' };
  }

  async consumeMagicLink(rawToken: string) {
    const token = await this.users.findToken(hashToken(rawToken));
    if (!token || token.type !== 'magic_link' || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('This sign-in link is invalid or has expired. Please request a new one.');
    }
    const owner = await this.users.findById(token.userId);
    if (!owner || owner.status === 'suspended') throw new UnauthorizedException('This account is suspended');
    requestContext.setUser(owner.id);
    const user = await this.users.consumeMagicToken(token.id, token.userId);
    return this.session(user, await this.issue(user));
  }

  async me(auth: AuthUser) {
    const user = await this.users.findByIdWithMember(auth.id);
    if (!user) throw new UnauthorizedException();
    return { user: { id: user.id, email: user.email, role: user.role }, member: user.member };
  }

  /** Create a one-time token and return the raw value (only its hash is stored). */
  async createToken(userId: string, type: AuthTokenType): Promise<string> {
    const raw = randomBytes(32).toString('base64url');
    await this.users.replaceToken(userId, type, hashToken(raw), new Date(Date.now() + TOKEN_TTL_HOURS[type] * 3600_000));
    return raw;
  }

  /** Email a set-password invite link to a user. */
  async sendInvite(userId: string) {
    const user = await this.users.findByIdWithMember(userId);
    if (!user) throw new BadRequestException('User not found');
    const raw = await this.createToken(user.id, 'invite');
    const link = `${env().WEB_APP_URL}/auth/set-password?token=${raw}`;
    await this.mail.sendInvite(user.email, user.member?.fullName ?? 'Member', link);
    // Returned for admins outside production so the flow can be tested without email.
    return env().NODE_ENV === 'production' ? { sent: true } : { sent: true, devLink: link };
  }

  async forgotPassword(email: string) {
    const user = await this.users.findByEmail(email.trim().toLowerCase());
    if (user && user.status !== 'suspended') {
      const raw = await this.createToken(user.id, 'password_reset');
      await this.mail.sendPasswordReset(user.email, `${env().WEB_APP_URL}/auth/set-password?token=${raw}&reset=1`);
    }
    // Same response whether or not the email exists (no account enumeration).
    return { ok: true, message: 'If that email belongs to an account, a reset link is on its way.' };
  }

  /** Consume an invite or reset token and set the password. */
  async setPassword(rawToken: string, password: string) {
    const token = await this.users.findToken(hashToken(rawToken));
    if (!token || token.type === 'magic_link' || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('This link is invalid or has expired. Please request a new one.');
    }
    // Check before consuming: consuming the token marks the user active, which would undo a suspension.
    const owner = await this.users.findById(token.userId);
    if (!owner || owner.status === 'suspended') throw new UnauthorizedException('This account is suspended');
    requestContext.setUser(owner.id);
    const user = await this.users.consumeTokenAndSetPassword(token.id, token.userId, await argon2.hash(password));
    return this.session(user, await this.issue(user));
  }

  async changePassword(auth: AuthUser, current: string, next: string) {
    const user = await this.users.findById(auth.id);
    if (!user?.passwordHash || !(await this.checkPassword(user.passwordHash, current))) {
      throw new BadRequestException('Current password is incorrect');
    }
    const updated = await this.users.updateUserWithMember(user.id, {
      passwordHash: await argon2.hash(next), tokenVersion: { increment: 1 },
    });
    // Other sessions are signed out; this one gets a fresh token.
    return { accessToken: await this.issue(updated) };
  }

  /** Raw user row (used by admin user actions). */
  findUserById(id: string) {
    return this.users.findById(id);
  }

  async revokeSessions(userId: string) {
    await this.users.updateUser(userId, { tokenVersion: { increment: 1 } });
    return { ok: true };
  }
}
