import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { GroupProposalSchema, GroupsService } from './groups.service';

/** Member Groups (/membership/groups). */
@ApiTags('membership')
@ApiBearerAuth()
@Controller('v1/groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.groups.list(user);
  }

  @Post('proposals')
  propose(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.groups.propose(user, parseBody(GroupProposalSchema, body));
  }

  @Post(':id/join')
  @HttpCode(200)
  join(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.groups.join(user, id);
  }

  @Delete(':id/membership')
  leave(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.groups.leave(user, id);
  }
}
