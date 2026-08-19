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
const pan = read('packages/ui/src/gestures/usePanGesture.ts');
const edgePan = read('packages/ui/src/gestures/useEdgePanGesture.ts');
const drag = read('packages/ui/src/drag-drop/useDragSource.ts');
const scroll = read('packages/ui/src/scroll/ScrollView.tsx');
const typeahead = read('packages/ui/src/interaction/typeahead.ts');
const selection = read('packages/ui/src/interaction/selection.ts');
const select = read('packages/ui/src/components/Select.tsx');
const overlays = read('packages/ui/src/components/Overlays.tsx');
const navigation = read('packages/ui/src/components/Navigation.tsx');
const browserScenarios = read('scripts/browser/scenarios.mjs');
const publicIndex = read('packages/ui/src/index.ts');
const certification = JSON.parse(read('docs/quality/RUNTIME_KERNEL_CERTIFICATION.json'));

if (!uiRoot.includes('<GestureRuntimeProvider>')) {
  issues.push('UiRoot must own a root-scoped GestureRuntimeProvider.');
}
if (/export const gestureArena\b/.test(arena) || /\bgestureArena\b/.test(gestureIndex)) {
  issues.push('Gesture arbitration must not expose a module-global singleton; use root-scoped useGestureArena().');
}
if (!arena.includes('dispose()') || !/useEffect\(\(\) => \(\) => \w+\.dispose\(\)/.test(gestureRuntime)) {
  issues.push('Gesture runtime scopes must cancel live candidates during disposal/unmount.');
}
for (const [name, source] of [['press', press], ['pan', pan], ['drag', drag], ['scroll', scroll]]) {
  if (!source.includes('useGestureArena')) issues.push(`${name} must consume the shared scoped gesture arena.`);
}
if (!press.includes('if (!disabled) return;') || !press.includes('clearPointerSession();')) {
  issues.push('Press must cancel active ownership when disabled changes mid-transaction.');
}
if (!pan.includes('if (disabled && sessionRef.current) cancelSession();')) {
  issues.push('Pan gestures must cancel active ownership when disabled changes mid-transaction.');
}
if (!pan.includes('session.target.ownerDocument.defaultView')) {
  issues.push('Pan window continuation must attach to the pointer target owning Window realm.');
}
if (!pan.includes('sessionTarget.ownerDocument.defaultView?.Node')) {
  issues.push('Pan target checks must use the owning realm Node constructor.');
}
if (!edgePan.includes('event.currentTarget.ownerDocument.defaultView')) {
  issues.push('Edge gestures must derive viewport geometry from the target owning Window realm.');
}
if (/\bdocument\.activeElement\b/.test(focus) || /\bwindow\.getComputedStyle\b/.test(focus)) {
  issues.push('Focus utilities must not use global document/window ownership.');
}
if (!focus.includes('ownerDocument.activeElement') || !focus.includes('element.ownerDocument.defaultView')) {
  issues.push('Focus utilities must resolve activeElement/computed style through the owning realm.');
}
if (!typeahead.includes('export class TypeaheadController') || !typeahead.includes("normalize('NFKC')")) {
  issues.push('Interaction kernel must own one Unicode-normalized TypeaheadController.');
}
if (!select.includes('new TypeaheadController()') || !overlays.includes('new TypeaheadController()')) {
  issues.push('Select and Menu must share the canonical TypeaheadController.');
}
if (/TYPEAHEAD_RESET_MS|typeaheadTimerRef/.test(select) || /typeaheadTimerRef/.test(overlays)) {
  issues.push('Select/Menu must not retain private typeahead timer state.');
}
if (!selection.includes('normalizeSingleSelection') || !navigation.includes('normalizeSingleSelection')) {
  issues.push('Selection validity/fallback must use the shared normalization utility.');
}
if (/GestureRuntimeProvider|TypeaheadController|normalizeSingleSelection/.test(publicIndex)) {
  issues.push('UIR05-A engines/utilities must stay off the canonical @ontologyx/ui surface; Components may consume them internally and advanced may expose diagnostics.');
}
const inputCertification = certification?.slices?.['input-authority'];
if (certification?.roadmap !== 'UIR05' || inputCertification?.owner !== 'UIR05-A' || inputCertification?.status !== 'certified') {
  issues.push('Runtime-kernel certification must record UIR05-A input authority as certified.');
} else {
  for (const relative of inputCertification.behaviorTests ?? []) {
    if (!fs.existsSync(path.join(ROOT, relative))) issues.push(`UIR05-A certification behavior owner is missing: ${relative}`);
  }
  for (const scenarioId of inputCertification.browserScenarios ?? []) {
    if (!browserScenarios.includes(`'${scenarioId}'`)) issues.push(`UIR05-A certification browser scenario is missing: ${scenarioId}`);
  }
  for (const axis of inputCertification.requiredAxes ?? []) {
    if (!browserScenarios.includes(`'${axis}'`)) issues.push(`UIR05-A certification axis is not present in browser evidence: ${axis}`);
  }
}
if (certification?.slices?.['overlay-authority']?.status !== 'candidate' || certification?.slices?.['motion-authority']?.status !== 'candidate') {
  issues.push('UIR05-B/C must remain candidate until their own runtime slices are certified.');
}
if (!browserScenarios.includes("'interaction-kernel-shared-typeahead'")) {
  issues.push('G6 must include dedicated shared typeahead/selection browser evidence.');
}
for (const requiredAxis of ["'interaction-kernel', 'pointer'", "'interaction-kernel', 'touch'"]) {
  if (!browserScenarios.includes(requiredAxis)) issues.push(`G6 runtime evidence is missing axis binding: ${requiredAxis}`);
}

if (issues.length) {
  console.error('G0 interaction/runtime kernel contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log('G0 interaction/runtime kernel contract passed: root-scoped gesture arbitration · disabled cancellation · realm-local focus/gesture continuation · shared Unicode typeahead/selection normalization · dedicated G6 evidence.');
