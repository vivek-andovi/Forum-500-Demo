import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MEMBER_PRIVATE } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Member directory reads. */
@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(filter: { search?: string; sectorId?: string; chapterId?: string }) {
    const where: Prisma.MemberWhereInput = { isPublished: true };
    if (filter.sectorId) where.sectorId = filter.sectorId;
    if (filter.chapterId) where.chapterId = filter.chapterId;
    if (filter.search) {
      where.OR = [
        { fullName: { contains: filter.search, mode: 'insensitive' } },
        { headline: { contains: filter.search, mode: 'insensitive' } },
        { company: { contains: filter.search, mode: 'insensitive' } },
        { interests: { has: filter.search } },
      ];
    }
    return this.prisma.member.findMany({
      where, orderBy: { fullName: 'asc' }, omit: MEMBER_PRIVATE, include: { chapter: true, sector: true },
    });
  }

  listFeaturedNew() {
    return this.prisma.member.findMany({
      where: { featuredNewMember: true, isPublished: true },
      omit: MEMBER_PRIVATE,
      include: { interviews: { orderBy: { sortOrder: 'asc' } }, chapter: true },
    });
  }

  findPublishedBySlugOrId(slug: string, isUuid: boolean) {
    return this.prisma.member.findFirst({
      where: { OR: [{ slug }, ...(isUuid ? [{ id: slug }] : [])], isPublished: true },
      omit: { phone: true, userId: true, profileDraft: true },
      include: { chapter: true, sector: true, tier: true, answers: { include: { question: true } } },
    });
  }

  findPublishedById(id: string) {
    return this.prisma.member.findFirst({ where: { id, isPublished: true } });
  }

  /** Author details (name, photo, chapter) used when a member posts content. */
  findAuthor(id: string) {
    return this.prisma.member.findUniqueOrThrow({ where: { id }, include: { chapter: true } });
  }

  findById(id: string) {
    return this.prisma.member.findUnique({ where: { id } });
  }

  findByName(fullName: string) {
    return this.prisma.member.findFirst({ where: { fullName: { equals: fullName, mode: 'insensitive' } } });
  }
}
