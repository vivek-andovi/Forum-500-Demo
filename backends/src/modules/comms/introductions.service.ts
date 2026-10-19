import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { MembersRepository } from '../membership/members.repository';
import { IntroductionsRepository } from './introductions.repository';

export const IntroSchema = z.object({ targetMemberId: z.string().uuid(), reason: z.string().min(1).max(1000) });
export const RespondSchema = z.object({ accept: z.boolean() });

@Injectable()
export class IntroductionsService {
  constructor(
    private readonly repo: IntroductionsRepository,
    private readonly members: MembersRepository,
  ) {}

  list(user: AuthUser) {
    return this.repo.listFor(requireMember(user));
  }

  async request(user: AuthUser, input: z.infer<typeof IntroSchema>) {
    const memberId = requireMember(user);
    if (input.targetMemberId === memberId) throw new BadRequestException('You cannot request an intro to yourself');
    if (!(await this.members.findPublishedById(input.targetMemberId))) throw new NotFoundException('Member not found');
    if (await this.repo.findOpen(memberId, input.targetMemberId)) {
      throw new BadRequestException('You already have an open introduction request with this member');
    }
    return this.repo.create(memberId, input.targetMemberId, input.reason);
  }

  async respond(user: AuthUser, id: string, accept: boolean) {
    const memberId = requireMember(user);
    const intro = await this.repo.findById(id);
    if (!intro) throw new NotFoundException('Introduction not found');
    if (intro.targetId !== memberId) throw new ForbiddenException('Only the introduced member can respond');
    if (!['requested', 'pending'].includes(intro.status)) throw new BadRequestException('This introduction was already answered');
    return this.repo.respond(id, accept);
  }
}
