import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MEMBER_PRIVATE } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Member directory reads. */
@Injectable()
export class MembersRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished(filter: { search?: string; sectorId?: string; chapterId?: string; interest?: string }) {
    const and: Prisma.MemberWhereInput[] = [{ isPublished: true }];
    // A member matches a sector if it is their primary sector or one of their other sectors.
    if (filter.sectorId) and.push({ OR: [{ sectorId: filter.sectorId }, { sectors: { some: { sectorId: filter.sectorId } } }] });
    if (filter.chapterId) and.push({ chapterId: filter.chapterId });
    if (filter.interest) and.push({ interests: { has: filter.interest } });
    if (filter.search) {
      and.push({
        OR: [
          { fullName: { contains: filter.search, mode: 'insensitive' } },
          { headline: { contains: filter.search, mode: 'insensitive' } },
          { company: { contains: filter.search, mode: 'insensitive' } },
          { interests: { has: filter.search } },
        ],
      });
    }
    return this.prisma.member.findMany({
      where: { AND: and }, orderBy: { fullName: 'asc' }, omit: MEMBER_PRIVATE,
      include: { chapter: true, sector: true, sectors: { orderBy: { sortOrder: 'asc' }, include: { sector: true } } },
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
      include: {
        chapter: true, sector: true, tier: true, answers: { include: { question: true } },
        sectors: { orderBy: { sortOrder: 'asc' }, include: { sector: true } },
        interviews: { orderBy: { sortOrder: 'asc' } },
      },
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
