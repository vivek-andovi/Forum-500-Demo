import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { ActionsService } from './actions.service';

/** Actions inbox (/comms/actions). */
@ApiTags('comms')
@ApiBearerAuth()
@Controller('v1/actions')
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Get()
  pending(@CurrentUser() user: AuthUser) {
    return this.actions.pending(user);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.actions.complete(user, id);
  }
}
