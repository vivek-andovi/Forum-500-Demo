// Architecture guards (run: npm run check:layers — also runs in CI):
//  1. Only *.repository.ts files (and the Prisma provider itself) may use the database.
//  2. A feature module never imports another feature module's repository: src/modules/<a>/
//     may not import src/modules/<b>/*.repository (a ≠ b). Use <b>'s exported service instead.
import { readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative, resolve, sep } from 'path';
import { fileURLToPath } from 'url';

const root = fileURLToPath(new URL('../src', import.meta.url));
const modulesRoot = join(root, 'modules');
const allowed = (f) => f.endsWith('.repository.ts') || f.includes('/core/prisma/');
const dbViolations = [];
const crossModule = [];

/** Feature module name for a path under src/modules/<name>/, else null. */
const moduleOf = (path) => {
  const rel = relative(modulesRoot, path);
  return rel.startsWith('..') ? null : rel.split(sep)[0];
};

function checkImports(path, src) {
  const from = moduleOf(path);
  if (!from) return;
  for (const [, spec] of src.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    if (!spec.startsWith('.') || !/\.repository$/.test(spec)) continue;
    const target = moduleOf(resolve(dirname(path), spec));
    if (target && target !== from) crossModule.push(`src/${relative(root, path)} → ${spec}`);
  }
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.ts')) {
      const src = readFileSync(path, 'utf8');
      if (!allowed(path) && /PrismaService|new PrismaClient|\$queryRaw|\$transaction/.test(src)) {
        dbViolations.push(relative(root, path));
      }
      checkImports(path, src);
    }
  }
}
walk(root);

if (dbViolations.length) {
  console.error('Database access outside repositories:\n' + dbViolations.map((v) => `  - src/${v}`).join('\n'));
}
if (crossModule.length) {
  console.error("Module imports another module's repository (use its service):\n" + crossModule.map((v) => `  - ${v}`).join('\n'));
}
if (dbViolations.length || crossModule.length) process.exit(1);
console.log('check:layers OK — database access only in *.repository.ts, no cross-module repository imports');
