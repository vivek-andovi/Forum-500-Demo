import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { StorageService } from '../../core/storage/storage.service';
import { coerceWrite, rethrowWriteError } from './admin-coerce';
import { AdminCrudRepository } from './admin-crud.repository';
import { AdminLabelsService } from './admin-labels.service';
import { AdminMetadataService } from './admin-metadata.service';
import { buildListQuery, ListQuery } from './admin-query';
import { AdminStatusEffectsService } from './admin-status-effects.service';
import { ResourceConfig } from './resources';

/**
 * Generic, DMMF-driven CRUD for every registered admin resource (see ./resources).
 * This class only orchestrates; the pieces live next to it:
 *  - admin-metadata.service  model/field metadata, relation includes, row presentation
 *  - admin-query             list filters / sort / paging (pure)
 *  - admin-coerce            body → validated Prisma data, Prisma error mapping
 *  - admin-status-effects    member notifications after a status change
 */
@Injectable()
export class AdminCrudService {
  constructor(
    private readonly repo: AdminCrudRepository,
    private readonly metadata: AdminMetadataService,
    private readonly labels: AdminLabelsService,
    private readonly statusEffects: AdminStatusEffectsService,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  meta() {
    return this.metadata.meta();
  }

  /** Model-bound accessor over the repository, so queries read naturally. */
  private delegate(res: ResourceConfig) {
    const m = res.model;
    return {
      findMany: (args: Record<string, unknown>) => this.repo.findMany(m, args),
      count: (args: { where: Record<string, unknown> }) => this.repo.count(m, args.where),
      findUnique: (args: Record<string, unknown>) => this.repo.findUnique(m, args),
      create: (args: { data: Record<string, unknown> }) => this.repo.create(m, args.data),
      update: (args: { where: Record<string, unknown>; data: Record<string, unknown> }) => this.repo.update(m, args.where, args.data),
      delete: (args: { where: Record<string, unknown> }) => this.repo.delete(m, args.where),
    };
  }

  // ───────────── read ─────────────

  async list(name: string, q: ListQuery) {
    const res = this.metadata.resource(name);
    const { where, orderBy, page, pageSize } = buildListQuery(res, this.metadata.model(res).fields, (e) => this.metadata.enumValues(e), q);
    const delegate = this.delegate(res);
    const [rows, total] = await Promise.all([
      delegate.findMany({
        where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: this.metadata.include(res),
      }),
      delegate.count({ where }),
    ]);
    return { data: await this.labels.label(res, rows.map((r: any) => this.metadata.present(res, r))), total, page, pageSize };
  }

  async get(name: string, id: string) {
    const res = this.metadata.resource(name);
    const row = await this.delegate(res).findUnique({
      where: { [this.metadata.idField(res)]: id },
      include: this.metadata.include(res),
    });
    if (!row) throw new NotFoundException(`${res.singular} not found`);
    const [presented] = await this.labels.label(res, [this.metadata.present(res, row)]);
    return presented;
  }

  async options(name: string, search?: string, ids?: string) {
    const res = this.metadata.resource(name);
    const lf = this.metadata.labelFieldOf(res);
    const where: Record<string, unknown> = {};
    if (ids) where.id = { in: ids.split(',').filter(Boolean) };
    else if (search && lf !== 'id') where[lf] = { contains: search, mode: 'insensitive' };
    const rows = await this.delegate(res).findMany({
      where,
      take: 50,
      orderBy: lf !== 'id' ? { [lf]: 'asc' } : undefined,
      include: lf === 'id' ? this.metadata.include(res) : undefined,
    });
    return rows.map((r: any) => ({ id: r.id ?? r.key, label: this.metadata.present(res, r)._label }));
  }

  // ───────────── write ─────────────

  async create(name: string, body: Record<string, any>, actor: Actor) {
    const res = this.metadata.resource(name);
    if (res.readOnly || res.noCreate) throw new BadRequestException(`${res.label} cannot be created here`);
    const data = await coerceWrite(this.metadata, res, body, true);
    try {
      const row = await this.delegate(res).create({ data });
      const id = row.id ?? row.key;
      const presented = await this.get(name, id);
      await this.audit.log(actor, {
        action: 'create', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: recordLabel(presented), after: await this.labelled(res, data),
        fieldLabels: this.metadata.fieldLabels(res),
      });
      return presented;
    } catch (e) {
      rethrowWriteError(e);
    }
  }

  async update(name: string, id: string, body: Record<string, any>, actor: Actor) {
    const res = this.metadata.resource(name);
    if (res.readOnly) throw new BadRequestException(`${res.label} are read-only`);
    const data = await coerceWrite(this.metadata, res, body, false);
    if (res.model === 'User') await this.checkUserWrite(id, data, actor);
    try {
      const before = await this.raw(res, id);
      if (!before) throw new NotFoundException(`${res.singular} not found`);
      const after = await this.delegate(res).update({ where: { [this.metadata.idField(res)]: id }, data });
      const presented = await this.get(name, id);
      const written = Object.fromEntries(Object.keys(data).map((k) => [k, after[k]]));
      await this.audit.log(actor, {
        action: 'update', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: recordLabel(presented),
        before: await this.labelled(res, before), after: await this.labelled(res, written),
        fieldLabels: this.metadata.fieldLabels(res),
      });
      if (data.status && before.status !== data.status) await this.statusEffects.afterStatusChange(res, after, String(data.status));
      return presented;
    } catch (e) {
      rethrowWriteError(e);
    }
  }

  async remove(name: string, id: string, actor: Actor) {
    const res = this.metadata.resource(name);
    if (res.readOnly) throw new BadRequestException(`${res.label} are read-only`);
    if (res.model === 'User') await this.checkUserWrite(id, {}, actor, true);
    try {
      const presented = await this.get(name, id);
      const row = await this.delegate(res).delete({ where: { [this.metadata.idField(res)]: id } });
      if (res.model === 'Asset') await this.storage.remove(row.storageKey, row.driver);
      await this.audit.log(actor, {
        action: 'delete', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: recordLabel(presented),
      });
      return { ok: true };
    } catch (e) {
      rethrowWriteError(e);
    }
  }

  /** Generic status change. Statuses listed in `workflowStatuses` belong to admin-workflows instead. */
  async setStatus(name: string, id: string, status: string, actor: Actor) {
    const res = this.metadata.resource(name);
    const fields = this.metadata.fieldsByName(res);
    if (!fields.status) throw new BadRequestException(`${res.label} have no status`);
    const allowed = this.metadata.enumValues(fields.status.type) ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    }
    const before = await this.raw(res, id);
    if (!before) throw new NotFoundException(`${res.singular} not found`);
    const locked = res.workflowStatuses ?? [];
    if (locked.includes(status) || locked.includes(before.status)) {
      throw new BadRequestException(`Use the decision buttons on the ${res.singular.toLowerCase()} to approve or reject it`);
    }
    const data: Record<string, unknown> = { status };
    if (res.model === 'User') await this.checkUserWrite(id, data, actor);
    if (status === 'published' && fields.publishedAt && !before.publishedAt) data.publishedAt = new Date();
    if (fields.respondedAt && ['accepted', 'declined'].includes(status)) data.respondedAt = new Date();
    try {
      const after = await this.delegate(res).update({ where: { id }, data });
      const presented = await this.get(name, id);
      await this.audit.log(actor, {
        action: 'status', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: recordLabel(presented), before, after: { status }, fieldLabels: this.metadata.fieldLabels(res),
      });
      if (before.status !== status) await this.statusEffects.afterStatusChange(res, after, status);
      return presented;
    } catch (e) {
      rethrowWriteError(e);
    }
  }

