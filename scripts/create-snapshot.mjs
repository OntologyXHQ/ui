import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'artifacts', 'snapshots');
mkdirSync(outDir, { recursive: true });

function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout.trim();
}

const dirty = git(['status', '--porcelain']);
if (dirty) {
  console.error('Snapshot refused: working tree is not clean. Commit/stash intentionally before creating a canonical tracked-source snapshot.');
  process.exit(1);
}

const head = git(['rev-parse', 'HEAD']);
const branch = git(['branch', '--show-current']) || 'detached';
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const base = `OXS-UI-snapshot-${stamp}`;
const tarPath = path.join(outDir, `${base}.tar`);
const manifestPath = path.join(outDir, `${base}.json`);

const archive = spawnSync('git', ['archive', '--format=tar', `--output=${tarPath}`, 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
});
if (archive.status !== 0) {
  console.error(archive.stderr.trim());
  process.exit(archive.status ?? 1);
}

writeFileSync(
  manifestPath,
  `${JSON.stringify({ schema: 1, repository: 'OntologyXHQ/ui', branch, head, createdAt: new Date().toISOString(), format: 'git-archive-tar', dirty: false }, null, 2)}\n`,
);

console.log(`Snapshot created:\n  ${tarPath}\n  ${manifestPath}\n  HEAD ${head}`);
