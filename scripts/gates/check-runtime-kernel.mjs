import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const issues = [];

const uiRoot = read('packages/ui/src/adaptive/UiRoot.tsx');
const arena = read('packages/ui/src/gestures/arena.ts');
const gestureRuntime = read('packages/ui/src/gestures/runtime.tsx');
const gestureIndex = read('packages/ui/src/gestures/index.ts');
const press = read('packages/ui/src/interaction/press.ts');
const focus = read('packages/ui/src/interaction/focus.ts');
const overlay = read('packages/ui/src/interaction/overlay.ts');
const overlayRuntime = read('packages/ui/src/interaction/overlayRuntime.tsx');
const pan = read('packages/ui/src/gestures/usePanGesture.ts');
const edgePan = read('packages/ui/src/gestures/useEdgePanGesture.ts');
const drag = read('packages/ui/src/drag-drop/useDragSource.ts');
const scroll = read('packages/ui/src/scroll/ScrollView.tsx');
const typeahead = read('packages/ui/src/interaction/typeahead.ts');
const selection = read('packages/ui/src/interaction/selection.ts');
const select = read('packages/ui/src/components/Select.tsx');
const overlays = read('packages/ui/src/components/Overlays.tsx');
const overlayDocs = read('packages/ui/src/components/Overlays.docs.tsx');
const baseCss = read('packages/ui/src/styles/base.css');
const navigation = read('packages/ui/src/components/Navigation.tsx');
const clock = read('packages/ui/src/motion/clock.ts');
const motionRuntime = read('packages/ui/src/motion/runtime.tsx');
const motionPerformance = read('packages/ui/src/motion/performance.ts');
const spring = read('packages/ui/src/motion/spring.ts');
const sharedBounds = read('packages/ui/src/motion/SharedBounds.tsx');
const motionDocs = read('packages/ui/src/motion/Transition.docs.tsx');
const browserScenarios = read('scripts/browser/scenarios.mjs');
const publicIndex = read('packages/ui/src/index.ts');
const certification = JSON.parse(read('docs/quality/RUNTIME_KERNEL_CERTIFICATION.json'));

if (!uiRoot.includes('<GestureRuntimeProvider>'))
  issues.push('UiRoot must own a root-scoped GestureRuntimeProvider.');
if (/export const gestureArena\b/.test(arena) || /\bgestureArena\b/.test(gestureIndex))
  issues.push(
    'Gesture arbitration must not expose a module-global singleton; use root-scoped useGestureArena().',
  );
