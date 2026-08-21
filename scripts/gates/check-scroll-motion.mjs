import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const scrollView = read('packages/ui/src/scroll/ScrollView.tsx');
const logical = read('packages/ui/src/scroll/logicalPosition.ts');
const nativeChain = read('packages/ui/src/scroll/nativeChain.ts');
const scrollCss = read('packages/ui/src/styles/scroll.css');
const transition = read('packages/ui/src/motion/Transition.tsx');
const sharedBounds = read('packages/ui/src/motion/SharedBounds.tsx');
const performance = read('packages/ui/src/motion/performance.ts');
const motionCss = read('packages/ui/src/styles/motion.css');
const scenarios = read('scripts/browser/scenarios.mjs');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['ScrollView', 'scroll-contract'],
  ['ScrollSnapItem', 'scroll-contract'],
  ['MotionTransition', 'lifecycle'],
  ['FadeTransition', 'lifecycle'],
  ['ScaleTransition', 'lifecycle'],
  ['SlideTransition', 'lifecycle'],
  ['RevealTransition', 'lifecycle'],
  ['CollapseTransition', 'lifecycle'],
  ['ReplaceTransition', 'lifecycle'],
  ['SharedBounds', 'bounds-lifecycle'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') issues.push(`${name}: UIR11 accepted contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId)) {
    issues.push(`${name}: missing Studio example ${exampleId}`);
  }
}