  // ───────────── helpers ─────────────

  private raw(res: ResourceConfig, id: string) {
    return this.delegate(res).findUnique({ where: { [this.metadata.idField(res)]: id } });
  }

  /** Replace FK ids in an audit snapshot with the related record's label. */
  private async labelled(res: ResourceConfig, row: Record<string, any> | null) {
    if (!row) return row;
    const out: Record<string, any> = { ...row };
    for (const rel of this.metadata.relations(res)) {
      const id = row[rel.fk];
      if (!id) continue;
      const lf = this.metadata.labelFieldOf(rel.resource);
      if (lf === 'id') continue;
      const related = await this.delegate(rel.resource).findUnique({ where: { id }, select: { [lf]: true } }).catch(() => null);
      if (related) out[rel.fk] = String(related[lf]);
    }
    return out;
  }

  /** Guard rails for user accounts so admins cannot lock everyone out. */
  private async checkUserWrite(id: string | null, data: Record<string, unknown>, actor: Actor, deleting = false) {
    if (!id) return;
    const target = await this.repo.findUser(id);
    if (!target) return;
    const losingAdmin =
      target.role === 'admin' && (deleting || (data.role && data.role !== 'admin') || data.status === 'suspended');
    if (id === actor.id && (deleting || losingAdmin)) {
      throw new BadRequestException('You cannot delete, suspend or demote your own account');
    }
    if (losingAdmin) {
      const admins = await this.repo.countActiveAdmins();
      if (admins <= 1) throw new BadRequestException('At least one active admin must remain');
    }
    // Role, status or password changes sign the user out everywhere.
    if (!deleting && (data.role !== undefined || data.status === 'suspended' || data.passwordHash)) {
      data.tokenVersion = { increment: 1 };
    }
  }
}

const recordLabel = (presented: any): string | null =>
  presented?._label ? String(presented._label).slice(0, 200) : null;
