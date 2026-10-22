import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Publication } from '@prisma/client';
import { PublicationsRepository } from './publications.repository';

const PUBLICATIONS = Object.values(Publication) as string[];

@Injectable()
export class PublicationsService {
  constructor(private readonly repo: PublicationsRepository) {}

  forecast() {
    return this.repo.listForecastIssues();
  }

  podcasts() {
    return this.repo.listPodcasts();
  }

  async books() {
    const [memberBooks, recommended] = await Promise.all([this.repo.listMemberBooks(), this.repo.listBookRecommendations(false)]);
    return { memberBooks, recommended };
  }

  reading() {
    return this.repo.listBookRecommendations(true);
  }

  library() {
    return this.repo.listLibrary();
  }

  articles(publication?: string) {
    if (publication && !PUBLICATIONS.includes(publication)) {
      throw new BadRequestException(`publication must be one of: ${PUBLICATIONS.join(', ')}`);
    }
    return this.repo.listArticles(publication as Publication | undefined);
  }

  async article(slug: string) {
    const article = await this.repo.findArticle(slug);
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  // ── Reads used by other modules (e.g. the dashboard)

  latestArticles(publication: Publication, take: number) {
    return this.repo.listArticles(publication, take);
  }

  latestPodcasts(take: number) {
    return this.repo.listPodcasts(take);
  }
}
