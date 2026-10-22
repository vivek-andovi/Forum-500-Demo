import { Prisma } from '@prisma/client';
import { requestContext } from '../common/request-context';
import { fieldsOf } from './model-meta';

/**
 * Prisma client extension behind the audit columns every model has
 * (createdAt/updatedAt/deletedAt, createdBy/updatedBy/deletedBy):
 *
 *  - Reads never see soft-deleted rows: `deletedAt: null` is added to the top-level `where`,
 *    to every to-many `include`/`select` and `_count`, and to `some`/`every`/`none` relation
 *    filters. A query that names `deletedAt` itself at the top level is left alone, which is
 *    how deleted rows can still be read on purpose.
 *  - Writes are stamped with the signed-in user (createdBy/updatedBy), including nested
 *    creates/updates. `update`/`updateMany` only touch live rows.
 *  - `upsert` revives a soft-deleted row that holds the unique key (e.g. leave a group, then
 *    join again) instead of failing on the unique constraint.
 *  - Hard deletes are refused: use softDelete()/softDeleteMany() from ./soft-delete.
 */

type Args = Record<string, any>;

/** Columns the extension and soft delete maintain; never written from request bodies. */
export const AUDIT_FIELDS = ['createdBy', 'updatedBy', 'deletedAt', 'deletedBy'] as const;
/** Spread into a top-level `where` to include soft-deleted rows (a `deletedAt` key disables the filter). */
export const WITH_DELETED = { deletedAt: undefined };

const LIVE = { deletedAt: null };
const DELETED = { deletedAt: { not: null } };
const each = (v: any, fn: (x: any) => any) => (Array.isArray(v) ? v.map(fn) : fn(v));

// ───────────── where ─────────────

/** `where` restricted to live rows (unless it already filters on deletedAt). */
function liveWhere(model: string, where: Args | undefined): Args {
  const scoped = scopeWhere(model, where) ?? {};
  return 'deletedAt' in scoped ? scoped : { ...scoped, ...LIVE };
}

/** Make relation filters inside a `where` ignore soft-deleted related rows. */
function scopeWhere(model: string, where: Args | undefined): Args | undefined {
  if (!where || typeof where !== 'object') return where;
  const fields = fieldsOf(model);
  const out: Args = {};
  for (const [key, value] of Object.entries(where)) {
    const f = fields.get(key);
    if (key === 'AND' || key === 'OR' || key === 'NOT') out[key] = each(value, (w) => scopeWhere(model, w));
    else if (f?.kind === 'object' && value && typeof value === 'object') {
      out[key] = f.isList ? scopeListFilter(f.type, value) : scopeToOneFilter(f.type, value);
    } else out[key] = value;
  }
  return out;
}

function scopeListFilter(target: string, filter: Args): Args {
  const out = { ...filter };
  if (filter.some !== undefined) out.some = liveWhere(target, filter.some);
  if (filter.none !== undefined) out.none = liveWhere(target, filter.none);
  // "every live row matches" = every row is either deleted or matches.
  if (filter.every !== undefined) out.every = { OR: [DELETED, scopeWhere(target, filter.every) ?? {}] };
  return out;
}

// A live row never points at a soft-deleted one (softDelete applies the onDelete action),
// so to-one filters only need their nested relation filters scoped.
function scopeToOneFilter(target: string, filter: Args): Args {
  if (!('is' in filter) && !('isNot' in filter)) return scopeWhere(target, filter)!;
  return {
    ...filter,
    ...('is' in filter ? { is: scopeWhere(target, filter.is) ?? null } : {}),
    ...('isNot' in filter ? { isNot: scopeWhere(target, filter.isNot) ?? null } : {}),
  };
}

// ───────────── include / select ─────────────

function scopeSelection(model: string, args: Args): Args {
  const out = { ...args };
  if (args.include) out.include = scopeRelations(model, args.include);
  if (args.select) out.select = scopeRelations(model, args.select);
  return out;
}

function scopeRelations(model: string, selection: Args): Args {
  const fields = fieldsOf(model);
  const out: Args = {};
  for (const [key, value] of Object.entries(selection)) {
    const f = fields.get(key);
    if (key === '_count') out[key] = scopeCount(model, value);
    else if (f?.kind === 'object' && value) {
      const nested: Args = value === true ? {} : value;
      out[key] = f.isList
        ? { ...scopeSelection(f.type, nested), where: liveWhere(f.type, nested.where) }
        : value === true ? true : scopeSelection(f.type, nested);
    } else out[key] = value;
  }
  return out;
}

