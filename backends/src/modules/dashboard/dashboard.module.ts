import { Module } from '@nestjs/common';
import { CommsModule } from '../comms/comms.module';
import { EventsModule } from '../events/events.module';
import { MediaModule } from '../media/media.module';
import { MembershipModule } from '../membership/membership.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/** The dashboard has no tables of its own; it reads through the other modules. */
@Module({
  imports: [MembershipModule, EventsModule, MediaModule, CommsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
