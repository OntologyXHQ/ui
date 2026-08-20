import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const SCENARIOS = path.join(ROOT, 'scripts/browser/scenarios.mjs');
const source = fs.readFileSync(SCENARIOS, 'utf8');

function scanCallEnd(start) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (char === '\n') lineComment = false;
      continue;
    }
    if (blockComment) {
      if (char === '*' && next === '/') {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === '/' && next === '/') {
      lineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      blockComment = true;
      index += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }
    if (char === '(') depth += 1;
    if (char === ')') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error('Unterminated gotoCatalog call in browser scenarios.');
}

const failures = [];
const needle = 'gotoCatalog(';
let cursor = 0;
while ((cursor = source.indexOf(needle, cursor)) !== -1) {
  const open = cursor + needle.length - 1;
  const end = scanCallEnd(open);
  const call = source.slice(cursor, end + 1);
  const statementStart =
    Math.max(
      source.lastIndexOf(';', cursor - 1),
      source.lastIndexOf('{', cursor - 1),
      source.lastIndexOf('}', cursor - 1),
    ) + 1;
  const prefix = source.slice(statementStart, cursor).trim();
  const consumesResult =
    /(?:^|\b)(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*await\s*$/.test(prefix) ||
    /^[A-Za-z_$][\w$]*\s*=\s*await\s*$/.test(prefix);
  if (/\bexample\s*:/.test(call) && !consumesResult) {
    const line = source.slice(0, cursor).split('\n').length;
    failures.push(`line ${line}: example deep link ignores gotoCatalog's canonical fixture scope`);
  }
  cursor = end + 1;
}

const unscopedDomPatterns = [
  /document\.querySelector\(\s*['"]\[data-visual-cert=/g,
  /document\.querySelector\(\s*['"]\[data-icon-pack-animated=/g,
  /document\.querySelectorAll\(\s*['"]\[data-motion-authority-probe/g,
];
for (const pattern of unscopedDomPatterns) {
  for (const match of source.matchAll(pattern)) {
    const line = source.slice(0, match.index).split('\n').length;
    failures.push(`line ${line}: certification DOM polling bypasses #example-<id> scope`);
  }
}

const overlayAuthorityStart = source.indexOf("'overlay-authority-cross-root-certification'");
const motionAuthorityStart = source.indexOf(
  "'motion-authority-realm-interruption-certification'",
  overlayAuthorityStart,
);
if (overlayAuthorityStart !== -1 && motionAuthorityStart !== -1) {
  const authority = source.slice(overlayAuthorityStart, motionAuthorityStart);
  for (const stale of [
    'triggerA.evaluate((element) => element.closest',
    'triggerB.evaluate((element) => element.closest',
  ]) {
    if (authority.includes(stale)) {
      failures.push(
        'overlay authority certification re-resolves an accessibility-role trigger after modal isolation; inspect stable UiRoot DOM identity instead',
      );
      break;
    }
  }
  for (const required of [
    "workbench.locator('.ui-doc-overlay-authority-root--a')",
    "workbench.locator('.ui-doc-overlay-authority-root--b')",
    'waitForStudioExampleControl(page, triggerA',
    'waitForStudioExampleControl(page, triggerB',
  ]) {
    if (!authority.includes(required))
      failures.push(
        `overlay authority certification lost stable post-isolation evidence: ${required}`,
      );
  }
}

if (failures.length) {
  console.error('G0 browser fixture-scope gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(
  'G0 browser fixture-scope gate passed: every example journey consumes canonical #example-<id> scope, fixture DOM polling is explicitly scoped, and modal-isolation evidence uses stable DOM identities after accessibility removal.',
);
