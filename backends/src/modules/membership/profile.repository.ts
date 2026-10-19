import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
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

  updateProfile(memberId: string, data: Prisma.MemberUncheckedUpdateInput, answers: Answer[] = []) {
    return this.prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data });
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
      this.prisma.member.update({ where: { id: memberId }, data: { profileStatus: 'pending_review' } }),
    ]);
  }

  // ── Admin review
  findRevision(id: string) {
    return this.prisma.profileRevision.findUnique({ where: { id } });
  }

  approveRevision(id: string, memberId: string, changes: Prisma.MemberUncheckedUpdateInput, answers: Answer[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data: { ...changes, isPublished: true, profileStatus: 'published' } });
      for (const a of answers) {
        await tx.memberQuestionAnswer.upsert({
          where: { memberId_questionId: { memberId, questionId: a.questionId } },
          update: { answer: a.answer },
          create: { memberId, questionId: a.questionId, answer: a.answer },
        });
      }
      await tx.profileRevision.update({ where: { id }, data: { status: 'approved', reviewedAt: new Date() } });
      await tx.notification.create({
        data: { memberId, type: 'approval', title: 'Your profile update is live', link: '/membership/profile' },
      });
      return tx.profileRevision.findUnique({ where: { id } });
    });
  }

  rejectRevision(id: string, memberId: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const rev = await tx.profileRevision.update({
        where: { id }, data: { status: 'rejected', reviewerNote: note, reviewedAt: new Date() },
      });
      await tx.member.update({ where: { id: memberId }, data: { profileStatus: 'published' } });
      await tx.notification.create({
        data: { memberId, type: 'approval', title: 'Your profile update needs changes', body: note, link: '/membership/profile' },
      });
      return rev;
    });
  }
}
