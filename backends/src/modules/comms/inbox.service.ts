import { Injectable } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { NO_MEMBER } from '../../core/common/member-context';
import { InboxRepository } from './inbox.repository';

@Injectable()
export class InboxService {
  constructor(private readonly repo: InboxRepository) {}

  async emails(user: AuthUser) {
    const campaigns = await this.repo.listEmails(user.memberId ?? NO_MEMBER);
    return campaigns.map(({ deliveries, ...c }) => ({ ...c, unread: !deliveries[0]?.openedAt }));
  }

  notifications(user: AuthUser) {
    return this.repo.listNotifications(user.memberId ?? NO_MEMBER);
  }

  async markRead(user: AuthUser, id: string) {
    await this.repo.markNotificationRead(id, user.memberId ?? NO_MEMBER);
    return { ok: true };
  }
}
