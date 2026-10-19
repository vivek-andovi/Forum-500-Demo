import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PublicationsService } from './publications.service';

/** Forecast, Podcasts, Forum Radio, What to read, Member articles, Member books, Library (/media/*). */
@ApiTags('media')
@ApiBearerAuth()
@Controller('v1')
export class PublicationsController {
  constructor(private readonly publications: PublicationsService) {}

  @Get('forecast')
  forecast() {
    return this.publications.forecast();
  }

  @Get('podcasts')
  podcasts() {
    return this.publications.podcasts();
  }

  @Get('books')
  books() {
    return this.publications.books();
  }

  @Get('reading')
  reading() {
    return this.publications.reading();
  }

  @Get('library')
  library() {
    return this.publications.library();
  }

  @Get('articles')
  articles(@Query('publication') publication?: string) {
    return this.publications.articles(publication);
  }

  @Get('articles/:slug')
  article(@Param('slug') slug: string) {
    return this.publications.article(slug);
  }
}
