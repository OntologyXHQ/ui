import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const roadmapPath = path.join(repoRoot, 'ROADMAP.md');
const taskListPath = path.join(repoRoot, 'docs/roadmap/UI_TASK_LIST.md');

const roadmap = readFileSync(roadmapPath, 'utf8');
if (
  roadmap.includes(
    '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **DONE**',
  )
) {
  console.log('UIR17 publication closeout is already DONE.');
  process.exit(0);
}
if (
  !roadmap.includes(
    '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **PUBLICATION READY**',
  )
) {
  console.error(
    'UIR17 publication closeout requires the release-candidate closeout to reach PUBLICATION READY first.',
  );
  process.exit(2);
}

const result = spawnSync(process.execPath, ['scripts/check-v1-publication.mjs'], {
  cwd: repoRoot,
  env: process.env,
  stdio: 'inherit',
});
if (result.status !== 0) {
  console.error(
    'UIR17 publication is not externally complete; planning remains PUBLICATION READY.',
  );
  process.exit(result.status ?? 1);
}

const nextRoadmap = roadmap.replace(
  '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **PUBLICATION READY**',
  '- `UIR17` — Cross-axis certification, package hardening and V1 freeze: **DONE**',
);
let tasks = readFileSync(taskListPath, 'utf8').replace(
  '## UIR17 — Cross-axis certification, package hardening and V1 freeze — PUBLICATION READY',
  '## UIR17 — Cross-axis certification, package hardening and V1 freeze — DONE',
);
const lines = tasks.split('\n');
const index = lines.findIndex((line) => line.startsWith('- `UI-1708`'));
if (index < 0) {
  console.error('UIR17 publication closeout could not find UI-1708.');
  process.exit(2);
}
lines[index] = lines[index]
  .replace(/ \*\*PUBLICATION READY\*\*.*$/, '')
  .replace(/ \*\*DONE\*\*$/, '');
lines[index] += ' **DONE**';
tasks = lines.join('\n');
writeFileSync(roadmapPath, nextRoadmap);
writeFileSync(taskListPath, tasks);
console.log(
  'UIR17 publication closeout PASSED. UI-1708 DONE; UIR17 DONE; @ontologyx/ui V1 is fully closed.',
);
