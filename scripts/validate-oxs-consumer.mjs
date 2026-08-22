import { spawnSync } from 'node:child_process';
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  readlink,
  rm,
  stat,
  symlink,
  writeFile,
} from 'node:fs/promises';
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
    encoding: options.capture || options.input !== undefined ? 'utf8' : undefined,
    input: options.input,
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

const consumerHead = run('git', ['rev-parse', 'HEAD'], consumerRoot, {
  capture: true,
}).stdout.trim();
const trackedOverlayRaw = run(
  'git',
  ['diff', '--name-status', '-z', '--no-renames', consumerHead, '--'],
  consumerRoot,
  { capture: true },
).stdout;
const trackedOverlayTokens = trackedOverlayRaw.split('\0').filter(Boolean);
if (trackedOverlayTokens.length % 2 !== 0) {
  fail('OXS consumer validation could not parse the tracked working-tree overlay.');
}
const trackedOverlay = [];
for (let index = 0; index < trackedOverlayTokens.length; index += 2) {
  trackedOverlay.push({
    status: trackedOverlayTokens[index],
    path: trackedOverlayTokens[index + 1],
  });
}
const untrackedOverlay = run(
  'git',
  ['ls-files', '--others', '--exclude-standard', '-z'],
  consumerRoot,
  { capture: true },
)
  .stdout.split('\0')
  .filter(Boolean);

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

async function overlayUntrackedFiles(sourceRoot, targetRoot, relativePaths) {
  for (const relativePath of relativePaths) {
    const sourcePath = path.join(sourceRoot, relativePath);
    const targetPath = path.join(targetRoot, relativePath);
    const sourceStat = await lstat(sourcePath);
    await mkdir(path.dirname(targetPath), { recursive: true });
    if (sourceStat.isSymbolicLink()) {
      await symlink(await readlink(sourcePath), targetPath);
      continue;
    }
    if (!sourceStat.isFile()) {
      throw new Error(`Unsupported untracked OXS path type: ${relativePath}`);
    }
    await copyFile(sourcePath, targetPath);
    await chmod(targetPath, sourceStat.mode);
  }
}

async function overlayTrackedFiles(sourceRoot, targetRoot, entries) {
  for (const entry of entries) {
    const targetPath = path.join(targetRoot, entry.path);
    if (entry.status === 'D') {
      await rm(targetPath, { recursive: true, force: true });
      continue;
    }

    const sourcePath = path.join(sourceRoot, entry.path);
    const sourceStat = await lstat(sourcePath);
    await rm(targetPath, { recursive: true, force: true });
    await mkdir(path.dirname(targetPath), { recursive: true });
    if (sourceStat.isSymbolicLink()) {
      await symlink(await readlink(sourcePath), targetPath);
      continue;
    }
    if (!sourceStat.isFile()) {
      throw new Error(`Unsupported tracked OXS path type: ${entry.path}`);
    }
    await copyFile(sourcePath, targetPath);
    await chmod(targetPath, sourceStat.mode);
  }
}

function replaceDependency(container, tarballSpecifier) {
  if (!container || typeof container !== 'object' || !('@ontologyx/ui' in container)) return false;
  container['@ontologyx/ui'] = tarballSpecifier;
  return true;
}

