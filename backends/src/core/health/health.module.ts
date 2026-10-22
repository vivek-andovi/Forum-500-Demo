import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthRepository } from './health.repository';

/** `GET /api/health` for the load balancer / ECS. */
@Module({ controllers: [HealthController], providers: [HealthRepository] })
export class HealthModule {}
