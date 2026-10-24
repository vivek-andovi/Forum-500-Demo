import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/auth/decorators';
import { SiteService } from './site.service';

/** Public site content: layout (navigation, footer), pages (home, about, apply…), chapters and club benefits. */
@ApiTags('site')
@Public()
@Controller('public')
export class PublicSiteController {
  constructor(private readonly site: SiteService) {}

  @Get('site')
  site_() {
    return this.site.publicSite();
  }

  @Get('pages/:slug')
  page(@Param('slug') slug: string) {
    return this.site.page(slug);
  }

  /** Where an old forum.club (WordPress) URL lives now: `{ to: "/membership/jane-doe" }` or `{ to: null }`. */
  @Get('redirect')
  redirect(@Query('path') path?: string) {
    return this.site.legacyRedirect(path ?? '');
  }
}

/** Member-area site content: sidebar navigation, page headers, CMS pages, option lists. */
@ApiTags('site')
@ApiBearerAuth()
@Controller('v1')
export class MemberSiteController {
  constructor(private readonly site: SiteService) {}

  @Get('site')
  site_() {
    return this.site.memberSite();
  }

  @Get('pages/:slug')
  page(@Param('slug') slug: string) {
    return this.site.page(slug);
  }

  @Get('lookups')
  lookups() {
    return this.site.lookups();
  }
}
