/* eslint-disable no-console */
/**
 * Imports the old forum.club WordPress site into this app (see docs/wordpress-migration/PLAN.md).
 *
 *   npm run wp:import -- --dry-run                 read everything, write nothing, produce the report
 *   npm run wp:import                              import (safe to re-run: updates what it imported before)
 *   npm run wp:import -- --only=members,messages   run selected steps
 *   --newsletter-recipients                        also import who received / opened each newsletter (each newsletter is
 *                                                  then shown only to its recipients; by default all members see all of them,
 *                                                  like the old Newsletter Archive)
 *
 * Steps: lookups users members interviews whatsapp messages newsletters magazines podcast library gallery posts projects-csv
 *
 * Environment (besides the app's own DATABASE_URL / storage settings):
 *   WP_DB_URL       mysql://root:localonly@127.0.0.1:3307/wp   (the restored WordPress dump)
 *   WP_UPLOADS_DIR  the wp-content/uploads folder
 *   WP_CONTENT_DIR  magazine article folders (Things/Content), optional
 *   WP_XML          the WordPress export file, optional (count cross-check)
 *   WP_REPORT_DIR   where the report goes (default ./wp-import-report)
 *   WP_TABLE_PREFIX default cnj_
 *
 * Never truncates or deletes anything, and never runs the seed.
 */
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { Ctx } from './lib/context';
import { Media } from './lib/media';
import { importComms } from './steps/comms';
import { importContent } from './steps/content';
import { importPeople, People } from './steps/people';

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit === undefined ? undefined : hit.includes('=') ? hit.split('=').slice(1).join('=') : 'true';
}

async function main() {
  const wpUrl = process.env.WP_DB_URL;
  const uploadsDir = process.env.WP_UPLOADS_DIR;
  if (!wpUrl || !uploadsDir) {
    console.error('Set WP_DB_URL and WP_UPLOADS_DIR (see the header of scripts/import-wordpress/index.ts).');
    process.exit(1);
  }
  if (!existsSync(uploadsDir)) {
    console.error(`WP_UPLOADS_DIR not found: ${uploadsDir}`);
    process.exit(1);
  }
  const reportDir = resolve(process.env.WP_REPORT_DIR ?? 'wp-import-report');
  mkdirSync(reportDir, { recursive: true });
  const only = arg('only');
  const ctx = new Ctx(
    {
      dryRun: arg('dry-run') === 'true',
      only: only ? new Set(only.split(',').map((s) => s.trim())) : null,
      uploadsDir: resolve(uploadsDir),
      contentDir: process.env.WP_CONTENT_DIR ? resolve(process.env.WP_CONTENT_DIR) : null,
      xmlPath: process.env.WP_XML ? resolve(process.env.WP_XML) : null,
      reportDir,
      prefix: process.env.WP_TABLE_PREFIX ?? 'cnj_',
      newsletterRecipients: arg('newsletter-recipients') === 'true',
    },
    wpUrl,
  );
  const target = (process.env.DATABASE_URL ?? '').replace(/\/\/[^@]*@/, '//***@');
  console.log(`WordPress import${ctx.opt.dryRun ? ' (DRY RUN: nothing is written)' : ''}\n  from ${wpUrl.replace(/\/\/[^@]*@/, '//***@')}\n  into ${target}`);

  const started = Date.now();
  try {
    await ctx.loadMap();
    const media = new Media(ctx);
    await media.load();
    const people: People = { memberByUser: new Map(), memberByName: new Map(), memberSlug: new Map(), memberByEmail: new Map(), chapterByKey: new Map() };
    await importPeople(ctx, media, people);
    await importComms(ctx, media, people);
    await importContent(ctx, media, people);
    await crossCheck(ctx);
    ctx.report.note('file', `${(media.bytes / 1024 / 1024).toFixed(0)} MB`);
  } finally {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const name = `${ctx.opt.dryRun ? 'dry-run' : 'import'}-${stamp}`;
    const title = `WordPress import ${ctx.opt.dryRun ? '(dry run) ' : ''}${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
    writeFileSync(resolve(reportDir, `${name}.md`), ctx.report.toMarkdown(title));
    writeFileSync(resolve(reportDir, `${name}.json`), JSON.stringify(ctx.report.toJSON(), null, 2));
    console.log(`\nReport: ${resolve(reportDir, `${name}.md`)}  (${((Date.now() - started) / 1000).toFixed(0)}s)`);
    await ctx.close();
  }
}

/** The XML export is a subset of the database dump; flag it if the two disagree (e.g. one is newer). */
async function crossCheck(ctx: Ctx) {
  if (!ctx.opt.xmlPath || !existsSync(ctx.opt.xmlPath)) return;
  const xml = readFileSync(ctx.opt.xmlPath, 'utf8');
  const xmlCounts = new Map<string, number>();
  for (const m of xml.matchAll(/<wp:post_type><!\[CDATA\[([^\]]+)\]\]><\/wp:post_type>/g)) xmlCounts.set(m[1], (xmlCounts.get(m[1]) ?? 0) + 1);
  const dbRows = await ctx.q<{ type: string; n: number }>(
    `SELECT post_type type, COUNT(*) n FROM {posts} WHERE post_status NOT IN ('auto-draft', 'inherit', 'trash') OR post_type = 'attachment' GROUP BY post_type`,
  );
  for (const type of ['hp_listing', 'post', 'page', 'events', 'whatsapp-accounts', 'attachment', 'r3d']) {
    const inXml = xmlCounts.get(type) ?? 0;
    const inDb = Number(dbRows.find((r) => r.type === type)?.n ?? 0);
    ctx.report.note(`cross-check: ${type}`, `XML ${inXml} / SQL ${inDb}`);
    if (inXml !== inDb) ctx.report.issue('XML export and SQL dump differ', `${type}: XML has ${inXml}, SQL dump has ${inDb}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
