import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const overlays = fs.readFileSync(path.join(UI, 'src/components/Overlays.tsx'), 'utf8');
const overlayDocs = fs.readFileSync(path.join(UI, 'src/components/Overlays.docs.tsx'), 'utf8');
const transient = fs.readFileSync(path.join(UI, 'src/components/TransientFeedback.tsx'), 'utf8');
const feedback = fs.readFileSync(path.join(UI, 'src/components/Feedback.tsx'), 'utf8');
const scrim = fs.readFileSync(path.join(UI, 'src/components/Scrim.tsx'), 'utf8');
const floating = fs.readFileSync(path.join(UI, 'src/interaction/floating.ts'), 'utf8');
const componentStyles = fs.readFileSync(path.join(UI, 'src/styles/components.css'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['Dialog', 'overview'],
  ['AlertDialog', 'overview'],
  ['Sheet', 'preview'],
  ['BottomSheet', 'preview'],
  ['Popover', 'preview'],
  ['Menu', 'preview'],
  ['MenuItem', 'menu-contract'],
  ['MenuSeparator', 'menu-contract'],
  ['ContextMenu', 'preview'],
  ['Tooltip', 'preview'],
  ['Scrim', 'ownership'],
  ['Badge', 'overview'],
  ['StatusIndicator', 'feedback-contract'],
  ['Progress', 'feedback-contract'],
  ['Spinner', 'ox-loading'],
  ['Skeleton', 'feedback-contract'],
  ['EmptyState', 'feedback-contract'],
  ['Snackbar', 'overview'],
  ['ToastHost', 'overview'],
  ['Banner', 'overview'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') issues.push(`${name}: UIR10 accepted contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId)) {
    issues.push(`${name}: missing Studio example ${exampleId}`);
  }
}

for (const [label, source] of [
  ['Overlays', overlays],
  ['TransientFeedback', transient],
  ['floating engine', floating],
]) {
  if (/\bwindow\./.test(source))
    issues.push(`${label} must use the owning Window realm, not ambient window`);
}
for (const token of [
  'useUiPortalHost()',
  'useOverlayLifecycle({',
  'viewportPointToPortalHost',
  'ownerDocument.defaultView',
  'scheduleOwnerMicrotask',
]) {
  if (!overlays.includes(token))
    issues.push(`overlay lifecycle/floating contract missing ${token}`);
}
for (const token of [
  'ownerWindow.innerWidth',
  'ownerWindow.innerHeight',
  'observeElementGeometry([surface, anchorElement], update)',
]) {
  if (!floating.includes(token)) issues.push(`shared floating realm contract missing ${token}`);
}
if (!componentStyles.includes('translate: var(--oxs-popover-x, 0) var(--oxs-popover-y, 0);')) {
  issues.push('Popover geometry must use non-animated CSS translate coordinates');
}
if (componentStyles.includes('transform: translate3d(var(--oxs-popover-x')) {
  issues.push('Popover anchor coordinates must not share the animated transform channel');
}
if (scrim.includes('createPortal'))
  issues.push('Scrim must remain presentation-only and never own a portal');
for (const token of [
  'aria-live="polite"',
  'aria-relevant="additions text"',
  'data-toast-id={item.id}',
  'timer.ownerWindow.clearTimeout',
  'timer.ownerWindow.performance.now()',
]) {
  if (!transient.includes(token)) issues.push(`toast lifecycle contract missing ${token}`);
}
for (const token of ['<progress', 'aria-hidden="true"', '<OxLoadingMark']) {
  if (!feedback.includes(token))
    issues.push(`feedback semantic/reduced-motion contract missing ${token}`);
}
for (const id of [
  'overlay-components-nested-dismissal-certification',
  'floating-menu-tooltip-certification',
  'feedback-lifecycle-certification',
]) {
  if (!scenarios.includes(`'${id}'`)) issues.push(`missing UIR10 G6 scenario: ${id}`);
}
if (!overlayDocs.includes('<MenuItem>Duplicate</MenuItem>')) {
  issues.push(
    'Menu preview must retain the Duplicate command used by the shared typeahead certification',
  );
}
for (const token of [
  "menu.getByRole('menuitem', { name: 'Open', exact: true })",
  "menu.getByRole('menuitem', { name: 'Duplicate', exact: true })",
  "menu.getByRole('menuitem', { name: 'Remove', exact: true })",
]) {
  if (!scenarios.includes(token))
    issues.push(`floating Menu certification must use stable command identity: ${token}`);
}
if (/floating-menu-tooltip-certification[\s\S]*?items\.nth\(/.test(scenarios)) {
  issues.push('floating Menu certification must not identify commands by ordinal position');
}

if (issues.length) {
  console.error('G0 overlays/feedback contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 overlays/feedback contract passed: shared portal/modal authority · owner-realm floating/timers · semantic Scrim · menu/tooltip/context activation · stable toast live-region/upsert timing · native progress and reduced-motion-safe loading feedback.',
);
