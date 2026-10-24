import bcrypt from 'bcryptjs';
import { createHash, createHmac, timingSafeEqual } from 'crypto';

/**
 * Password hashes carried over from the old forum.club WordPress site (see
 * docs/wordpress-migration). A member's first successful login verifies the legacy hash and
 * replaces it with argon2, so these only ever exist for members who haven't logged in since.
 *
 *  - `$wp$2y$…`  WordPress 6.8+: bcrypt over base64(HMAC-SHA384(password, key "wp-sha384"))
 *  - `$P$…`/`$H$…`  phpass "portable" hashes (WordPress before 6.8): iterated MD5
 *  - `$2y$…`     plain bcrypt (written by some WordPress plugins)
 */
export function isLegacyHash(hash: string): boolean {
  return hash.startsWith('$wp$') || hash.startsWith('$P$') || hash.startsWith('$H$') || /^\$2[aby]\$/.test(hash);
}

export async function verifyLegacyPassword(password: string, hash: string): Promise<boolean> {
  if (hash.startsWith('$wp$')) {
    const prehashed = createHmac('sha384', 'wp-sha384').update(password).digest('base64');
    return bcryptCompare(prehashed, hash.slice(3));
  }
  if (/^\$2[aby]\$/.test(hash)) return bcryptCompare(password, hash);
  if (hash.startsWith('$P$') || hash.startsWith('$H$')) return phpassCheck(password, hash);
  return false;
}

// PHP writes bcrypt as $2y$; it is the same algorithm as $2b$.
const bcryptCompare = (password: string, hash: string) => bcrypt.compare(password, hash.replace(/^\$2y\$/, '$2b$'));

const ITOA64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function phpassCheck(password: string, stored: string): boolean {
  const countLog2 = ITOA64.indexOf(stored[3]);
  if (stored.length !== 34 || countLog2 < 7 || countLog2 > 30) return false;
  const salt = stored.slice(4, 12);
  const pw = Buffer.from(password, 'utf8');
  let hash = createHash('md5').update(Buffer.concat([Buffer.from(salt, 'binary'), pw])).digest();
  for (let count = 1 << countLog2; count > 0; count--) {
    hash = createHash('md5').update(Buffer.concat([hash, pw])).digest();
  }
  const computed = Buffer.from(stored.slice(0, 12) + encode64(hash, 16), 'binary');
  const expected = Buffer.from(stored, 'binary');
  return computed.length === expected.length && timingSafeEqual(computed, expected);
}

function encode64(input: Buffer, count: number): string {
  let output = '';
  let i = 0;
  do {
    let value = input[i++];
    output += ITOA64[value & 0x3f];
    if (i < count) value |= input[i] << 8;
    output += ITOA64[(value >> 6) & 0x3f];
    if (i++ >= count) break;
    if (i < count) value |= input[i] << 16;
    output += ITOA64[(value >> 12) & 0x3f];
    if (i++ >= count) break;
    output += ITOA64[(value >> 18) & 0x3f];
  } while (i < count);
  return output;
}
