import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

const MEMBER_COUNT = { _count: { select: { memberships: { where: { status: 'approved' as const } } } } };

@Injectable()
export class GroupsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublishedWithCounts() {
    return this.prisma.group.findMany({ where: PUBLISHED, orderBy: { sortOrder: 'asc' }, include: MEMBER_COUNT });
  }

  listJoinedWithCounts(memberId: string) {
    return this.prisma.group.findMany({
      where: { ...PUBLISHED, memberships: { some: { memberId, status: 'approved' } } },
      include: MEMBER_COUNT,
    });
  }

  membershipsOf(memberId: string) {
    return this.prisma.groupMembership.findMany({ where: { memberId } });
  }

  proposalsBy(memberId: string) {
    return this.prisma.group.findMany({ where: { proposedById: memberId, status: { in: ['in_review', 'rejected'] } } });
  }

  findPublished(id: string) {
    return this.prisma.group.findFirst({ where: { id, ...PUBLISHED } });
  }

  findMembership(groupId: string, memberId: string) {
    return this.prisma.groupMembership.findUnique({ where: { groupId_memberId: { groupId, memberId } } });
  }

  requestJoin(groupId: string, memberId: string) {
    return this.prisma.groupMembership.upsert({
      where: { groupId_memberId: { groupId, memberId } },
      update: { status: 'requested' },
      create: { groupId, memberId, status: 'requested' },
    });
  }

  leave(groupId: string, memberId: string) {
    return this.prisma.groupMembership.deleteMany({ where: { groupId, memberId } });
  }

  createProposal(data: Prisma.GroupUncheckedCreateInput, proposerId: string) {
    return this.prisma.group.create({
      data: { ...data, proposedById: proposerId, memberships: { create: { memberId: proposerId, status: 'approved' } } },
    });
  }
}
