import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { EventsService, ProposalSchema, RsvpSchema } from './events.service';

/** Events Calendar, event detail and My Events (/events). */
@ApiTags('events')
@ApiBearerAuth()
@Controller('v1/events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.list();
  }

  @Get('mine')
  mine(@CurrentUser() user: AuthUser) {
    return this.events.mine(user);
  }

  @Post('proposals')
  propose(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.events.propose(user, parseBody(ProposalSchema, body));
  }

  @Get(':slug')
  detail(@CurrentUser() user: AuthUser, @Param('slug') slug: string) {
    return this.events.detail(user, slug);
  }

  @Post(':id/rsvp')
  @HttpCode(200)
  rsvp(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.events.rsvp(user, id, parseBody(RsvpSchema, body ?? {}));
  }

  @Delete(':id/rsvp')
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.events.cancelRsvp(user, id);
  }
}
