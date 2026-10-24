import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { humanize, passwordSchema, SAFE_URL, uniqueSlug } from '../../core/common/util';
import { AUDIT_FIELDS } from '../../core/prisma/audit-trail.extension';
import type { AdminMetadataService, DmmfField } from './admin-metadata.service';
import { ResourceConfig } from './resources';

/**
 * Turn an admin form body into Prisma `data` for `res`, validated against the DMMF:
 * skips system/hidden/read-only fields, coerces types, validates strings, hashes a
 * User password and fills a missing slug on create. Throws 400 with a readable message.
 */
export async function coerceWrite(
  meta: AdminMetadataService,
  res: ResourceConfig,
  body: Record<string, any>,
  isCreate: boolean,
) {
  const data: Record<string, unknown> = {};
  for (const f of meta.model(res).fields) {
    if (f.kind === 'object' || f.isId || f.isUpdatedAt || f.name === 'createdAt') continue;
    if ((AUDIT_FIELDS as readonly string[]).includes(f.name)) continue;
    if (!isCreate && res.createOnlyFields?.includes(f.name)) continue;
    if ((res.hidden ?? []).includes(f.name) || res.readOnlyFields?.includes(f.name)) continue;
    if (res.workflowStatuses && f.name === 'status' && !isCreate) continue; // use setStatus / workflows
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
          const allowed = meta.enumValues(f.type) ?? [];
          if (!allowed.includes(String(v))) {
            throw new BadRequestException(`${humanize(f.name)} must be one of: ${allowed.join(', ')}`);
          }
        } else if (!f.isList) {
          v = validateString(meta, res, f, String(v));
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
  if ('slug' in meta.fieldsByName(res) && isCreate && !data.slug) {
    const lf = res.labelField;
    const base = lf && typeof data[lf] === 'string' ? (data[lf] as string) : 'item';
    // Admin-created slugs keep their historical shape: max 60 chars, no accent folding, 4-char suffix.
    data.slug = uniqueSlug(base, { maxLength: 60, stripAccents: false, suffixLength: 4 });
  }
  return data;
}

/** Field-level rules on top of type coercion: safe URLs, emails, slugs, lengths. */
function validateString(meta: AdminMetadataService, res: ResourceConfig, f: DmmfField, v: string): string {
  const fm = meta.fieldMeta(res, f, meta.relations(res));
  const label = humanize(f.name);
  if (v.length > 50_000) throw new BadRequestException(`${label} is too long`);
  if ((fm.type === 'url' || fm.type === 'image') && !SAFE_URL.test(v.trim())) {
    throw new BadRequestException(`${label} must be an http(s) URL`);
  }
  if (f.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) {
    throw new BadRequestException(`${label} must be a valid email address`);
  }
  if (f.name === 'slug' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)) {
    throw new BadRequestException('Slug may only contain lowercase letters, numbers and dashes');
  }
  if (fm.relation && !/^[0-9a-f-]{36}$/i.test(v)) {
    throw new BadRequestException(`${label} must be a valid id`);
  }
  return fm.type === 'url' || fm.type === 'image' ? v.trim() : v;
}

/** Map Prisma write errors to 400/404 with admin-friendly messages; rethrow anything else. */
export function rethrowWriteError(e: unknown): never {
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