let phase = 'worktree';
const modifiedManifests = [];
const consumerManifests = [];
const consumerChecks = [];
let rootConsumerGate = null;
let baselineInstallStatus = null;
let baselineInstallMode = null;
let baselineRootGate = null;
let baselineRootGateStatus = null;
let installStatus = null;
let installMode = null;
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

  phase = 'working-tree-overlay';
  if (trackedOverlay.length) {
    console.log(
      `OXS RC consumer: overlaying ${trackedOverlay.length} current tracked working-tree path(s)`,
    );
    await overlayTrackedFiles(consumerRoot, tempRoot, trackedOverlay);
  }
  if (untrackedOverlay.length) {
    console.log(
      `OXS RC consumer: overlaying ${untrackedOverlay.length} untracked non-ignored file(s)`,
    );
    await overlayUntrackedFiles(consumerRoot, tempRoot, untrackedOverlay);
  }

  const verifyEnv = {
    ...process.env,
    CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? path.join(consumerRoot, 'target'),
  };

  phase = 'baseline-install';
  baselineInstallMode = 'offline';
  console.log('OXS baseline consumer: pnpm install --offline --no-frozen-lockfile');
  let baselineInstall = spawnSync('pnpm', ['install', '--offline', '--no-frozen-lockfile'], {
    cwd: tempRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  baselineInstallStatus = baselineInstall.status;
  const baselineOfflineOutput = `${baselineInstall.stdout ?? ''}${baselineInstall.stderr ?? ''}`;
  if (baselineInstall.status === 0) {
    if (baselineOfflineOutput.trim()) process.stdout.write(baselineOfflineOutput);
  } else if (baselineOfflineOutput.includes('ERR_PNPM_NO_OFFLINE_TARBALL')) {
    console.warn(
      'OXS baseline consumer: pnpm store is missing a required tarball; retrying install with --prefer-offline.',
    );
    baselineInstallMode = 'prefer-offline-fallback';
    baselineInstall = run(
      'pnpm',
      ['install', '--prefer-offline', '--no-frozen-lockfile'],
      tempRoot,
    );
    baselineInstallStatus = baselineInstall.status;
  } else {
    if (baselineOfflineOutput.trim()) process.stderr.write(baselineOfflineOutput);
    throw new Error(
      `Isolated OXS baseline offline install failed with status ${baselineInstall.status ?? 'unknown'}.`,
    );
  }
  if (baselineInstallStatus !== 0) {
    throw new Error(
      `Isolated OXS baseline install failed with status ${baselineInstallStatus ?? 'unknown'}.`,
    );
  }

  phase = 'baseline-root-gate';
  const baselineRootManifest = JSON.parse(
    await readFile(path.join(tempRoot, 'package.json'), 'utf8'),
  );
  const baselineRootScripts =
    baselineRootManifest.scripts && typeof baselineRootManifest.scripts === 'object'
      ? baselineRootManifest.scripts
      : {};
  const baselineRootGateArgs = baselineRootScripts.quality
    ? ['quality']
    : baselineRootScripts.verify
      ? ['verify']
      : null;
  if (!baselineRootGateArgs) {
    throw new Error(
      'OXS consumer validation requires either the post-split pnpm quality gate or the legacy pnpm verify gate at repository root.',
    );
  }
  baselineRootGate = `pnpm ${baselineRootGateArgs.join(' ')}`;
  rootConsumerGate = baselineRootGate;
  console.log(`OXS baseline consumer: ${baselineRootGate}`);
  const baselineGate = run('pnpm', baselineRootGateArgs, tempRoot, { env: verifyEnv });
  baselineRootGateStatus = baselineGate.status;
  verifyStatus = baselineGate.status;
  if (baselineGate.status !== 0) {
    throw new Error(
      `OXS baseline root gate ${baselineRootGate} failed with status ${baselineGate.status ?? 'unknown'}.`,
    );
  }

  phase = 'manifest-overlay';
  const tarballSpecifier = `file:${tarballPath}`;
  const manifests = await collectPackageJson(tempRoot);
  for (const manifestPath of manifests) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const directConsumer = [
      'dependencies',
      'devDependencies',
      'optionalDependencies',
      'peerDependencies',
    ].some(
      (field) =>
        manifest[field] &&
        typeof manifest[field] === 'object' &&
        '@ontologyx/ui' in manifest[field],
    );
    if (directConsumer) consumerManifests.push(path.relative(tempRoot, manifestPath));
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
  if (!consumerManifests.length) {
    throw new Error(
      'The current OXS workspace only references @ontologyx/ui through an override/resolution and has no direct consumer manifest to validate.',
    );
  }

  phase = 'candidate-install';
  installMode = 'offline';
  console.log('OXS RC consumer: pnpm install --offline --no-frozen-lockfile');
  let install = spawnSync('pnpm', ['install', '--offline', '--no-frozen-lockfile'], {
    cwd: tempRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });
  installStatus = install.status;
  const offlineOutput = `${install.stdout ?? ''}${install.stderr ?? ''}`;
  if (install.status === 0) {
    if (offlineOutput.trim()) process.stdout.write(offlineOutput);
  } else if (offlineOutput.includes('ERR_PNPM_NO_OFFLINE_TARBALL')) {
    console.warn(
      'OXS RC consumer: pnpm store is missing a required tarball; retrying install with --prefer-offline so only missing packages may be fetched.',
    );
    installMode = 'prefer-offline-fallback';
    install = run('pnpm', ['install', '--prefer-offline', '--no-frozen-lockfile'], tempRoot);
    installStatus = install.status;
  } else {
    if (offlineOutput.trim()) process.stderr.write(offlineOutput);
    throw new Error(
      `Isolated OXS offline install failed with status ${install.status ?? 'unknown'}.`,
    );
  }
  if (installStatus !== 0)
    throw new Error(`Isolated OXS install failed with status ${installStatus ?? 'unknown'}.`);

  phase = 'consumer-package-checks';
  for (const relativeManifest of consumerManifests) {
    const manifestPath = path.join(tempRoot, relativeManifest);
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const scripts =
      manifest.scripts && typeof manifest.scripts === 'object' ? manifest.scripts : {};
    const packageLabel = manifest.name ?? relativeManifest;
    const packageRoot = path.dirname(manifestPath);
    const runnable = ['check', 'build'].filter(
      (scriptName) => typeof scripts[scriptName] === 'string',
    );
    if (!runnable.length) {
      console.log(
        `OXS RC consumer: ${packageLabel} has no package-local check/build script; root consumer gate remains authoritative.`,
      );
      continue;
    }
    for (const scriptName of runnable) {
      console.log(`OXS RC consumer: ${packageLabel} -> pnpm run ${scriptName}`);
      const result = run('pnpm', ['run', scriptName], packageRoot, { env: verifyEnv });
      const status = result.status;
      consumerChecks.push({
        manifest: relativeManifest,
        package: packageLabel,
        script: scriptName,
        status,
      });
      if (status !== 0) {
        throw new Error(
          `OXS consumer package ${packageLabel} pnpm run ${scriptName} failed with status ${status ?? 'unknown'}.`,
        );
      }
    }
  }

  console.log(
    'OXS RC consumer: candidate package checks/builds are authoritative after the untouched baseline root gate passed.',
  );
  success = true;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  const evidence = {
    schema: 6,
    createdAt: new Date().toISOString(),
    uiPackage: `${uiPackage.name}@${uiPackage.version}`,
    tarball: tarballPath,
    consumerRoot,
    consumerHead,
    isolatedConsumerRoot: tempRoot,
    isolation: 'git-worktree-with-current-overlay',
    workingTreeOverlay: {
      trackedFiles: trackedOverlay,
      untrackedNonIgnoredFiles: untrackedOverlay,
    },
    modifiedManifests,
    consumerManifests,
    consumerChecks,
    rootConsumerGate,
    baselineInstallStatus,
    baselineInstallMode,
    baselineRootGate,
    baselineRootGateStatus,
    phase,
    installStatus,
    installMode,
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
