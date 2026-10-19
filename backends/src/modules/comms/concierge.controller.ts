import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { ConciergeSchema, ConciergeService } from './concierge.service';

/** Ask Zola concierge (/ask-zola). */
@ApiTags('comms')
@ApiBearerAuth()
@Controller('v1/concierge')
export class ConciergeController {
  constructor(private readonly concierge: ConciergeService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.concierge.mine(user);
  }

  @Get('prompts')
  prompts() {
    return this.concierge.quickPrompts();
  }

  @Post()
  ask(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.concierge.ask(user, parseBody(ConciergeSchema, body));
  }
}
