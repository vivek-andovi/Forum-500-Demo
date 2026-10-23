import { Module } from '@nestjs/common';
import { MembershipModule } from '../membership/membership.module';
import { SiteModule } from '../site/site.module';
import { ActionsController } from './actions.controller';
import { ActionsRepository } from './actions.repository';
import { ActionsService } from './actions.service';
import { ConciergeController } from './concierge.controller';
import { ConciergeRepository } from './concierge.repository';
import { ConciergeService } from './concierge.service';
import { InboxController } from './inbox.controller';
import { InboxRepository } from './inbox.repository';
import { InboxService } from './inbox.service';
import { IntroductionsController } from './introductions.controller';
import { IntroductionsRepository } from './introductions.repository';
import { IntroductionsService } from './introductions.service';
import { MessagesController } from './messages.controller';
import { MessagesRepository } from './messages.repository';
import { MessagesService } from './messages.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappRepository } from './whatsapp.repository';
import { WhatsappService } from './whatsapp.service';

/** Communications hub: introductions, WhatsApp groups & chat, direct messages, emails, notifications, actions, Ask Zola. */
@Module({
  imports: [MembershipModule, SiteModule],
  controllers: [IntroductionsController, WhatsappController, MessagesController, InboxController, ActionsController, ConciergeController],
  providers: [
    IntroductionsService, IntroductionsRepository,
    WhatsappService, WhatsappRepository,
    MessagesService, MessagesRepository,
    InboxService, InboxRepository,
    ActionsService, ActionsRepository,
    ConciergeService, ConciergeRepository,
  ],
  exports: [IntroductionsService, WhatsappService, InboxService, ActionsService],
})
export class CommsModule {}
