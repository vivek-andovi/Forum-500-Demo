import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../auth/decorators';
import { HealthRepository } from './health.repository';

/**
 * Health checks. `/api/health` verifies the process and the database; `/api/health/live` only the process,
 * for uptime monitors that must not wake a paused database (Aurora Serverless).
 */
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

  @Public()
  @SkipThrottle()
  @Get('live')
  live() {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
