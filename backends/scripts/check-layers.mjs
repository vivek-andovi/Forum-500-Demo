// Architecture guard: only *.repository.ts files (and the Prisma provider itself) may use the database.
// Run: npm run check:layers  (also runs in CI)
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('../src', import.meta.url));
const allowed = (f) => f.endsWith('.repository.ts') || f.includes('/core/prisma/');
const violations = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.ts') && !allowed(path)) {
      const src = readFileSync(path, 'utf8');
      if (/PrismaService|new PrismaClient|\$queryRaw|\$transaction/.test(src)) violations.push(relative(root, path));
    }
  }
}
walk(root);

if (violations.length) {
  console.error('Database access outside repositories:\n' + violations.map((v) => `  - src/${v}`).join('\n'));
  process.exit(1);
}
console.log('check:layers OK — database access only in *.repository.ts');
