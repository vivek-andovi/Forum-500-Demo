import { Injectable } from '@nestjs/common';
import { AdminCrudRepository } from './admin-crud.repository';
import { AdminMetadataService, DmmfModel, USER_FIELDS } from './admin-metadata.service';
import { ResourceConfig } from './resources';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

type Row = Record<string, any> & { _relations: Record<string, string | null> };

/** Ids to look up, per model. */
class Wanted {
  private readonly byModel = new Map<string, Set<string>>();
  add(model: string, v: unknown) {
    for (const id of Array.isArray(v) ? v : [v]) {
      if (!isId(id)) continue;
      if (!this.byModel.has(model)) this.byModel.set(model, new Set());
      this.byModel.get(model)!.add(id);
    }
  }
  entries() {
    return [...this.byModel].map(([model, ids]) => [model, [...ids]] as const);
  }
}

/**
 * Turns ids the admin would otherwise show raw into readable labels, after
 * AdminMetadataService.present() has labelled the plain relations:
 *  - user-id columns (createdBy, updatedBy, uploadedBy) → the user's email, in `_relations`
 *  - `idLabels.from`       → another column of the same row (e.g. audit actorId → actorEmail)
 *  - `idLabels.polymorphic`→ the record named by a type column (comment target)
 *  - `idLabels.json`       → ids inside JSON columns, as `_refs: { [id]: label }`
 * Deleted records keep their name with " (deleted)", since history still points at them.
 */
@Injectable()
export class AdminLabelsService {
  constructor(
    private readonly repo: AdminCrudRepository,
    private readonly metadata: AdminMetadataService,
  ) {}

  async label(res: ResourceConfig, rows: Row[]): Promise<Row[]> {
    if (!rows.length) return rows;
    const cfg = res.idLabels ?? {};
    const wanted = new Wanted();
    const jsonIds = new Map<Row, Wanted>();

    for (const r of rows) {
      for (const f of USER_FIELDS) wanted.add('User', r[f]);
      for (const [f, source] of Object.entries(cfg.from ?? {})) if (r[f]) r._relations[f] = r[source] ?? null;
      const poly = cfg.polymorphic;
      const polyModel = poly && poly.models[r[poly.typeField]];
      if (polyModel) wanted.add(polyModel, r[poly.field]);
      for (const [field, model] of Object.entries(cfg.json ?? {})) {
        const ids = jsonIds.get(r) ?? new Wanted();
        if (model === 'audit') this.collectAuditChanges(r, ids);
        else this.collectJson(this.metadata.modelByName(model), r[field], ids);
        jsonIds.set(r, ids);
        for (const [m, list] of ids.entries()) wanted.add(m, list);
      }
    }

    const labels = await this.resolve(wanted);
    for (const r of rows) {
      for (const f of USER_FIELDS) if (isId(r[f])) r._relations[f] = labels.get(r[f]) ?? null;
      const poly = cfg.polymorphic;
      if (poly && r[poly.field]) r._relations[poly.field] = labels.get(r[poly.field]) ?? null;
      const ids = jsonIds.get(r);
      if (ids) {
        r._refs = Object.fromEntries(
          ids.entries().flatMap(([, list]) => list.filter((id) => labels.has(id)).map((id) => [id, labels.get(id)!])),
        );
      }
    }
    return rows;
  }

  /** JSON whose keys are field names of `model`: FK values → target model; nested lists recurse. */
  private collectJson(model: DmmfModel | undefined, value: unknown, out: Wanted) {
    if (!model || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) return value.forEach((v) => this.collectJson(model, v, out));
    for (const [key, v] of Object.entries(value)) {
      const relation = model.fields.find((f) => f.kind === 'object' && f.relationFromFields?.includes(key));
      if (relation) out.add(relation.type, v);
      const nested = model.fields.find((f) => f.kind === 'object' && f.isList && f.name === key);
      if (nested) this.collectJson(this.metadata.modelByName(nested.type), v, out);
    }
  }

  /**
   * Audit `changes` [{ field, from, to }]: FK fields of the entry's resource → target model.
   * Workflows can record another model's fields (approving a profile revision changes the
   * Member), so the models of that resource's `idLabels.json` are searched too.
   */
  private collectAuditChanges(row: Row, out: Wanted) {
    const res = this.metadata.findResource(String(row.entity ?? ''));
    if (!res || !Array.isArray(row.changes)) return;
    const models = [res.model, ...Object.values(res.idLabels?.json ?? {})]
      .map((m) => this.metadata.modelByName(m))
      .filter((m): m is DmmfModel => !!m);
    for (const c of row.changes) {
      const relation = models
        .flatMap((m) => m.fields)
        .find((f) => f.kind === 'object' && f.relationFromFields?.includes(c?.field));
      if (!relation) continue;
      out.add(relation.type, c.from);
      out.add(relation.type, c.to);
    }
  }

  private async resolve(wanted: Wanted): Promise<Map<string, string>> {
    const labels = new Map<string, string>();
    await Promise.all(
      wanted.entries().map(async ([model, ids]) => {
        const labelField = model === 'User' ? 'email' : this.metadata.resourceForModel(model)?.labelField;
        if (!labelField) return;
        for (const row of await this.repo.findLabels(model, ids, labelField)) {
          // Soft delete may have suffixed a unique label (name~deleted~…); show the original.
          const text = String(row[labelField] ?? '').split('~deleted~')[0].slice(0, 120);
          labels.set(row.id, row.deletedAt ? `${text} (deleted)` : text);
        }
      }),
    );
    return labels;
  }
}
