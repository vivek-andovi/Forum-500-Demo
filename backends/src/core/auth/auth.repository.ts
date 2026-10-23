import { Injectable } from '@nestjs/common';
import { AuthTokenType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Database access for authentication: users, sessions and one-time tokens. */
@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmailWithMember(email: string) {
    return this.prisma.user.findUnique({ where: { email }, include: { member: true } });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithMember(id: string) {
    return this.prisma.user.findUnique({ where: { id }, include: { member: true } });
  }

  /** Minimal projection used by the auth guard on every request. */
  findSessionUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true, member: { select: { id: true } } },
    });
  }

  updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateUserWithMember(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data, include: { member: true } });
  }

  async replaceToken(userId: string, type: AuthTokenType, tokenHash: string, expiresAt: Date) {
    await this.prisma.authToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
    return this.prisma.authToken.create({ data: { userId, type, tokenHash, expiresAt } });
  }

  findToken(tokenHash: string) {
    return this.prisma.authToken.findUnique({ where: { tokenHash } });
  }

  /** Mark a magic sign-in token used and record the login, in one transaction. */
  consumeMagicToken(tokenId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.authToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } });
      return tx.user.update({
        where: { id: userId },
        data: { status: 'active', failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
        include: { member: true },
      });
    });
  }

  /** Mark the token used and set the new password in one transaction. */
  consumeTokenAndSetPassword(tokenId: string, userId: string, passwordHash: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.authToken.update({ where: { id: tokenId }, data: { usedAt: new Date() } });
      return tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: 'active',
          tokenVersion: { increment: 1 },
          failedLogins: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
        include: { member: true },
      });
    });
  }
}
