import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const TASK_IDS = [
  '1101',
  '1102',
  '1103',
  '1104',
  '1105',
  '1106',
  '1201',
  '1202',
  '1203',
  '1204',
  '1205',
  '1206',
];

function setRoadmapState(state) {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (state === 'done') {
    roadmap = roadmap
      .replace(
        '- `UIR11` — Scroll and motion: **ACTIVE**',
        '- `UIR11` — Scroll and motion: **DONE**',
      )
      .replace(
        '- `UIR12` — Gestures, drag/drop, editing and cursor: **ACTIVE**',
        '- `UIR12` — Gestures, drag/drop, editing and cursor: **DONE**',
      )
      .replace(
        '- `UIR13+` — Developer compositions → System UI reacceptance: **TODO**',
        '- `UIR13` — Developer compositions and adaptive scaffolds: **NEXT**',
      );
    tasks = tasks
      .replace('## UIR11 — Scroll and motion — ACTIVE', '## UIR11 — Scroll and motion — DONE')
      .replace(
        '## UIR12 — Gestures, drag/drop, editing and cursor — ACTIVE',
        '## UIR12 — Gestures, drag/drop, editing and cursor — DONE',
      )
      .replace(
        '## UIR13 — Developer compositions and adaptive scaffolds — TODO',
        '## UIR13 — Developer compositions and adaptive scaffolds — NEXT',
      );
    for (const id of TASK_IDS) {
      const pattern = new RegExp('(^- `UI-' + id + '`[^\\n]*?)(?: \\*\\*DONE\\*\\*)?$', 'm');
      if (!pattern.test(tasks)) throw new Error(`UIR11 + UIR12 closeout could not find UI-${id}`);
      tasks = tasks.replace(pattern, '$1 **DONE**');
    }
    tasks = tasks
      .replace(
        'Canonical `DONE` remains intentionally blocked until the full `pnpm verify` run succeeds on an installed workspace;',
        'Canonical `DONE` is backed by the full `pnpm verify` closeout run;',
      )
      .replace(
        'Canonical `DONE` remains blocked until the full `pnpm verify` run succeeds on an installed workspace;',
        'Canonical `DONE` is backed by the full `pnpm verify` closeout run;',
      );
  } else {
    roadmap = roadmap
      .replace(
        '- `UIR11` — Scroll and motion: **DONE**',
        '- `UIR11` — Scroll and motion: **ACTIVE**',
      )
      .replace(
        '- `UIR12` — Gestures, drag/drop, editing and cursor: **DONE**',
        '- `UIR12` — Gestures, drag/drop, editing and cursor: **ACTIVE**',
      )
      .replace(
        '- `UIR13` — Developer compositions and adaptive scaffolds: **NEXT**',
        '- `UIR13+` — Developer compositions → System UI reacceptance: **TODO**',
      );
    tasks = tasks
      .replace('## UIR11 — Scroll and motion — DONE', '## UIR11 — Scroll and motion — ACTIVE')
      .replace(
        '## UIR12 — Gestures, drag/drop, editing and cursor — DONE',
        '## UIR12 — Gestures, drag/drop, editing and cursor — ACTIVE',
      )
      .replace(
        '## UIR13 — Developer compositions and adaptive scaffolds — NEXT',
        '## UIR13 — Developer compositions and adaptive scaffolds — TODO',
      );
    for (const id of TASK_IDS) {
      const pattern = new RegExp('(^- `UI-' + id + '`[^\\n]*?) \\*\\*DONE\\*\\*$', 'm');
      tasks = tasks.replace(pattern, '$1');
    }
    const backedMarker = 'Canonical `DONE` is backed by the full `pnpm verify` closeout run;';
    const firstBacked = tasks.indexOf(backedMarker);
    if (firstBacked >= 0) {
      tasks = `${tasks.slice(0, firstBacked)}Canonical \`DONE\` remains intentionally blocked until the full \`pnpm verify\` run succeeds on an installed workspace;${tasks.slice(firstBacked + backedMarker.length)}`;
    }
    const secondBacked = tasks.indexOf(backedMarker);
    if (secondBacked >= 0) {
      tasks = `${tasks.slice(0, secondBacked)}Canonical \`DONE\` remains blocked until the full \`pnpm verify\` run succeeds on an installed workspace;${tasks.slice(secondBacked + backedMarker.length)}`;
    }
  }

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

function runPnpm(args) {
  return spawnSync('pnpm', args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });
}

try {
  setRoadmapState('done');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

console.log('UIR11 + UIR12 closeout: regenerating canonical catalog before full verification.');
let result = runPnpm(['catalog:generate']);
if (result.status === 0) {
  console.log('UIR11 + UIR12 closeout: candidate claims staged; running full pnpm verify.');
  result = runPnpm(['verify']);
}

if (result.status === 0) {
  console.log('UIR11 + UIR12 closeout passed. UIR11/UIR12 remain DONE; UIR13 is NEXT.');
  process.exit(0);
}

try {
  setRoadmapState('active');
} catch (error) {
  console.error('Validation failed and truthful ACTIVE roadmap markers could not be restored:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(result.status ?? 1);
}

console.error(
  'UIR11 + UIR12 closeout validation failed. Implementation/generated state is preserved; only roadmap acceptance claims were returned to ACTIVE. NO SOURCE ROLLBACK.',
);
process.exit(result.status ?? 1);
