import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Each moderation queue: which model/status counts as "waiting for an admin". */
export const APPROVAL_QUEUES = [
  { key: 'applications', label: 'Membership applications', resource: 'applications', model: 'application', filter: { status: 'new' } },
  { key: 'profile-revisions', label: 'Profile updates to review', resource: 'profile-revisions', model: 'profileRevision', filter: { status: 'pending' } },
  { key: 'event-proposals', label: 'Member event proposals', resource: 'events', model: 'event', filter: { status: 'in_review' } },
  { key: 'benefit-offers', label: 'Benefit offers submitted', resource: 'benefit-offers', model: 'benefitOffer', filter: { status: 'in_review' } },
  { key: 'group-proposals', label: 'Group proposals', resource: 'groups', model: 'group', filter: { status: 'in_review' } },
  { key: 'group-joins', label: 'Group join requests', resource: 'group-memberships', model: 'groupMembership', filter: { status: 'requested' } },
  { key: 'whatsapp-joins', label: 'WhatsApp join requests', resource: 'whatsapp-memberships', model: 'whatsappMembership', filter: { status: 'requested' } },
  { key: 'pitches', label: 'Article pitches', resource: 'pitches', model: 'pitch', filter: { status: 'pending' } },
  { key: 'comments', label: 'Comments to moderate', resource: 'comments', model: 'comment', filter: { status: 'in_review' } },
  { key: 'feed-posts', label: 'Newsfeed posts to moderate', resource: 'feed-posts', model: 'feedPost', filter: { status: 'in_review' } },
  { key: 'recommendations', label: 'Member recommendations', resource: 'recommendations', model: 'recommendation', filter: { status: 'in_review' } },
  { key: 'introductions', label: 'Introduction requests', resource: 'introductions', model: 'introduction', filter: { status: 'requested' } },
  { key: 'concierge', label: 'Ask Zola requests', resource: 'concierge-requests', model: 'conciergeRequest', filter: { status: 'open' } },
] as const;

@Injectable()
export class AdminDashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  countQueue(model: string, where: Record<string, unknown>): Promise<number> {
    return (this.prisma as any)[model].count({ where });
  }

  counts() {
    const now = new Date();
    return Promise.all([
      this.prisma.member.count(),
      this.prisma.member.count({ where: { isPublished: true } }),
      this.prisma.event.count({ where: { startsAt: { gte: now }, status: 'published' } }),
      this.prisma.application.count({ where: { status: 'new' } }),
      this.prisma.eventRsvp.count({ where: { status: 'confirmed' } }),
      this.prisma.benefitOffer.count({ where: { status: 'published' } }),
      this.prisma.article.count({ where: { status: 'published' } }),
      this.prisma.group.count({ where: { status: 'published' } }),
    ]).then(([members, publishedMembers, upcomingEvents, applicationsNew, rsvps, benefitOffers, articles, groups]) => ({
      members, publishedMembers, upcomingEvents, applicationsNew, rsvps, benefitOffers, articles, groups,
    }));
  }

  upcomingEvents(take: number) {
    return this.prisma.event.findMany({
      where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: 'asc' }, take, include: { _count: { select: { rsvps: true } } },
    });
  }

  recentApplications(take: number) {
    return this.prisma.application.findMany({ orderBy: { createdAt: 'desc' }, take });
  }
}
