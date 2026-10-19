import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators';
import { HealthRepository } from './health.repository';

/** Load balancer / ECS health check: verifies the process and the database. */
@Controller('health')
export class HealthController {
  constructor(private readonly repo: HealthRepository) {}

  @Public()
  @SkipThrottle()
  @Get()
  async health() {
    await this.repo.ping();
    return { status: 'ok', time: new Date().toISOString() };
  }
}
