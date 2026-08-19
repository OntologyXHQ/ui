import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const failures = [];
if (pkg.private === true) failures.push('package is still private');
if (pkg.license !== 'MIT') failures.push('package license must be MIT for the public OntologyX release');
for (const [subpath, target] of Object.entries(pkg.exports ?? {})) {
  const values = typeof target === 'string' ? [target] : Object.values(target);
  for (const value of values) if (typeof value === 'string' && value.includes('/src/')) failures.push(`${subpath} leaks source export ${value}`);
}
for (const rel of ['dist/index.js', 'dist/advanced.js', 'dist/icons.js', 'dist/index.d.ts', 'dist/advanced.d.ts', 'dist/icons.d.ts', 'dist/styles.css']) {
  try { await access(path.join(root, rel)); } catch { failures.push(`missing ${rel}`); }
}
for (const rel of ['dist/index.js', 'dist/advanced.js', 'dist/icons.js']) {
  try {
    const javascript = await readFile(path.join(root, rel), 'utf8');
    if (/['"][^'"\n]+\.css['"]/.test(javascript)) {
      failures.push(`${rel} must be stylesheet-neutral; consumers import @ontologyx/ui/styles.css explicitly`);
    }
  } catch {}
}

const iconsExport = pkg.exports?.['./icons'];
if (!iconsExport || typeof iconsExport === 'string' || iconsExport.import !== './dist/icons.js' || iconsExport.types !== './dist/icons.d.ts') {
  failures.push('package must expose ./icons as the optional built ESM/declaration icon-pack subpath');
}

if (pkg.exports?.['./styles.css'] !== './dist/styles.css') {
  failures.push('package must expose ./styles.css as the canonical explicit stylesheet export');
}
if (!Array.isArray(pkg.sideEffects) || !pkg.sideEffects.includes('./dist/styles.css')) {
  failures.push('package sideEffects must retain ./dist/styles.css');
}
try {
  const types = await readFile(path.join(root, 'dist/index.d.ts'), 'utf8');
  if (types.includes('./styles/index.css')) failures.push('dist/index.d.ts leaks the source stylesheet path');
} catch {}
const distFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(p); else distFiles.push(p);
  }
}
try { await walk(path.join(root, 'dist')); } catch {}
for (const file of distFiles) {
  if (/(__tests__|\.test\.|\.docs\.)/.test(file)) failures.push(`test/docs artifact leaked into dist: ${path.relative(root, file)}`);
}
try {
  const mainEntry = await readFile(path.join(root, 'dist/index.js'), 'utf8');
  const canvasMarker = 'data-oxs-loading-renderer';
  if (mainEntry.includes(canvasMarker)) {
    failures.push('optional OX Canvas renderer was inlined into dist/index.js instead of remaining lazy');
  }
  const javascriptChunks = distFiles.filter((file) => file.endsWith('.js') && path.relative(root, file) !== 'dist/index.js');
  let canvasChunkFound = false;
  for (const file of javascriptChunks) {
    const source = await readFile(file, 'utf8');
    if (source.includes(canvasMarker)) { canvasChunkFound = true; break; }
  }
  if (!canvasChunkFound) failures.push('missing lazy OX Canvas renderer chunk in package artifact');
} catch {}

if (failures.length) {
  console.error('@ontologyx/ui package artifact check failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
const total = (await Promise.all(distFiles.map((file) => stat(file)))).reduce((sum, item) => sum + item.size, 0);
console.log(`@ontologyx/ui package artifact check passed: ${distFiles.length} files · ${total} bytes.`);
