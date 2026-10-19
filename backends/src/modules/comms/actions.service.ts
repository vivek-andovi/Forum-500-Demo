import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../../core/auth/decorators';
import { NO_MEMBER, requireMember } from '../../core/common/member-context';
import { ActionsRepository } from './actions.repository';

@Injectable()
export class ActionsService {
  constructor(private readonly repo: ActionsRepository) {}

  async pending(user: AuthUser) {
    const memberId = user.memberId ?? NO_MEMBER;
    const [pending, completed] = await Promise.all([this.repo.listPending(memberId), this.repo.completedTitles(memberId)]);
    // Hide global actions this member already completed (stored as a personal completed copy).
    const done = new Set(completed.map((c) => c.title));
    return pending.filter((a) => a.memberId || !done.has(a.title));
  }

  async complete(user: AuthUser, id: string) {
    const memberId = requireMember(user);
    const action = await this.repo.findById(id);
    if (!action || (action.memberId && action.memberId !== memberId)) throw new NotFoundException('Action not found');
    return action.memberId ? this.repo.complete(id) : this.repo.completeGlobalFor(action, memberId);
  }
}
