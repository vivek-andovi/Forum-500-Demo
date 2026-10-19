import { Injectable } from '@nestjs/common';
import { Publication } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Forecast, podcasts / Forum Radio, books, reading picks, library and member articles. */
@Injectable()
export class PublicationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForecastIssues() {
    return this.prisma.forecastIssue.findMany({
      where: PUBLISHED, orderBy: { publishedOn: 'desc' }, include: { articles: { where: PUBLISHED, orderBy: { sortOrder: 'asc' } } },
    });
  }

  listPodcasts(take?: number) {
    return this.prisma.podcastEpisode.findMany({ where: PUBLISHED, orderBy: { number: 'desc' }, take });
  }

  listMemberBooks() {
    return this.prisma.book.findMany({ where: { ...PUBLISHED, isMemberBook: true }, orderBy: { sortOrder: 'asc' } });
  }

  listBookRecommendations(curated: boolean) {
    return this.prisma.bookRecommendation.findMany({
      where: { ...PUBLISHED, isCuratedPick: curated }, orderBy: { sortOrder: 'asc' }, include: { book: true },
    });
  }

  listLibrary() {
    return this.prisma.libraryItem.findMany({ where: PUBLISHED, orderBy: [{ publishedAt: 'desc' }, { title: 'asc' }] });
  }

  listArticles(publication?: Publication, take?: number) {
    return this.prisma.article.findMany({
      where: { ...PUBLISHED, ...(publication ? { publication } : {}) },
      orderBy: [{ publishedAt: 'desc' }, { sortOrder: 'asc' }],
      include: { section: true },
      take,
    });
  }

  findArticle(slug: string) {
    return this.prisma.article.findFirst({ where: { slug, ...PUBLISHED }, include: { section: true } });
  }
}
