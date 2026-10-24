import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/** List columns only: an imported newsletter's `html` can be hundreds of KB, so it is loaded one email at a time. */
const EMAIL_LIST_FIELDS = {
  id: true, subject: true, senderLabel: true, preview: true, status: true,
  scheduledAt: true, sentAt: true, createdAt: true, updatedAt: true,
} as const;

/** Sent campaigns addressed to everyone (no delivery rows) or to this member. */
const visibleTo = (memberId: string) => ({
  status: 'sent' as const,
  OR: [{ deliveries: { none: {} } }, { deliveries: { some: { memberId } } }],
});

/** Emails received and in-app notifications. */
@Injectable()
export class InboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  listEmails(memberId: string, take?: number) {
    return this.prisma.emailCampaign.findMany({
      where: visibleTo(memberId),
      orderBy: { sentAt: 'desc' },
      select: { ...EMAIL_LIST_FIELDS, deliveries: { where: { memberId }, select: { openedAt: true } } },
      take,
    });
  }

  findEmail(id: string, memberId: string) {
    return this.prisma.emailCampaign.findFirst({
      where: { id, ...visibleTo(memberId) },
      select: { ...EMAIL_LIST_FIELDS, body: true, html: true },
    });
  }

  markEmailOpened(campaignId: string, memberId: string) {
    return this.prisma.emailDelivery.updateMany({ where: { campaignId, memberId, openedAt: null }, data: { openedAt: new Date() } });
  }

  listNotifications(memberId: string) {
    return this.prisma.notification.findMany({
      where: { OR: [{ memberId }, { memberId: null }] }, orderBy: { createdAt: 'desc' }, take: 100,
    });
  }

  markNotificationRead(id: string, memberId: string) {
    return this.prisma.notification.updateMany({ where: { id, memberId }, data: { readAt: new Date() } });
  }
}
