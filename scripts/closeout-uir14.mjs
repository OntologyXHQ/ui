import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const taskIds = ['1401', '1402', '1403', '1404', '1405', '1406'];
const oxsRoot = process.env.OXS_CONSUMER_ROOT?.trim();

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });
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
  if (index < 0) throw new Error(`UIR14 closeout could not find UI-${id}.`);
  if (!lines[index].endsWith(' **DONE**')) lines[index] += ' **DONE**';
  return lines.join('\n');
}

function markPlanningDone() {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (!roadmap.includes('- `UIR14` — System UI core: **DONE**')) {
    const nextMarker = '- `UIR14` — System UI core: **NEXT**';
    if (!roadmap.includes(nextMarker)) {
      throw new Error('UIR14 closeout could not find the NEXT roadmap frontier.');
    }
    roadmap = roadmap.replace(
      nextMarker,
      '- `UIR14` — System UI core: **DONE**\n- `UIR15` — Privileged System surfaces: **NEXT**',
    );
  }

  tasks = tasks.replace('## UIR14 — System UI core — NEXT', '## UIR14 — System UI core — DONE');
  tasks = tasks.replace(
    '## UIR15 — Privileged System surfaces — TODO',
    '## UIR15 — Privileged System surfaces — NEXT',
  );
  for (const id of taskIds) tasks = markTaskDone(tasks, id);

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

if (!oxsRoot) {
  console.error(
    'UIR14 closeout requires OXS_CONSUMER_ROOT so UI-1406 can validate the real OXS consumer before planning advances.',
  );
  process.exit(2);
}

console.log('UIR14 closeout: regenerating the canonical Studio catalog.');
let result = runPnpm(['catalog:generate']);

if (result.status === 0) {
  console.log('UIR14 closeout: running the dedicated System UI core contract.');
  result = runPnpm(['gate:system-ui-core']);
}

if (result.status === 0) {
  console.log('UIR14 closeout: running the canonical pnpm verify.');
  result = runPnpm(['verify']);
}

if (result.status === 0) {
  console.log('UIR14 closeout: packing the already-verified @ontologyx/ui build.');
  result = runNode(['scripts/create-tarball.mjs', '--from-build']);
}

if (result.status === 0) {
  console.log(`UIR14 closeout: validating the real OXS consumer at ${oxsRoot}.`);
  result = runPnpm(['v1:oxs:check', '--', oxsRoot]);
}

if (result.status !== 0) {
  console.error(
    'UIR14 closeout validation FAILED; repaired/generated/formatted implementation state is preserved and planning remains unadvanced. NO SOURCE ROLLBACK.',
  );
  process.exit(result.status ?? 1);
}

try {
  markPlanningDone();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    'UIR14 implementation/OXS verification passed, but planning reconciliation failed; implementation state is preserved for fix-forward. NO SOURCE ROLLBACK.',
  );
  process.exit(2);
}

console.log('UIR14 closeout PASSED. UIR14 is DONE and UIR15 is NEXT.');
