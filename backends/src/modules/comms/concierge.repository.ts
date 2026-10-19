import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ConciergeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(memberId: string, data: { promptType?: string; body: string }) {
    return this.prisma.conciergeRequest.create({ data: { ...data, memberId } });
  }

  listFor(memberId: string) {
    return this.prisma.conciergeRequest.findMany({ where: { memberId }, orderBy: { createdAt: 'desc' } });
  }

  listQuickPrompts() {
    return this.prisma.quickPrompt.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  }
}
