import { PrismaClient } from '@prisma/client';
import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import { auditTrail } from '../../../src/core/prisma/audit-trail.extension';

export const IMPORT_ACTOR = 'wp-import';

export interface Options {
  dryRun: boolean;
  only: Set<string> | null;
  uploadsDir: string;
  contentDir: string | null;
  xmlPath: string | null;
  reportDir: string;
  prefix: string;
  newsletterRecipients: boolean;
}

type Db = ReturnType<typeof createDb>;
const createDb = () => new PrismaClient().$extends(auditTrail);

/** Everything a step needs: both databases, options, the legacy-id map and the report. */
export class Ctx {
  readonly db: Db = createDb();
  readonly wp: Pool;
  readonly report = new Report();
  /** In-memory copy of LegacyMap for this run: "entity:legacyId" → newId. */
  private readonly ids = new Map<string, string>();
  private dryCounter = 0;

  constructor(readonly opt: Options, wpUrl: string) {
    // dateStrings: WordPress stores *_gmt columns as UTC strings; don't let the driver shift them.
    this.wp = createPool({ uri: wpUrl, dateStrings: true, charset: 'utf8mb4', connectionLimit: 4 });
  }

  /** Table name with the WordPress prefix, e.g. t('posts') → cnj_posts. */
  t(table: string) {
    return `\`${this.opt.prefix}${table}\``;
  }

  async q<T = Record<string, any>>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.wp.query<RowDataPacket[]>(sql.replace(/\{(\w+)\}/g, (_, t) => this.t(t)), params);
    return rows as T[];
  }

  async loadMap() {
    const rows = await this.db.legacyMap.findMany({ where: { source: 'wordpress' }, select: { entity: true, legacyId: true, newId: true } });
    for (const r of rows) this.ids.set(`${r.entity}:${r.legacyId}`, r.newId);
  }

  /** New id for an imported legacy row, if it was imported (this run or before). */
  idOf(entity: string, legacyId: string | number): string | undefined {
    return this.ids.get(`${entity}:${legacyId}`);
  }

  /**
   * Create or update one target row for a legacy row, remembering the link in LegacyMap.
   * - not imported before → `create()`
   * - imported before and the row still exists → `update(id)` (re-runs refresh it)
   * - imported before but deleted since by an admin → left deleted (reported)
   * In a dry run nothing is written and a placeholder id is returned.
   */
  async upsert(
    entity: string,
    legacyId: string | number,
    model: string,
    ops: { find?: () => Promise<{ id: string } | null>; create: () => Promise<{ id: string }>; update?: (id: string) => Promise<unknown>; exists: (id: string) => Promise<boolean> },
    urls?: { oldUrl?: string | null; newUrl?: string | null },
  ): Promise<string | null> {
    const key = `${entity}:${legacyId}`;
    const known = this.ids.get(key);
    if (this.opt.dryRun) {
      const id = known ?? `dry-${entity}-${legacyId}-${++this.dryCounter}`;
      this.ids.set(key, id);
      this.report.count(entity, known ? 'updated' : 'created');
      return id;
    }
    if (known) {
      if (!(await ops.exists(known))) {
        this.report.count(entity, 'skipped (deleted in app)');
        return null;
      }
      if (ops.update) await ops.update(known);
      await this.remember(entity, legacyId, model, known, urls);
      this.report.count(entity, 'updated');
      return known;
    }
    const existing = ops.find ? await ops.find() : null;
    const id = existing ? existing.id : (await ops.create()).id;
    if (existing && ops.update) await ops.update(existing.id);
    await this.remember(entity, legacyId, model, id, urls);
    this.report.count(entity, existing ? 'linked to existing' : 'created');
    return id;
  }

  private async remember(entity: string, legacyId: string | number, model: string, newId: string, urls?: { oldUrl?: string | null; newUrl?: string | null }) {
    this.ids.set(`${entity}:${legacyId}`, newId);
    await this.db.legacyMap.upsert({
      where: { source_entity_legacyId: { source: 'wordpress', entity, legacyId: String(legacyId) } },
      create: { entity, legacyId: String(legacyId), model, newId, oldUrl: urls?.oldUrl ?? null, newUrl: urls?.newUrl ?? null, createdBy: IMPORT_ACTOR },
      update: { model, newId, ...(urls && { oldUrl: urls.oldUrl ?? null, newUrl: urls.newUrl ?? null }) },
    });
  }

  /** Record an old URL → new path redirect that isn't tied to a single row. */
  async redirect(oldPath: string, newPath: string) {
    if (this.opt.dryRun) return this.report.count('redirect', 'saved');
    const legacyId = oldPath;
    await this.db.legacyMap.upsert({
      where: { source_entity_legacyId: { source: 'wordpress', entity: 'redirect', legacyId } },
      create: { entity: 'redirect', legacyId, model: 'Path', newId: newPath, oldUrl: oldPath, newUrl: newPath, createdBy: IMPORT_ACTOR },
      update: { newId: newPath, oldUrl: oldPath, newUrl: newPath },
    });
    this.report.count('redirect', 'saved');
  }

  /** Run a step unless --only excludes it; errors are reported and the import continues. */
  async step(name: string, fn: () => Promise<void>) {
    if (this.opt.only && !this.opt.only.has(name)) return;
    const started = Date.now();
    console.log(`→ ${name}`);
    try {
      await fn();
      console.log(`  done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    } catch (e) {
      console.error(`  FAILED: ${(e as Error).stack}`);
      this.report.issue('Step failures', `${name}: ${(e as Error).message}`);
    }
  }

  async close() {
    await this.wp.end();
    await this.db.$disconnect();
  }
}

/** Counts per entity, plus lists of things a person should look at. */
export class Report {
  readonly counts = new Map<string, Map<string, number>>();
  readonly issues = new Map<string, string[]>();
  readonly expected = new Map<string, number>();
  readonly notes = new Map<string, string>();

  note(entity: string, text: string) {
    this.notes.set(entity, text);
  }

  count(entity: string, outcome: string, n = 1) {
    const m = this.counts.get(entity) ?? new Map<string, number>();
    m.set(outcome, (m.get(outcome) ?? 0) + n);
    this.counts.set(entity, m);
  }

  issue(section: string, line: string) {
    const list = this.issues.get(section) ?? [];
    list.push(line);
    this.issues.set(section, list);
  }

  expect(entity: string, n: number) {
    this.expected.set(entity, n);
  }

  toMarkdown(title: string): string {
    const out = [`# ${title}`, '', '## Counts', '', '| Entity | Expected (WordPress) | Result |', '|---|---|---|'];
    const entities = [...new Set([...this.expected.keys(), ...this.counts.keys(), ...this.notes.keys()])];
    for (const e of entities) {
      const parts = [...(this.counts.get(e) ?? new Map()).entries()].map(([k, v]) => `${v} ${k}`);
      if (this.notes.has(e)) parts.push(this.notes.get(e)!);
      const result = parts.join(', ') || '—';
      out.push(`| ${e} | ${this.expected.get(e) ?? ''} | ${result} |`);
    }
    for (const [section, lines] of this.issues) {
      out.push('', `## ${section} (${lines.length})`, '');
      for (const l of lines) out.push(`- ${l}`);
    }
    return out.join('\n') + '\n';
  }

  toJSON() {
    return {
      expected: Object.fromEntries(this.expected),
      counts: Object.fromEntries([...this.counts].map(([k, v]) => [k, Object.fromEntries(v)])),
      notes: Object.fromEntries(this.notes),
      issues: Object.fromEntries(this.issues),
    };
  }
}
