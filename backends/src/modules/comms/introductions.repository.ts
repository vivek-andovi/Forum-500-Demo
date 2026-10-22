import { Injectable } from '@nestjs/common';
import { MEMBER_PRIVATE } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

const PERSON = { omit: MEMBER_PRIVATE } as const;
const PERSON_WITH_CHAPTER = { omit: MEMBER_PRIVATE, include: { chapter: true } } as const;

@Injectable()
export class IntroductionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listFor(memberId: string, take?: number, withChapters = true) {
    return this.prisma.introduction.findMany({
      where: { OR: [{ targetId: memberId }, { requesterId: memberId }] },
      include: withChapters
        ? { requester: PERSON_WITH_CHAPTER, target: PERSON_WITH_CHAPTER, introducer: PERSON }
        : { requester: PERSON, target: PERSON, introducer: PERSON },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  findOpen(requesterId: string, targetId: string) {
    return this.prisma.introduction.findFirst({ where: { requesterId, targetId, status: { in: ['requested', 'pending'] } } });
  }

  create(requesterId: string, targetId: string, reason: string) {
    return this.prisma.introduction.create({ data: { requesterId, targetId, reason, status: 'requested' } });
  }

  findById(id: string) {
    return this.prisma.introduction.findUnique({ where: { id } });
  }

  respond(id: string, accept: boolean) {
    return this.prisma.introduction.update({ where: { id }, data: { status: accept ? 'accepted' : 'declined', respondedAt: new Date() } });
  }
}
