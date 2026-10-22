import { Injectable } from '@nestjs/common';
import { approvalNotification } from './notification-data';
import { NotificationsRepository } from './notifications.repository';

/**
 * Creates in-app notifications for members. Writes that must be atomic with another change
 * stay inside that repository's Prisma transaction and use `approvalNotification()` directly
 * (see notification-data.ts).
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly repo: NotificationsRepository) {}

  /** Tell a member an admin decided on something they submitted. */
  async notifyApproval(memberId: string, title: string, extra: { body?: string | null; link?: string } = {}) {
    await this.repo.create(approvalNotification(memberId, title, extra));
  }
}
