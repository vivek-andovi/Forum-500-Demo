import { Injectable } from '@nestjs/common';
import { NavMenu } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** CMS content: pages, cards, navigation, club benefits, settings and lookup lists. */
@Injectable()
export class SiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  findPublishedPage(slug: string) {
    return this.prisma.page.findFirst({ where: { slug, ...PUBLISHED } });
  }

  listPublishedPageHeaders(prefixes: string[]) {
    return this.prisma.page.findMany({
      where: { ...PUBLISHED, OR: prefixes.map((p) => ({ slug: { startsWith: p } })) },
      select: { slug: true, title: true, eyebrow: true, subtitle: true, heroImageUrl: true, heroImageAlt: true, body: true, blocks: true },
    });
  }

  listCards(placementPrefix: string) {
    return this.prisma.contentCard.findMany({
      where: { active: true, placement: { startsWith: placementPrefix } }, orderBy: { sortOrder: 'asc' },
    });
  }

  /** Top-level items of a menu with their active children. */
  listMenu(menu: NavMenu) {
    return this.prisma.navItem.findMany({
      where: { menu, active: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: { children: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  listClubBenefits() {
    return this.prisma.clubBenefit.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  }

  findLegacyRedirect(paths: string[]) {
    return this.prisma.legacyMap.findFirst({ where: { oldUrl: { in: paths }, newUrl: { not: null } }, select: { newUrl: true } });
  }

  findSetting(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  listChaptersForSite() {
    return this.prisma.chapter.findMany({ where: { whatsappEnabled: true }, orderBy: { name: 'asc' } });
  }

  listSectors() {
    return this.prisma.sector.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  listDirectoryChapters() {
    return this.prisma.chapter.findMany({ where: { isChapter: true }, orderBy: { sortOrder: 'asc' } });
  }

  listAllChapters() {
    return this.prisma.chapter.findMany({ orderBy: { name: 'asc' } });
  }

  listActiveQuestions() {
    return this.prisma.profileQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  }
}
