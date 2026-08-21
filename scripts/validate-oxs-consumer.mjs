import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
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
const consumerRoot = path.resolve(consumerRootInput);
const excludedCopySegments = new Set([
  'node_modules',
  'target',
  'artifacts',
  'dist',
  '.next',
  'coverage',
]);
const excludedWalkSegments = new Set([...excludedCopySegments, '.git']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!consumerRootInput) {
  fail('OXS consumer validation requires a consumer root: pnpm v1:oxs:check -- /path/to/OXS');
}

const consumerPackage = path.join(consumerRoot, 'package.json');
try {
  await stat(consumerPackage);
} catch {
  fail(`OXS consumer package.json was not found at ${consumerPackage}`);
}

const uiPackage = JSON.parse(
  await readFile(path.join(repositoryRoot, 'packages/ui/package.json'), 'utf8'),
);
const artifactsRoot = path.join(repositoryRoot, 'artifacts');
const artifactNames = await readdir(artifactsRoot).catch(() => []);
const tarballName = artifactNames
  .filter((name) => name.endsWith(`-${uiPackage.version}.tgz`) && name.includes('ontologyx-ui'))
  .sort()
  .at(-1);
if (!tarballName) {
  fail(
    `No @ontologyx/ui@${uiPackage.version} tarball was found under ${artifactsRoot}. Run pnpm package:tarball first.`,
  );
}
const tarballPath = path.join(artifactsRoot, tarballName);
const tempParent = await mkdtemp(path.join(os.tmpdir(), 'ontologyx-ui-oxs-consumer-'));
const tempRoot = path.join(tempParent, 'OXS');
const evidenceRoot = path.join(artifactsRoot, 'oxs-consumer-validation');
await mkdir(evidenceRoot, { recursive: true });

function shouldCopy(source) {
  const relative = path.relative(consumerRoot, source);
  if (!relative) return true;
  const segments = relative.split(path.sep);
  return !segments.some((segment) => excludedCopySegments.has(segment));
}

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

function run(command, args, cwd, env = process.env) {
  console.log(`OXS RC consumer: ${command} ${args.join(' ')}`);
  return spawnSync(command, args, { cwd, env, stdio: 'inherit' });
}

let phase = 'copy';
const modifiedManifests = [];
let installStatus = null;
let verifyStatus = null;
let success = false;
try {
  console.log(
    `OXS RC consumer: cloning current working tree into isolated validation root ${tempRoot}`,
  );
  await cp(consumerRoot, tempRoot, {
    recursive: true,
    preserveTimestamps: true,
    filter: shouldCopy,
  });

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
  const install = run('pnpm', ['install', '--offline', '--no-frozen-lockfile'], tempRoot);
  installStatus = install.status;
  if (install.status !== 0) {
    throw new Error(`Isolated OXS install failed with status ${install.status ?? 'unknown'}.`);
  }

  phase = 'verify';
  const verifyEnv = {
    ...process.env,
    CARGO_TARGET_DIR: process.env.CARGO_TARGET_DIR ?? path.join(consumerRoot, 'target'),
  };
  const verify = run('pnpm', ['verify'], tempRoot, verifyEnv);
  verifyStatus = verify.status;
  if (verify.status !== 0) {
    throw new Error(`OXS pnpm verify failed with status ${verify.status ?? 'unknown'}.`);
  }
  success = true;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  const evidence = {
    schema: 1,
    createdAt: new Date().toISOString(),
    uiPackage: `@ontologyx/ui@${uiPackage.version}`,
    tarball: tarballPath,
    consumerRoot,
    isolatedConsumerRoot: tempRoot,
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
    await rm(tempParent, { recursive: true, force: true });
    console.log(`OXS RC consumer validation PASSED. Evidence: ${timestampPath}`);
  } else {
    console.error(
      `OXS RC consumer validation FAILED during ${phase}. Isolated failure state preserved at ${tempRoot}`,
    );
    console.error(`Evidence: ${timestampPath}`);
  }
}

if (!success) process.exit(1);
