import { Injectable, NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { uniqueSlug } from '../../core/common/util';
import { BenefitsRepository } from './benefits.repository';
import { MembersRepository } from './members.repository';

export const OfferSubmissionSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  offer: z.string().min(1).max(300),
  about: z.string().max(3000).optional(),
  detail: z.string().max(3000).optional(),
  howToRedeem: z.string().max(3000).optional(),
});

@Injectable()
export class BenefitsService {
  constructor(
    private readonly repo: BenefitsRepository,
    private readonly members: MembersRepository,
  ) {}

  async list(user: AuthUser) {
    const [offers, optIns, mySubmissions] = await Promise.all([
      this.repo.listPublished(),
      user.memberId ? this.repo.optInsFor(user.memberId) : [],
      user.memberId ? this.repo.submissionsBy(user.memberId) : [],
    ]);
    return {
      memberOffers: offers.filter((o) => o.kind === 'member'),
      partnerOffers: offers.filter((o) => o.kind === 'partner'),
      optedInIds: optIns.map((o) => o.offerId),
      mySubmissions,
    };
  }

  async optIn(user: AuthUser, offerId: string) {
    const memberId = requireMember(user);
    if (!(await this.repo.findPublished(offerId))) throw new NotFoundException('Benefit not found');
    await this.repo.optIn(memberId, offerId);
    return { ok: true };
  }

  async optOut(user: AuthUser, offerId: string) {
    await this.repo.optOut(requireMember(user), offerId);
    return { ok: true };
  }

  async submit(user: AuthUser, input: z.infer<typeof OfferSubmissionSchema>) {
    const memberId = requireMember(user);
    const member = await this.members.findAuthor(memberId);
    const category = await this.repo.findCategoryByName(input.category);
    return this.repo.createOffer({
      slug: uniqueSlug(input.title),
      kind: 'member',
      title: input.title,
      offer: input.offer,
      categoryId: category?.id,
      providerMemberId: memberId,
      providerName: member.fullName,
      providerRole: [member.headline, member.company].filter(Boolean).join(', ') || null,
      about: input.about,
      detail: input.detail,
      howToRedeem: input.howToRedeem,
      imageUrl: member.avatarUrl,
      status: 'in_review',
    });
  }
}
