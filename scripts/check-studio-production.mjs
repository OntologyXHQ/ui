import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'apps/ui-studio/dist');
const indexPath = path.join(dist, 'index.html');
const failures = [];

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(indexPath))) {
  failures.push('apps/ui-studio/dist/index.html is missing');
} else {
  const html = await readFile(indexPath, 'utf8');
  for (const forbidden of ['localhost:', '/src/main.tsx', '@oxs/ui-docs']) {
    if (html.includes(forbidden)) failures.push(`production index leaks development marker ${JSON.stringify(forbidden)}`);
  }
  if (!html.includes('OXS UI Studio')) failures.push('production index is missing Studio identity');
}

const assetsDir = path.join(dist, 'assets');
if (!(await exists(assetsDir))) {
  failures.push('production Studio assets directory is missing');
} else {
  const assets = await readdir(assetsDir);
  const js = assets.filter((name) => name.endsWith('.js'));
  const css = assets.filter((name) => name.endsWith('.css'));
  if (!js.length) failures.push('production Studio emitted no JavaScript asset');
  if (!css.length) failures.push('production Studio emitted no CSS asset');
  for (const name of [...js, ...css]) {
    const size = (await stat(path.join(assetsDir, name))).size;
    if (name.endsWith('.js') && size > 900_000) failures.push(`${name} exceeds the 900 kB uncompressed Studio JS budget`);
    if (name.endsWith('.css') && size > 180_000) failures.push(`${name} exceeds the 180 kB uncompressed Studio CSS budget`);
  }
}

if (failures.length) {
  console.error('OXS UI Studio production artifact check failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('OXS UI Studio production artifact passed: static entry · no dev leakage · JS/CSS assets · production budgets.');
