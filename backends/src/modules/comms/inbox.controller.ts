import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { InboxService } from './inbox.service';

/** Emails (/comms/emails) and notifications (/comms/notifications). */
@ApiTags('comms')
@ApiBearerAuth()
@Controller('v1')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('emails')
  emails(@CurrentUser() user: AuthUser) {
    return this.inbox.emails(user);
  }

  @Get('emails/:id')
  email(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inbox.email(user, id);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.inbox.notifications(user);
  }

  @Post('notifications/:id/read')
  @HttpCode(200)
  read(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.inbox.markRead(user, id);
  }
}
