import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';

type Args = Record<string, unknown>;

/**
 * Database access for the generic admin engine. Each call names the Prisma model
 * (e.g. "Event"); the service decides *what* to query from the resource registry.
 */
@Injectable()
export class AdminCrudRepository {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(model: string): any {
    return (this.prisma as any)[model.charAt(0).toLowerCase() + model.slice(1)];
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

  create(model: string, data: Args) {
    return this.delegate(model).create({ data });
  }

  update(model: string, where: Args, data: Args) {
    return this.delegate(model).update({ where, data });
  }

  delete(model: string, where: Args) {
    return this.delegate(model).delete({ where });
  }

  // ── Specific lookups used by guard rails and notifications
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

  createNotification(data: Prisma.NotificationUncheckedCreateInput) {
    return this.prisma.notification.create({ data });
  }
}
