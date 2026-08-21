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
const dragTests = read('packages/ui/src/drag-drop/__tests__/dragDrop.test.tsx');
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
  'if (event.pointerId !== pending.pointerId) return;',
  "priority: 'content'",
]) {
  if (!dragSource.includes(token)) issues.push(`drag source lifecycle missing ${token}`);
}
if (/\bwindow\.(?:setTimeout|clearTimeout|addEventListener|removeEventListener)/.test(dragSource)) {
  issues.push('drag source must not borrow continuation/timers from the ambient Window');
}
if (dragSource.includes('onLostPointerCapture: onPointerCancel')) {
  issues.push(
    'drag source must not treat pointer-capture ownership handoff as pointer cancellation',
  );
}
if (dragSource.includes('eventTargetsSessionElement')) {
  issues.push(
    'drag source must not split continuation ownership by event target once an owner Window exists',
  );
}
if (/setPointerCaptureIfSupported|releasePointerCaptureIfSupported/.test(dragSource)) {
  issues.push(
    'drag source must not steal/release pointer capture; owner-Window continuation owns drag transport',
  );
}
for (const token of [
  'pending.ownerWindow) return;',
  "ownerWindow.addEventListener('pointercancel'",
]) {
  if (!dragSource.includes(token))
    issues.push(`drag source owner-Window authority missing ${token}`);
}
for (const token of [
  'keeps owner-Window continuation authoritative through Button press pointer-capture handoff',
  '<Button {...sourceProps}>Button drag source</Button>',
  "pointerEvent('lostpointercapture'",
]) {
  if (!dragTests.includes(token))
    issues.push(`drag source Button handoff regression missing ${token}`);
}
for (const token of [
  'resolves the actual hit-tested public Button target during owner-Window continuation',
  '<Button {...targetProps}>Public Button target</Button>',
  "Object.defineProperty(document, 'elementFromPoint'",
  "'data-oxs-drop-active', 'true'",
  "'data-oxs-drag-cursor-role'",
  "'drag-move'",
]) {
  if (!dragTests.includes(token)) issues.push(`drag target hit-test regression missing ${token}`);
}
for (const token of [
  'const targetRef = useRef(target)',
  'targetRef.current = target',
  'const bindTarget = useCallback(',
  'unregisterRef.current?.()',
  'unregisterRef.current = registerTarget({',
  'elementRef.current === element',
]) {
  if (!dropTarget.includes(token)) issues.push(`drop target stable registration missing ${token}`);
}
if (dropTarget.includes('registerTarget({ ...target, element })')) {
  issues.push('drop target registration must not churn with inline contract object identity');
}
if (/useState<HTMLElement\s*\|\s*null>/.test(dropTarget)) {
  issues.push(
    'drop target registration must bind synchronously to the attached DOM ref rather than wait for state/effect registration',
  );
}

for (const token of [
  'rootElement?.ownerDocument ?? portalHost?.ownerDocument',
  'ownerDocument.activeElement',
  'ownerWindow.getComputedStyle',
  'ownerWindow.requestAnimationFrame',
  'ownerWindow.cancelAnimationFrame',
  'ownerDocument.elementFromPoint',
  "hit?.closest?.('[data-oxs-drop-target]')",
  'target.element === marker',
  'target.instanceId',
  'targetInstanceId: target?.instanceId',
  'targetsRef.current.set(target.instanceId, target)',
  'targetsRef.current.delete(target.instanceId)',
  'viewportPointToPortalHost',
  'target.element.isConnected',
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

if (/\buseEffect\s*\(/.test(dropTarget)) {
  issues.push(
    'drop target callback-ref registration must be the only lifecycle owner; StrictMode effect replay must not unregister a live target',
  );
}
for (const token of [
  'keeps callback-ref drop registration alive through React StrictMode replay',
  '<StrictMode>',
  '<Button {...targetProps}>Strict target</Button>',
  "'data-oxs-drop-active', 'true'",
  "'data-oxs-drag-cursor-role'",
  "'drag-move'",
]) {
  if (!dragTests.includes(token)) issues.push(`drop target StrictMode regression missing ${token}`);
}

for (const token of [
  'const instanceId = useId()',
  'instanceId,',
  "'data-oxs-drop-target-instance': instanceId",
  'session?.targetInstanceId === instanceId',
]) {
  if (!dropTarget.includes(token)) issues.push(`drop target instance identity missing ${token}`);
}
for (const token of [
  'keeps duplicate semantic target ids instance-safe inside one UiRoot',
  "id: 'shared-target'",
  "'data-oxs-drop-target-instance'",
  "'data-oxs-drop-active', 'true'",
  "'data-oxs-drop-active', 'false'",
  'expect(secondDrop).not.toHaveBeenCalled()',
]) {
  if (!dragTests.includes(token)) issues.push(`duplicate drop-target regression missing ${token}`);
}

// UIR12 provider-authority continuation contract (v2)
for (const token of ['event.pointerId !== pending.pointerId || pending.active']) {
  if (!dragSource.includes(token)) issues.push(`drag source provider handoff missing ${token}`);
}
for (const token of [
  "marker.getAttribute('data-oxs-drop-target-instance')",
  'targets.get(instanceId)',
  "ownerWindow.addEventListener('pointermove', onPointerMove, true)",
  "ownerWindow.addEventListener('pointerup', onPointerUp, true)",
  "ownerWindow.addEventListener('pointercancel', onPointerCancel, true)",
  "ownerWindow.removeEventListener('pointermove', onPointerMove, true)",
]) {
  if (!dragRuntime.includes(token)) issues.push(`drag runtime provider authority missing ${token}`);
}
for (const token of [
  'keeps active drag continuation above descendants that stop pointer bubbling',
  'event.stopPropagation()',
  "'data-oxs-drop-active', 'true'",
  "'data-oxs-drag-cursor-role'",
  "'drag-move'",
]) {
  if (!dragTests.includes(token))
    issues.push(`drag provider-authority regression missing ${token}`);
}

if (issues.length) {
  console.error('G0 gesture/drag/editing/cursor contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 gesture/drag/editing/cursor contract passed: one arena · owner-realm pointer continuation/DnD · stable target lifecycle · clipboard session generations · host-neutral nested cursor intent.',
);
