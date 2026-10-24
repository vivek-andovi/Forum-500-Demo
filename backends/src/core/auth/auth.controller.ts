import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { z } from 'zod';
import { parseBody, passwordSchema } from '../common/util';
import { AuthService } from './auth.service';
import { AuthUser, CurrentUser, Public } from './decorators';

const LoginSchema = z.object({ email: z.string().trim().email().max(200), password: z.string().min(1).max(200) });
const EmailSchema = z.object({ email: z.string().trim().email().max(200) });
const TokenSchema = z.object({ token: z.string().min(20).max(200) });
const SetPasswordSchema = z.object({ token: z.string().min(20).max(200), password: passwordSchema });
const ChangePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema });

const STRICT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(STRICT)
  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    const { email, password } = parseBody(LoginSchema, body);
    return this.auth.login(email, password);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(200)
  forgot(@Body() body: unknown) {
    return this.auth.forgotPassword(parseBody(EmailSchema, body).email);
  }

  /** Email a one-click sign-in link. */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('magic-link')
  @HttpCode(200)
  magicLink(@Body() body: unknown) {
    return this.auth.requestMagicLink(parseBody(EmailSchema, body).email);
  }

  /** Sign in with the token from a magic link. */
  @Public()
  @Throttle(STRICT)
  @Post('magic-link/consume')
  @HttpCode(200)
  consumeMagicLink(@Body() body: unknown) {
    return this.auth.consumeMagicLink(parseBody(TokenSchema, body).token);
  }

  /** Accept an invite or complete a password reset (same token mechanism). */
  @Public()
  @Throttle(STRICT)
  @Post('set-password')
  @HttpCode(200)
  setPassword(@Body() body: unknown) {
    const { token, password } = parseBody(SetPasswordSchema, body);
    return this.auth.setPassword(token, password);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user);
  }

  @ApiBearerAuth()
  @Throttle(STRICT)
  @Post('change-password')
  @HttpCode(200)
  changePassword(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const { currentPassword, newPassword } = parseBody(ChangePasswordSchema, body);
    return this.auth.changePassword(user, currentPassword, newPassword);
  }

  /** Sign out of every device (invalidates all existing tokens). */
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(200)
  logoutAll(@CurrentUser() user: AuthUser) {
    return this.auth.revokeSessions(user.id);
  }
}
