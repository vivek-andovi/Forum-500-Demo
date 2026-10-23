/** Text helpers: WordPress HTML → the plain paragraphs the apps render, names, slugs. */

const NAMED: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', bull: '•', middot: '·',
  copy: '©', reg: '®', trade: '™', euro: '€', pound: '£', deg: '°', times: '×', eacute: 'é', egrave: 'è',
  aacute: 'á', agrave: 'à', uuml: 'ü', ouml: 'ö', auml: 'ä', Uuml: 'Ü', Ouml: 'Ö', Auml: 'Ä', szlig: 'ß',
  ccedil: 'ç', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', ecirc: 'ê', acirc: 'â', ocirc: 'ô',
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return NAMED[code] ?? NAMED[code.toLowerCase()] ?? m;
  });
}

/** Collapse whitespace inside a line; keep the text readable. */
const tidy = (s: string) => s.replace(/[ \t ]+/g, ' ').replace(/ *\n */g, '\n').trim();

/**
 * HTML (WordPress post content, Elementor output, Outlook pastes) → paragraphs.
 * Drops style/script/media, keeps line breaks and link text, decodes entities.
 */
export function htmlToParagraphs(html: string | null | undefined): string[] {
  if (!html) return [];
  let s = html
    .replace(/\r\n?/g, '\n')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(style|script|noscript|svg|iframe|video|audio|figure)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/\[\/?[a-z_0-9-]+(?:\s[^\]]*)?\]/gi, '') // WordPress shortcodes
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|section|article|tr|ul|ol|table)>/gi, '\n\n')
    .replace(/<li\b[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '');
  // Classic-editor content uses blank lines as paragraph breaks.
  s = decodeEntities(s);
  return s
    .split(/\n\s*\n+/)
    .map(tidy)
    .filter((p) => p && !/^[\s•·\-–—]*$/.test(p));
}

export const htmlToText = (html: string | null | undefined) => htmlToParagraphs(html).join('\n\n');

/** Plain text (already decoded) → paragraphs on blank lines. */
export const textParagraphs = (s: string) => s.split(/\n\s*\n+/).map(tidy).filter(Boolean);

export function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** For matching people / places by name: "Zürich" = "zurich", "Dr. Jane O'Neil" = "dr jane oneil". */
export function nameKey(s: string): string {
  return stripAccents(decodeEntities(s)).toLowerCase().replace(/['’`.]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

export function slugify(s: string, max = 80): string {
  const slug = stripAccents(decodeEntities(s))
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
  return slug || 'item';
}

/** "NEW YORK" → "New York", "ALAN HILBURG" → "Alan Hilburg"; mixed-case input is left alone. */
export function titleCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s\-‘'(/])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
}

export const SPELLED: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** "September 25th 2026", "25 September 2026", "24/03/2020" (dd/mm/yyyy) → Date (UTC noon), or null. */
export function parseLooseDate(label: string): Date | null {
  const s = label.trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Date.UTC(+dmy[3], +dmy[2] - 1, +dmy[1], 12));
  const mdy = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/);
  if (mdy && MONTHS.includes(mdy[1].toLowerCase())) return new Date(Date.UTC(+mdy[3], MONTHS.indexOf(mdy[1].toLowerCase()), +mdy[2], 12));
  const dmy2 = s.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})/);
  if (dmy2 && MONTHS.includes(dmy2[2].toLowerCase())) return new Date(Date.UTC(+dmy2[3], MONTHS.indexOf(dmy2[2].toLowerCase()), +dmy2[1], 12));
  return null;
}

/** MySQL DATETIME string in UTC ("2026-10-20 11:27:55") → Date, or null for zero dates. */
export function mysqlUtc(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (v.startsWith('0000')) return null;
  const d = new Date(v.replace(' ', 'T') + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}
