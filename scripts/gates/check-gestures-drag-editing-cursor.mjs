import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const pan = read('packages/ui/src/gestures/usePanGesture.ts');
const reveal = read('packages/ui/src/gestures/useDragReveal.ts');
const swipe = read('packages/ui/src/gestures/useSwipeGesture.ts');
const edgePan = read('packages/ui/src/gestures/useEdgePanGesture.ts');
const dragSource = read('packages/ui/src/drag-drop/useDragSource.ts');
const dropTarget = read('packages/ui/src/drag-drop/useDropTarget.ts');
const dragRuntime = read('packages/ui/src/drag-drop/runtime.tsx');
const editingRuntime = read('packages/ui/src/editing/runtime.tsx');
const editable = read('packages/ui/src/editing/useEditableText.ts');
const cursorTypes = read('packages/ui/src/cursor/types.ts');
const cursorRuntime = read('packages/ui/src/cursor/runtime.tsx');
const cursorRegion = read('packages/ui/src/cursor/CursorRegion.tsx');
const cursorCss = read('packages/ui/src/styles/cursor.css');
const uiRoot = read('packages/ui/src/adaptive/UiRoot.tsx');
const rootIndex = read('packages/ui/src/index.ts');
const scenarios = read('scripts/browser/scenarios.mjs');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['GestureRevealHandle', 'interaction-runtime'],
  ['CursorRegion', 'cursor-contract'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') issues.push(`${name}: UIR12 accepted contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId)) {
    issues.push(`${name}: missing Studio example ${exampleId}`);
  }
}

for (const token of [
  'useGestureArena()',
  'gestureArena.claim(event.pointerId, owner)',
  'event.preventDefault()',
  'installWindowContinuation',
  'session.target.ownerDocument.defaultView',
]) {
  if (!pan.includes(token)) issues.push(`pan gesture ownership missing ${token}`);
}
if (/\bwindow\./.test(pan) || /\bdocument\./.test(pan)) {
  issues.push('pan gesture must stay scoped to the concrete owner realm');
}
if (!swipe.includes('return usePanGesture({')) {
  issues.push(
    'swipe gesture must remain a specialization of the accepted arena-owned pan contract',
  );
}
for (const token of [
  "priority: options.priority ?? 'system'",
  'event.currentTarget.ownerDocument.defaultView',
]) {
  if (!edgePan.includes(token)) issues.push(`edge-pan ownership missing ${token}`);
}
for (const token of ['useMotionRuntime()', 'clock.scheduleTimeout', 'clock.cancelTimeout']) {
  if (!reveal.includes(token)) issues.push(`drag-reveal lifecycle missing ${token}`);
}
if (/\bwindow\.(?:setTimeout|clearTimeout)/.test(reveal)) {
  issues.push('drag reveal must use the owning MotionClock rather than ambient Window timers');
}

for (const token of [
  'event.currentTarget.ownerDocument.defaultView',
  'installWindowContinuation',
  "ownerWindow.addEventListener('pointermove'",
  "ownerWindow.addEventListener('pointerup'",
  'ownerWindow.setTimeout',
  'eventTargetsSessionElement',
  "priority: 'content'",
]) {
  if (!dragSource.includes(token)) issues.push(`drag source lifecycle missing ${token}`);
}
if (/\bwindow\.(?:setTimeout|clearTimeout|addEventListener|removeEventListener)/.test(dragSource)) {
  issues.push('drag source must not borrow continuation/timers from the ambient Window');
}
for (const token of [
  'const targetRef = useRef(target)',
  'targetRef.current = target',
  'target.id',
  'element',
]) {
  if (!dropTarget.includes(token)) issues.push(`drop target stable registration missing ${token}`);
}
if (dropTarget.includes('registerTarget({ ...target, element })')) {
  issues.push('drop target registration must not churn with inline contract object identity');
}

for (const token of [
  'rootElement?.ownerDocument ?? portalHost?.ownerDocument',
  'ownerDocument.activeElement',
  'ownerWindow.getComputedStyle',
  'ownerWindow.requestAnimationFrame',
  'ownerWindow.cancelAnimationFrame',
  'ownerDocument.elementFromPoint',
  'viewportPointToPortalHost',
  'target.element.isConnected',
  'targetsRef.current.delete(target.id)',
]) {
  if (!dragRuntime.includes(token)) issues.push(`drag/drop runtime missing ${token}`);
}
if (
  /(?:^|[^A-Za-z])window\.|(?:^|[^A-Za-z])document\.|\bNode\.DOCUMENT_POSITION/m.test(dragRuntime)
) {
  issues.push(
    'drag/drop runtime must use owner Window/Document/Node realm rather than ambient globals',
  );
}

