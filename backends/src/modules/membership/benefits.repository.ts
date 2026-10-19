import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class BenefitsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.benefitOffer.findMany({ where: PUBLISHED, orderBy: { sortOrder: 'asc' }, include: { category: true } });
  }

  listFeatured() {
    return this.prisma.benefitOffer.findMany({ where: { ...PUBLISHED, featured: true }, include: { category: true } });
  }

  listOptedIn(memberId: string) {
    return this.prisma.benefitOffer.findMany({ where: { ...PUBLISHED, optIns: { some: { memberId } } }, include: { category: true } });
  }

  optInsFor(memberId: string) {
    return this.prisma.benefitOptIn.findMany({ where: { memberId } });
  }

  submissionsBy(memberId: string) {
    return this.prisma.benefitOffer.findMany({
      where: { providerMemberId: memberId, status: { in: ['in_review', 'rejected'] } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findPublished(id: string) {
    return this.prisma.benefitOffer.findFirst({ where: { id, ...PUBLISHED } });
  }

  optIn(memberId: string, offerId: string) {
    return this.prisma.benefitOptIn.upsert({
      where: { memberId_offerId: { memberId, offerId } }, update: {}, create: { memberId, offerId },
    });
  }

  optOut(memberId: string, offerId: string) {
    return this.prisma.benefitOptIn.deleteMany({ where: { memberId, offerId } });
  }

  findCategoryByName(name: string) {
    return this.prisma.benefitCategory.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
  }

  createOffer(data: Prisma.BenefitOfferUncheckedCreateInput) {
    return this.prisma.benefitOffer.create({ data });
  }
}
