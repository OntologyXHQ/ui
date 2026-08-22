import { spawnSync } from 'node:child_process';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const artifacts = path.join(root, 'artifacts');
const packageRoot = path.join(root, 'packages/ui');
const manifest = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
const expectedName = `${manifest.name.replace(/^@/, '').replaceAll('/', '-')}-${manifest.version}.tgz`;
const tarballPath = path.join(artifacts, expectedName);
const fromBuild = process.argv.includes('--from-build');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

await mkdir(artifacts, { recursive: true });
await rm(tarballPath, { force: true });

if (!fromBuild) {
  const build = spawnSync(pnpm, ['gate:package'], { cwd: root, stdio: 'inherit' });
  if (build.status !== 0) process.exit(build.status ?? 1);
}

const result = spawnSync(
  pnpm,
  ['--dir', 'packages/ui', 'pack', '--ignore-scripts', '--pack-destination', '../../artifacts'],
  { cwd: root, stdio: 'inherit' },
);
if (result.status !== 0) process.exit(result.status ?? 1);
try {
  await stat(tarballPath);
} catch {
  throw new Error(`pnpm pack completed without the expected tarball: ${tarballPath}`);
}
console.log(tarballPath);
