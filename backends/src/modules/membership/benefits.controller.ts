import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { BenefitsService, OfferSubmissionSchema } from './benefits.service';

/** Member Benefits (/membership/benefits). */
@ApiTags('membership')
@ApiBearerAuth()
@Controller('v1/benefits')
export class BenefitsController {
  constructor(private readonly benefits: BenefitsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.benefits.list(user);
  }

  @Post(':id/optin')
  @HttpCode(200)
  optIn(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.benefits.optIn(user, id);
  }

  @Delete(':id/optin')
  optOut(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.benefits.optOut(user, id);
  }

  @Post('submissions')
  submit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.benefits.submit(user, parseBody(OfferSubmissionSchema, body));
  }
}
