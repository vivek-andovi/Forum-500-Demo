import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { approvalNotification } from '../../core/notifications/notification-data';
import { PrismaService } from '../../core/prisma/prisma.service';
import { softDelete } from '../../core/prisma/soft-delete';

/** In:Forum: editions, sections, tabs, recommendations, comments and pitches. */
@Injectable()
export class InforumRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublishedEditions() {
    return this.prisma.inforumEdition.findMany({ where: PUBLISHED, orderBy: { publishedOn: 'desc' } });
  }

  /** A published edition with its ordered articles (`slug === undefined` = newest). */
  findPublishedEdition(slug?: string) {
    return this.prisma.inforumEdition.findFirst({
      where: slug ? { slug, ...PUBLISHED } : PUBLISHED,
      orderBy: { publishedOn: 'desc' },
      include: { articles: { orderBy: { sortOrder: 'asc' }, include: { article: { include: { section: true } } } } },
    });
  }

  /** Newest edition limited to articles readable on the public site. */
  findPublicEdition(take = 4) {
    return this.prisma.inforumEdition.findFirst({
      where: PUBLISHED,
      orderBy: { publishedOn: 'desc' },
      include: {
        articles: {
          where: { article: { status: 'published', OR: [{ visibility: 'public' }, { editorsChoice: true }] } },
          orderBy: { sortOrder: 'asc' },
          take,
          include: { article: { omit: { body: true }, include: { section: true } } },
        },
      },
    });
  }

  /** First N articles of the newest edition (dashboard teaser). */
  findLatestEditionArticles(take: number) {
    return this.prisma.inforumEdition.findFirst({
      where: PUBLISHED,
      orderBy: { publishedOn: 'desc' },
      include: { articles: { where: { article: PUBLISHED }, orderBy: { sortOrder: 'asc' }, take, include: { article: { include: { section: true } } } } },
    });
  }

  listSections() {
    return this.prisma.inforumSection.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  findSectionByKey(key: string) {
    return this.prisma.inforumSection.findUnique({ where: { key } });
  }

  findSetting(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  listRecommendations() {
    return this.prisma.recommendation.findMany({ where: PUBLISHED, orderBy: { createdAt: 'asc' } });
  }

  createRecommendation(data: Prisma.RecommendationUncheckedCreateInput) {
    return this.prisma.recommendation.create({ data });
  }

  listTopLevelComments() {
    return this.prisma.comment.findMany({
      where: { ...PUBLISHED, parentId: null, targetType: 'edition' },
      orderBy: { createdAt: 'desc' },
      include: { replies: { where: PUBLISHED, orderBy: { createdAt: 'asc' } } },
    });
  }

  recommendationsBy(memberId: string) {
    return this.prisma.commentRecommend.findMany({ where: { memberId } });
  }

  findPublishedComment(id: string, topLevelOnly = false) {
    return this.prisma.comment.findFirst({ where: { id, ...PUBLISHED, ...(topLevelOnly ? { parentId: null } : {}) } });
  }

  createComment(data: Prisma.CommentUncheckedCreateInput) {
    return this.prisma.comment.create({ data });
  }

  /** Toggle a member's "recommend" on a comment and keep the counter in sync. */
  toggleRecommend(commentId: string, memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.commentRecommend.findUnique({ where: { commentId_memberId: { commentId, memberId } } });
      if (existing) await softDelete(tx, 'CommentRecommend', { id: existing.id });
      // upsert, not create: revives a previously removed recommend (the unique key is still taken)
      else await tx.commentRecommend.upsert({ where: { commentId_memberId: { commentId, memberId } }, update: {}, create: { commentId, memberId } });
      const comment = await tx.comment.update({ where: { id: commentId }, data: { recommends: { increment: existing ? -1 : 1 } } });
      return { recommended: !existing, recommends: comment.recommends };
    });
  }

  createPitch(data: Prisma.PitchUncheckedCreateInput) {
    return this.prisma.pitch.create({ data });
  }

  // ── Admin pitch decisions
  findPitchWithMember(id: string) {
    return this.prisma.pitch.findUnique({ where: { id }, include: { member: true } });
  }

  /** Accept: create a draft article from the pitch, link it and notify the author. */
  acceptPitch(id: string, article: Prisma.ArticleUncheckedCreateInput, notifyMemberId: string | null, headline: string) {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.article.create({ data: article });
      const pitch = await tx.pitch.update({ where: { id }, data: { status: 'approved', articleId: created.id } });
      if (notifyMemberId) {
        // Inside the transaction (not NotificationsService) so it commits with the decision.
        await tx.notification.create({ data: approvalNotification(notifyMemberId, `Your pitch "${headline}" was accepted`) });
      }
      return { pitch, article: created };
    });
  }

  declinePitch(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const pitch = await tx.pitch.update({ where: { id }, data: { status: 'rejected' } });
      if (pitch.memberId) {
        await tx.notification.create({
          data: approvalNotification(pitch.memberId, `Your pitch “${pitch.headline}” was not accepted this time`),
        });
      }
      return pitch;
    });
  }
}
