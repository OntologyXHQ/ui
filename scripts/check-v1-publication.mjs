import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const pkg = JSON.parse(
  await readFile(new URL('../packages/ui/package.json', import.meta.url), 'utf8'),
);
const expectedTag = `v${pkg.version}`;
const evidenceRoot = path.resolve('artifacts/publication');
await mkdir(evidenceRoot, { recursive: true });

function run(command, args) {
  return spawnSync(command, args, { encoding: 'utf8' });
}

const evidence = {
  schema: 1,
  createdAt: new Date().toISOString(),
  package: `${pkg.name}@${pkg.version}`,
  expectedTag,
  gitTagAtHead: false,
  registryVersion: null,
  latest: null,
  passed: false,
  failures: [],
};

const tags = run('git', ['tag', '--points-at', 'HEAD']);
if (tags.status !== 0) {
  evidence.failures.push(`git tag lookup failed: ${String(tags.stderr || tags.stdout).trim()}`);
} else {
  evidence.gitTagAtHead = tags.stdout.split(/\s+/).includes(expectedTag);
  if (!evidence.gitTagAtHead)
    evidence.failures.push(`${expectedTag} does not point at current HEAD`);
}

const versionResult = run('npm', ['view', `${pkg.name}@${pkg.version}`, 'version', '--json']);
if (versionResult.status !== 0) {
  evidence.failures.push(`npm registry does not expose ${pkg.name}@${pkg.version}`);
} else {
  try {
    evidence.registryVersion = JSON.parse(versionResult.stdout.trim());
  } catch {
    evidence.registryVersion = versionResult.stdout.trim().replaceAll('"', '');
  }
  if (evidence.registryVersion !== pkg.version) {
    evidence.failures.push(
      `registry version mismatch: ${JSON.stringify(evidence.registryVersion)}`,
    );
  }
}

const tagsResult = run('npm', ['view', pkg.name, 'dist-tags', '--json']);
if (tagsResult.status !== 0) {
  evidence.failures.push(`npm dist-tag lookup failed for ${pkg.name}`);
} else {
  try {
    evidence.latest = JSON.parse(tagsResult.stdout.trim())?.latest ?? null;
  } catch {
    evidence.latest = null;
  }
  if (evidence.latest !== pkg.version) {
    evidence.failures.push(
      `npm dist-tag latest is ${JSON.stringify(evidence.latest)}, expected ${pkg.version}`,
    );
  }
}

evidence.passed = evidence.failures.length === 0;
const timestamp = evidence.createdAt.replaceAll(/[:.]/g, '-');
await writeFile(
  path.join(evidenceRoot, `publication-${timestamp}.json`),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
await writeFile(path.join(evidenceRoot, 'latest.json'), `${JSON.stringify(evidence, null, 2)}\n`);

if (!evidence.passed) {
  console.error('V1 publication verification failed:');
  for (const failure of evidence.failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(
  `V1 publication verification passed: ${expectedTag} at HEAD · ${pkg.name}@${pkg.version} published · npm latest=${pkg.version}.`,
);
