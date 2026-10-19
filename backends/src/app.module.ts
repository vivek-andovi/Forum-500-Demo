import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './core/audit/audit.module';
import { AuthGuard } from './core/auth/auth.guard';
import { AuthModule } from './core/auth/auth.module';
import { AllExceptionsFilter } from './core/common/prisma-exception.filter';
import { env } from './core/config/env';
import { HealthController } from './core/health/health.controller';
import { HealthRepository } from './core/health/health.repository';
import { MailModule } from './core/mail/mail.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { StorageModule } from './core/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { CommsModule } from './modules/comms/comms.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { MediaModule } from './modules/media/media.module';
import { MembershipModule } from './modules/membership/membership.module';
import { SiteModule } from './modules/site/site.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Default: RATE_LIMIT_PER_MINUTE (300) requests / minute / IP. Sensitive routes set stricter limits.
    // With several ECS tasks, switch to a Redis-backed storage (ElastiCache).
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: env().RATE_LIMIT_PER_MINUTE }]),
    // Core infrastructure
    PrismaModule,
    AuditModule,
    StorageModule,
    MailModule,
    AuthModule,
    // Feature modules — one per hub of the member app, plus admin and site content
    SiteModule,
    DashboardModule,
    MembershipModule,
    EventsModule,
    MediaModule,
    CommsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthRepository,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
