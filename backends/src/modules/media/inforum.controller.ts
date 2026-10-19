import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { CommentSchema, InforumService, PitchSchema, RecommendationSchema } from './inforum.service';

/** In:Forum journal for members (/media/inforum). */
@ApiTags('media')
@ApiBearerAuth()
@Controller('v1')
export class InforumController {
  constructor(private readonly inforum: InforumService) {}

  @Get('inforum/editions')
  editions() {
    return this.inforum.editions();
  }

  @Get('inforum/editions/:slug')
  edition(@Param('slug') slug: string) {
    return this.inforum.edition(slug);
  }

  @Get('inforum/sections')
  sections() {
    return this.inforum.sections();
  }

  @Get('inforum/tabs')
  tabs() {
    return this.inforum.tabs();
  }

  @Get('inforum/recommendations')
  recommendations() {
    return this.inforum.recommendations();
  }

  @Post('inforum/recommendations')
  addRecommendation(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.inforum.addRecommendation(user, parseBody(RecommendationSchema, body));
  }

  @Get('inforum/comments')
  comments(@CurrentUser() user: AuthUser) {
    return this.inforum.comments(user);
  }

  @Post('inforum/comments')
  addComment(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.inforum.addComment(user, parseBody(CommentSchema, body));
  }

  @Post('inforum/comments/:id/recommend')
  @HttpCode(200)
  recommend(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inforum.recommend(user, id);
  }

  @Post('pitches')
  pitch(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.inforum.pitch(user, parseBody(PitchSchema, body));
  }
}

/** Public In:Forum preview (/inforum). */
@ApiTags('public')
@Public()
@Controller('public/inforum')
export class PublicInforumController {
  constructor(private readonly inforum: InforumService) {}

  @Get('current')
  current() {
    return this.inforum.publicEdition();
  }

  @Get('tabs')
  tabs() {
    return this.inforum.tabs();
  }
}