for (const token of [
  'restorationKey?: string',
  'saveRestoredOffset(viewport, axis, restorationKey',
  'MAX_RESTORED_SCROLL_OFFSETS = 128',
  'readRestoredOffset(viewport, axis, restorationKey)',
  'clock.scheduleTimeout',
  'clock.cancelTimeout',
  'logicalSnapItemStart(',
  'item.getBoundingClientRect()',
  'observeElementSize(viewport, reconcileGeometry)',
  'findNativeScrollableAncestor(viewport, axis, delta)',
  'consumeNativeScrollChain(viewport, axis, delta)',
  'findParentScrollViewport(viewport, axis, localResult.overflow)',
  'findParentScrollViewport(viewport, axis, delta)',
  'canNativeScrollElementConsume(ancestor, axis, delta)',
]) {
  if (!scrollView.includes(token)) issues.push(`ScrollView contract missing ${token}`);
}
if (/\bwindow\.(?:setTimeout|clearTimeout|getComputedStyle)\b/.test(scrollView)) {
  issues.push('ScrollView must not borrow timers/computed-style reads from the ambient Window');
}
for (const token of [
  'const rtlScrollTypes = new WeakMap<Document, RtlScrollType>()',
  'rtlScrollType(element.ownerDocument)',
  'logicalSnapItemStart',
]) {
  if (!logical.includes(token)) issues.push(`logical scroll contract missing ${token}`);
}
if (/typeof document|\bdocument\.createElement|\bgetComputedStyle\(/.test(logical)) {
  issues.push('logical scroll helpers must stay scoped to the concrete owner Document realm');
}
for (const token of [
  'element.ownerDocument.defaultView',
  'readLogicalHorizontalScroll(element, elementDirection(element))',
  'consumeNativeScrollChain(',
  'canNativeScrollElementConsume(',
]) {
  if (!nativeChain.includes(token)) issues.push(`native wheel-chain bridge missing ${token}`);
}
if (/\bwindow\.|\bdocument\./.test(nativeChain)) {
  issues.push('native wheel-chain bridge must stay scoped to concrete owner realms');
}
if (!scrollCss.includes('overscroll-behavior: auto')) {
  issues.push('ScrollView CSS must permit native wheel chaining at an exhausted boundary');
}
if (!scrollCss.includes('overflow: hidden;\n  overflow: clip;\n  isolation: isolate;')) {
  issues.push(
    'ScrollView outer clip must override the compatibility hidden fallback so clip-capable engines do not create a wheel-chain barrier',
  );
}
for (const token of [
  'const nativeResult = consumeNativeScrollChain(viewport, axis, delta)',
  'if (nativeResult.consumed !== 0)',
]) {
  if (!scrollView.includes(token)) {
    issues.push(
      `ScrollView native-chain bridge must synchronously own exhausted wheel transfer: missing ${token}`,
    );
  }
}
if (scrollView.includes('bridgeNativeChainIfNeeded') || scrollView.includes('fallbackTimer')) {
  issues.push(
    'ScrollView native-chain bridge must not defer wheel ownership through an async fallback race',
  );
}
if (!scrollCss.includes("data-overscrolling='true'")) {
  issues.push('ScrollView must promote transform work only while elastic overscroll is active');
}
if (scrollCss.includes(".ui-root[data-oxs-motion='reduced']")) {
  issues.push('ScrollView reduced-motion styling must not leak across nested UiRoot boundaries');
}
if (scrollCss.includes('@media (prefers-reduced-motion: reduce)')) {
  issues.push(
    'ScrollView reduced-motion CSS must consume resolved UiRoot policy, not a global media branch',
  );
}

for (const token of [
  "node.dataset.motionActive = 'true'",
  'data-motion-preference={runtime.preference}',
  'delete node.dataset.motionActive',
  'applyReducedTransitionFrame(node, target)',
  "direction = 'block-start'",
  "direction === 'inline-start'",
  "uiDirection === 'rtl' ? 'slide-right' : 'slide-left'",
]) {
  if (!transition.includes(token)) issues.push(`Transition contract missing ${token}`);
}
if (motionCss.includes(".ui-root[data-oxs-motion='reduced']")) {
  issues.push('Transition reduced-motion styling must be node-local to the owning motion runtime');
}
if (motionCss.includes('@media (prefers-reduced-motion: reduce)')) {
  issues.push(
    'Motion reduced-motion CSS must consume resolved UiRoot policy, not a global media branch',
  );
}
if (!motionCss.includes("[data-motion-active='true']")) {
  issues.push('Motion compositor promotion must be scoped to active lifecycle only');
}
if (
  /\.ui-(?:motion-transition|shared-bounds)\s*\{[^}]*?(?:will-change|backface-visibility)/s.test(
    motionCss,
  )
) {
  issues.push('Motion idle selectors must not retain compositor-promotion hints');
}
for (const token of [
  'cancelSharedBoundsExpiry(runtime, transitionId)',
  'runtime.sharedBoundsExpiry.get(transitionId) !== timeout',
  'delete node.dataset.motionActive',
  'transitionIdRef.current !== transitionId',
]) {
  if (!sharedBounds.includes(token)) issues.push(`SharedBounds lifecycle missing ${token}`);
}
for (const token of [
  'DEFAULT_FRAME_PERFORMANCE_BUDGET',
  'minimumSampledFrames: 30',
  'maximumBudgetMissRatio: 0.1',
  'maximumLongFrameRatio: 0.02',
  'assessFramePerformance(',
  'budgetMissRatio',
  'longFrameRatio',
]) {
  if (!performance.includes(token)) issues.push(`motion performance budget missing ${token}`);
}
if (!performance.includes('this.frameIntervals.filter')) {
  issues.push('motion frame-budget ratios must be derived from the bounded retained sample window');
}
if (performance.includes('private budgetMisses') || performance.includes('private longFrames')) {
  issues.push(
    'motion performance must not divide lifetime miss counters by a bounded rolling sample count',
  );
}
if (!scenarios.includes("'scroll-motion-certification'")) {
  issues.push('missing UIR11 G6 scenario: scroll-motion-certification');
}
const certificationStart = scenarios.indexOf("'scroll-motion-certification'");
const certificationEnd = scenarios.indexOf(
  "'motion-authority-realm-interruption-certification'",
  certificationStart,
);
const certificationScenario =
  certificationStart >= 0 && certificationEnd > certificationStart
    ? scenarios.slice(certificationStart, certificationEnd)
    : '';
for (const name of requiredExamples.keys()) {
  if (!certificationScenario.includes(`'${name}'`)) {
    issues.push(`scroll-motion-certification does not claim accepted export ${name}`);
  }
}
for (const axis of [
  'logical-coordinates',
  'nested-scroll',
  'native-chaining',
  'restoration',
  'variable-geometry',
  'shared-bounds',
  'reduced-motion',
  'performance-budget',
]) {
  if (!scenarios.includes(`'${axis}'`)) issues.push(`UIR11 G6 scenario missing axis ${axis}`);
}

if (issues.length) {
  console.error('G0 scroll/motion contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 scroll/motion contract passed: realm-logical RTL/restoration · nested/native wheel chaining · live snap geometry/resize · interruptible transition/shared-bounds lifecycle · semantic reduced motion · measurable hot-path budgets.',
);
