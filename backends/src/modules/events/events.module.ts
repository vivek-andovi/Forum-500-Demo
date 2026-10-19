import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsRepository } from './events.repository';
import { EventsService } from './events.service';
import { GalleryController } from './gallery.controller';
import { GalleryRepository } from './gallery.repository';
import { GalleryService } from './gallery.service';
import { VenuesController } from './venues.controller';
import { VenuesRepository } from './venues.repository';
import { VenuesService } from './venues.service';

/** Events hub: calendar, event detail & RSVP, my events/proposals, venues, gallery. */
@Module({
  controllers: [EventsController, VenuesController, GalleryController],
  providers: [EventsService, EventsRepository, VenuesService, VenuesRepository, GalleryService, GalleryRepository],
  exports: [EventsRepository],
})
export class EventsModule {}
