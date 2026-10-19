import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { ActionsRepository } from '../comms/actions.repository';
import { InboxRepository } from '../comms/inbox.repository';
import { IntroductionsRepository } from '../comms/introductions.repository';
import { WhatsappRepository } from '../comms/whatsapp.repository';
import { EventsRepository } from '../events/events.repository';
import { InforumService } from '../media/inforum.service';
import { PublicationsRepository } from '../media/publications.repository';
import { BenefitsRepository } from '../membership/benefits.repository';
import { GroupsService } from '../membership/groups.service';
import { MembersRepository } from '../membership/members.repository';

/** Member dashboard: composes data from every hub (each via its own repository/service). */
@Injectable()
export class DashboardService {
  constructor(
    private readonly members: MembersRepository,
    private readonly events: EventsRepository,
    private readonly benefits: BenefitsRepository,
    private readonly groups: GroupsService,
    private readonly publications: PublicationsRepository,
    private readonly inforum: InforumService,
    private readonly whatsapp: WhatsappRepository,
    private readonly intros: IntroductionsRepository,
    private readonly actions: ActionsRepository,
    private readonly inbox: InboxRepository,
  ) {}

  async forMember(user: AuthUser) {
    const memberId = user.memberId;
    const [
      member, upcomingEvents, attending, hosting, newMembers, featuredOffers, myOffers, myGroups,
      memberArticles, podcasts, inforumArticles, whatsappGroups, introductions, actions, emails,
    ] = await Promise.all([
      memberId ? this.members.findById(memberId) : null,
      this.events.listUpcoming(6),
      memberId ? this.events.listAttendingWithHosts(memberId) : [],
      memberId ? this.events.listHostingIncludingReview(memberId) : [],
      this.members.listFeaturedNew(),
      this.benefits.listFeatured(),
      memberId ? this.benefits.listOptedIn(memberId) : [],
      memberId ? this.groups.joined(memberId) : [],
      this.publications.listArticles('member', 6),
      this.publications.listPodcasts(6),
      this.inforum.latestArticles(6),
      memberId ? this.whatsapp.listJoinedGroups(memberId) : [],
      memberId ? this.intros.listFor(memberId, 5, false) : [],
      this.actions.listPendingForDashboard(memberId),
      this.inbox.listSentCampaigns(5),
    ]);
    return {
      member, upcomingEvents, attending, hosting, newMembers, featuredOffers, myOffers, myGroups,
      memberArticles, podcasts, inforumArticles, whatsappGroups, introductions, actions, emails,
    };
  }
}
