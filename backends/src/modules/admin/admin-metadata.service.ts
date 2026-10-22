import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { humanize } from '../../core/common/util';
import { AUDIT_FIELDS } from '../../core/prisma/audit-trail.extension';
import { LINK_FIELDS, RESOURCES, ResourceConfig, TEXT_FIELDS } from './resources';

export type DmmfField = Prisma.DMMF.Field;
export type DmmfModel = Prisma.DMMF.Model;

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
  /** Set once on create, read-only afterwards (e.g. Setting.key). */
  createOnly?: boolean;
}

const AUDIT = new Set<string>(AUDIT_FIELDS);
/** Audit actor columns, shown in "Record details" as a link to the user. */
export const ACTOR_FIELDS = ['createdBy', 'updatedBy'] as const;

export interface RelationInfo {
  fk: string;
  relationName: string;
  resource: ResourceConfig;
}

/**
 * Everything the admin engine knows about a resource *without* touching the database:
 * the Prisma model (DMMF), field metadata for the admin UI (`GET /admin/meta`), relation
 * includes, and how a row is presented (`_label`, `_relations`, hidden fields stripped).
 */
@Injectable()
export class AdminMetadataService {
  private readonly models = new Map<string, DmmfModel>(
    Prisma.dmmf.datamodel.models.map((m) => [m.name, m]),
  );
  private readonly enums = new Map<string, string[]>(
    Prisma.dmmf.datamodel.enums.map((e) => [e.name, e.values.map((v) => v.name)]),
  );
  private readonly byName = new Map(RESOURCES.map((r) => [r.name, r]));
  private readonly byModel = new Map(RESOURCES.map((r) => [r.model, r]));

  resource(name: string): ResourceConfig {
    const res = this.byName.get(name);
    if (!res) throw new NotFoundException(`Unknown resource "${name}"`);
    return res;
  }

  model(res: ResourceConfig): DmmfModel {
    return this.models.get(res.model)!;
  }

  /** Values of a Prisma enum, e.g. enumValues('EventStatus'). */
  enumValues(enumName: string): string[] | undefined {
    return this.enums.get(enumName);
  }

  fieldsByName(res: ResourceConfig): Record<string, DmmfField> {
    return Object.fromEntries(this.model(res).fields.map((f) => [f.name, f]));
  }

  idField(res: ResourceConfig): string {
    return this.model(res).fields.find((f) => f.isId)!.name;
  }

  labelFieldOf(res: ResourceConfig): string {
    return res.labelField ?? 'id';
  }

  /** Foreign keys of this resource that point at another registered resource. */
  relations(res: ResourceConfig): RelationInfo[] {
    const out: RelationInfo[] = [];
    for (const f of this.model(res).fields) {
      if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
      const target = this.byModel.get(f.type);
      if (target) out.push({ fk: f.relationFromFields[0], relationName: f.name, resource: target });
    }
    return out;
  }

  fieldMeta(res: ResourceConfig, f: DmmfField, rels: RelationInfo[]): FieldMeta {
    const createOnly = !!res.createOnlyFields?.includes(f.name);
    const readOnly =
      f.isId || f.isUpdatedAt || f.name === 'createdAt' || AUDIT.has(f.name) || createOnly || !!res.readOnlyFields?.includes(f.name);
    const rel = rels.find((r) => r.fk === f.name);
    const actor = (ACTOR_FIELDS as readonly string[]).includes(f.name);
    let type: FieldMeta['type'] = 'string';
    if (rel || actor) type = 'relation';
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
      hidden: f.name === 'deletedAt' || f.name === 'deletedBy' || (res.hidden ?? []).includes(f.name),
      enumValues: f.kind === 'enum' ? this.enums.get(f.type) : undefined,
      relation: rel
        ? { resource: rel.resource.name, labelField: this.labelFieldOf(rel.resource) }
        : actor ? { resource: 'users', labelField: 'email' } : undefined,
      createOnly: createOnly || undefined,
      default:
        f.hasDefaultValue && (typeof f.default !== 'object' || Array.isArray(f.default))
          ? f.default
          : undefined,
    };
  }

  /** Field name → display label, used for audit diffs. */
  fieldLabels(res: ResourceConfig): Record<string, string> {
    const rels = this.relations(res);
    return Object.fromEntries(
      this.model(res).fields.filter((f) => f.kind !== 'object').map((f) => [f.name, this.fieldMeta(res, f, rels).label]),
    );
  }

  /** `GET /admin/meta`: the whole registry, in sidebar order, with per-field metadata. */
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
          workflowStatuses: res.workflowStatuses,
          defaultQuery: res.defaultQuery,
          fields,
        };
      }),
    };
  }

  /** Prisma `include` that loads just the label of every related record. */
  include(res: ResourceConfig) {
    const include: Record<string, unknown> = {};
    for (const rel of this.relations(res)) {
      const lf = this.labelFieldOf(rel.resource);
      include[rel.relationName] = { select: { id: true, ...(lf !== 'id' ? { [lf]: true } : {}) } };
    }
    return Object.keys(include).length ? include : undefined;
  }

  /** Strip hidden fields, flatten relation labels into `_relations`, add `_label`. */
  present(res: ResourceConfig, row: any) {
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
}
