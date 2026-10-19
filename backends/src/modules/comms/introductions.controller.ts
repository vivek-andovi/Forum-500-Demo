import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { IntroSchema, IntroductionsService, RespondSchema } from './introductions.service';

/** Member Introductions (/comms/introductions). */
@ApiTags('comms')
@ApiBearerAuth()
@Controller('v1/introductions')
export class IntroductionsController {
  constructor(private readonly intros: IntroductionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.intros.list(user);
  }

  @Post()
  request(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.intros.request(user, parseBody(IntroSchema, body));
  }

  @Post(':id/respond')
  @HttpCode(200)
  respond(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.intros.respond(user, id, parseBody(RespondSchema, body).accept);
  }
}
