import { Module } from '@nestjs/common';
import { MemberSiteController, PublicSiteController } from './site.controller';
import { SiteRepository } from './site.repository';
import { SiteService } from './site.service';

/** CMS: pages, navigation menus, content cards, club benefits, site settings, lookups. */
@Module({
  controllers: [PublicSiteController, MemberSiteController],
  providers: [SiteService, SiteRepository],
})
export class SiteModule {}
