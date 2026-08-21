import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');
const oxsConsumerRoot = process.env.OXS_CONSUMER_ROOT;
if (!oxsConsumerRoot) {
  console.error(
    'V1 closeout requires OXS_CONSUMER_ROOT so System UI is validated against the real current OXS consumer before DONE is recorded.',
  );
  process.exit(1);
}
const doneIds = [
  ...Array.from({ length: 6 }, (_, index) => `13${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 6 }, (_, index) => `14${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 6 }, (_, index) => `15${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 8 }, (_, index) => `16${String(index + 1).padStart(2, '0')}`),
  ...Array.from({ length: 7 }, (_, index) => `17${String(index + 1).padStart(2, '0')}`),
];
const uir11Ids = Array.from({ length: 6 }, (_, index) => `11${String(index + 1).padStart(2, '0')}`);
const uir12Ids = Array.from({ length: 6 }, (_, index) => `12${String(index + 1).padStart(2, '0')}`);

function run(args) {
  const result = spawnSync('pnpm', args, { cwd: repoRoot, env: process.env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function markTaskDone(tasks, id) {
  const pattern = new RegExp('(^- `UI-' + id + '`[^\\n]*?)(?: \\*\\*DONE\\*\\*)?$', 'm');
  if (!pattern.test(tasks)) throw new Error(`V1 closeout could not find UI-${id}`);
  return tasks.replace(pattern, '$1 **DONE**');
}

console.log('V1 closeout: formatting before static checks (fix-forward; no source rollback).');
run(['format']);
console.log('V1 closeout: regenerating the canonical Studio catalog.');
run(['catalog:generate']);
console.log('V1 closeout: running full G0..G7 release acceptance.');
run(['release:check']);
console.log(
  'V1 closeout: freezing measured V1 artifact budgets when no reviewed baseline exists yet.',
);
run(['v1:budgets:freeze', '--', '--if-missing']);
console.log('V1 closeout: enforcing measured V1 artifact budgets.');
run(['v1:budgets:check']);
console.log('V1 closeout: asserting the stable freeze contract.');
run(['v1:freeze:check']);
console.log(
  `V1 closeout: validating the packed release candidate against OXS at ${oxsConsumerRoot}.`,
);
run(['v1:oxs:check', '--', oxsConsumerRoot]);

let roadmap = readFileSync(roadmapPath, 'utf8');
let tasks = readFileSync(taskListPath, 'utf8');

roadmap = roadmap
  .replace('- `UIR11` — Scroll and motion: **ACTIVE**', '- `UIR11` — Scroll and motion: **DONE**')
  .replace(
    '- `UIR12` — Gestures, drag/drop, editing and cursor: **ACTIVE**',
    '- `UIR12` — Gestures, drag/drop, editing and cursor: **DONE**',
  )
  .replace(
    '- `UIR13+` — Developer compositions → System UI reacceptance: **TODO**',
    [
      '- `UIR13` — Developer compositions and adaptive scaffolds: **DONE**',
      '- `UIR14` — System UI core: **DONE**',
      '- `UIR15` — Privileged System surfaces: **DONE**',
      '- `UIR16` — Studio product-quality SDK workbench: **DONE**',
      '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **RELEASE READY**',
    ].join('\n'),
  )
  .replace(
    '- `UIR13` — Developer compositions and adaptive scaffolds: **NEXT**',
    [
      '- `UIR13` — Developer compositions and adaptive scaffolds: **DONE**',
      '- `UIR14` — System UI core: **DONE**',
      '- `UIR15` — Privileged System surfaces: **DONE**',
      '- `UIR16` — Studio product-quality SDK workbench: **DONE**',
      '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **RELEASE READY**',
    ].join('\n'),
  );

tasks = tasks
  .replace('## UIR11 — Scroll and motion — ACTIVE', '## UIR11 — Scroll and motion — DONE')
  .replace(
    '## UIR12 — Gestures, drag/drop, editing and cursor — ACTIVE',
    '## UIR12 — Gestures, drag/drop, editing and cursor — DONE',
  )
  .replace(
    '## UIR13 — Developer compositions and adaptive scaffolds — TODO',
    '## UIR13 — Developer compositions and adaptive scaffolds — DONE',
  )
  .replace(
    '## UIR13 — Developer compositions and adaptive scaffolds — NEXT',
    '## UIR13 — Developer compositions and adaptive scaffolds — DONE',
  )
  .replace('## UIR14 — System UI core — TODO', '## UIR14 — System UI core — DONE')
  .replace(
    '## UIR15 — Privileged System surfaces — TODO',
    '## UIR15 — Privileged System surfaces — DONE',
  )
  .replace(
    '## UIR16 — Studio as a real product-quality SDK workbench — TODO',
    '## UIR16 — Studio as a real product-quality SDK workbench — DONE',
  )
  .replace(
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — TODO',
    '## UIR17 — Cross-axis certification, package hardening and V1 freeze — RELEASE READY',
  );

tasks = tasks
  .replace(
    'Canonical `DONE` remains intentionally blocked until the full `pnpm verify` run succeeds on an installed workspace; `pnpm uir11-12:closeout` performs the consolidated final fix-forward closeout without rolling back implementation changes on failure.',
    'Canonical full G0..G7 acceptance passed during `pnpm v1:closeout`; Scroll/motion evidence is frozen into the V1 certification matrix.',
  )
  .replace(
    'Canonical `DONE` remains blocked until the full `pnpm verify` run succeeds on an installed workspace; `pnpm uir11-12:closeout` regenerates the catalog, runs full verification, preserves implementation on failure and advances UIR13 only after success.',
    'Canonical full G0..G7 acceptance passed during `pnpm v1:closeout`; gesture/drag/editing/cursor evidence is frozen into the V1 certification matrix.',
  );

for (const id of [...uir11Ids, ...uir12Ids, ...doneIds]) tasks = markTaskDone(tasks, id);

writeFileSync(roadmapPath, roadmap);
writeFileSync(taskListPath, tasks);

console.log('V1 closeout: formatting final planning/evidence claims after successful validation.');
run(['format']);
console.log('V1 RELEASE-CANDIDATE CLOSEOUT PASSED. UIR11–UIR16 are DONE; UIR17 is RELEASE READY.');
console.log(
  'External release operation still required for UI-1708: publish/tag @ontologyx/ui@1.0.0 so npm latest points to the already OXS-validated stable line.',
);
