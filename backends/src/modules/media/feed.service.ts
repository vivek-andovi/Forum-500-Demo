import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { httpUrl } from '../../core/common/util';
import { MembersService } from '../membership/members.service';
import { FeedRepository } from './feed.repository';

export const FeedPostSchema = z.object({ body: z.string().trim().min(1).max(2000), imageUrl: httpUrl().optional() });

@Injectable()
export class FeedService {
  constructor(
    private readonly repo: FeedRepository,
    private readonly members: MembersService,
  ) {}

  async list(user: AuthUser) {
    const [posts, likes] = await Promise.all([this.repo.listPublished(), user.memberId ? this.repo.likesBy(user.memberId) : []]);
    return { posts, likedIds: likes.map((l) => l.postId) };
  }

  async post(user: AuthUser, input: z.infer<typeof FeedPostSchema>) {
    const memberId = requireMember(user);
    const m = await this.members.findAuthor(memberId);
    return this.repo.create({
      ...input, memberId, authorName: m.fullName, authorPhotoUrl: m.avatarUrl,
      authorMeta: [[m.headline, m.company].filter(Boolean).join(', '), m.chapter?.name].filter(Boolean).join(' · '),
      status: 'in_review',
    });
  }

  async like(user: AuthUser, postId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findPublished(postId))) throw new NotFoundException('Post not found');
    return this.repo.toggleLike(postId, memberId);
  }
}
