import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { FeedPostSchema, FeedService } from './feed.service';

/** Newsfeed (/media/newsfeed). */
@ApiTags('media')
@ApiBearerAuth()
@Controller('v1/feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.feed.list(user);
  }

  @Post()
  post(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.feed.post(user, parseBody(FeedPostSchema, body));
  }

  @Post(':id/like')
  @HttpCode(200)
  like(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.feed.like(user, id);
  }
}
