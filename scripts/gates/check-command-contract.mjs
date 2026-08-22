import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};
const failures = [];

function expectEqual(name, expected) {
  if (scripts[name] !== expected) {
    failures.push(
      `${name} must be ${JSON.stringify(expected)}; found ${JSON.stringify(scripts[name])}`,
    );
  }
}

function forbid(name, tokens) {
  const value = scripts[name] ?? '';
  for (const token of tokens) {
    if (value.includes(token)) failures.push(`${name} must not invoke ${token}`);
  }
}

expectEqual('format', 'biome format --write .');
expectEqual('format:check', 'biome format .');
expectEqual('lint', 'biome lint .');
expectEqual('check', 'pnpm gate:architecture && pnpm gate:catalog && pnpm gate:types');
expectEqual('quality', 'pnpm check && pnpm test');
expectEqual('gate:browser', 'pnpm gate:build && pnpm gate:browser:run');
expectEqual(
  'verify',
  'pnpm quality && pnpm gate:studio && pnpm gate:build && pnpm gate:browser:run',
);
forbid('verify', [
  'release:check',
  'v1:oxs:check',
  'format',
  'catalog:generate',
  'v1:budgets:freeze',
]);
forbid('release:check', [
  'v1:oxs:check',
  'v1:closeout',
  'format',
  'catalog:generate',
  'v1:budgets:freeze',
]);

for (const required of [
  'pnpm verify',
  'scripts/check-studio-production.mjs',
  'scripts/create-tarball.mjs --from-build',
  'scripts/package-smoke.mjs',
  'pnpm v1:budgets:check',
  'pnpm v1:freeze:check',
]) {
  if (!(scripts['release:check'] ?? '').includes(required)) {
    failures.push(`release:check must include ${required}`);
  }
}

const closeoutSource = await readFile(path.join(root, 'scripts/closeout-v1.mjs'), 'utf8');
for (const forbidden of [
  'ROADMAP.md',
  'UI_TASK_LIST.md',
  'writeFile',
  "run(['format'])",
  "run(['catalog:generate'])",
  'v1:budgets:freeze',
]) {
  if (closeoutSource.includes(forbidden)) {
    failures.push(`scripts/closeout-v1.mjs must remain validation-only; found ${forbidden}`);
  }
}

const oxsSource = await readFile(path.join(root, 'scripts/validate-oxs-consumer.mjs'), 'utf8');
if (!oxsSource.includes("['worktree', 'add'")) {
  failures.push('OXS consumer validation must isolate through git worktree add.');
}
for (const forbidden of ['import { cp', 'await cp(']) {
  if (oxsSource.includes(forbidden)) {
    failures.push(
      `OXS consumer validation must not recursively copy the consumer; found ${forbidden}`,
    );
  }
}

const ci = await readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8');
if (!ci.includes('- run: pnpm verify')) failures.push('CI must run pnpm verify.');
if (ci.includes('- run: pnpm release:check'))
  failures.push('CI must not run release:check on every push/PR.');

const pages = await readFile(path.join(root, '.github/workflows/studio-pages.yml'), 'utf8');
if (!pages.includes('- run: pnpm verify')) failures.push('Studio Pages must run pnpm verify.');
if (pages.includes('- run: pnpm release:check'))
  failures.push('Studio Pages must not run package release checks.');

const release = await readFile(path.join(root, '.github/workflows/release.yml'), 'utf8');
if (!release.includes('- run: pnpm release:check')) {
  failures.push('The tagged release workflow must run pnpm release:check.');
}

if (failures.length) {
  console.error('OXS-UI command contract gate failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(
  'OXS-UI command contract passed: canonical verify covers architecture/catalog/types/tests/Studio/build/browser once; formatting and repo-wide lint remain explicit maintenance commands.',
);
