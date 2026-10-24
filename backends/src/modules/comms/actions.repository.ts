import { Injectable } from '@nestjs/common';
import { ActionItem } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class ActionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Pending actions assigned to the member or to everyone (memberId null). */
  listPending(memberId: string) {
    return this.prisma.actionItem.findMany({
      where: { status: 'pending', OR: [{ memberId }, { memberId: null }] },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /** Dashboard: pending actions for the member (or global ones when there is no member). */
  listPendingForDashboard(memberId: string | null) {
    return this.prisma.actionItem.findMany({
      where: { status: 'pending', OR: [{ memberId }, { memberId: null }] }, orderBy: { dueAt: 'asc' },
    });
  }

  completedTitles(memberId: string) {
    return this.prisma.actionItem.findMany({ where: { memberId, status: 'completed' }, select: { title: true } });
  }

  findById(id: string) {
    return this.prisma.actionItem.findUnique({ where: { id } });
  }

  complete(id: string) {
    return this.prisma.actionItem.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } });
  }

  /** Global actions are completed by storing a personal completed copy. */
  completeGlobalFor(action: ActionItem, memberId: string) {
    // The copy is the member's own record: audit fields are stamped afresh, not copied from the global action.
    const { id: _id, createdAt: _c, updatedAt: _u, createdBy: _cb, updatedBy: _ub, deletedAt: _da, deletedBy: _db, ...rest } = action;
    return this.prisma.actionItem.create({ data: { ...rest, memberId, status: 'completed', completedAt: new Date() } });
  }
}