function scopeCount(model: string, value: any): any {
  const fields = fieldsOf(model);
  if (value === true) {
    const lists = [...fields.values()].filter((f) => f.kind === 'object' && f.isList);
    return { select: Object.fromEntries(lists.map((f) => [f.name, { where: LIVE }])) };
  }
  if (!value?.select) return value;
  const select: Args = {};
  for (const [rel, v] of Object.entries<any>(value.select)) {
    const target = fields.get(rel)?.type;
    if (!v || !target) select[rel] = v;
    else select[rel] = { ...(v === true ? {} : v), where: liveWhere(target, v === true ? undefined : v.where) };
  }
  return { ...value, select };
}

// ───────────── data ─────────────

function stampCreate(model: string, data: Args, actor: string | null): Args {
  const out = stampNested(model, data, actor);
  if (actor) {
    out.createdBy ??= actor;
    out.updatedBy ??= actor;
  }
  return out;
}

function stampUpdate(model: string, data: Args, actor: string | null): Args {
  const out = stampNested(model, data, actor);
  if (actor && !('updatedBy' in out)) out.updatedBy = actor;
  return out;
}

/** Stamp nested writes (`hosts: { create: … }`) and refuse nested hard deletes. */
function stampNested(model: string, data: Args, actor: string | null): Args {
  const fields = fieldsOf(model);
  const out: Args = { ...data };
  for (const [key, ops] of Object.entries(data)) {
    const f = fields.get(key);
    if (f?.kind !== 'object' || !ops || typeof ops !== 'object') continue;
    const t = f.type;
    const nested: Args = { ...ops };
    for (const [op, v] of Object.entries<any>(ops)) {
      if (op === 'delete' || op === 'deleteMany') {
        throw new Error(`Nested hard delete on ${model}.${key} is disabled; use softDelete()`);
      }
      if (op === 'create') nested.create = each(v, (d) => stampCreate(t, d, actor));
      if (op === 'createMany') nested.createMany = { ...v, data: each(v.data, (d) => stampCreate(t, d, actor)) };
      if (op === 'connectOrCreate') nested.connectOrCreate = each(v, (x) => ({ ...x, create: stampCreate(t, x.create, actor) }));
      if (op === 'upsert') {
        nested.upsert = each(v, (x) => ({ ...x, create: stampCreate(t, x.create, actor), update: stampUpdate(t, x.update, actor) }));
      }
      if (op === 'updateMany') nested.updateMany = each(v, (x) => ({ ...x, data: stampUpdate(t, x.data, actor) }));
      if (op === 'update') {
        // List relations: { where, data }. To-one: the data itself, or { where?, data }.
        const wrapped = (x: Args) => 'data' in x && Object.keys(x).every((k) => k === 'data' || k === 'where');
        nested.update = each(v, (x) => (wrapped(x) ? { ...x, data: stampUpdate(t, x.data, actor) } : stampUpdate(t, x, actor)));
      }
    }
    out[key] = nested;
  }
  return out;
}

// ───────────── extension ─────────────

export const auditTrail = Prisma.defineExtension({
  name: 'audit-trail',
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const a: Args = { ...(args as Args) };
        const actor = requestContext.userId();
        switch (operation) {
          case 'findUnique':
          case 'findUniqueOrThrow':
          case 'findFirst':
          case 'findFirstOrThrow':
          case 'findMany':
            return query(scopeSelection(model, { ...a, where: liveWhere(model, a.where) }));
          case 'count':
          case 'aggregate':
          case 'groupBy':
            return query({ ...a, where: liveWhere(model, a.where) });
          case 'create':
            return query(scopeSelection(model, { ...a, data: stampCreate(model, a.data, actor) }));
          case 'createMany':
          case 'createManyAndReturn':
            return query(scopeSelection(model, { ...a, data: each(a.data, (d) => stampCreate(model, d, actor)) }));
          case 'update':
          case 'updateMany':
          case 'updateManyAndReturn':
            return query(scopeSelection(model, { ...a, where: liveWhere(model, a.where), data: stampUpdate(model, a.data, actor) }));
          case 'upsert':
            return query(scopeSelection(model, {
              ...a,
              where: scopeWhere(model, a.where),
              create: stampCreate(model, a.create, actor),
              // Revive a soft-deleted row that holds this unique key.
              update: { ...stampUpdate(model, a.update, actor), deletedAt: null, deletedBy: null },
            }));
          case 'delete':
          case 'deleteMany':
            throw new Error(`Hard delete of ${model} is disabled; use softDelete() / softDeleteMany()`);
          default:
            return (query as (a: unknown) => Promise<unknown>)(args);
        }
      },
    },
  },
});
