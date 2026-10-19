import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../core/auth/decorators';
import { parseBody } from '../../core/common/util';
import { ApplicationSchema, ApplicationsService } from './applications.service';

/** Public membership application form (/apply). */
@ApiTags('membership')
@Public()
@Controller('public/applications')
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  apply(@Body() body: unknown) {
    return this.applications.apply(parseBody(ApplicationSchema, body));
  }
}
