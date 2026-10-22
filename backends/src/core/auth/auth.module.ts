import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { env } from '../config/env';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: env().JWT_SECRET,
        signOptions: { expiresIn: env().JWT_EXPIRES_IN as any, issuer: 'forum500-api', audience: 'forum500' },
        verifyOptions: { issuer: 'forum500-api', audience: 'forum500', algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  // AuthRepository is exported only for AuthGuard, which AppModule registers as the global APP_GUARD.
  // Feature modules should use AuthService.
  exports: [AuthService, AuthRepository, JwtModule],
})
export class AuthModule {}
