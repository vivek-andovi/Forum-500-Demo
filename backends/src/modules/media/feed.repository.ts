import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PUBLISHED } from '../../core/common/member-context';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class FeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.feedPost.findMany({ where: PUBLISHED, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] });
  }

  likesBy(memberId: string) {
    return this.prisma.feedLike.findMany({ where: { memberId } });
  }

  findPublished(id: string) {
    return this.prisma.feedPost.findFirst({ where: { id, ...PUBLISHED } });
  }

  create(data: Prisma.FeedPostUncheckedCreateInput) {
    return this.prisma.feedPost.create({ data });
  }

  /** Toggle a like and keep the counter in sync. */
  toggleLike(postId: string, memberId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.feedLike.findUnique({ where: { postId_memberId: { postId, memberId } } });
      if (existing) await tx.feedLike.delete({ where: { id: existing.id } });
      else await tx.feedLike.create({ data: { postId, memberId } });
      const post = await tx.feedPost.update({ where: { id: postId }, data: { likes: { increment: existing ? -1 : 1 } } });
      return { liked: !existing, likes: post.likes };
    });
  }
}
