import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '../..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const issues = [];

const exportsUnderTest = [
  'SystemNotificationCenter',
  'SystemQuickSettings',
  'SystemOsd',
  'SystemCommandSurface',
  'SystemLockLayout',
  'SystemKeyboardHost',
];
const privilegedSources = [
  'packages/ui/src/system/SystemCenters.tsx',
  'packages/ui/src/system/SystemTransientLayouts.tsx',
  'packages/ui/src/system/SystemKeyboard.tsx',
];

const certifications = JSON.parse(read('docs/quality/CERTIFICATIONS.json'));
const scenarios = read('scripts/browser/scenarios.mjs');
const centers = read('packages/ui/src/system/SystemCenters.tsx');
const transient = read('packages/ui/src/system/SystemTransientLayouts.tsx');
const keyboard = read('packages/ui/src/system/SystemKeyboard.tsx');
const styles = read('packages/ui/src/styles/system-ui.css');
const docs = read('packages/ui/src/system/System.docs.tsx');
const keyboardTests = read('packages/ui/src/system/__tests__/system-keyboard.test.tsx');
const layoutTests = read('packages/ui/src/system/__tests__/system-layouts.test.tsx');
const qualityGates = read('docs/quality/QUALITY_GATES.md');
const audit = read('docs/quality/UIR15_PRIVILEGED_SYSTEM_AUDIT.md');
const packageJson = JSON.parse(read('package.json'));
const tarball = read('scripts/create-tarball.mjs');
const closeout = read('scripts/closeout-uir15.mjs');
const oxsValidator = read('scripts/validate-oxs-consumer.mjs');

