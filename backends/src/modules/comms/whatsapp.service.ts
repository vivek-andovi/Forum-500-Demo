import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { MembersService } from '../membership/members.service';
import { SiteService } from '../site/site.service';
import { WhatsappRepository } from './whatsapp.repository';

export const ChatMessageSchema = z.object({ body: z.string().trim().min(1).max(2000) });

@Injectable()
export class WhatsappService {
  constructor(
    private readonly repo: WhatsappRepository,
    private readonly members: MembersService,
    private readonly site: SiteService,
  ) {}

  /**
   * All groups. Invite links appear on the member's approved memberships, or on every group
   * when the `whatsappOpenAccess` feature is on (members of the old site could join any group).
   */
  async overview(user: AuthUser) {
    const { whatsappOpenAccess } = await this.site.features();
    const [groups, memberships] = await Promise.all([
      this.repo.listActiveGroups(whatsappOpenAccess && !!user.memberId),
      user.memberId ? this.repo.membershipsOf(user.memberId) : [],
    ]);
    const showLink = (status: string) => whatsappOpenAccess || status === 'approved';
    return {
      groups,
      openAccess: whatsappOpenAccess,
      memberships: memberships.map((m) => ({ ...m, group: { ...m.group, inviteLink: showLink(m.status) ? m.group.inviteLink : null } })),
    };
  }

  async join(user: AuthUser, groupId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findActiveGroup(groupId))) throw new NotFoundException('Group not found');
    const existing = await this.repo.findMembership(groupId, memberId);
    if (existing?.status === 'approved') throw new BadRequestException('You are already in this group');
    return this.repo.requestJoin(groupId, memberId);
  }

  private async requireApproved(user: AuthUser, groupId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findActiveGroup(groupId))) throw new NotFoundException('Group not found');
    const membership = await this.repo.findMembership(groupId, memberId);
    if (membership?.status !== 'approved') throw new ForbiddenException('Join this group to see and post messages');
    return memberId;
  }

  /** Group chat (oldest first) for approved members. */
  async messages(user: AuthUser, groupId: string) {
    const memberId = await this.requireApproved(user, groupId);
    const rows = await this.repo.listMessages(groupId);
    return rows.reverse().map(({ member, ...m }) => ({ ...m, authorSlug: member?.slug ?? null, authorPhotoUrl: member?.avatarUrl ?? null, mine: m.memberId === memberId }));
  }

  async post(user: AuthUser, groupId: string, body: string) {
    const memberId = await this.requireApproved(user, groupId);
    const author = await this.members.findAuthor(memberId);
    const message = await this.repo.createMessage(groupId, memberId, author.fullName, body);
    return { ...message, authorSlug: author.slug, authorPhotoUrl: author.avatarUrl, mine: true };
  }

  // ── Reads used by other modules (e.g. the dashboard)

  joinedGroups(memberId: string) {
    return this.repo.listJoinedGroups(memberId);
  }
}
