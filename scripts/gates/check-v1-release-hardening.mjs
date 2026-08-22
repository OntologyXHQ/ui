import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { measureV1Artifacts } from '../v1-artifact-budgets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const withOxs = process.argv.includes('--with-oxs');
const readJson = async (relative) => JSON.parse(await readFile(path.join(ROOT, relative), 'utf8'));
const readText = async (relative) => readFile(path.join(ROOT, relative), 'utf8');
const issues = [];

const [
  pkg,
  studioPkg,
  catalog,
  certificationDoc,
  budgets,
  release,
  readme,
  quality,
  scenariosSource,
  viteConfig,
] = await Promise.all([
  readJson('packages/ui/package.json'),
  readJson('apps/ui-studio/package.json'),
  readJson('apps/ui-studio/src/catalog/generated/catalog.generated.json'),
  readJson('docs/quality/CERTIFICATIONS.json'),
  readJson('docs/quality/V1_ARTIFACT_BUDGETS.json'),
  readText('docs/RELEASE.md'),
  readText('README.md'),
  readText('docs/quality/QUALITY_GATES.md'),
  readText('scripts/browser/scenarios.mjs'),
  readText('packages/ui/vite.config.ts'),
]);

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  issues.push(`package version is not stable semver: ${pkg.version}`);
}
if (studioPkg.private !== true || studioPkg.version !== pkg.version) {
  issues.push(`private Studio version must match the V1 package version ${pkg.version}`);
}
if (pkg.dependencies && Object.keys(pkg.dependencies).length) {
  issues.push('published package must keep zero runtime dependencies');
}
for (const peer of ['react', 'react-dom']) {
  if (!pkg.peerDependencies?.[peer]) issues.push(`missing ${peer} peer dependency`);
}
if (pkg.peerDependencies?.react !== pkg.devDependencies?.react) {
  issues.push('React peer/dev versions must agree for the frozen V1 package');
}
if (pkg.peerDependencies?.['react-dom'] !== pkg.devDependencies?.['react-dom']) {
  issues.push('React DOM peer/dev versions must agree for the frozen V1 package');
}
if (pkg.type !== 'module') issues.push('V1 package must remain ESM-only');
if (!/id === 'react'/.test(viteConfig) || !/id === 'react-dom'/.test(viteConfig)) {
  issues.push('Vite library build no longer explicitly externalizes React/React DOM');
}
if (pkg.exports?.['./styles.css'] !== './dist/styles.css') {
  issues.push('canonical explicit stylesheet export is missing');
}
if (!Array.isArray(pkg.sideEffects) || !pkg.sideEffects.includes('./dist/styles.css')) {
  issues.push('styles.css must be the explicit retained side effect');
}

const nonAccepted = catalog.filter((entry) => entry.status !== 'accepted');
if (catalog.length !== 100 || nonAccepted.length) {
  issues.push(
    `V1 visual catalog must be exactly 100/100 accepted; got ${catalog.length} entries and ${nonAccepted.length} non-accepted`,
  );
}
const certifications = certificationDoc.exports ?? {};
const catalogNames = new Set(catalog.map((entry) => entry.exportName));
const certificationNames = new Set(Object.keys(certifications));
for (const name of catalogNames)
  if (!certificationNames.has(name)) issues.push(`${name}: missing certification`);
for (const name of certificationNames)
  if (!catalogNames.has(name)) issues.push(`${name}: stale certification outside V1 catalog`);

let browserEvidence;
try {
  browserEvidence = await readJson('artifacts/browser-acceptance/latest.json');
} catch {
  issues.push('missing full G6 browser evidence at artifacts/browser-acceptance/latest.json');
}
if (browserEvidence) {
  if (browserEvidence.status !== 'passed') issues.push('latest G6 browser evidence is not passed');
  if (browserEvidence.selection?.scenarioId || browserEvidence.selection?.fromId) {
    issues.push('UIR17 requires a full browser run, not focused evidence');
  }
  const scenarioPattern = /scenario\(\s*'([^']+)'\s*,\s*\[(.*?)\]\s*,/gs;
  const declared = new Map();
  for (const match of scenariosSource.matchAll(scenarioPattern)) {
    declared.set(
      match[1],
      [...match[2].matchAll(/'([^']+)'/g)].map((axis) => axis[1]),
    );
  }
  const passed = new Map(
    (browserEvidence.scenarios ?? [])
      .filter((item) => item.status === 'passed')
      .map((item) => [item.id, item]),
  );
  if (passed.size !== declared.size) {
    issues.push(`full G6 evidence passed ${passed.size}/${declared.size} declared journeys`);
  }
  for (const id of declared.keys())
    if (!passed.has(id)) issues.push(`G6 journey did not pass: ${id}`);
  const observedAxes = new Set([...passed.values()].flatMap((item) => item.axes ?? []));
  const requiredAxes = [
    'ltr',
    'rtl',
    'theme',
    'density',
    'responsive',
    'adaptive-band',
    'pointer',
    'touch',
    'coarse-pointer',
    'keyboard',
    'focus',
    'reduced-motion',
    'a11y',
    'nested-root',
    'portal',
    'reorder',
    'resize',
    'zoom',
    'interruption',
    'realm',
  ];
  for (const axis of requiredAxes)
    if (!observedAxes.has(axis)) issues.push(`G6 cross-axis matrix is missing ${axis}`);
  if ((browserEvidence.harnessSelfTests ?? []).length < 15) {
    issues.push('G6 adversarial harness self-test floor regressed below 15');
  }
}

