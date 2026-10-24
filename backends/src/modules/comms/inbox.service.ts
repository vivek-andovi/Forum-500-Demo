import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { NO_MEMBER } from '../../core/common/member-context';
import { InboxRepository } from './inbox.repository';

type ListedEmail = Awaited<ReturnType<InboxRepository['listEmails']>>[number];

/**
 * Unread only when this member has a delivery row they haven't opened. Campaigns sent to
 * everyone (no delivery rows, e.g. the imported newsletter archive) count as read.
 */
const withUnread = ({ deliveries, ...c }: ListedEmail) => ({ ...c, unread: !!deliveries[0] && !deliveries[0].openedAt });

@Injectable()
export class InboxService {
  constructor(private readonly repo: InboxRepository) {}

  async emails(user: AuthUser) {
    return (await this.repo.listEmails(user.memberId ?? NO_MEMBER)).map(withUnread);
  }

  /** One email with its full content; opening it marks this member's delivery as read. */
  async email(user: AuthUser, id: string) {
    const memberId = user.memberId ?? NO_MEMBER;
    const email = await this.repo.findEmail(id, memberId);
    if (!email) throw new NotFoundException('Email not found');
    if (user.memberId) await this.repo.markEmailOpened(id, user.memberId);
    return { ...email, unread: false };
  }

  notifications(user: AuthUser) {
    return this.repo.listNotifications(user.memberId ?? NO_MEMBER);
  }

  async markRead(user: AuthUser, id: string) {
    await this.repo.markNotificationRead(id, user.memberId ?? NO_MEMBER);
    return { ok: true };
  }

  // ── Reads used by other modules (e.g. the dashboard)

  /** Latest email campaigns for a member (dashboard teaser), list fields only. */
  async recentEmails(memberId: string, take: number) {
    return (await this.repo.listEmails(memberId, take)).map(withUnread);
  }
}
