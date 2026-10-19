/**
 * Detect a file's real type from its first bytes. The browser-supplied mimetype is
 * attacker-controlled, so uploads are accepted only when the content matches.
 * SVG is deliberately unsupported (it can carry scripts).
 */
export function sniffMime(buf: Buffer): string | null {
  const hex = (start: number, len: number) => buf.subarray(start, start + len).toString('hex');
  const ascii = (start: number, len: number) => buf.subarray(start, start + len).toString('latin1');
  if (buf.length < 12) return null;
  if (hex(0, 3) === 'ffd8ff') return 'image/jpeg';
  if (hex(0, 8) === '89504e470d0a1a0a') return 'image/png';
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'image/webp';
  if (ascii(4, 4) === 'ftyp' && /avif|avis/.test(ascii(8, 4))) return 'image/avif';
  if (ascii(4, 4) === 'ftyp' && /M4A |isom|mp42|M4B /.test(ascii(8, 4))) return 'audio/mp4';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  if (ascii(0, 3) === 'ID3' || (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WAVE') return 'audio/wav';
  if (ascii(0, 4) === 'OggS') return 'audio/ogg';
  return null;
}

/** Max size per detected type, in bytes. */
export const MAX_BYTES: Record<string, number> = {
  'image/jpeg': 15e6, 'image/png': 15e6, 'image/gif': 15e6, 'image/webp': 15e6, 'image/avif': 15e6,
  'application/pdf': 50e6,
  'audio/mpeg': 150e6, 'audio/mp4': 150e6, 'audio/wav': 150e6, 'audio/ogg': 150e6,
};
