import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VenuesService } from './venues.service';

/** Venues (/events/venues). */
@ApiTags('events')
@ApiBearerAuth()
@Controller('v1/venues')
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get()
  list() {
    return this.venues.list();
  }
}
