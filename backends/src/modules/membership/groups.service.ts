import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { uniqueSlug } from '../../core/common/util';
import { GroupsRepository } from './groups.repository';

export const GroupProposalSchema = z.object({
  name: z.string().min(1).max(120),
  purpose: z.string().min(1).max(2000),
  cadence: z.string().max(200).optional(),
  members: z.string().max(2000).optional(),
});

const withCount = <T extends { _count: { memberships: number } }>({ _count, ...g }: T) => ({ ...g, memberCount: _count.memberships });

@Injectable()
export class GroupsService {
  constructor(private readonly repo: GroupsRepository) {}

  async list(user: AuthUser) {
    const [groups, mine, myProposals] = await Promise.all([
      this.repo.listPublishedWithCounts(),
      user.memberId ? this.repo.membershipsOf(user.memberId) : [],
      user.memberId ? this.repo.proposalsBy(user.memberId) : [],
    ]);
    const statusByGroup = new Map(mine.map((m) => [m.groupId, m.status]));
    return {
      groups: groups.map((g) => ({ ...withCount(g), myStatus: statusByGroup.get(g.id) ?? null })),
      myProposals,
    };
  }

  async joined(memberId: string) {
    return (await this.repo.listJoinedWithCounts(memberId)).map(withCount);
  }

  async join(user: AuthUser, groupId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findPublished(groupId))) throw new NotFoundException('Group not found');
    const existing = await this.repo.findMembership(groupId, memberId);
    if (existing?.status === 'approved') throw new BadRequestException('You are already in this group');
    return this.repo.requestJoin(groupId, memberId);
  }

  async leave(user: AuthUser, groupId: string) {
    await this.repo.leave(groupId, requireMember(user));
    return { ok: true };
  }

  propose(user: AuthUser, input: z.infer<typeof GroupProposalSchema>) {
    return this.repo.createProposal(
      {
        slug: uniqueSlug(input.name),
        name: input.name,
        purpose: input.purpose,
        note: input.purpose.slice(0, 160),
        cadence: input.cadence,
        status: 'in_review',
      },
      requireMember(user),
    );
  }
}
