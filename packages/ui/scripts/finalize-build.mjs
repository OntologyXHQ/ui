import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '..', 'dist');

async function filesUnder(directory) {
  const out = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...(await filesUnder(target)));
    else out.push(target);
  }
  return out;
}

const before = await filesUnder(dist);
const cssFiles = before.filter((file) => file.endsWith('.css'));
if (cssFiles.length !== 1) {
  throw new Error(
    `Expected exactly one library CSS asset, found: ${cssFiles.map((file) => path.relative(dist, file)).join(', ') || 'none'}`,
  );
}

const originalCss = cssFiles[0];
const canonicalCss = path.join(dist, 'styles.css');
if (originalCss !== canonicalCss) {
  await rename(originalCss, canonicalCss);
}

const jsFiles = (await filesUnder(dist)).filter((file) => file.endsWith('.js'));
for (const file of jsFiles) {
  let text = await readFile(file, 'utf8');
  text = text.replace(/(^|\n)\s*import\s+['"][^'"\n]+\.css['"]\s*;?/g, '$1');
  if (/['"][^'"\n]+\.css['"]/.test(text)) {
    throw new Error(`Published JavaScript must not reference CSS: ${path.relative(dist, file)}`);
  }
  await writeFile(file, text);
}

const indexTypes = path.join(dist, 'index.d.ts');
try {
  const declaration = await readFile(indexTypes, 'utf8');
  await writeFile(
    indexTypes,
    declaration.replace(/^import ['"]\.\/styles\/index\.css['"];?\s*$/m, ''),
  );
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

// Vite commonly leaves an empty assets directory after the CSS asset is promoted.
await rm(path.join(dist, 'assets'), { recursive: true, force: true });
