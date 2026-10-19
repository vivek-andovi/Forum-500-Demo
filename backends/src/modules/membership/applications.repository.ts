import { Injectable } from '@nestjs/common';
import { Application, Prisma } from '@prisma/client';
import { uniqueSlug } from '../../core/common/util';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Membership applications from the public /apply form, and their approval. */
@Injectable()
export class ApplicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOpenByEmail(email: string) {
    return this.prisma.application.findFirst({ where: { email, status: { in: ['new', 'in_review'] } } });
  }

  create(data: Prisma.ApplicationUncheckedCreateInput) {
    return this.prisma.application.create({ data });
  }

  findById(id: string) {
    return this.prisma.application.findUnique({ where: { id } });
  }

  userExists(email: string) {
    return this.prisma.user.findUnique({ where: { email } }).then(Boolean);
  }

  setDecision(id: string, status: 'rejected' | 'waitlisted', note?: string) {
    return this.prisma.application.update({ where: { id }, data: { status, decisionNote: note, decidedAt: new Date() } });
  }

  /**
   * Approve: create an invited user (no password yet) and an unpublished member
   * profile pre-filled from the application, in one transaction.
   */
  async approve(app: Application, email: string, note?: string) {
    const [chapter, sector, tier] = await Promise.all([
      this.prisma.chapter.findFirst({ where: { name: { equals: app.city, mode: 'insensitive' } } }),
      this.prisma.sector.findFirst({ where: { name: { equals: app.sector, mode: 'insensitive' } } }),
      this.prisma.membershipTier.findFirst({ orderBy: { sortOrder: 'asc' } }),
    ]);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, role: 'member', status: 'invited' } });
      const member = await tx.member.create({
        data: {
          userId: user.id,
          slug: uniqueSlug(app.fullName),
          fullName: app.fullName,
          email,
          phone: app.phone,
          headline: app.role,
          company: app.company,
          linkedinUrl: app.linkedin,
          travelCities: app.travelCities,
          joinedYear: new Date().getFullYear(),
          chapterId: chapter?.id,
          sectorId: sector?.id,
          tierId: tier?.id,
          isPublished: false,
          profileStatus: 'draft',
        },
      });
      const application = await tx.application.update({
        where: { id: app.id },
        data: { status: 'approved', decisionNote: note, decidedAt: new Date() },
      });
      return { application, member, userId: user.id };
    });
  }
}