for (const name of exportsUnderTest) {
  const record = certifications.exports?.[name];
  if (!record) {
    issues.push(`${name}: missing certification record`);
    continue;
  }
  if (record.owner !== 'UIR15') issues.push(`${name}: certification owner must be UIR15`);
  if (!record.browserScenarios?.includes('privileged-system-surfaces-certification')) {
    issues.push(`${name}: missing privileged-system-surfaces-certification binding`);
  }
  for (const test of record.behaviorTests ?? []) {
    const normalized = test.replace(/^@ontologyx\/ui\//, 'packages/ui/src/');
    if (!existsSync(path.join(root, normalized)))
      issues.push(`${name}: behavior test missing: ${test}`);
  }
}

const importPattern = /(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/gu;
for (const relative of privilegedSources) {
  const source = read(relative);
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) {
      if (specifier !== 'react')
        issues.push(`${relative}: unreviewed external import ${specifier}`);
      continue;
    }
    if (specifier === '../components' || specifier === './SystemScaffold') continue;
    issues.push(
      `${relative}: privileged System code bypasses Component/System boundary via ${specifier}`,
    );
  }
  for (const rawControl of ['<button', '<input', '<select', '<textarea']) {
    if (source.includes(rawControl)) issues.push(`${relative}: raw interactive HTML ${rawControl}`);
  }
  for (const hostAuthority of [
    /\bfetch\s*\(/u,
    /\bWebSocket\b/u,
    /\blocalStorage\b/u,
    /\bsessionStorage\b/u,
    /\bnavigator\./u,
    /\bwindow\./u,
    /\bdocument\./u,
    /Notification\.requestPermission/u,
  ]) {
    if (hostAuthority.test(source)) {
      issues.push(
        `${relative}: host/browser authority leaked into privileged System source (${hostAuthority})`,
      );
    }
  }
}

for (const token of [
  'onActivate?: (id: string) => void;',
  'data-system-notification-id={item.id}',
  '() => onActivate(item.id)',
  'data-system-quick-setting-id={section.id}',
]) {
  if (!centers.includes(token)) issues.push(`UI-1502 host-neutral System centers missing ${token}`);
}

for (const token of [
  'edge="block-end"',
  '<StatusIndicator label={label} tone={tone} announce />',
  'commandListRef.current?.ownerDocument.activeElement',
]) {
  if (!transient.includes(token)) issues.push(`UI-1503 transient contract missing ${token}`);
}
if (/\bdocument\.activeElement\b/u.test(transient)) {
  issues.push('SystemCommandSurface still uses ambient document.activeElement');
}

for (const token of [
  'const keyboardRef = useRef<HTMLDivElement | null>(null);',
  'keyboardRef.current?.ownerDocument.defaultView',
  'ownerWindow.setInterval',
  'state.visible',
  'repeatTimerWindowRef.current?.clearInterval',
  'data-oxs-system-keyboard-session',
]) {
  if (!keyboard.includes(token))
    issues.push(`UI-1501 keyboard lifecycle contract missing ${token}`);
}
const bareSetInterval = keyboard
  .split('\n')
  .filter((line) => line.includes('setInterval(') && !line.includes('ownerWindow.setInterval('));
if (bareSetInterval.length)
  issues.push('SystemKeyboardHost repeat timing escaped the owner Window realm');

const osdBlock = styles.match(/\.ui-system-osd\s*\{([\s\S]*?)\n\}/u)?.[1] ?? '';
for (const token of ['--oxs-safe-block-end', '--oxs-occlusion-block-end', 'pointer-events: none']) {
  if (!osdBlock.includes(token)) issues.push(`UI-1504 SystemOsd style missing ${token}`);
}
const osdCardBlock = styles.match(/\.ui-system-osd__card\s*\{([\s\S]*?)\n\}/u)?.[1] ?? '';
if (osdCardBlock.includes('pointer-events: auto')) {
  issues.push('SystemOsd card re-enabled pointer input on an informational transient surface');
}
const lockBlock = styles.match(/\.ui-system-lock-layout\s*\{([\s\S]*?)\n\}/u)?.[1] ?? '';
for (const logicalEdge of ['block-start', 'inline-end', 'block-end', 'inline-start']) {
  if (!lockBlock.includes(`--oxs-safe-${logicalEdge}`))
    issues.push(`SystemLockLayout missing safe-area ${logicalEdge}`);
  if (!lockBlock.includes(`--oxs-occlusion-${logicalEdge}`))
    issues.push(`SystemLockLayout missing transient occlusion ${logicalEdge}`);
}
const keyboardBlock =
  styles.match(/\.ui-system-keyboard-host \.ui-system-keyboard\s*\{([\s\S]*?)\n\}/u)?.[1] ?? '';
for (const token of ['--oxs-safe-block-end', '--oxs-safe-inline-start', '--oxs-safe-inline-end']) {
  if (!keyboardBlock.includes(token))
    issues.push(`SystemKeyboardHost safe-area style missing ${token}`);
}
if (keyboardBlock.includes('--oxs-occlusion-')) {
  issues.push('SystemKeyboardHost must not consume the occlusion it produces');
}

for (const token of [
  'stops repeat immediately when compositor-owned visibility is withdrawn',
  'expect(afterHide).toBe(beforeHide)',
]) {
  if (!keyboardTests.includes(token)) issues.push(`UI-1501 behavior evidence missing ${token}`);
}
if (!layoutTests.includes("onNotificationActivate).toHaveBeenCalledWith('update-ready')")) {
  issues.push('UIR15 layout behavior evidence missing stable notification activation identity');
}
if (
  !/toHaveAttribute\(\s*["']data-oxs-system-edge["']\s*,\s*["']block-end["']\s*,?\s*\)/u.test(
    layoutTests,
  )
) {
  issues.push('UIR15 layout behavior evidence missing logical block-end System surface assertion');
}

for (const token of [
  "'privileged-system-surfaces-certification'",
  "insets: 'keyboard'",
  "insets: 'gesture'",
  'SystemOsd did not stay clear of transient keyboard occlusion.',
  'Informational SystemOsd captured pointer input.',
  'Reduced-motion SystemOsd retained autonomous animation.',
  'SystemLockLayout did not keep authentication content clear of transient occlusion.',
  'SystemNotificationCenter did not report activation by stable identity.',
  'SystemKeyboardHost was not mounted through the owning SystemScaffold privileged slot.',
  'SystemKeyboardHost did not consume persistent logical safe-area padding.',
  'Persian key plane did not switch to RTL.',
  'SystemKeyboardHost consumed the occlusion that it is responsible for producing.',
]) {
  if (!scenarios.includes(token)) issues.push(`UIR15 G6 evidence missing ${token}`);
}
for (const name of exportsUnderTest) {
  if (!scenarios.includes(`'${name}'`))
    issues.push(`${name}: UIR15 G6 scenario does not claim export`);
}

for (const token of [
  'SystemScaffold\n          workspace={<div aria-hidden data-uir15-keyboard-workspace />}',
  'Requested notification id: ${requestedNotificationId}',
  'receive activation by stable id',
  'owner-Window repeat',
  'without consuming the occlusion produced by the keyboard itself',
]) {
  if (!docs.includes(token)) issues.push(`UIR15 Studio/docs evidence missing ${token}`);
}

for (const task of ['UI-1501', 'UI-1502', 'UI-1503', 'UI-1504', 'UI-1505', 'UI-1506']) {
  if (!audit.includes(task)) issues.push(`UIR15 audit evidence missing ${task}`);
}
for (const statement of [
  'does not move compositor, notification-delivery, hardware, authentication, text-input/IME',
  '**does not consume the keyboard occlusion that it is responsible for producing**',
  'The standalone package cannot and should not invent a fake security token around React components.',
  'real OXS consumer validation',
]) {
  if (!audit.includes(statement)) issues.push(`UIR15 audit invariant missing: ${statement}`);
}

if (!qualityGates.includes('privileged System surfaces stay host-neutral')) {
  issues.push('UIR15 quality-gate documentation missing privileged host-neutral contract');
}
if (
  packageJson.scripts?.['gate:privileged-system-surfaces'] !==
  'node scripts/gates/check-privileged-system-surfaces.mjs'
) {
  issues.push('package.json missing canonical gate:privileged-system-surfaces command');
}
if (packageJson.scripts?.['uir15:closeout'] !== 'node scripts/closeout-uir15.mjs') {
  issues.push('package.json missing canonical uir15:closeout command');
}
if (!packageJson.scripts?.['gate:architecture']?.includes('check-privileged-system-surfaces.mjs')) {
  issues.push('canonical architecture gate does not include UIR15 privileged System contract');
}
if (tarball.includes("'--ignore-scripts'")) {
  issues.push('tarball creation still passes unsupported pnpm pack --ignore-scripts option');
}
if (!tarball.includes("npm_config_ignore_scripts: 'true'")) {
  issues.push(
    'tarball creation does not suppress lifecycle scripts through pnpm/npm config environment',
  );
}
for (const token of [
  "const taskIds = ['1501', '1502', '1503', '1504', '1505', '1506'];",
  "runPnpm(['verify'])",
  "runNode(['scripts/create-tarball.mjs', '--from-build'])",
  "runPnpm(['v1:oxs:check', '--', oxsRoot])",
  'UIR15 closeout PASSED. UIR15 is DONE and UIR16 is NEXT.',
]) {
  if (!closeout.includes(token)) issues.push(`UIR15 closeout contract missing ${token}`);
}

for (const token of [
  "phase = 'baseline-root-gate'",
  'baselineRootScripts.quality',
  "phase = 'manifest-overlay'",
  "phase = 'consumer-package-checks'",
  "const runnable = ['check', 'build']",
  'candidate package checks/builds are authoritative after the untouched baseline root gate passed.',
]) {
  if (!oxsValidator.includes(token)) issues.push(`UI-1506 OXS consumer validator missing ${token}`);
}
const baselineGateIndex = oxsValidator.indexOf("phase = 'baseline-root-gate'");
const candidateOverlayIndex = oxsValidator.indexOf("phase = 'manifest-overlay'");
const consumerChecksIndex = oxsValidator.indexOf("phase = 'consumer-package-checks'");
if (
  !(
    baselineGateIndex >= 0 &&
    candidateOverlayIndex > baselineGateIndex &&
    consumerChecksIndex > candidateOverlayIndex
  )
) {
  issues.push(
    'UI-1506 OXS validation must prove the untouched OXS root policy gate before candidate injection and direct-consumer checks/builds',
  );
}

if (issues.length) {
  console.error('G0 UIR15 privileged System surfaces gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  'G0 UIR15 privileged System gate passed: 6 accepted exports · Component/System-only implementation · owner-realm keyboard repeat · host-neutral IDs/commands · logical safe-area/occlusion split · noninteractive reduced-motion-safe OSD · explicit OXS closeout.',
);
