import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { ProfileSchema, ProfileService } from './profile.service';

/** "My Member Profile" (/membership/profile) and the account summary. */
@ApiTags('membership')
@ApiBearerAuth()
@Controller('v1/me')
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  me(@CurrentUser() user: AuthUser) {
    return this.profile.me(user);
  }

  @Patch('profile')
  saveDraft(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.profile.saveDraft(user, parseBody(ProfileSchema, body));
  }

  @Post('profile/submit')
  @HttpCode(200)
  submit(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    return this.profile.submitForReview(user, parseBody(ProfileSchema, body));
  }
}
