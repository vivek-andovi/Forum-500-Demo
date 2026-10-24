import { Prisma } from '@prisma/client';
import { requestContext } from '../common/request-context';
import { CHILD_RELATIONS, delegate, DmmfField, fieldsOf } from './model-meta';

/**
 * Soft delete: rows get deletedAt/deletedBy instead of being removed, and the audit-trail
 * extension hides them from every query. To keep the data looking exactly as it did after a
 * real DELETE, each relation's onDelete action is applied by hand:
 *  - Cascade  → the child rows are soft-deleted too (recursively)
 *  - SetNull  → the child rows' foreign key is cleared
 *  - Restrict → refused with P2003 while live child rows exist
 * Single-column unique values are released so the slug/email/name can be reused: strings get
 * a "~deleted~<time>" suffix, nullable non-text columns (the uuid Member.userId) are cleared.
 *
 * `db` is the PrismaService or an interactive-transaction client. On the root client the
 * whole delete runs in one transaction.
 */

const DELETED_SUFFIX = '~deleted~';

/** Unique single-column fields to release on delete, per model. */
const RELEASED = new Map<string, DmmfField[]>();
/** Text column that can take the suffix (a @db.Uuid String like Member.userId cannot). */
const isText = (f: DmmfField) => f.type === 'String' && f.nativeType?.[0] !== 'Uuid';
function releasedFields(model: string): DmmfField[] {
  if (!RELEASED.has(model)) {
    const fields = [...fieldsOf(model).values()].filter(
      (f) => f.isUnique && !f.isId && f.kind === 'scalar' && (isText(f) || !f.isRequired),
    );
    RELEASED.set(model, fields);
  }
  return RELEASED.get(model)!;
}

const knownError = (code: string, message: string) =>
  new Prisma.PrismaClientKnownRequestError(message, { code, clientVersion: Prisma.prismaVersion.client });

interface Ctx {
  at: Date;
  by: string | null;
}

/** Deleting a member cascades through ~17 tables, which can outlast Prisma's 5 s default. */
const TRANSACTION_TIMEOUT_MS = 30_000;

function inTransaction<T>(db: object, fn: (tx: object) => Promise<T>): Promise<T> {
  const root = db as { $transaction?: (fn: (tx: object) => Promise<T>, opts: { timeout: number }) => Promise<T> };
  return typeof root.$transaction === 'function' ? root.$transaction(fn, { timeout: TRANSACTION_TIMEOUT_MS }) : fn(db);
}

async function removeRows(tx: object, model: string, rows: Record<string, any>[], ctx: Ctx): Promise<void> {
  if (!rows.length) return;
  for (const rel of CHILD_RELATIONS.get(model) ?? []) {
    const where =
      rel.fks.length === 1
        ? { [rel.fks[0]]: { in: rows.map((r) => r[rel.refs[0]]) } }
        : { OR: rows.map((r) => Object.fromEntries(rel.fks.map((fk, i) => [fk, r[rel.refs[i]]]))) };
    const child = delegate(tx, rel.model);
    if (rel.onDelete === 'Cascade') {
      await removeRows(tx, rel.model, await child.findMany({ where }), ctx);
    } else if (rel.onDelete === 'SetNull') {
      await child.updateMany({ where, data: Object.fromEntries(rel.fks.map((fk) => [fk, null])) });
    } else if (await child.count({ where })) {
      throw knownError('P2003', `Cannot delete ${model}: ${rel.model} records still depend on it`);
    }
  }

  const release = releasedFields(model);
  const stamp = { deletedAt: ctx.at, deletedBy: ctx.by };
  const d = delegate(tx, model);
  if (!release.length) {
    await d.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: stamp });
    return;
  }
  for (const row of rows) {
    const data: Record<string, unknown> = { ...stamp };
    for (const f of release) {
      if (row[f.name] == null) continue;
      data[f.name] = isText(f) ? `${row[f.name]}${DELETED_SUFFIX}${ctx.at.getTime().toString(36)}` : null;
    }
    await d.update({ where: { id: row.id }, data });
  }
}

/** Soft-delete one row by a unique `where`. Returns the row as it was; P2025 if there is none. */
export function softDelete<T = any>(db: object, model: string, where: Record<string, unknown>): Promise<T> {
  return inTransaction(db, async (tx) => {
    const row = await delegate(tx, model).findUnique({ where });
    if (!row) throw knownError('P2025', `No ${model} record found to delete`);
    await removeRows(tx, model, [row], { at: new Date(), by: requestContext.userId() });
    return row;
  });
}

/** Soft-delete every live row matching `where`. */
export function softDeleteMany(db: object, model: string, where: Record<string, unknown>): Promise<{ count: number }> {
  return inTransaction(db, async (tx) => {
    const rows = await delegate(tx, model).findMany({ where });
    await removeRows(tx, model, rows, { at: new Date(), by: requestContext.userId() });
    return { count: rows.length };
  });
}
