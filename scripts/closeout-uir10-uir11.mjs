import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');

const TASK_IDS = ['1101', '1102', '1103', '1104', '1105', '1106'];

function replaceRequired(source, from, to, label) {
  if (!source.includes(from)) {
    throw new Error(`UIR10 + UIR11 closeout could not find ${label}: ${JSON.stringify(from)}`);
  }
  return source.replace(from, to);
}

function setRoadmapState(state) {
  let roadmap = readFileSync(roadmapPath, 'utf8');
  let tasks = readFileSync(taskListPath, 'utf8');

  if (state === 'done') {
    if (roadmap.includes('- `UIR11` — Scroll and motion: **ACTIVE**')) {
      roadmap = replaceRequired(
        roadmap,
        '- `UIR11` — Scroll and motion: **ACTIVE**',
        '- `UIR11` — Scroll and motion: **DONE**',
        'active roadmap marker',
      );
    }
    if (roadmap.includes('- `UIR12+` — Gestures/drag/drop/editing → System UI reacceptance: **TODO**')) {
      roadmap = replaceRequired(
        roadmap,
        '- `UIR12+` — Gestures/drag/drop/editing → System UI reacceptance: **TODO**',
        '- `UIR12+` — Gestures/drag/drop/editing → System UI reacceptance: **NEXT**',
        'next-roadmap marker',
      );
    }
    if (tasks.includes('## UIR11 — Scroll and motion — ACTIVE')) {
      tasks = replaceRequired(
        tasks,
        '## UIR11 — Scroll and motion — ACTIVE',
        '## UIR11 — Scroll and motion — DONE',
        'active task-list heading',
      );
    }
    for (const id of TASK_IDS) {
      const pattern = new RegExp('(^- `UI-' + id + '`[^\\n]*?)(?: \\*\\*DONE\\*\\*)?$', 'm');
      if (!pattern.test(tasks)) throw new Error(`UIR10 + UIR11 closeout could not find UI-${id}`);
      tasks = tasks.replace(pattern, '$1 **DONE**');
    }
    tasks = tasks.replace(
      'Canonical `DONE` remains intentionally blocked until the full `pnpm verify` run succeeds on an installed workspace; `pnpm uir11:closeout` performs that final fix-forward closeout without rolling back implementation changes on failure.',
      'Canonical `DONE` is backed by the full `pnpm verify` closeout run; `pnpm uir11:closeout` keeps implementation changes in place if a future rerun exposes a regression.',
    );
  } else {
    roadmap = roadmap
      .replace('- `UIR11` — Scroll and motion: **DONE**', '- `UIR11` — Scroll and motion: **ACTIVE**')
      .replace(
        '- `UIR12+` — Gestures/drag/drop/editing → System UI reacceptance: **NEXT**',
        '- `UIR12+` — Gestures/drag/drop/editing → System UI reacceptance: **TODO**',
      );
    tasks = tasks.replace('## UIR11 — Scroll and motion — DONE', '## UIR11 — Scroll and motion — ACTIVE');
    for (const id of TASK_IDS) {
      const pattern = new RegExp('(^- `UI-' + id + '`[^\\n]*?) \\*\\*DONE\\*\\*$', 'm');
      tasks = tasks.replace(pattern, '$1');
    }
    tasks = tasks.replace(
      'Canonical `DONE` is backed by the full `pnpm verify` closeout run; `pnpm uir11:closeout` keeps implementation changes in place if a future rerun exposes a regression.',
      'Canonical `DONE` remains intentionally blocked until the full `pnpm verify` run succeeds on an installed workspace; `pnpm uir11:closeout` performs that final fix-forward closeout without rolling back implementation changes on failure.',
    );
  }

  writeFileSync(roadmapPath, roadmap);
  writeFileSync(taskListPath, tasks);
}

try {
  setRoadmapState('done');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(2);
}

console.log('UIR10 + UIR11 closeout: marked the candidate source state DONE and running full pnpm verify.');
const result = spawnSync('pnpm', ['verify'], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
});

if (result.status === 0) {
  console.log('UIR10 + UIR11 closeout passed. UIR11 remains DONE; UIR12+ is NEXT.');
  process.exit(0);
}

try {
  setRoadmapState('active');
} catch (error) {
  console.error('Validation failed and the truthful ACTIVE marker could not be restored:');
  console.error(error instanceof Error ? error.message : error);
  process.exit(result.status ?? 1);
}

console.error('UIR10 + UIR11 closeout validation failed. Implementation state is preserved; only roadmap acceptance claims were returned to ACTIVE. NO SOURCE ROLLBACK.');
process.exit(result.status ?? 1);
