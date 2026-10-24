import { readFile, stat } from 'fs/promises';
import { basename, extname, join } from 'path';
import { StorageService } from '../../../src/core/storage/storage.service';
import { Ctx, IMPORT_ACTOR } from './context';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml',
  heic: 'image/heic', avif: 'image/avif', pdf: 'application/pdf', mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav',
  mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', doc: 'application/msword', rtf: 'application/rtf', zip: 'application/zip',
};
const mimeOf = (file: string) => MIME[extname(file).slice(1).toLowerCase()] ?? 'application/octet-stream';

/** Hosts the old site's files were served from (live domain + the SiteGround staging alias). */
const UPLOAD_URL = /(?:https?:)?\/\/(?:www\.)?(?:forum\.club|forum500\.club|jessicaj37\.sg-host\.com)\/wp-content\/uploads\/([^"'\s)<>?#\\]+)/gi;

const safeSegment = (s: string) => s.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file';

/**
 * Copies only the files that imported content actually uses from the WordPress uploads folder
 * into the app's storage (key `uploads/wp/<original path>`, so re-runs overwrite the same
 * objects), registers each as an Asset, and hands back the new URL.
 */
export class Media {
  private readonly storage = new StorageService();
  private readonly attachments = new Map<string, string>(); // attachment id → relative path
  private readonly done = new Map<string, string | null>(); // relative path → new URL (null = missing)
  bytes = 0;

  constructor(private readonly ctx: Ctx) {}

  async load() {
    // PENDING (production storage not chosen yet): file URLs are saved into the imported rows as they are built
    // now, so an import run against local storage bakes "http://localhost:4000/..." into avatars, newsletters and
    // articles. Run the production import fresh, with the production storage settings, and never promote a
    // rehearsal database.
    const sample = this.storage.publicUrl('uploads/wp/example.jpg');
    if (/^https?:\/\/(localhost|127\.0\.0\.1)\b/i.test(sample)) {
      const msg = `File URLs will point at ${new URL(sample).origin}. Fine for a local rehearsal; for production set STORAGE_DRIVER=s3 / ASSET_PUBLIC_BASE_URL first.`;
      console.warn(`\n  WARNING: ${msg}\n`);
      this.ctx.report.issue('Warnings', msg);
    }
    const rows = await this.ctx.q<{ id: number; path: string }>(
      `SELECT post_id AS id, meta_value AS path FROM {postmeta} WHERE meta_key = '_wp_attached_file'`,
    );
    for (const r of rows) this.attachments.set(String(r.id), r.path);
    this.ctx.report.expect('file (media library)', rows.length);
  }

  /** Relative uploads path for an old URL, or null if it isn't a WordPress upload. */
  static uploadPath(url: string): string | null {
    UPLOAD_URL.lastIndex = 0;
    const m = UPLOAD_URL.exec(url.trim());
    if (!m) return null;
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }

  /** New URL for an attachment id or an old upload URL; null when it can't be resolved. */
  async url(ref: string | number | null | undefined): Promise<string | null> {
    if (ref === null || ref === undefined || ref === '' || ref === 0 || ref === '0') return null;
    const asString = String(ref);
    const path = /^\d+$/.test(asString) ? this.attachments.get(asString) : Media.uploadPath(asString);
    if (!path) {
      if (/^\d+$/.test(asString)) this.ctx.report.issue('Missing files', `attachment #${asString} not in the media library`);
      return /^https?:\/\//.test(asString) && !/\/wp-content\//.test(asString) ? asString : null;
    }
    return this.copy(path);
  }

  /** Replace every old upload URL inside a block of HTML. Unresolvable ones are left as they are (and reported). */
  async rewriteHtml(html: string): Promise<string> {
    const found = [...new Set([...html.matchAll(UPLOAD_URL)].map((m) => m[0]))];
    let out = html;
    for (const old of found) {
      const url = await this.url(old);
      if (url) out = out.split(old).join(url);
    }
    return out;
  }

  /** A file that isn't in WordPress uploads (e.g. the magazine content folder). */
  async local(absPath: string, keyPath: string): Promise<string | null> {
    return this.store(absPath, `uploads/wp/${keyPath.split('/').map(safeSegment).join('/')}`, `local:${keyPath}`);
  }

  private copy(relPath: string): Promise<string | null> {
    return this.store(join(this.ctx.opt.uploadsDir, relPath), `uploads/wp/${relPath.split('/').map(safeSegment).join('/')}`, relPath);
  }

  private async store(absPath: string, key: string, legacyId: string): Promise<string | null> {
    if (this.done.has(legacyId)) return this.done.get(legacyId)!;
    let size: number;
    try {
      size = (await stat(absPath)).size;
    } catch {
      this.ctx.report.issue('Missing files', legacyId);
      this.done.set(legacyId, null);
      return null;
    }
    const url = this.storage.publicUrl(key);
    this.bytes += size;
    if (this.ctx.opt.dryRun) {
      this.ctx.report.count('file', 'copied');
      this.done.set(legacyId, url);
      return url;
    }
    const mime = mimeOf(absPath);
    const known = this.ctx.idOf('file', legacyId);
    if (!known) await this.storage.putAt(key, await readFile(absPath), mime);
    await this.ctx.upsert('file', legacyId, 'Asset', {
      find: () => this.ctx.db.asset.findFirst({ where: { storageKey: key }, select: { id: true } }),
      create: () =>
        this.ctx.db.asset.create({
          data: { url, storageKey: key, driver: this.storage.driver, filename: basename(absPath), mime, size, createdBy: IMPORT_ACTOR },
        }),
      exists: async (id) => !!(await this.ctx.db.asset.findUnique({ where: { id }, select: { id: true } })),
    });
    this.done.set(legacyId, url);
    return url;
  }
}
