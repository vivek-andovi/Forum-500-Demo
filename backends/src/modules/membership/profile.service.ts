import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { httpUrl } from '../../core/common/util';
import { MembersRepository } from './members.repository';
import { ProfileRepository } from './profile.repository';

export const ProfileSchema = z
  .object({
    fullName: z.string().min(1).max(120).optional(),
    headline: z.string().max(200).nullish(),
    company: z.string().max(200).nullish(),
    bio: z.string().max(5000).nullish(),
    avatarUrl: httpUrl().or(z.literal('')).nullish().transform((v) => v || null),
    linkedinUrl: httpUrl(500).or(z.literal('')).nullish().transform((v) => v || null),
    interests: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    travelCities: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
    joinedYear: z.number().int().min(1900).max(2100).nullish(),
    chapterId: z.string().uuid().nullish(),
    sectorId: z.string().uuid().nullish(),
    answers: z.array(z.object({ questionId: z.string().uuid(), answer: z.string().max(2000) })).max(20).optional(),
  })
  .strict();
export type ProfileInput = z.infer<typeof ProfileSchema>;

@Injectable()
export class ProfileService {
  constructor(
    private readonly repo: ProfileRepository,
    private readonly members: MembersRepository,
    private readonly audit: AuditService,
  ) {}

  async me(user: AuthUser) {
    const [member, pendingRevision] = user.memberId
      ? await Promise.all([this.repo.findOwnProfile(user.memberId), this.repo.findPendingRevision(user.memberId)])
      : [null, null];
    return { user: { id: user.id, email: user.email, role: user.role }, member, pendingRevision };
  }

  /**
   * "Save draft". A member who is not in the directory yet (new, never approved) edits their
   * profile directly — nobody else can see it. A published member's edits are parked in
   * `profileDraft` and only go live through submitForReview + admin approval.
   */
  async saveDraft(user: AuthUser, input: ProfileInput) {
    const memberId = requireMember(user);
    const member = await this.members.findById(memberId);
    if (!member) throw new NotFoundException('Member profile not found');
    if (member.isPublished) {
      await this.repo.saveDraft(memberId, input as Prisma.InputJsonValue);
    } else {
      const { answers, ...data } = input;
      await this.repo.updateProfile(memberId, data, answers);
    }
    return this.me(user);
  }

  async submitForReview(user: AuthUser, input: ProfileInput) {
    await this.repo.submitRevision(requireMember(user), input as Prisma.InputJsonValue);
    return this.me(user);
  }

  // ── Admin review

  async approveRevision(id: string, actor: Actor) {
    const rev = await this.repo.findRevision(id);
    if (!rev) throw new NotFoundException('Revision not found');
    if (rev.status !== 'pending') throw new BadRequestException('Revision already reviewed');
    const { answers, ...changes } = (rev.changes ?? {}) as Record<string, any>;
    const result = await this.repo.approveRevision(id, rev.memberId, changes, answers ?? []);
    const member = await this.members.findById(rev.memberId);
    await this.audit.log(actor, {
      action: 'approve', entity: 'profile-revisions', entityType: 'Profile Review', entityId: id, entityLabel: member?.fullName,
      summary: `Approved profile update for “${member?.fullName}” — ${Object.keys(changes).concat(answers?.length ? ['answers'] : []).join(', ')}`,
      before: {}, after: changes,
    });
    return result;
  }

  async rejectRevision(id: string, note: string | undefined, actor: Actor) {
    const existing = await this.repo.findRevision(id);
    if (!existing) throw new NotFoundException('Revision not found');
    if (existing.status !== 'pending') throw new BadRequestException('Revision already reviewed');
    const rev = await this.repo.rejectRevision(id, existing.memberId, note);
    const member = await this.members.findById(existing.memberId);
    await this.audit.log(actor, {
      action: 'reject', entity: 'profile-revisions', entityType: 'Profile Review', entityId: id, entityLabel: member?.fullName,
      summary: `Rejected profile update for “${member?.fullName}”${note ? ` — ${note}` : ''}`,
    });
    return rev;
  }
}
