/**
 * Minimal PHP unserialize() for WordPress option / meta values (arrays, strings, numbers,
 * booleans, null). String lengths in PHP are byte counts, so this walks a UTF-8 buffer.
 * Objects are read as plain records. Returns null for anything that doesn't parse.
 */
export function phpUnserialize(input: string | null | undefined): any {
  if (!input || !/^[aOsibdN][:;]/.test(input)) return null;
  const buf = Buffer.from(input, 'utf8');
  let i = 0;
  const readUntil = (ch: string) => {
    const end = buf.indexOf(ch, i);
    if (end < 0) throw new Error('unterminated');
    const s = buf.toString('utf8', i, end);
    i = end + 1;
    return s;
  };
  const expect = (ch: string) => {
    if (String.fromCharCode(buf[i]) !== ch) throw new Error(`expected ${ch} at ${i}`);
    i++;
  };
  const value = (): any => {
    const type = String.fromCharCode(buf[i]);
    i += 2; // "x:" or "N;"
    switch (type) {
      case 'N':
        return null;
      case 'b':
        return readUntil(';') === '1';
      case 'i':
        return parseInt(readUntil(';'), 10);
      case 'd':
        return parseFloat(readUntil(';'));
      case 's': {
        const len = parseInt(readUntil(':'), 10);
        expect('"');
        const s = buf.toString('utf8', i, i + len);
        i += len;
        expect('"');
        expect(';');
        return s;
      }
      case 'a': {
        const n = parseInt(readUntil(':'), 10);
        expect('{');
        const out: Record<string, any> = {};
        let isList = true;
        for (let k = 0; k < n; k++) {
          const key = value();
          if (key !== k) isList = false;
          out[String(key)] = value();
        }
        expect('}');
        return isList ? Object.values(out) : out;
      }
      case 'O': {
        readUntil(':'); // class name length
        readUntil(':'); // class name
        const n = parseInt(readUntil(':'), 10);
        expect('{');
        const out: Record<string, any> = {};
        for (let k = 0; k < n; k++) {
          const key = String(value()).replace(/^\0.*\0/, '');
          out[key] = value();
        }
        expect('}');
        return out;
      }
      default:
        throw new Error(`unsupported type ${type}`);
    }
  };
  try {
    return value();
  } catch {
    return null;
  }
}
