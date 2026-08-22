import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const taskIds = ['1501', '1502', '1503', '1504', '1505', '1506'];
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
  if (index < 0) throw new Error(`UIR15 closeout could not find UI-${id}.`);
  if (!lines[index].endsWith(' **DONE**')) lines[index] += ' **DONE**';
  return lines.join('\n');
}

function assertFrontier() {
  const roadmap = readFileSync(roadmapPath, 'utf8');
  if (roadmap.includes('- `UIR15` — Privileged System surfaces: **DONE**')) return;
  if (!roadmap.includes('- `UIR14` — System UI core: **DONE**')) {
    throw new Error('UIR15 closeout requires UIR14 to be DONE first.');
  }
  if (!roadmap.includes('- `UIR15` — Privileged System surfaces: **NEXT**')) {
    throw new Error('UIR15 closeout could not find the NEXT roadmap frontier.');
  }
}

function markPlanningDone() {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (!roadmap.includes('- `UIR15` — Privileged System surfaces: **DONE**')) {
    const nextMarker = '- `UIR15` — Privileged System surfaces: **NEXT**';
    if (!roadmap.includes(nextMarker)) {
      throw new Error('UIR15 closeout could not find the NEXT roadmap frontier.');
    }
    roadmap = roadmap.replace(
      nextMarker,
      '- `UIR15` — Privileged System surfaces: **DONE**\n- `UIR16` — Studio as a real product-quality SDK workbench: **NEXT**',
    );
  }

  tasks = tasks.replace(
    '## UIR15 — Privileged System surfaces — NEXT',
    '## UIR15 — Privileged System surfaces — DONE',
  );
  tasks = tasks.replace(
    '## UIR16 — Studio as a real product-quality SDK workbench — TODO',
    '## UIR16 — Studio as a real product-quality SDK workbench — NEXT',
  );
  for (const id of taskIds) tasks = markTaskDone(tasks, id);

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

if (!oxsRoot) {
  console.error(
    'UIR15 closeout requires OXS_CONSUMER_ROOT so UI-1506 can validate the real OXS consumer before planning advances.',
  );
  process.exit(2);
}

try {
  assertFrontier();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

console.log('UIR15 closeout: regenerating the canonical Studio catalog.');
let result = runPnpm(['catalog:generate']);

if (result.status === 0) {
  console.log('UIR15 closeout: running the dedicated privileged System surfaces contract.');
  result = runPnpm(['gate:privileged-system-surfaces']);
}

if (result.status === 0) {
  console.log('UIR15 closeout: running the canonical pnpm verify.');
  result = runPnpm(['verify']);
}

if (result.status === 0) {
  console.log('UIR15 closeout: packing the already-verified @ontologyx/ui build.');
  result = runNode(['scripts/create-tarball.mjs', '--from-build']);
}

if (result.status === 0) {
  console.log(`UIR15 closeout: validating the real OXS consumer at ${oxsRoot}.`);
  result = runPnpm(['v1:oxs:check', '--', oxsRoot]);
}

if (result.status !== 0) {
  console.error(
    'UIR15 closeout validation FAILED; repaired/generated/formatted implementation state is preserved and planning remains unadvanced. NO SOURCE ROLLBACK.',
  );
  process.exit(result.status ?? 1);
}

try {
  markPlanningDone();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    'UIR15 implementation/OXS verification passed, but planning reconciliation failed; implementation state is preserved for fix-forward. NO SOURCE ROLLBACK.',
  );
  process.exit(2);
}

console.log('UIR15 closeout PASSED. UIR15 is DONE and UIR16 is NEXT.');
