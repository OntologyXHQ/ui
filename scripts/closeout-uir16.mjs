import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const taskIds = ['1601', '1602', '1603', '1604', '1605', '1606', '1607', '1608'];

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
  if (index < 0) throw new Error(`UIR16 closeout could not find UI-${id}.`);
  if (!lines[index].endsWith(' **DONE**')) lines[index] += ' **DONE**';
  return lines.join('\n');
}

function assertFrontier() {
  const roadmap = readFileSync(roadmapPath, 'utf8');
  if (roadmap.includes('- `UIR16` — Studio as a real product-quality SDK workbench: **DONE**'))
    return;
  if (!roadmap.includes('- `UIR15` — Privileged System surfaces: **DONE**')) {
    throw new Error('UIR16 closeout requires UIR15 to be DONE first.');
  }
  if (!roadmap.includes('- `UIR16` — Studio as a real product-quality SDK workbench: **NEXT**')) {
    throw new Error('UIR16 closeout could not find the NEXT roadmap frontier.');
  }
}

function markPlanningDone() {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (!roadmap.includes('- `UIR16` — Studio as a real product-quality SDK workbench: **DONE**')) {
    const nextMarker = '- `UIR16` — Studio as a real product-quality SDK workbench: **NEXT**';
    if (!roadmap.includes(nextMarker)) {
      throw new Error('UIR16 closeout could not find the NEXT roadmap frontier.');
    }
    roadmap = roadmap.replace(
      nextMarker,
      '- `UIR16` — Studio as a real product-quality SDK workbench: **DONE**\n- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **NEXT**',
    );
  }

  tasks = tasks.replace(
    '## UIR16 — Studio as a real product-quality SDK workbench — NEXT',
    '## UIR16 — Studio as a real product-quality SDK workbench — DONE',
  );
  tasks = tasks.replace(
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — TODO',
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — NEXT',
  );
  for (const id of taskIds) tasks = markTaskDone(tasks, id);

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

try {
  assertFrontier();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

console.log('UIR16 closeout: regenerating the canonical Studio catalog.');
let result = runPnpm(['catalog:generate']);

if (result.status === 0) {
  console.log('UIR16 closeout: running the dedicated Studio product-workbench contract.');
  result = runPnpm(['gate:studio-workbench']);
}

if (result.status === 0) {
  console.log('UIR16 closeout: running the canonical pnpm verify.');
  result = runPnpm(['verify']);
}

if (result.status === 0) {
  console.log('UIR16 closeout: checking the already-built production Studio artifact.');
  result = runNode(['scripts/check-studio-production.mjs']);
}

if (result.status !== 0) {
  console.error(
    'UIR16 closeout validation FAILED; repaired/generated/formatted implementation state is preserved and planning remains unadvanced. NO SOURCE ROLLBACK.',
  );
  process.exit(result.status ?? 1);
}

try {
  markPlanningDone();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    'UIR16 Studio verification passed, but planning reconciliation failed; implementation state is preserved for fix-forward. NO SOURCE ROLLBACK.',
  );
  process.exit(2);
}

console.log('UIR16 closeout PASSED. UIR16 is DONE and UIR17 is NEXT.');
