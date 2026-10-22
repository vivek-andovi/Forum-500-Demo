import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Emails received and in-app notifications. */
@Injectable()
export class InboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Sent campaigns addressed to everyone (no delivery rows) or to this member. */
  listEmails(memberId: string, take?: number) {
    return this.prisma.emailCampaign.findMany({
      where: { status: 'sent', OR: [{ deliveries: { none: {} } }, { deliveries: { some: { memberId } } }] },
      orderBy: { sentAt: 'desc' },
      include: { deliveries: { where: { memberId } } },
      take,
    });
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
