import { Prisma } from '@prisma/client';

export type DmmfField = Prisma.DMMF.Field;

/** Field lookup per Prisma model, from the generated DMMF (no database access). */
const FIELDS = new Map<string, Map<string, DmmfField>>(
  Prisma.dmmf.datamodel.models.map((m) => [m.name, new Map(m.fields.map((f) => [f.name, f]))]),
);

export function fieldsOf(model: string): Map<string, DmmfField> {
  const fields = FIELDS.get(model);
  if (!fields) throw new Error(`Unknown Prisma model "${model}"`);
  return fields;
}

/** The Prisma delegate for a model name, e.g. delegate(db, 'EventRsvp') → db.eventRsvp. */
export function delegate(db: object, model: string): any {
  return (db as any)[model.charAt(0).toLowerCase() + model.slice(1)];
}

export interface ChildRelation {
  /** Model holding the foreign key. */
  model: string;
  fks: readonly string[];
  /** Referenced fields on the parent, aligned with `fks`. */
  refs: readonly string[];
  onDelete: string;
}

/** For each model, the relations whose foreign key points at it, with their onDelete action. */
export const CHILD_RELATIONS = new Map<string, ChildRelation[]>();
for (const m of Prisma.dmmf.datamodel.models) {
  for (const f of m.fields) {
    if (f.kind !== 'object' || !f.relationFromFields?.length) continue;
    const list = CHILD_RELATIONS.get(f.type) ?? [];
    list.push({
      model: m.name,
      fks: f.relationFromFields,
      refs: f.relationToFields ?? ['id'],
      // Prisma's defaults when the schema doesn't say: optional → SetNull, required → Restrict.
      onDelete: f.relationOnDelete ?? (f.isRequired ? 'Restrict' : 'SetNull'),
    });
    CHILD_RELATIONS.set(f.type, list);
  }
}
