import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { AuthUser } from '../../core/auth/decorators';
import { requireMember } from '../../core/common/member-context';
import { ConciergeRepository } from './concierge.repository';

export const ConciergeSchema = z.object({ promptType: z.string().max(60).optional(), body: z.string().min(1).max(4000) });

@Injectable()
export class ConciergeService {
  constructor(private readonly repo: ConciergeRepository) {}

  ask(user: AuthUser, input: z.infer<typeof ConciergeSchema>) {
    return this.repo.create(requireMember(user), input);
  }

  mine(user: AuthUser) {
    return this.repo.listFor(requireMember(user));
  }

  quickPrompts() {
    return this.repo.listQuickPrompts();
  }
}
