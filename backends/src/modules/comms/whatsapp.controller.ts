import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { ChatMessageSchema, WhatsappService } from './whatsapp.service';

/** Chapter WhatsApp groups and group chat (/comms/whatsapp). */
@ApiTags('comms')
@ApiBearerAuth()
@Controller('v1/whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  @Get()
  overview(@CurrentUser() user: AuthUser) {
    return this.whatsapp.overview(user);
  }

  @Post(':id/join')
  @HttpCode(200)
  join(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.whatsapp.join(user, id);
  }

  @Get(':id/messages')
  messages(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.whatsapp.messages(user, id);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post(':id/messages')
  post(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.whatsapp.post(user, id, parseBody(ChatMessageSchema, body).body);
  }
}
