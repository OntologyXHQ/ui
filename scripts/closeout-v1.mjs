import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');

console.log(
  'V1 closeout is validation-only. It does not format, rewrite planning, freeze budgets, or validate OXS implicitly.',
);
console.log('Running the canonical local release gate: pnpm release:check');
const result = spawnSync('pnpm', ['release:check'], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
});
if (result.status !== 0) process.exit(result.status ?? 1);

console.log('OXS-UI V1 LOCAL RELEASE CHECK PASSED.');
console.log(
  'Optional cross-repository certification is explicit: pnpm v1:oxs:check -- /path/to/OXS',
);
console.log('Roadmap/task status and npm/git publication remain explicit review operations.');
