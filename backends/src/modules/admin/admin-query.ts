import { BadRequestException } from '@nestjs/common';
import { humanize } from '../../core/common/util';
import type { DmmfField } from './admin-metadata.service';
import { ResourceConfig } from './resources';

/** Query string of `GET /admin/r/:resource`. Filters arrive as `filter.<field>=value` or `filter[<field>]=value`. */
export interface ListQuery {
  page?: string;
  pageSize?: string;
  search?: string;
  sort?: string;
  order?: string;
  status?: string;
  [key: string]: unknown;
}

function coerceFilterValue(f: DmmfField, value: string): unknown {
  if (value === 'null') return null;
  if (f.type === 'Boolean') return value === 'true';
  if (f.type === 'Int') return Number(value);
  return value;
}

/**
 * Turn a list query into Prisma `where` / `orderBy` / paging. Pure: no database access.
 * Unknown filter fields are ignored; invalid enum/number values are a 400.
 */
export function buildListQuery(
  res: ResourceConfig,
  modelFields: readonly DmmfField[],
  enumValues: (enumName: string) => string[] | undefined,
  q: ListQuery,
) {
  const fields = new Map(modelFields.map((f) => [f.name, f]));
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
    const allowed = enumValues(fields.get('status')!.type) ?? [];
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
    // deletedAt is left out: naming it in `where` switches off the soft-delete filter (see audit-trail.extension).
    if (!f || f.kind === 'object' || f.isList || f.type === 'Json' || field === 'deletedAt') continue;
    if (f.kind === 'enum' && value !== 'null' && !(enumValues(f.type) ?? []).includes(value)) {
      throw new BadRequestException(`${humanize(field)} must be one of: ${(enumValues(f.type) ?? []).join(', ')}`);
    }
    if (f.type === 'Int' && value !== 'null' && Number.isNaN(Number(value))) {
      throw new BadRequestException(`${humanize(field)} must be a number`);
    }
    where[field] = coerceFilterValue(f, value.slice(0, 200));
  }
  if (and.length) where.AND = and;

  const sortField = q.sort && fields.has(q.sort) ? q.sort : res.defaultSort?.field;
  const order = q.order === 'asc' || q.order === 'desc' ? q.order : res.defaultSort?.order ?? 'desc';
  const orderBy = sortField && fields.has(sortField) ? { [sortField]: order } : undefined;

  return { where, orderBy, page, pageSize };
}
