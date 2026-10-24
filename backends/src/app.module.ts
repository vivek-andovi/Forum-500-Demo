import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './core/audit/audit.module';
import { AuthGuard } from './core/auth/auth.guard';
import { AuthModule } from './core/auth/auth.module';
import { AllExceptionsFilter } from './core/common/all-exceptions.filter';
import { ClientIpThrottlerGuard } from './core/common/client-ip-throttler.guard';
import { env } from './core/config/env';
import { HealthModule } from './core/health/health.module';
import { MailModule } from './core/mail/mail.module';
import { NotificationsModule } from './core/notifications/notifications.module';
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
    // Counted per running instance: with several Lambda instances (or ECS tasks) the limit is per instance, so
    // Cloudflare rate-limiting rules in front are the real protection.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: env().RATE_LIMIT_PER_MINUTE }]),
    // Core infrastructure
    PrismaModule,
    AuditModule,
    StorageModule,
    MailModule,
    AuthModule,
    NotificationsModule,
    HealthModule,
    // Feature modules — one per hub of the member app, plus admin and site content
    SiteModule,
    DashboardModule,
    MembershipModule,
    EventsModule,
    MediaModule,
    CommsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
