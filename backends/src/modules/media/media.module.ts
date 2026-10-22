import { Module } from '@nestjs/common';
import { MembershipModule } from '../membership/membership.module';
import { FeedController } from './feed.controller';
import { FeedRepository } from './feed.repository';
import { FeedService } from './feed.service';
import { InforumController, PublicInforumController } from './inforum.controller';
import { InforumRepository } from './inforum.repository';
import { InforumService } from './inforum.service';
import { PublicationsController } from './publications.controller';
import { PublicationsRepository } from './publications.repository';
import { PublicationsService } from './publications.service';

/** Media hub: In:Forum, Forecast, podcasts/radio, books & reading, library, member articles, newsfeed. */
@Module({
  imports: [MembershipModule],
  controllers: [InforumController, PublicInforumController, PublicationsController, FeedController],
  providers: [InforumService, InforumRepository, PublicationsService, PublicationsRepository, FeedService, FeedRepository],
  exports: [InforumService, PublicationsService],
})
export class MediaModule {}
