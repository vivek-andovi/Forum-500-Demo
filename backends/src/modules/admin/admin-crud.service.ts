import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { Actor, AuditService } from '../../core/audit/audit.service';
import { passwordSchema, SAFE_URL } from '../../core/common/util';
import { AdminCrudRepository } from './admin-crud.repository';
import { StorageService } from '../../core/storage/storage.service';
import { LINK_FIELDS, RESOURCES, ResourceConfig, TEXT_FIELDS } from './resources';

type DmmfField = Prisma.DMMF.Field;
type DmmfModel = Prisma.DMMF.Model;

export interface FieldMeta {
  name: string;
  label: string;
  type:
    | 'string' | 'text' | 'int' | 'float' | 'boolean' | 'datetime' | 'enum'
    | 'string[]' | 'json' | 'relation' | 'url' | 'image';
  required: boolean;
  readOnly: boolean;
  hidden: boolean;
  enumValues?: string[];
  relation?: { resource: string; labelField: string };
  /** Literal database default (omitted for functions such as now()/uuid()). */
  default?: unknown;
}

interface RelationInfo {
  fk: string;
  relationName: string;
  resource: ResourceConfig;
}

interface ListQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  sort?: string;
  order?: string;
  status?: string;
  [key: string]: unknown;
}

