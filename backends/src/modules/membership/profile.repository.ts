import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { approvalNotification } from '../../core/notifications/notification-data';
import { PrismaService } from '../../core/prisma/prisma.service';

type Answer = { questionId: string; answer: string };

/** The signed-in member's own profile and profile-revision workflow. */
@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findOwnProfile(memberId: string) {
    return this.prisma.member.findUnique({
      where: { id: memberId },
      include: {
        chapter: true, sector: true, tier: true,
        answers: { include: { question: true } },
        groupMemberships: { where: { status: 'approved' }, include: { group: true } },
        benefitOffers: true,
        articles: { where: PUBLISHED, orderBy: { publishedAt: 'desc' } },
        podcastAppearances: { where: PUBLISHED, orderBy: { number: 'desc' } },
      },
    });
  }

  findPendingRevision(memberId: string) {
    return this.prisma.profileRevision.findFirst({ where: { memberId, status: 'pending' }, orderBy: { createdAt: 'desc' } });
  }

  saveDraft(memberId: string, draft: Prisma.InputJsonValue) {
    return this.prisma.member.update({ where: { id: memberId }, data: { profileDraft: draft } });
  }

  updateProfile(memberId: string, data: Prisma.MemberUncheckedUpdateInput, answers: Answer[] = []) {
    return this.prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data: { ...data, profileDraft: Prisma.DbNull } });
      for (const a of answers) {
        await tx.memberQuestionAnswer.upsert({
          where: { memberId_questionId: { memberId, questionId: a.questionId } },
          update: { answer: a.answer },
          create: { memberId, questionId: a.questionId, answer: a.answer },
        });
      }
    });
  }

  /** Replace any pending revision with a new one and flag the profile as pending review. */
  submitRevision(memberId: string, changes: Prisma.InputJsonValue) {
    return this.prisma.$transaction([
      this.prisma.profileRevision.updateMany({
        where: { memberId, status: 'pending' },
        data: { status: 'rejected', reviewerNote: 'Superseded by a newer submission' },
      }),
      this.prisma.profileRevision.create({ data: { memberId, changes } }),
      // The submission replaces any saved draft.
      this.prisma.member.update({ where: { id: memberId }, data: { profileStatus: 'pending_review', profileDraft: Prisma.DbNull } }),
    ]);
  }

  // ── Admin review
  findRevision(id: string) {
    return this.prisma.profileRevision.findUnique({ where: { id } });
  }

  approveRevision(id: string, memberId: string, changes: Prisma.MemberUncheckedUpdateInput, answers: Answer[]) {
    return this.prisma.$transaction(async (tx) => {
      // A member's first approved profile makes them visible in the directory. Later approvals
      // leave isPublished alone, so a member an admin has hidden stays hidden.
      const firstApproval = (await tx.profileRevision.count({ where: { memberId, status: 'approved' } })) === 0;
      await tx.member.update({
        where: { id: memberId },
        data: { ...changes, profileStatus: 'published', ...(firstApproval && { isPublished: true }) },
      });
      for (const a of answers) {
        await tx.memberQuestionAnswer.upsert({
          where: { memberId_questionId: { memberId, questionId: a.questionId } },
          update: { answer: a.answer },
          create: { memberId, questionId: a.questionId, answer: a.answer },
        });
      }
      await tx.profileRevision.update({ where: { id }, data: { status: 'approved', reviewedAt: new Date() } });
      // Inside the transaction so the member is only notified if the approval commits.
      await tx.notification.create({ data: approvalNotification(memberId, 'Your profile update is live', { link: '/membership/profile' }) });
      return tx.profileRevision.findUnique({ where: { id } });
    });
  }

  rejectRevision(id: string, memberId: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const rev = await tx.profileRevision.update({
        where: { id }, data: { status: 'rejected', reviewerNote: note, reviewedAt: new Date() },
      });
      // Back to the state before submission: live profiles stay live, unpublished ones stay drafts.
      const m = await tx.member.findUniqueOrThrow({ where: { id: memberId }, select: { isPublished: true } });
      await tx.member.update({ where: { id: memberId }, data: { profileStatus: m.isPublished ? 'published' : 'draft' } });
      await tx.notification.create({
        data: approvalNotification(memberId, 'Your profile update needs changes', { body: note, link: '/membership/profile' }),
      });
      return rev;
    });
  }
}
