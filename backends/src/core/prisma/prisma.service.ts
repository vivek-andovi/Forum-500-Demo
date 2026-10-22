import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { auditTrail } from './audit-trail.extension';

const createClient = () => new PrismaClient().$extends(auditTrail);
type AuditedClient = ReturnType<typeof createClient>;

/**
 * The application's database client: PrismaClient with the audit-trail extension
 * (soft-delete filtering + createdBy/updatedBy stamping) applied. `$extends` returns a new
 * object, so the class constructor returns that client and the Nest lifecycle hooks are
 * attached to it directly.
 */
const AuditedPrismaClient = function () {
  return createClient();
} as unknown as new () => AuditedClient;

@Injectable()
export class PrismaService extends AuditedPrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super();
    this.onModuleInit = () => this.$connect();
    this.onModuleDestroy = () => this.$disconnect();
  }

  declare onModuleInit: () => Promise<void>;
  declare onModuleDestroy: () => Promise<void>;
}
