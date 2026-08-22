import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const oxsRoot = process.env.OXS_CONSUMER_ROOT?.trim();
const locallyDoneTasks = ['1701', '1702', '1703', '1704', '1705', '1706', '1707'];

function run(command, args) {
  return spawnSync(command, args, { cwd: repoRoot, env: process.env, stdio: 'inherit' });
}
function runPnpm(args) {
  return run('pnpm', args);
}
function runNode(args) {
  return run(process.execPath, args);
}
function markTaskDone(tasks, id) {
  const prefix = `- \`UI-${id}\``;
  const lines = tasks.split('\n');
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) throw new Error(`UIR17 closeout could not find UI-${id}.`);
  if (!lines[index].endsWith(' **DONE**')) lines[index] += ' **DONE**';
  return lines.join('\n');
}
function markPublicationReady(tasks) {
  const prefix = '- `UI-1708`';
  const lines = tasks.split('\n');
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) throw new Error('UIR17 closeout could not find UI-1708.');
  lines[index] = lines[index]
    .replace(/ \*\*DONE\*\*$/, '')
    .replace(/ \*\*PUBLICATION READY\*\*.*$/, '');
  lines[index] +=
    ' **PUBLICATION READY** — real OXS RC passed; stable Git tag/npm `latest` publication remains explicit.';
  return lines.join('\n');
}
function assertFrontier() {
  const roadmap = readFileSync(roadmapPath, 'utf8');
  if (
    roadmap.includes(
      '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **DONE**',
    )
  ) {
    return 'done';
  }
  if (
    roadmap.includes(
      '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **PUBLICATION READY**',
    )
  ) {
    return 'ready';
  }
  if (!roadmap.includes('- `UIR16` — Studio as a real product-quality SDK workbench: **DONE**')) {
    throw new Error('UIR17 closeout requires UIR16 to be DONE first.');
  }
  if (
    !roadmap.includes(
      '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **NEXT**',
    )
  ) {
    throw new Error('UIR17 closeout could not find the NEXT roadmap frontier.');
  }
  return 'next';
}
function markPlanningReady() {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');
  roadmap = roadmap.replace(
    '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **NEXT**',
    '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **PUBLICATION READY**',
  );
  tasks = tasks.replace(
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — NEXT',
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — PUBLICATION READY',
  );
  for (const id of locallyDoneTasks) tasks = markTaskDone(tasks, id);
  tasks = markPublicationReady(tasks);
  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

if (!oxsRoot) {
  console.error(
    'UIR17 closeout requires OXS_CONSUMER_ROOT so the release candidate is revalidated in the real consumer before publication readiness is claimed.',
  );
  process.exit(2);
}

let frontier;
try {
  frontier = assertFrontier();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}
if (frontier === 'done') {
  console.log('UIR17 is already DONE.');
  process.exit(0);
}

console.log('UIR17 closeout: regenerating the canonical Studio catalog.');
let result = runPnpm(['catalog:generate']);

if (result.status === 0) {
  console.log('UIR17 closeout: running the canonical full G0..G6 verify.');
  result = runPnpm(['verify']);
}
if (result.status === 0) {
  console.log('UIR17 closeout: checking the already-built production Studio artifact.');
  result = runNode(['scripts/check-studio-production.mjs']);
}
if (result.status === 0) {
  console.log('UIR17 closeout: packing the already-verified stable candidate.');
  result = runNode(['scripts/create-tarball.mjs', '--from-build']);
}
if (result.status === 0) {
  console.log('UIR17 closeout: proving the fresh packed-tarball consumer.');
  result = runNode(['scripts/package-smoke.mjs']);
}
if (result.status === 0) {
  console.log(
    'UIR17 closeout: freezing final measured V1 artifact budgets from this release output.',
  );
  result = runNode(['scripts/rebaseline-uir17-artifact-budgets.mjs']);
}
if (result.status === 0) result = runPnpm(['v1:budgets:check']);
if (result.status === 0) result = runPnpm(['v1:freeze:check']);
if (result.status === 0) {
  console.log(`UIR17 closeout: revalidating the real OXS consumer at ${oxsRoot}.`);
  result = runPnpm(['v1:oxs:check', '--', oxsRoot]);
}
if (result.status === 0) {
  console.log('UIR17 closeout: running the final cross-axis/package/release hardening contract.');
  result = runNode(['scripts/gates/check-v1-release-hardening.mjs', '--with-oxs']);
}

if (result.status !== 0) {
  console.error(
    'UIR17 closeout validation FAILED; applied/generated/formatted/budget evidence is preserved and planning remains unadvanced. NO SOURCE ROLLBACK.',
  );
  process.exit(result.status ?? 1);
}

try {
  markPlanningReady();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    'UIR17 release-candidate verification passed, but planning reconciliation failed; verified state is preserved for fix-forward. NO SOURCE ROLLBACK.',
  );
  process.exit(2);
}

console.log(
  'UIR17 RELEASE-CANDIDATE CLOSEOUT PASSED. UI-1701..1707 are DONE; UI-1708 and UIR17 are PUBLICATION READY pending the external v1.0.0/npm latest publication.',
);
