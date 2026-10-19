import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { MessagesService, NewMessageSchema, ReplySchema } from './messages.service';

/** Direct messages between members (/comms/messages). */
@ApiTags('comms')
@ApiBearerAuth()
@Throttle({ default: { limit: 30, ttl: 60_000 } })
@Controller('v1/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  inbox(@CurrentUser() user: AuthUser) {
    return this.messages.inbox(user);
  }

  @Post()
  start(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.messages.start(user, parseBody(NewMessageSchema, body));
  }

  @Get(':id')
  thread(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.messages.thread(user, id);
  }

  @Post(':id')
  reply(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.messages.reply(user, id, parseBody(ReplySchema, body).body);
  }
}
