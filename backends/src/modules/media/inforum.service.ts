import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PitchFormat, RecommendationCategory } from '@prisma/client';
import { z } from 'zod';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { uniqueSlug } from '../../core/common/util';
import { MembersService } from '../membership/members.service';
import { InforumRepository } from './inforum.repository';

export const CommentSchema = z.object({ body: z.string().trim().min(1).max(400), parentId: z.string().uuid().optional() });
export const PitchSchema = z.object({
  headline: z.string().min(1).max(120),
  synopsis: z.string().min(1).max(800),
  section: z.string().min(1).max(60),
  format: z.nativeEnum(PitchFormat).default('article'),
  dateline: z.string().max(80).optional(),
  notes: z.string().max(600).optional(),
});
export const RecommendationSchema = z.object({
  category: z.nativeEnum(RecommendationCategory),
  title: z.string().min(1).max(200),
  place: z.string().max(200).optional(),
  note: z.string().max(1000).optional(),
});

/** Editorial tabs shown before the section tabs (editable in admin: Settings → inforum_tabs). */
const DEFAULT_FIXED_TABS = [
  { id: 'editors-choice', label: "Editor's Choice" },
  { id: 'around-the-world', label: 'From Around the World' },
  { id: 'by-members', label: 'Articles by Members' },
  { id: 'recommendations', label: 'Member Recommendations' },
  { id: 'comments', label: 'Comments' },
];

@Injectable()
export class InforumService {
  constructor(
    private readonly repo: InforumRepository,
    private readonly members: MembersService,
    private readonly audit: AuditService,
  ) {}

  editions() {
    return this.repo.listPublishedEditions();
  }

  async edition(slug: string) {
    const edition = await this.repo.findPublishedEdition(slug === 'current' ? undefined : slug);
    if (!edition) throw new NotFoundException('Edition not found');
    const { articles, ...rest } = edition;
    return { ...rest, articles: articles.map((ea) => ea.article).filter((a) => a.status === 'published') };
  }

  async publicEdition() {
    const edition = await this.repo.findPublicEdition();
    if (!edition) throw new NotFoundException('No published edition');
    const { articles, ...rest } = edition;
    return { ...rest, articles: articles.map((ea) => ea.article) };
  }

  async latestArticles(take: number) {
    const edition = await this.repo.findLatestEditionArticles(take);
    return (edition?.articles ?? []).map((ea) => ea.article);
  }

  sections() {
    return this.repo.listSections();
  }

  /** Tabs for the In:Forum page: editorial tabs, then one tab per real section. */
  async tabs() {
    const [setting, sections] = await Promise.all([this.repo.findSetting('inforum_tabs'), this.repo.listSections()]);
    const fixed = Array.isArray(setting?.value) ? (setting!.value as { id: string; label: string }[]) : DEFAULT_FIXED_TABS;
    const fixedIds = new Set(fixed.map((t) => t.id));
    return [
      ...fixed.map((t) => ({ ...t, type: 'editorial' as const })),
      ...sections.filter((s) => !fixedIds.has(s.key)).map((s) => ({ id: `section:${s.key}`, label: s.label, type: 'section' as const, sectionKey: s.key })),
    ];
  }

  recommendations() {
    return this.repo.listRecommendations();
  }

  async addRecommendation(user: AuthUser, input: z.infer<typeof RecommendationSchema>) {
    const memberId = requireMember(user);
    const m = await this.members.findAuthor(memberId);
    return this.repo.createRecommendation({
      ...input, memberId, memberName: m.fullName, memberPhotoUrl: m.avatarUrl, memberChapter: m.chapter?.name, status: 'in_review',
    });
  }

  async comments(user: AuthUser) {
    const [comments, recs] = await Promise.all([
      this.repo.listTopLevelComments(),
      user.memberId ? this.repo.recommendationsBy(user.memberId) : [],
    ]);
    return { comments, recommendedIds: recs.map((r) => r.commentId) };
  }

  async addComment(user: AuthUser, input: z.infer<typeof CommentSchema>) {
    const memberId = requireMember(user);
    if (input.parentId && !(await this.repo.findPublishedComment(input.parentId, true))) {
      throw new NotFoundException('The comment you are replying to does not exist');
    }
    const m = await this.members.findAuthor(memberId);
    return this.repo.createComment({
      body: input.body, parentId: input.parentId, targetType: 'edition', memberId,
      memberName: m.fullName, memberPhotoUrl: m.avatarUrl, memberChapter: m.chapter?.name, status: 'in_review',
    });
  }

  async recommend(user: AuthUser, commentId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findPublishedComment(commentId))) throw new NotFoundException('Comment not found');
    return this.repo.toggleRecommend(commentId, memberId);
  }

  pitch(user: AuthUser, input: z.infer<typeof PitchSchema>) {
    return this.repo.createPitch({ ...input, memberId: requireMember(user) });
  }

  // ── Admin decisions

  async acceptPitch(id: string, actor: Actor) {
    const pitch = await this.repo.findPitchWithMember(id);
    if (!pitch) throw new NotFoundException('Pitch not found');
    if (pitch.status !== 'pending') throw new BadRequestException('Pitch already decided');
    const section = await this.repo.findSectionByKey(pitch.section);
    const result = await this.repo.acceptPitch(
      id,
      {
        slug: uniqueSlug(pitch.headline),
        publication: pitch.format === 'forecast' ? 'forecast' : 'inforum',
        title: pitch.headline,
        standfirst: pitch.synopsis,
        sectionId: section?.id,
        authorMemberId: pitch.memberId,
        authorName: pitch.member?.fullName ?? 'Member contributor',
        authorRole: 'Member contributor',
        authorPhotoUrl: pitch.member?.avatarUrl,
        isMember: !!pitch.memberId,
        fromAroundWorld: pitch.section === 'around-the-world',
        dateline: pitch.dateline,
        status: 'draft',
      },
      pitch.memberId,
      pitch.headline,
    );
    await this.audit.log(actor, {
      action: 'accept', entity: 'pitches', entityType: 'Pitch', entityId: id, entityLabel: pitch.headline,
      summary: `Accepted pitch “${pitch.headline}” — created draft article`,
    });
    return result;
  }

  async declinePitch(id: string, actor: Actor) {
    const existing = await this.repo.findPitchWithMember(id);
    if (!existing) throw new NotFoundException('Pitch not found');
    if (existing.status !== 'pending') throw new BadRequestException('Pitch already decided');
    const pitch = await this.repo.declinePitch(id);
    await this.audit.log(actor, { action: 'decline', entity: 'pitches', entityType: 'Pitch', entityId: id, entityLabel: pitch.headline });
    return pitch;
  }
}