const humanize = (name: string) =>
  name
    .replace(/Id$/, '')
    .replace(/Url$/, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

/**
 * Generic, DMMF-driven CRUD for every registered admin resource. Validates and coerces
 * writes against the Prisma model so the admin UI can stay fully metadata-driven.
 */
@Injectable()
export class AdminCrudService {
  private readonly models = new Map<string, DmmfModel>(
    Prisma.dmmf.datamodel.models.map((m) => [m.name, m]),
  );
  private readonly enums = new Map<string, string[]>(
    Prisma.dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.name)]),
  );
  private readonly byName = new Map(RESOURCES.map((r) => [r.name, r]));
  private readonly byModel = new Map(RESOURCES.map((r) => [r.model, r]));

  constructor(
    private readonly repo: AdminCrudRepository,
    private readonly audit: AuditService,
    private readonly storage: StorageService,
  ) {}

  // ───────────── metadata ─────────────

  resource(name: string): ResourceConfig {
    const res = this.byName.get(name);
    if (!res) throw new NotFoundException(`Unknown resource "${name}"`);
    return res;
  }

  private model(res: ResourceConfig): DmmfModel {
    return this.models.get(res.model)!;
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

  private relations(res: ResourceConfig): RelationInfo[] {
    const out: RelationInfo[] = [];
    for (const f of this.model(res).fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
      const target = this.byModel.get(f.type);
      if (target) out.push({ fk: f.relationFromFields[0], relationName: f.name, resource: target });
    }
    return out;
  }

  private labelFieldOf(res: ResourceConfig): string {
    return res.labelField ?? 'id';
  }

  private fieldMeta(res: ResourceConfig, f: DmmfField, rels: RelationInfo[]): FieldMeta {
    // A primary key without a default (e.g. Setting.key) is chosen by the admin on create.
    const readOnly =
      (f.isId && f.hasDefaultValue) || f.isUpdatedAt || f.name === 'createdAt' || !!res.readOnlyFields?.includes(f.name);
    const rel = rels.find((r) => r.fk === f.name);
    let type: FieldMeta['type'] = 'string';
    if (rel) type = 'relation';
    else if (f.kind === 'enum') type = 'enum';
    else if (f.type === 'Int') type = 'int';
    else if (f.type === 'Float' || f.type === 'Decimal') type = 'float';
    else if (f.type === 'Boolean') type = 'boolean';
    else if (f.type === 'DateTime') type = 'datetime';
    else if (f.type === 'Json') type = 'json';
    else if (f.type === 'String' && f.isList) type = 'string[]';
    else if (LINK_FIELDS.has(f.name)) type = 'url';
    else if (/Url$/.test(f.name) || f.name === 'url') type = 'image';
    else if (TEXT_FIELDS.has(f.name)) type = 'text';

    return {
      name: f.name,
      label: res.labels?.[f.name] ?? humanize(f.name),
      type,
      required: f.isRequired && !f.hasDefaultValue && !readOnly && !f.isList,
      readOnly,
      hidden: (res.hidden ?? []).includes(f.name),
      enumValues: f.kind === 'enum' ? this.enums.get(f.type) : undefined,
      relation: rel
        ? { resource: rel.resource.name, labelField: this.labelFieldOf(rel.resource) }
        : undefined,
      default:
        f.hasDefaultValue && (typeof f.default !== 'object' || Array.isArray(f.default))
          ? f.default
          : undefined,
    };
  }

  meta() {
    return {
      resources: RESOURCES.map((res) => {
        const model = this.model(res);
        const rels = this.relations(res);
        const scalarFields = model.fields.filter((f) => f.kind !== 'object');
        const fields = scalarFields.map((f) => this.fieldMeta(res, f, rels));
        if (res.name === 'users') {
          fields.push({
            name: 'password', label: 'Password (set / reset)', type: 'string',
            required: false, readOnly: false, hidden: false,
          });
        }
        const statusField = scalarFields.find((f) => f.name === 'status');
        return {
          name: res.name,
          label: res.label,
          singular: res.singular,
          group: res.group,
          model: res.model,
          labelField: this.labelFieldOf(res),
          listColumns: res.listColumns,
          searchFields: res.searchFields,
          defaultSort: res.defaultSort ?? { field: 'createdAt', order: 'desc' },
          hasStatus: !!statusField,
          statusEnum: statusField ? this.enums.get(statusField.type) : undefined,
          readOnly: !!res.readOnly,
          defaultQuery: res.defaultQuery,
          fields,
        };
      }),
    };
  }

  // ───────────── read ─────────────

  private include(res: ResourceConfig) {
    const include: Record<string, unknown> = {};
    for (const rel of this.relations(res)) {
      const lf = this.labelFieldOf(rel.resource);
      include[rel.relationName] = { select: { id: true, ...(lf !== 'id' ? { [lf]: true } : {}) } };
    }
    return Object.keys(include).length ? include : undefined;
  }

  /** Strip hidden fields, flatten relation labels into `_relations`, add `_label`. */
  private present(res: ResourceConfig, row: any) {
    if (!row) return row;
    const out: any = { ...row };
    const relLabels: Record<string, string | null> = {};
    for (const rel of this.relations(res)) {
      const related = row[rel.relationName];
      relLabels[rel.fk] = related ? String(related[this.labelFieldOf(rel.resource)] ?? related.id) : null;
      delete out[rel.relationName];
    }
    for (const h of res.hidden ?? []) delete out[h];
    const lf = res.labelField;
    out._relations = relLabels;
    out._label = lf
      ? String(row[lf] ?? '').slice(0, 120)
      : Object.values(relLabels).filter(Boolean).join(' · ') || row.id || row.key;
    return out;
  }

  private coerceFilterValue(f: DmmfField, value: string): unknown {
    if (value === 'null') return null;
    if (f.type === 'Boolean') return value === 'true';
    if (f.type === 'Int') return Number(value);
    return value;
  }

  async list(name: string, q: ListQuery) {
    const res = this.resource(name);
    const model = this.model(res);
    const fields = new Map(model.fields.map((f) => [f.name, f]));
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(q.pageSize) || 20));

    const where: Record<string, unknown> = {};
    const and: unknown[] = [];
    const search = typeof q.search === 'string' ? q.search.trim().slice(0, 100) : '';
    if (search && res.searchFields.length) {
      and.push({
        OR: res.searchFields.map((s) => ({ [s]: { contains: search, mode: 'insensitive' } })),
      });
    }
    if (typeof q.status === 'string' && fields.has('status')) {
      const allowed = this.enums.get(fields.get('status')!.type) ?? [];
      if (!allowed.includes(q.status)) throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
      where.status = q.status;
    }

    const filterEntries: [string, string][] = [];
    for (const [key, value] of Object.entries(q)) {
      if (key.startsWith('filter.')) filterEntries.push([key.slice(7), String(value)]);
    }
    if (q.filter && typeof q.filter === 'object') {
      for (const [k, v] of Object.entries(q.filter as Record<string, string>)) filterEntries.push([k, v]);
    }
    for (const [field, value] of filterEntries) {
      const f = fields.get(field);
      if (!f || f.kind === 'object' || f.isList || f.type === 'Json') continue;
      if (f.kind === 'enum' && value !== 'null' && !(this.enums.get(f.type) ?? []).includes(value)) {
        throw new BadRequestException(`${humanize(field)} must be one of: ${(this.enums.get(f.type) ?? []).join(', ')}`);
      }
      if (f.type === 'Int' && value !== 'null' && Number.isNaN(Number(value))) {
        throw new BadRequestException(`${humanize(field)} must be a number`);
      }
      where[field] = this.coerceFilterValue(f, value.slice(0, 200));
    }
    if (and.length) where.AND = and;

    const sortField = q.sort && fields.has(q.sort) ? q.sort : res.defaultSort?.field;
    const order = q.order === 'asc' || q.order === 'desc' ? q.order : res.defaultSort?.order ?? 'desc';
    const orderBy = sortField && fields.has(sortField) ? { [sortField]: order } : undefined;

    const delegate = this.delegate(res);
    const [rows, total] = await Promise.all([
      delegate.findMany({
        where, orderBy, skip: (page - 1) * pageSize, take: pageSize, include: this.include(res),
      }),
      delegate.count({ where }),
    ]);
    return { data: rows.map((r: any) => this.present(res, r)), total, page, pageSize };
  }

  private idField(res: ResourceConfig): string {
    return this.model(res).fields.find((f) => f.isId)!.name;
  }

  async get(name: string, id: string) {
    const res = this.resource(name);
    const row = await this.delegate(res).findUnique({
      where: { [this.idField(res)]: id },
      include: this.include(res),
    });
    if (!row) throw new NotFoundException(`${res.singular} not found`);
    return this.present(res, row);
  }

  async options(name: string, search?: string, ids?: string) {
    const res = this.resource(name);
    const lf = this.labelFieldOf(res);
    const where: Record<string, unknown> = {};
    if (ids) where.id = { in: ids.split(',').filter(Boolean) };
    else if (search && lf !== 'id') where[lf] = { contains: search, mode: 'insensitive' };
    const rows = await this.delegate(res).findMany({
      where,
      take: 50,
      orderBy: lf !== 'id' ? { [lf]: 'asc' } : undefined,
      include: lf === 'id' ? this.include(res) : undefined,
    });
    return rows.map((r: any) => ({ id: r.id ?? r.key, label: this.present(res, r)._label }));
  }

  // ───────────── write ─────────────

  private async coerce(res: ResourceConfig, body: Record<string, any>, isCreate: boolean) {
    const data: Record<string, unknown> = {};
    for (const f of this.model(res).fields) {
      if (f.kind === 'object' || f.isUpdatedAt || f.name === 'createdAt') continue;
      if (f.isId && !(res.model === 'Setting' && isCreate)) continue;
      if ((res.hidden ?? []).includes(f.name) || res.readOnlyFields?.includes(f.name)) continue;
      if (!(f.name in body)) continue;
      let v = body[f.name];

      if (v === '' || v === undefined) v = null;
      if (v === null) {
        if (f.isList) v = [];
        else if (f.isRequired) {
          if (f.hasDefaultValue) continue;
          throw new BadRequestException(`${humanize(f.name)} is required`);
        }
        data[f.name] = v;
        continue;
      }

      switch (f.type) {
        case 'Int':
          v = Number.parseInt(String(v), 10);
          if (Number.isNaN(v)) throw new BadRequestException(`${humanize(f.name)} must be a number`);
          break;
        case 'Float':
          v = Number(v);
          if (Number.isNaN(v)) throw new BadRequestException(`${humanize(f.name)} must be a number`);
          break;
        case 'Boolean':
          v = v === true || v === 'true' || v === 1 || v === '1';
          break;
        case 'DateTime': {
          const d = new Date(v);
          if (Number.isNaN(d.getTime())) throw new BadRequestException(`${humanize(f.name)} is not a valid date`);
          v = d;
          break;
        }
        case 'Json':
          if (typeof v === 'string') {
            try {
              v = JSON.parse(v);
            } catch {
              throw new BadRequestException(`${humanize(f.name)} must be valid JSON`);
            }
          }
          break;
        default:
          if (f.isList) {
            const list = Array.isArray(v) ? v : String(v).split(',');
            v = list.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 200);
          } else if (f.kind === 'enum') {
            const allowed = this.enums.get(f.type) ?? [];
            if (!allowed.includes(String(v))) {
              throw new BadRequestException(`${humanize(f.name)} must be one of: ${allowed.join(', ')}`);
            }
          } else if (!f.isList) {
            v = this.validateString(res, f, String(v));
          }
      }
      data[f.name] = v;
    }

    if (res.model === 'User') {
      if (typeof body.password === 'string' && body.password.length) {
        const check = passwordSchema.safeParse(body.password);
        if (!check.success) throw new BadRequestException(`Password ${check.error.issues[0].message}`);
        data.passwordHash = await argon2.hash(body.password);
      }
      if (typeof data.email === 'string') data.email = data.email.trim().toLowerCase();
    }
    if ('slug' in this.fieldsByName(res) && isCreate && !data.slug) {
      const lf = res.labelField;
      const base = lf && typeof data[lf] === 'string' ? (data[lf] as string) : 'item';
      data.slug = `${base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`;
    }
    return data;
  }

  /** Field-level rules on top of type coercion: safe URLs, emails, slugs, lengths. */
  private validateString(res: ResourceConfig, f: DmmfField, v: string): string {
    const meta = this.fieldMeta(res, f, this.relations(res));
    const label = humanize(f.name);
    if (v.length > 50_000) throw new BadRequestException(`${label} is too long`);
    if ((meta.type === 'url' || meta.type === 'image') && !SAFE_URL.test(v.trim())) {
      throw new BadRequestException(`${label} must be an http(s) URL`);
    }
    if (f.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
      throw new BadRequestException(`${label} must be a valid email address`);
    }
    if (f.name === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
      throw new BadRequestException('Slug may only contain lowercase letters, numbers and dashes');
    }
    if (meta.relation && !/^[0-9a-f-]{36}$/i.test(v)) {
      throw new BadRequestException(`${label} must be a valid id`);
    }
    return meta.type === 'url' || meta.type === 'image' ? v.trim() : v;
  }

  private fieldsByName(res: ResourceConfig): Record<string, DmmfField> {
    return Object.fromEntries(this.model(res).fields.map((f) => [f.name, f]));
  }

  private fieldLabels(res: ResourceConfig): Record<string, string> {
    const rels = this.relations(res);
    return Object.fromEntries(
      this.model(res).fields.filter((f) => f.kind !== 'object').map((f) => [f.name, this.fieldMeta(res, f, rels).label]),
    );
  }

  /** Replace FK ids in an audit snapshot with the related record's label. */
  private async labelled(res: ResourceConfig, row: Record<string, any> | null) {
    if (!row) return row;
    const out: Record<string, any> = { ...row };
    for (const rel of this.relations(res)) {
      const id = row[rel.fk];
      if (!id) continue;
      const lf = this.labelFieldOf(rel.resource);
      if (lf === 'id') continue;
      const related = await this.delegate(rel.resource).findUnique({ where: { id }, select: { [lf]: true } }).catch(() => null);
      if (related) out[rel.fk] = String(related[lf]);
    }
    return out;
  }

  private recordLabel(res: ResourceConfig, presented: any): string | null {
    return presented?._label ? String(presented._label).slice(0, 200) : null;
  }

  private handlePrismaError(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2002') {
        throw new BadRequestException(`A record with this ${(e.meta?.target as string[])?.join(', ')} already exists`);
      }
      if (e.code === 'P2003') throw new BadRequestException('Related record does not exist, or other records still depend on this one');
      if (e.code === 'P2025') throw new NotFoundException('Record not found');
      if (e.code === 'P2023') throw new BadRequestException('Invalid identifier');
    }
    if (e instanceof Prisma.PrismaClientValidationError) {
      throw new BadRequestException('Invalid data for this record');
    }
    throw e;
  }

  private async raw(res: ResourceConfig, id: string) {
    return this.delegate(res).findUnique({ where: { [this.idField(res)]: id } });
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

  async create(name: string, body: Record<string, any>, actor: Actor) {
    const res = this.resource(name);
    if (res.readOnly || res.noCreate) throw new BadRequestException(`${res.label} cannot be created here`);
    const data = await this.coerce(res, body, true);
    try {
      const row = await this.delegate(res).create({ data });
      const id = row.id ?? row.key;
      const presented = await this.get(name, id);
      await this.audit.log(actor, {
        action: 'create', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: this.recordLabel(res, presented), after: await this.labelled(res, data),
        fieldLabels: this.fieldLabels(res),
      });
      return presented;
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async update(name: string, id: string, body: Record<string, any>, actor: Actor) {
    const res = this.resource(name);
    if (res.readOnly) throw new BadRequestException(`${res.label} are read-only`);
    const data = await this.coerce(res, body, false);
    if (res.model === 'User') await this.checkUserWrite(id, data, actor);
    try {
      const before = await this.raw(res, id);
      if (!before) throw new NotFoundException(`${res.singular} not found`);
      const after = await this.delegate(res).update({ where: { [this.idField(res)]: id }, data });
      const presented = await this.get(name, id);
      const written = Object.fromEntries(Object.keys(data).map((k) => [k, after[k]]));
      await this.audit.log(actor, {
        action: 'update', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: this.recordLabel(res, presented),
        before: await this.labelled(res, before), after: await this.labelled(res, written),
        fieldLabels: this.fieldLabels(res),
      });
      if (data.status && before.status !== data.status) await this.afterStatusChange(res, after, String(data.status));
      return presented;
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async remove(name: string, id: string, actor: Actor) {
    const res = this.resource(name);
    if (res.readOnly) throw new BadRequestException(`${res.label} are read-only`);
    if (res.model === 'User') await this.checkUserWrite(id, {}, actor, true);
    try {
      const presented = await this.get(name, id);
      const row = await this.delegate(res).delete({ where: { [this.idField(res)]: id } });
      if (res.model === 'Asset') await this.storage.remove(row.storageKey, row.driver);
      await this.audit.log(actor, {
        action: 'delete', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: this.recordLabel(res, presented),
      });
      return { ok: true };
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  async setStatus(name: string, id: string, status: string, actor: Actor) {
    const res = this.resource(name);
    const fields = this.fieldsByName(res);
    if (!fields.status) throw new BadRequestException(`${res.label} have no status`);
    const allowed = this.enums.get(fields.status.type) ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(`Status must be one of: ${allowed.join(', ')}`);
    }
    const before = await this.raw(res, id);
    if (!before) throw new NotFoundException(`${res.singular} not found`);
    const data: Record<string, unknown> = { status };
    if (res.model === 'User') await this.checkUserWrite(id, data, actor);
    if (status === 'published' && fields.publishedAt && !before.publishedAt) data.publishedAt = new Date();
    if (fields.respondedAt && ['accepted', 'declined'].includes(status)) data.respondedAt = new Date();
    try {
      const after = await this.delegate(res).update({ where: { id }, data });
      const presented = await this.get(name, id);
      await this.audit.log(actor, {
        action: 'status', entity: res.name, entityType: res.singular, entityId: id,
        entityLabel: this.recordLabel(res, presented), before, after: { status }, fieldLabels: this.fieldLabels(res),
      });
      if (before.status !== status) await this.afterStatusChange(res, after, status);
      return presented;
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  /** Tell the member when an admin decides on something they submitted. */
  private async afterStatusChange(res: ResourceConfig, row: any, status: string) {
    const approved = ['published', 'approved', 'accepted', 'answered'].includes(status);
    const rejected = ['rejected', 'declined'].includes(status);
    if (!approved && !rejected) return;
    const verdict = approved ? 'approved' : 'not approved';
    let memberId: string | null = null;
    let title = '';
    let link: string | undefined;
    let body: string | undefined;
    switch (res.model) {
      case 'Event':
        memberId = row.proposedById; title = `Your event “${row.title}” was ${verdict}`; link = approved ? `/events/${row.slug}` : '/events/my-events';
        break;
      case 'BenefitOffer':
        memberId = row.providerMemberId; title = `Your benefit “${row.title}” was ${verdict}`; link = '/membership/benefits';
        break;
      case 'Group':
        memberId = row.proposedById; title = `Your group “${row.name}” was ${verdict}`; link = '/membership/groups';
        break;
      case 'GroupMembership': {
        const g = await this.repo.findGroupName(row.groupId);
        memberId = row.memberId; title = `Your request to join “${g?.name}” was ${verdict}`; link = '/membership/groups';
        break;
      }
      case 'WhatsappMembership': {
        const g = await this.repo.findWhatsappGroup(row.groupId);
        memberId = row.memberId; title = `Your request to join the ${g?.name} WhatsApp group was ${verdict}`;
        link = '/comms/whatsapp'; body = approved && g?.inviteLink ? `Join here: ${g.inviteLink}` : undefined;
        break;
      }
      case 'FeedPost':
        memberId = row.memberId; title = `Your newsfeed post was ${verdict}`; link = '/media/newsfeed';
        break;
      case 'Comment':
        memberId = row.memberId; title = `Your comment was ${verdict}`; link = '/media/inforum';
        break;
      case 'Recommendation':
        memberId = row.memberId; title = `Your recommendation “${row.title}” was ${verdict}`; link = '/media/inforum';
        break;
      case 'ConciergeRequest':
        memberId = row.memberId; title = 'The Forum team replied to your Ask Zola request'; body = row.adminReply ?? undefined; link = '/ask-zola';
        break;
      default:
        return;
    }
    if (memberId) {
      await this.repo.createNotification({ memberId, type: 'approval', title, body, link });
    }
  }
}
