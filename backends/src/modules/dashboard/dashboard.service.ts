import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { ActionsService } from '../comms/actions.service';
import { InboxService } from '../comms/inbox.service';
import { IntroductionsService } from '../comms/introductions.service';
import { WhatsappService } from '../comms/whatsapp.service';
import { EventsService } from '../events/events.service';
import { InforumService } from '../media/inforum.service';
import { PublicationsService } from '../media/publications.service';
import { BenefitsService } from '../membership/benefits.service';
import { GroupsService } from '../membership/groups.service';
import { MembersService } from '../membership/members.service';

/** Member dashboard: composes data from every hub, always through that hub's exported services. */
@Injectable()
export class DashboardService {
  constructor(
    private readonly members: MembersService,
    private readonly events: EventsService,
    private readonly benefits: BenefitsService,
    private readonly groups: GroupsService,
    private readonly publications: PublicationsService,
    private readonly inforum: InforumService,
    private readonly whatsapp: WhatsappService,
    private readonly intros: IntroductionsService,
    private readonly actions: ActionsService,
    private readonly inbox: InboxService,
  ) {}

  async forMember(user: AuthUser) {
    const memberId = user.memberId;
    const [
      member, upcomingEvents, attending, hosting, newMembers, featuredOffers, myOffers, myGroups,
      memberArticles, podcasts, inforumArticles, whatsappGroups, introductions, actions, emails,
    ] = await Promise.all([
      memberId ? this.members.findById(memberId) : null,
      this.events.upcoming(6),
      memberId ? this.events.attendingWithHosts(memberId) : [],
      memberId ? this.events.hostingIncludingReview(memberId) : [],
      this.members.newMembers(),
      this.benefits.featured(),
      memberId ? this.benefits.optedIn(memberId) : [],
      memberId ? this.groups.joined(memberId) : [],
      this.publications.latestArticles('member', 6),
      this.publications.latestPodcasts(6),
      this.inforum.latestArticles(6),
      memberId ? this.whatsapp.joinedGroups(memberId) : [],
      memberId ? this.intros.recentFor(memberId, 5) : [],
      this.actions.pendingForDashboard(memberId),
      memberId ? this.inbox.recentEmails(memberId, 5) : [],
    ]);
    return {
      member, upcomingEvents, attending, hosting, newMembers, featuredOffers, myOffers, myGroups,
      memberArticles, podcasts, inforumArticles, whatsappGroups, introductions, actions, emails,
    };
  }
}