const lifecycleProofs = [
  [
    'packages/ui/src/adaptive/__tests__/ui-root-certification.test.tsx',
    /\.unmount\(\)/,
    'nested-root unmount',
  ],
  [
    'packages/ui/src/editing/__tests__/editing.test.tsx',
    /delayed paste/,
    'delayed event invalidation',
  ],
  [
    'packages/ui/src/components/__tests__/navigation-data.test.tsx',
    /through reorder/,
    'reorder continuity',
  ],
  [
    'packages/ui/src/components/__tests__/overlays-feedback.test.tsx',
    /portal|portaled/i,
    'portal nesting/order',
  ],
];
for (const [file, pattern, label] of lifecycleProofs) {
  const source = await readText(file);
  if (!pattern.test(source)) issues.push(`missing adversarial lifecycle proof: ${label} (${file})`);
}

const measured = await measureV1Artifacts().catch((error) => {
  issues.push(`could not measure release artifacts: ${error.message}`);
  return null;
});
if (measured) {
  if (
    budgets.schema !== 2 ||
    budgets.freezeOwner !== 'UIR17' ||
    budgets.measurement !== 'final-v1-release-candidate'
  ) {
    issues.push(
      'V1 artifact budgets are not frozen by the final UIR17 release-candidate measurement',
    );
  }
  if (budgets.packageVersion !== measured.version)
    issues.push('V1 budget version does not match package version');
  for (const name of Object.keys(measured.metrics)) {
    const budget = budgets.metrics?.[name];
    if (!budget) {
      issues.push(`${name}: missing final V1 budget`);
      continue;
    }
    if (
      !(budget.measuredBytes > 0) ||
      !(budget.measuredFiles > 0) ||
      !(budget.limitBytes >= budget.measuredBytes)
    ) {
      issues.push(`${name}: frozen UIR17 budget record is malformed`);
    }
  }
}

let smoke;
try {
  smoke = await readJson('artifacts/package-smoke/latest.json');
} catch {
  issues.push(
    'missing fresh packed-tarball consumer evidence at artifacts/package-smoke/latest.json',
  );
}
if (smoke) {
  if (smoke.status !== 'passed') issues.push('packed-tarball consumer evidence is not passed');
  if (smoke.package !== `${pkg.name}@${pkg.version}`)
    issues.push('packed-tarball evidence package identity is stale');
  for (const proof of [
    'nodeImports',
    'ssrRender',
    'types',
    'viteBuild',
    'treeShaking',
    'singleReactPeer',
  ]) {
    if (smoke.proofs?.[proof] !== true)
      issues.push(`packed-tarball consumer proof missing: ${proof}`);
  }
}

if (release.includes('requires a clean tracked OXS Git worktree')) {
  issues.push('release docs still describe the retired clean-OXS consumer requirement');
}
if (release.includes("runs OXS's canonical `pnpm verify`")) {
  issues.push('release docs still describe the retired one-size-fits-all OXS verify contract');
}
for (const phrase of [
  'baseline OXS-owned root gate',
  'tracked changes plus untracked non-ignored files',
  'candidate consumer package `check`/`build`',
  'dist-tag `latest`',
]) {
  if (!release.includes(phrase)) issues.push(`release contract is missing: ${phrase}`);
}
if (readme.includes('The first bootstrap publish is interactive')) {
  issues.push('root README still contains bootstrap-beta publication guidance');
}
for (const phrase of ['SSR render', 'tree-shaking', 'React/React DOM peers']) {
  if (!quality.includes(phrase)) issues.push(`G7 quality contract is missing ${phrase}`);
}

if (withOxs) {
  let oxs;
  try {
    oxs = await readJson('artifacts/oxs-consumer-validation/latest.json');
  } catch {
    issues.push('missing real OXS RC consumer evidence');
  }
  if (oxs) {
    if (oxs.passed !== true) issues.push('latest OXS RC consumer validation did not pass');
    if (oxs.uiPackage !== `${pkg.name}@${pkg.version}`)
      issues.push('OXS RC evidence targets a stale UI package identity');
    if (!Array.isArray(oxs.consumerChecks) || oxs.consumerChecks.length === 0) {
      issues.push('OXS RC evidence contains no direct consumer check/build proof');
    }
  }
}

const tarball = path.join(
  ROOT,
  'artifacts',
  `${pkg.name.replace(/^@/, '').replaceAll('/', '-')}-${pkg.version}.tgz`,
);
try {
  await stat(tarball);
} catch {
  issues.push(`missing packed release candidate ${tarball}`);
}

if (issues.length) {
  console.error('G7 UIR17 release-hardening gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  `G7 UIR17 release-hardening gate passed: ${catalog.length}/100 accepted · full cross-axis/adversarial G6 · final measured budgets · SSR/tree-shake packed consumer${withOxs ? ' · real OXS RC' : ''} · stable publication contract.`,
);