for (const token of [
  'adapterGenerationRef',
  'clipboardGeneration',
  'generation,',
  'ownsSession',
  'previous?.id === next.id',
  'previousBridge?.end?.(active.id)',
  'bridge?.begin?.(active)',
  'adapterRef.current = resolvedAdapter',
]) {
  if (!editingRuntime.includes(token)) issues.push(`editing runtime ownership missing ${token}`);
}
for (const token of [
  'activeSessionIdRef',
  'runtime.ownsSession(activeSessionId)',
  'runtime.clipboardGeneration() !== clipboardRequest.generation',
  'activeSessionIdRef.current !== activeSessionId',
  'runtime.end(previousSessionId)',
]) {
  if (!editable.includes(token)) issues.push(`editable session/race cancellation missing ${token}`);
}

for (const token of [
  'export type CursorHotspot',
  'hotspot: CursorHotspot',
  'pointerRestoreDistance',
  'normalizeCursorRuntimeConfig',
]) {
  if (!cursorTypes.includes(token)) issues.push(`cursor host-intent config missing ${token}`);
}
for (const token of [
  'realmWindow?: Window | null',
  'const activeWindow = realmWindow ?? null',
  "event.pointerType === 'touch' || event.pointerType === 'pen'",
  'resolvedConfig.pointerRestoreDistance',
  'listenerRealmRef.current !== activeWindow',
  "modality !== 'keyboard'",
]) {
  if (!cursorRuntime.includes(token)) issues.push(`cursor modality runtime missing ${token}`);
}
if (/\bwindow\.|\bdocument\./.test(cursorRuntime)) {
  issues.push('cursor modality runtime must listen only in the UiRoot owner Window realm');
}
for (const token of ["'data-oxs-cursor-intent': CursorRole", 'normalizeCursorRole(role)']) {
  if (!cursorRegion.includes(token)) issues.push(`cursor semantic intent missing ${token}`);
}
for (const token of [
  'Browser/Servo preview only',
  ".ui-root[data-oxs-pointer-visible='false']",
  ".ui-root[data-oxs-pointer-visible='true'] { cursor: auto; }",
]) {
  if (!cursorCss.includes(token)) issues.push(`cursor nested-root/host boundary missing ${token}`);
}
for (const token of [
  'realmWindow={realm.window}',
  'data-oxs-cursor-hotspot',
  "'--oxs-cursor-hotspot-x'",
  "'--oxs-cursor-hotspot-y'",
]) {
  if (!uiRoot.includes(token)) issues.push(`UiRoot cursor projection missing ${token}`);
}
for (const forbidden of [
  'usePanGesture',
  'useDragSource',
  'useDropTarget',
  'DragDropProvider',
  'GestureRuntimeProvider',
  'CursorRuntimeProvider',
  'useEditableTextRuntime',
]) {
  if (rootIndex.includes(forbidden)) {
    issues.push(`root public surface leaks advanced runtime API ${forbidden}`);
  }
}

const scenarioName = "'gesture-drag-editing-cursor-certification'";
const scenarioStart = scenarios.indexOf(scenarioName);
const scenarioEnd = scenarios.indexOf(
  "'motion-authority-realm-interruption-certification'",
  scenarioStart,
);
const certificationScenario =
  scenarioStart >= 0 && scenarioEnd > scenarioStart
    ? scenarios.slice(scenarioStart, scenarioEnd)
    : '';
if (!certificationScenario)
  issues.push('missing UIR12 G6 scenario: gesture-drag-editing-cursor-certification');
for (const name of requiredExamples.keys()) {
  if (!certificationScenario.includes(`'${name}'`)) {
    issues.push(`UIR12 G6 scenario does not claim accepted export ${name}`);
  }
}
for (const axis of [
  'arena',
  'native-scroll',
  'text-selection',
  'drag-drop',
  'pointer-continuation',
  'edge-autoscroll',
  'keyboard',
  'clipboard-race',
  'hotspot',
  'nested-root',
  'realm',
  'a11y',
]) {
  if (!certificationScenario.includes(`'${axis}'`))
    issues.push(`UIR12 G6 scenario missing axis ${axis}`);
}

if (issues.length) {
  console.error('G0 gesture/drag/editing/cursor contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 gesture/drag/editing/cursor contract passed: one arena · owner-realm pointer continuation/DnD · stable target lifecycle · clipboard session generations · host-neutral nested cursor intent.',
);
