import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const tokenSourcePath = path.join(ROOT, 'packages/ui/src/foundations/tokens.ts');
const tokenCssPath = path.join(ROOT, 'packages/ui/src/styles/tokens.css');
const packageStylesRoot = path.join(ROOT, 'packages/ui/src/styles');
const styleRoots = [packageStylesRoot, path.join(ROOT, 'apps/ui-studio/src')];
const issues = [];

const tokenSource = fs.readFileSync(tokenSourcePath, 'utf8');
const tokenCss = fs.readFileSync(tokenCssPath, 'utf8');
const groupsBody = tokenSource.match(/export const UI_TOKEN_GROUPS\s*=\s*\{([\s\S]*?)\n\} as const;/)?.[1];
if (!groupsBody) issues.push('cannot parse UI_TOKEN_GROUPS structural declaration');

const tokens = groupsBody ? [...groupsBody.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]) : [];
const duplicates = tokens.filter((token, index) => tokens.indexOf(token) !== index);
for (const token of new Set(duplicates)) issues.push(`duplicate public semantic token: ${token}`);

function extractBalancedBlock(source, marker, from = 0) {
  const markerIndex = source.indexOf(marker, from);
  if (markerIndex < 0) return null;
  const open = source.indexOf('{', markerIndex + marker.length);
  if (open < 0) return null;
  let depth = 0;
  let quote = null;
  let comment = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (comment) {
      if (char === '*' && next === '/') {
        comment = false;
        index += 1;
      }
      continue;
    }
    if (!quote && char === '/' && next === '*') {
      comment = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(open + 1, index);
    }
  }
  return null;
}

function definitions(block) {
  if (!block) return new Map();
  return new Map(
    [...block.matchAll(/(--oxs-[a-z0-9-]+)\s*:\s*([^;]+);/g)]
      .map((match) => [match[1], match[2].trim()]),
  );
}

const baseDefinitions = definitions(extractBalancedBlock(tokenCss, '.ui-root'));
const lightDefinitions = definitions(extractBalancedBlock(tokenCss, "[data-oxs-theme='light']"));
const systemMedia = extractBalancedBlock(tokenCss, '@media (prefers-color-scheme: light)');
const systemLightDefinitions = definitions(systemMedia && extractBalancedBlock(systemMedia, "[data-oxs-theme='system']"));

for (const token of tokens) {
  const variable = `--oxs-${token}`;
  if (!baseDefinitions.has(variable)) issues.push(`public semantic token has no .ui-root default: ${token}`);
}

const colorBody = groupsBody?.match(/color\s*:\s*\[([\s\S]*?)\],\s*typography\s*:/)?.[1] ?? '';
const colors = [...colorBody.matchAll(/'([a-z0-9-]+)'/g)].map((match) => match[1]);
for (const token of colors) {
  const variable = `--oxs-${token}`;
  if (!lightDefinitions.has(variable)) issues.push(`theme color has no explicit light value: ${token}`);
  if (!systemLightDefinitions.has(variable)) issues.push(`theme color has no explicit system-light value: ${token}`);
}

for (const tone of ['accent', 'danger', 'success', 'warning']) {
  for (const token of [
    `color-${tone}`,
    `color-${tone}-text`,
    `color-on-${tone}`,
    `color-${tone}-soft`,
    `color-${tone}-border`,
  ]) {
    if (!colors.includes(token)) issues.push(`semantic tone ${tone} is missing role ${token}`);
  }
}

const colorLiteral = /#[0-9a-f]{3,8}\b|rgba?\(/i;
for (const file of fs.readdirSync(packageStylesRoot).filter((name) => name.endsWith('.css') && name !== 'tokens.css')) {
  const text = fs.readFileSync(path.join(packageStylesRoot, file), 'utf8');
  const lines = text.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (colorLiteral.test(line)) issues.push(`${file}:${index + 1}: raw color literal is forbidden outside tokens.css`);
  });
}

// Any semantic color consumed by the package or self-hosted Studio must exist in
// the canonical token substrate. This catches stale references after token removal
// without maintaining a patch-specific denylist.
const definedColorVariables = new Set(
  [...tokenCss.matchAll(/(--oxs-color-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
);
function walkCss(directory) {
  const result = [];
  if (!fs.existsSync(directory)) return result;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walkCss(full));
    else if (entry.isFile() && entry.name.endsWith('.css')) result.push(full);
  }
  return result;
}
for (const root of styleRoots) {
  for (const file of walkCss(root)) {
    const relative = path.relative(ROOT, file);
    const text = fs.readFileSync(file, 'utf8');
    for (const match of text.matchAll(/var\((--oxs-color-[a-z0-9-]+)/g)) {
      if (!definedColorVariables.has(match[1])) {
        issues.push(`${relative}: references undefined semantic color ${match[1]}`);
      }
    }
  }
}

if (issues.length) {
  console.error('G0 foundation contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(`G0 foundation contract passed: ${tokens.length} customizable semantic tokens · ${colors.length} theme color roles · explicit light/system-light color coverage · no raw package colors outside tokens.css.`);