if (
  !arena.includes('dispose()') ||
  !/useEffect\(\(\) => \(\) => \w+\.dispose\(\)/.test(gestureRuntime)
)
  issues.push('Gesture runtime scopes must cancel live candidates during disposal/unmount.');
for (const [name, source] of [
  ['press', press],
  ['pan', pan],
  ['drag', drag],
  ['scroll', scroll],
]) {
  if (!source.includes('useGestureArena'))
    issues.push(`${name} must consume the shared scoped gesture arena.`);
}
if (!press.includes('if (!disabled) return;') || !press.includes('clearPointerSession();'))
  issues.push('Press must cancel active ownership when disabled changes mid-transaction.');
if (!pan.includes('if (disabled && sessionRef.current) cancelSession();'))
  issues.push('Pan gestures must cancel active ownership when disabled changes mid-transaction.');
if (!pan.includes('session.target.ownerDocument.defaultView'))
  issues.push('Pan window continuation must attach to the pointer target owning Window realm.');
if (!pan.includes('sessionTarget.ownerDocument.defaultView?.Node'))
  issues.push('Pan target checks must use the owning realm Node constructor.');
if (!edgePan.includes('event.currentTarget.ownerDocument.defaultView'))
  issues.push('Edge gestures must derive viewport geometry from the target owning Window realm.');
if (/\bdocument\.activeElement\b/.test(focus) || /\bwindow\.getComputedStyle\b/.test(focus))
  issues.push('Focus utilities must not use global document/window ownership.');
if (
  !focus.includes('ownerDocument.activeElement') ||
  !focus.includes('element.ownerDocument.defaultView')
)
  issues.push(
    'Focus utilities must resolve activeElement/computed style through the owning realm.',
  );
if (!focus.includes('reference.ownerDocument.defaultView?.Node'))
  issues.push(
    'Focus document-position comparisons must use the reference owning realm Node constants.',
  );
if (
  !typeahead.includes('export class TypeaheadController') ||
  !typeahead.includes("normalize('NFKC')")
)
  issues.push('Interaction kernel must own one Unicode-normalized TypeaheadController.');
if (
  !select.includes('new TypeaheadController()') ||
  !overlays.includes('new TypeaheadController()')
)
  issues.push('Select and Menu must share the canonical TypeaheadController.');
if (/TYPEAHEAD_RESET_MS|typeaheadTimerRef/.test(select) || /typeaheadTimerRef/.test(overlays))
  issues.push('Select/Menu must not retain private typeahead timer state.');
if (
  !selection.includes('normalizeSingleSelection') ||
  !navigation.includes('normalizeSingleSelection')
)
  issues.push('Selection validity/fallback must use the shared normalization utility.');

// Overlay authority: local stacks, one event broker per Document realm, no per-overlay global listeners.
if (
  !overlayRuntime.includes('export class DocumentOverlayBroker') ||
  !overlayRuntime.includes('new WeakMap<Document, DocumentOverlayBroker>()')
)
  issues.push('Overlay events must be brokered once per concrete Document realm.');
if (
  !overlayRuntime.includes("this.documentRef.addEventListener('keydown'") ||
  !overlayRuntime.includes("this.documentRef.addEventListener('pointerdown'")
)
  issues.push('Document overlay broker must own Escape/outside-pointer listeners.');
if (/\.addEventListener\(['\"](?:keydown|pointerdown)['\"]/.test(overlay))
  issues.push('Individual overlay hooks must not install document keyboard/pointer listeners.');
if (!overlay.includes('ownerDocument') || !overlay.includes('ownerDocument?.defaultView'))
  issues.push(
    'Overlay lifecycle must derive focus/event realm from the committed layer/surface/anchor.',
  );
if (!overlay.includes('useLayoutEffect'))
  issues.push('Modal focus/isolation registration must happen in layout lifecycle before paint.');
if (!overlayRuntime.includes('layer.ownerDocument.defaultView?.HTMLElement'))
  issues.push('Overlay isolation must use the layer owner realm HTMLElement constructor.');
if (
  !overlayRuntime.includes('recomputePortalRanks') ||
  !overlayRuntime.includes('--oxs-overlay-document-depth') ||
  !baseCss.includes('var(--oxs-overlay-document-depth, 0)')
)
  issues.push(
    'Document overlay order must project into portal-host visual stacking, not only event arbitration.',
  );
if (!overlayDocs.includes("id: 'authority'") || !overlayDocs.includes('OverlayAuthorityExample'))
  issues.push('Overlay authority requires a dedicated public Studio fixture.');
const overlayAuthorityFixture = overlayDocs.slice(
  overlayDocs.indexOf('function OverlayAuthorityScope'),
);
if (!overlayAuthorityFixture.includes('dismissOnOutsidePress={false}'))
  issues.push(
    'Cross-root overlay stacking/Escape fixture must disable outside dismissal so concurrent root ownership can be certified without contradicting outside-pointer arbitration.',
  );

// Motion authority: every scheduling/observation/style read follows the concrete Window realm.
if (
  !clock.includes('export type MotionFrameHost') ||
  clock.includes('typeof requestAnimationFrame') ||
  !clock.includes('this.host.requestAnimationFrame(this.tick)')
)
  issues.push('MotionClock must schedule only through an injected realm frame host.');
if (!clock.includes('scheduleTimeout') || !clock.includes('this.timeoutIds'))
  issues.push('MotionClock must own delayed cleanup timers and dispose them with the runtime.');
if (
  !motionRuntime.includes('realmWindow: Window | null') ||
  !motionRuntime.includes('motionFrameHost(realmWindow)')
)
  issues.push(
    'MotionRuntime must retain its concrete owner Window and construct the clock from that realm.',
  );
if (!motionPerformance.includes('realmGlobal?.PerformanceObserver'))
  issues.push('Performance instrumentation must use the owner Window PerformanceObserver.');
if (
  /\bgetComputedStyle\(element\)/.test(spring) &&
  !spring.includes('ownerWindow.getComputedStyle(element)')
)
  issues.push('Spring token reads must use the animated element owner Window.');
if (/\bsetTimeout\(/.test(sharedBounds))
  issues.push('SharedBounds expiry must use the root-owned motion scheduler, not global timers.');
if (!sharedBounds.includes('runtime.clock.scheduleTimeout'))
  issues.push('SharedBounds expiry must use MotionClock delayed scheduling.');
if (!motionDocs.includes("id: 'authority'") || !motionDocs.includes('MotionAuthorityExample'))
  issues.push('Motion authority requires a dedicated Studio fixture.');

if (
  /GestureRuntimeProvider|TypeaheadController|normalizeSingleSelection|DocumentOverlayBroker|MotionFrameHost/.test(
    publicIndex,
  )
)
  issues.push(
    'Kernel engines/utilities must stay off the canonical @ontologyx/ui surface; advanced may expose diagnostics.',
  );

if (certification?.roadmap !== 'UIR05' || certification?.status !== 'certified')
  issues.push('Runtime-kernel certification must mark UIR05 as certified after A/B/C closeout.');
const expectedSlices = [
  ['input-authority', 'UIR05-A'],
  ['overlay-authority', 'UIR05-B'],
  ['motion-authority', 'UIR05-C'],
];
for (const [sliceId, owner] of expectedSlices) {
  const slice = certification?.slices?.[sliceId];
  if (slice?.owner !== owner || slice?.status !== 'certified') {
    issues.push(`Runtime-kernel certification must record ${owner} ${sliceId} as certified.`);
    continue;
  }
  for (const relative of slice.behaviorTests ?? []) {
    if (!fs.existsSync(path.join(ROOT, relative)))
      issues.push(`${owner} certification behavior owner is missing: ${relative}`);
  }
  for (const scenarioId of slice.browserScenarios ?? []) {
    if (!browserScenarios.includes(`'${scenarioId}'`))
      issues.push(`${owner} certification browser scenario is missing: ${scenarioId}`);
  }
  for (const axis of slice.requiredAxes ?? []) {
    if (!browserScenarios.includes(`'${axis}'`))
      issues.push(`${owner} certification axis is not present in browser evidence: ${axis}`);
  }
}

for (const requiredScenario of [
  'interaction-kernel-shared-typeahead',
  'overlay-authority-cross-root-certification',
  'motion-authority-realm-interruption-certification',
]) {
  if (!browserScenarios.includes(`'${requiredScenario}'`))
    issues.push(`G6 runtime evidence is missing dedicated scenario: ${requiredScenario}`);
}

if (issues.length) {
  console.error('G0 interaction/runtime kernel contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  'G0 interaction/runtime kernel contract passed: root-scoped input arbitration · Document-realm overlay event authority with UiRoot-local modal state · realm-owned motion clock/observers/timers · shared Unicode typeahead/selection · dedicated G6 evidence.',
);
