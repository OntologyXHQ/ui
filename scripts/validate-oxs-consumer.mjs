import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const repositoryRoot = process.cwd();
const positionalArgs = process.argv.slice(2).filter((argument) => argument !== '--');
if (positionalArgs.length > 1) {
  console.error(
    `OXS consumer validation received unexpected arguments: ${positionalArgs.slice(1).join(' ')}`,
  );
  process.exit(1);
}
const consumerRootInput = positionalArgs[0] ?? process.env.OXS_CONSUMER_ROOT ?? '';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    env: options.env ?? process.env,
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: options.capture ? 'utf8' : undefined,
  });
  if (options.capture && result.status !== 0) {
    const detail = String(result.stderr || result.stdout || '').trim();
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

if (!consumerRootInput) {
  fail('OXS consumer validation requires a consumer root: pnpm v1:oxs:check -- /path/to/OXS');
}

const requestedRoot = path.resolve(consumerRootInput);
const consumerPackage = path.join(requestedRoot, 'package.json');
try {
  await stat(consumerPackage);
} catch {
  fail(`OXS consumer package.json was not found at ${consumerPackage}`);
}

let consumerRoot;
try {
  consumerRoot = run('git', ['rev-parse', '--show-toplevel'], requestedRoot, {
    capture: true,
  }).stdout.trim();
} catch (error) {
  fail(
    `OXS consumer validation requires a Git worktree: ${error instanceof Error ? error.message : error}`,
  );
}
if (path.resolve(consumerRoot) !== requestedRoot) {
  fail(`OXS consumer root must be the Git repository root. Resolved ${consumerRoot}`);
}

const dirty = run('git', ['status', '--porcelain', '--untracked-files=no'], consumerRoot, {
  capture: true,
}).stdout.trim();
if (dirty) {
  fail(
    'OXS consumer validation requires a clean tracked worktree so the isolated checkout matches a concrete commit. Commit/stash OXS changes first.',
  );
}
const consumerHead = run('git', ['rev-parse', 'HEAD'], consumerRoot, {
  capture: true,
}).stdout.trim();

const uiPackage = JSON.parse(
  await readFile(path.join(repositoryRoot, 'packages/ui/package.json'), 'utf8'),
);
const artifactsRoot = path.join(repositoryRoot, 'artifacts');
const tarballName = `${uiPackage.name.replace(/^@/, '').replaceAll('/', '-')}-${uiPackage.version}.tgz`;
const tarballPath = path.join(artifactsRoot, tarballName);
try {
  await stat(tarballPath);
} catch {
  fail(
    `No packed ${uiPackage.name}@${uiPackage.version} candidate was found at ${tarballPath}. Run pnpm package:tarball first.`,
  );
}

const excludedWalkSegments = new Set([
  'node_modules',
  'target',
  'artifacts',
  'dist',
  '.next',
  'coverage',
  '.git',
]);
const tempParent = await mkdtemp(path.join(os.tmpdir(), 'ontologyx-ui-oxs-consumer-'));
const tempRoot = path.join(tempParent, 'OXS');
const evidenceRoot = path.join(artifactsRoot, 'oxs-consumer-validation');
await mkdir(evidenceRoot, { recursive: true });

async function collectPackageJson(root, files = []) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedWalkSegments.has(entry.name)) continue;
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) await collectPackageJson(target, files);
    else if (entry.isFile() && entry.name === 'package.json') files.push(target);
  }
  return files;
}

function replaceDependency(container, tarballSpecifier) {
  if (!container || typeof container !== 'object' || !('@ontologyx/ui' in container)) return false;
  container['@ontologyx/ui'] = tarballSpecifier;
  return true;
}

let phase = 'worktree';
const modifiedManifests = [];
let installStatus = null;
let verifyStatus = null;
let success = false;
let worktreeAdded = false;
try {
  console.log(
    `OXS RC consumer: creating isolated Git worktree at ${tempRoot} from ${consumerHead}`,
  );
  const add = run('git', ['worktree', 'add', '--detach', tempRoot, consumerHead], consumerRoot);
  if (add.status !== 0)
    throw new Error(`git worktree add failed with status ${add.status ?? 'unknown'}.`);
  worktreeAdded = true;

  phase = 'manifest-overlay';
  const tarballSpecifier = `file:${tarballPath}`;
  const manifests = await collectPackageJson(tempRoot);
  for (const manifestPath of manifests) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    let changed = false;
    for (const field of [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ]) {
      changed = replaceDependency(manifest[field], tarballSpecifier) || changed;
    }
    changed = replaceDependency(manifest.pnpm?.overrides, tarballSpecifier) || changed;
    changed = replaceDependency(manifest.resolutions, tarballSpecifier) || changed;
    if (!changed) continue;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    modifiedManifests.push(path.relative(tempRoot, manifestPath));
  }
  if (!modifiedManifests.length) {
    throw new Error(
      'The current OXS consumer does not declare @ontologyx/ui in any workspace manifest.',
    );
  }

  phase = 'install';
  console.log('OXS RC consumer: pnpm install --offline --no-frozen-lockfile');
  const install = run('pnpm', ['install', '--offline', '--no-frozen-lockfile'], tempRoot);
  installStatus = install.status;
  if (install.status !== 0)
    throw new Error(`Isolated OXS install failed with status ${install.status ?? 'unknown'}.`);

  phase = 'verify';
  const verifyEnv = {
    ...process.env,
    CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? path.join(consumerRoot, 'target'),
  };
  console.log('OXS RC consumer: pnpm verify');
  const verify = run('pnpm', ['verify'], tempRoot, { env: verifyEnv });
  verifyStatus = verify.status;
  if (verify.status !== 0)
    throw new Error(`OXS pnpm verify failed with status ${verify.status ?? 'unknown'}.`);
  success = true;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  const evidence = {
    schema: 2,
    createdAt: new Date().toISOString(),
    uiPackage: `${uiPackage.name}@${uiPackage.version}`,
    tarball: tarballPath,
    consumerRoot,
    consumerHead,
    isolatedConsumerRoot: tempRoot,
    isolation: 'git-worktree',
    modifiedManifests,
    phase,
    installStatus,
    verifyStatus,
    passed: success,
  };
  const timestamp = evidence.createdAt.replaceAll(/[:.]/g, '-');
  const timestampPath = path.join(evidenceRoot, `oxs-consumer-${timestamp}.json`);
  await writeFile(timestampPath, `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile(path.join(evidenceRoot, 'latest.json'), `${JSON.stringify(evidence, null, 2)}\n`);

  if (success) {
    if (worktreeAdded) {
      run('git', ['worktree', 'remove', '--force', tempRoot], consumerRoot);
    }
    await rm(tempParent, { recursive: true, force: true });
    console.log(`OXS RC consumer validation PASSED. Evidence: ${timestampPath}`);
  } else {
    console.error(`OXS RC consumer validation FAILED during ${phase}.`);
    if (worktreeAdded) console.error(`Isolated failing Git worktree preserved at ${tempRoot}`);
    else await rm(tempParent, { recursive: true, force: true });
    console.error(`Evidence: ${timestampPath}`);
  }
}

if (!success) process.exit(1);
