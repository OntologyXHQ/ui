import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'packages/ui/src');
const STYLE_ROOT = path.join(SRC, 'styles');
const issues = [];

function walk(directory, predicate) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(full, predicate));
    else if (entry.isFile() && predicate(full)) result.push(full);
  }
  return result;
}

const productionSource = walk(SRC, (file) => /\.(ts|tsx)$/.test(file))
  .filter((file) => !file.includes(`${path.sep}__tests__${path.sep}`) && !file.includes('.docs.'));
const cssFiles = walk(STYLE_ROOT, (file) => file.endsWith('.css'));

const deviceSniffing = /navigator\.(?:userAgent|platform)|\bscreen\.(?:width|height)|\bdevicePixelRatio\b/;
for (const file of productionSource) {
  const text = fs.readFileSync(file, 'utf8');
  if (deviceSniffing.test(text)) {
    issues.push(`${path.relative(ROOT, file)}: environment/adaptation must not use device identity/sniffing`);
  }
}

for (const file of cssFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (/@media[^\{]*(?:min|max)-(?:width|height)\s*:/i.test(text)) {
    issues.push(`${path.relative(ROOT, file)}: responsive layout must use container queries, not viewport-size media queries`);
  }
  if (/data-oxs-density=['"]auto['"]/.test(text)) {
    issues.push(`${path.relative(ROOT, file)}: CSS must consume resolved density, not the auto preference`);
  }
  if (/data-oxs-motion=['"]system['"]/.test(text)) {
    issues.push(`${path.relative(ROOT, file)}: CSS must consume resolved motion state, not the system preference`);
  }
  if (/\b(?:margin|padding|border)-(?:left|right)\s*:/.test(text)) {
    issues.push(`${path.relative(ROOT, file)}: public styling must use logical inline properties instead of physical left/right box properties`);
  }
}

const tokens = fs.readFileSync(path.join(STYLE_ROOT, 'tokens.css'), 'utf8');
for (const variable of [
  '--oxs-safe-block-start',
  '--oxs-safe-inline-end',
  '--oxs-safe-block-end',
  '--oxs-safe-inline-start',
  '--oxs-occlusion-block-start',
  '--oxs-occlusion-inline-end',
  '--oxs-occlusion-block-end',
  '--oxs-occlusion-inline-start',
  '--oxs-environment-inset-block-start',
  '--oxs-environment-inset-inline-end',
  '--oxs-environment-inset-block-end',
  '--oxs-environment-inset-inline-start',
]) {
  if (!tokens.includes(`${variable}:`)) issues.push(`tokens.css is missing environment inset variable ${variable}`);
}

const componentsCss = fs.readFileSync(path.join(STYLE_ROOT, 'components.css'), 'utf8');
if (/var\(--oxs-safe-(?:block|inline)/.test(componentsCss)) {
  issues.push('Components must consume combined environment insets when avoiding host occlusion; raw safe-area variables are reserved for SafeArea/System ownership');
}

if (issues.length) {
  console.error('G0 environment contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log('G0 environment contract passed: resolved preference/runtime split · container-first adaptation · logical styling · separate safe-area/occlusion inputs · no device sniffing.');
