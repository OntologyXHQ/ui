import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const taskIds = ['1301', '1302', '1303', '1304', '1305', '1306'];

function runPnpm(args) {
  return spawnSync('pnpm', args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });
}

function markTaskDone(tasks, id) {
  const prefix = `- \`UI-${id}\``;
  const lines = tasks.split('\n');
  const index = lines.findIndex((line) => line.startsWith(prefix));
  if (index < 0) throw new Error(`UIR13 closeout could not find UI-${id}.`);
  if (!lines[index].endsWith(' **DONE**')) lines[index] += ' **DONE**';
  return lines.join('\n');
}

function markPlanningDone() {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (!roadmap.includes('- `UIR13` — Developer compositions and adaptive scaffolds: **DONE**')) {
    const nextMarker = '- `UIR13` — Developer compositions and adaptive scaffolds: **NEXT**';
    if (!roadmap.includes(nextMarker)) {
      throw new Error('UIR13 closeout could not find the NEXT roadmap frontier.');
    }
    roadmap = roadmap.replace(
      nextMarker,
      '- `UIR13` — Developer compositions and adaptive scaffolds: **DONE**\n- `UIR14` — System UI core: **NEXT**',
    );
  }

  tasks = tasks.replace(
    '## UIR13 — Developer compositions and adaptive scaffolds — NEXT',
    '## UIR13 — Developer compositions and adaptive scaffolds — DONE',
  );
  tasks = tasks.replace('## UIR14 — System UI core — TODO', '## UIR14 — System UI core — NEXT');
  for (const id of taskIds) tasks = markTaskDone(tasks, id);

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

console.log('UIR13 closeout: regenerating the canonical Studio catalog.');
let result = runPnpm(['catalog:generate']);

if (result.status === 0) {
  console.log('UIR13 closeout: running the dedicated developer-composition contract.');
  result = runPnpm(['gate:developer-compositions']);
}

if (result.status === 0) {
  console.log('UIR13 closeout: running the canonical pnpm verify.');
  result = runPnpm(['verify']);
}

if (result.status !== 0) {
  console.error(
    'UIR13 closeout validation FAILED; repaired/generated/formatted implementation state is preserved and planning remains unadvanced. NO SOURCE ROLLBACK.',
  );
  process.exit(result.status ?? 1);
}

try {
  markPlanningDone();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    'UIR13 implementation verification passed, but planning reconciliation failed; implementation state is preserved for fix-forward. NO SOURCE ROLLBACK.',
  );
  process.exit(2);
}

console.log('UIR13 closeout PASSED. UIR13 is DONE and UIR14 is NEXT.');
