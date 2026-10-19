import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Chapter WhatsApp groups, join requests and the in-app group chat. */
@Injectable()
export class WhatsappRepository {
  constructor(private readonly prisma: PrismaService) {}

  listActiveGroups() {
    return this.prisma.whatsappGroup.findMany({
      where: { active: true }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], omit: { inviteLink: true },
    });
  }

  listJoinedGroups(memberId: string) {
    return this.prisma.whatsappGroup.findMany({ where: { memberships: { some: { memberId, status: 'approved' } } } });
  }

  membershipsOf(memberId: string) {
    return this.prisma.whatsappMembership.findMany({ where: { memberId }, include: { group: true } });
  }

  findActiveGroup(id: string) {
    return this.prisma.whatsappGroup.findFirst({ where: { id, active: true } });
  }

  findMembership(groupId: string, memberId: string) {
    return this.prisma.whatsappMembership.findUnique({ where: { groupId_memberId: { groupId, memberId } } });
  }

  requestJoin(groupId: string, memberId: string) {
    return this.prisma.whatsappMembership.upsert({
      where: { groupId_memberId: { groupId, memberId } },
      update: { status: 'requested' },
      create: { groupId, memberId, status: 'requested' },
    });
  }

  listMessages(groupId: string, take = 100) {
    return this.prisma.whatsappMessage.findMany({
      where: { groupId, status: 'published' }, orderBy: { createdAt: 'desc' }, take,
      include: { member: { select: { slug: true, avatarUrl: true } } },
    });
  }

  createMessage(groupId: string, memberId: string, authorName: string, body: string) {
    return this.prisma.whatsappMessage.create({ data: { groupId, memberId, authorName, body } });
  }
}
