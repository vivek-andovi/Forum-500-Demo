import { Injectable } from '@nestjs/common';
import { WITH_DELETED } from '../../core/prisma/audit-trail.extension';
import { compoundUniquesOf, delegate } from '../../core/prisma/model-meta';
import { PrismaService } from '../../core/prisma/prisma.service';
import { softDelete } from '../../core/prisma/soft-delete';

type Args = Record<string, unknown>;

/**
 * Database access for the generic admin engine. Each call names the Prisma model
 * (e.g. "Event"); the service decides *what* to query from the resource registry.
 */
@Injectable()
export class AdminCrudRepository {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(model: string) {
    return delegate(this.prisma, model);
  }

  findMany(model: string, args: Args) {
    return this.delegate(model).findMany(args);
  }

  count(model: string, where: Args) {
    return this.delegate(model).count({ where });
  }

  findUnique(model: string, args: Args) {
    return this.delegate(model).findUnique(args);
  }

  /**
   * Create, or revive the soft-deleted row that still holds this multi-column unique key
   * (e.g. a member re-added to a sector after being removed). Soft delete only frees
   * single-column uniques, so a plain create would fail with P2002.
   */
  async create(model: string, data: Args) {
    for (const key of compoundUniquesOf(model)) {
      if (!key.every((f) => data[f] != null)) continue;
      const deleted = await this.delegate(model).findFirst({
        where: { ...Object.fromEntries(key.map((f) => [f, data[f]])), deletedAt: { not: null } },
        select: { id: true },
      });
      if (deleted) {
        return this.delegate(model).update({
          where: { id: deleted.id, deletedAt: { not: null } },
          data: { ...data, deletedAt: null, deletedBy: null },
        });
      }
    }
    return this.delegate(model).create({ data });
  }

  update(model: string, where: Args, data: Args) {
    return this.delegate(model).update({ where, data });
  }

  /** Soft delete (see core/prisma/soft-delete): cascades/set-nulls like the real FK would. */
  delete(model: string, where: Args) {
    return softDelete(this.prisma, model, where);
  }

  // ── Specific lookups used by guard rails (checkUserWrite) and status notifications
  /** `id` + label column of the given rows, including deleted ones (history still points at them). */
  findLabels(model: string, ids: readonly string[], labelField: string): Promise<{ id: string; deletedAt: Date | null; [k: string]: unknown }[]> {
    return this.delegate(model).findMany({
      where: { id: { in: ids }, ...WITH_DELETED },
      select: { id: true, deletedAt: true, [labelField]: true },
    });
  }

  findUser(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  countActiveAdmins() {
    return this.prisma.user.count({ where: { role: 'admin', status: { not: 'suspended' } } });
  }

  findGroupName(id: string) {
    return this.prisma.group.findUnique({ where: { id }, select: { name: true } });
  }

  findWhatsappGroup(id: string) {
    return this.prisma.whatsappGroup.findUnique({ where: { id }, select: { name: true, inviteLink: true } });
  }
}
