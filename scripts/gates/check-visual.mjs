import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_ROOT = path.join(ROOT, 'packages/ui');
const typographySource = fs.readFileSync(
  path.join(UI_ROOT, 'src/primitives/Typography.tsx'),
  'utf8',
);
const iconSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Icon.tsx'), 'utf8');
const surfaceSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Surface.tsx'), 'utf8');
const uiIndexSource = fs.readFileSync(path.join(UI_ROOT, 'src/index.ts'), 'utf8');
const iconPackEntrySource = fs.readFileSync(path.join(UI_ROOT, 'src/icons.ts'), 'utf8');
const staticIconPackSource = fs.readFileSync(path.join(UI_ROOT, 'src/icons/static.ts'), 'utf8');
const animatedIconPackSource = fs.readFileSync(path.join(UI_ROOT, 'src/icons/animated.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(UI_ROOT, 'package.json'), 'utf8'));
const css = fs.readFileSync(path.join(UI_ROOT, 'src/styles/primitives.css'), 'utf8');
const componentCss = fs.readFileSync(path.join(UI_ROOT, 'src/styles/components.css'), 'utf8');
const tokenCss = fs.readFileSync(path.join(UI_ROOT, 'src/styles/tokens.css'), 'utf8');
const systemUiCss = fs.readFileSync(path.join(UI_ROOT, 'src/styles/system-ui.css'), 'utf8');
const studioCss = fs.readFileSync(path.join(ROOT, 'apps/ui-studio/src/styles/studio.css'), 'utf8');
const demoCss = fs.readFileSync(path.join(ROOT, 'apps/ui-demo/src/demo.css'), 'utf8');
const buttonSource = fs.readFileSync(path.join(UI_ROOT, 'src/components/Button.tsx'), 'utf8');
const feedbackSource = fs.readFileSync(path.join(UI_ROOT, 'src/components/Feedback.tsx'), 'utf8');
const loadingMarkSource = fs.readFileSync(
  path.join(UI_ROOT, 'src/components/OxLoadingMark.tsx'),
  'utf8',
);
const loadingCanvasSource = fs.readFileSync(
  path.join(UI_ROOT, 'src/components/OxLoadingCanvas.tsx'),
  'utf8',
);
const browserScenarioSource = fs.readFileSync(
  path.join(ROOT, 'scripts/browser/scenarios.mjs'),
  'utf8',
);
const catalog = buildCatalog({ uiRoot: UI_ROOT });
const issues = [];

// Final V1 cross-axis polish: all authored semantic token references must use the
// canonical token vocabulary. Runtime-position custom properties are intentionally
// excluded; these aliases are static authoring mistakes that otherwise fail silently
// because var() has no fallback.
const nonCanonicalTokenAliases = [
  ['--oxs-weight-semibold', componentCss, '--oxs-weight-medium'],
  ['--oxs-type-caption-line-height', systemUiCss, '--oxs-type-caption-line'],
  ['--oxs-weight-bold', studioCss, '--oxs-weight-strong'],
  ['--oxs-motion-duration-normal', studioCss, '--oxs-motion-normal'],
  ['--oxs-motion-easing-standard', studioCss, '--oxs-ease-standard'],
  ['--oxs-color-positive', demoCss, '--oxs-color-success'],
];
for (const [legacy, source, canonical] of nonCanonicalTokenAliases) {
  if (source.includes(legacy)) {
    issues.push(`non-canonical visual token ${legacy}; use ${canonical}`);
  }
}

// Final V1 interaction-state polish: semantic selected/checked state must survive
// pointer hover, keyboard focus must remain explicit, and hover affordances that can
// become sticky on touch are scoped to the resolved fine-pointer environment.
const interactionPolishRequirements = [
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-button[aria-pressed='true']:not(:disabled):hover",
    'pressed ToggleButton hover must preserve selected-state treatment',
  ],
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-app-tile[data-selected='true']:not(:disabled):hover",
    'selected AppTile hover must preserve selected-state treatment',
  ],
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-select-option[aria-selected='true']:not(:disabled):hover",
    'selected Select option hover must preserve selected-state treatment',
  ],
  [
    ".ui-switch[data-checked='true']:not(:disabled):hover .ui-switch__track",
    'checked Switch hover must retain accent authority',
  ],
  [
    ".ui-segmented__item[aria-checked='true']:not(:disabled):hover",
    'selected SegmentedControl hover must preserve selected treatment',
  ],
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-tile[data-selected='true'] .ui-tile__action:hover:not(:disabled)",
    'selected Tile hover must preserve selected treatment',
  ],
  ['.ui-list-item__action:focus-visible', 'ListItem action needs keyboard focus treatment'],
  ['.ui-select-option:focus-visible', 'Select option needs keyboard focus treatment'],
  ['.ui-menu-item:focus-visible', 'Menu item needs keyboard focus treatment'],
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-disclosure__summary:hover:not(:disabled)",
    'Disclosure hover affordance must be fine-pointer scoped',
  ],
  [
    ".ui-root[data-oxs-pointer-precision='fine'] .ui-gesture-reveal:hover",
    'GestureReveal hover affordance must be fine-pointer scoped',
  ],
];
for (const [token, message] of interactionPolishRequirements) {
  if (!componentCss.includes(token)) issues.push(message);
}
for (const forbidden of [
  /^\.ui-select-option:hover/m,
  /^\.ui-list-item__action:hover/m,
  /^\.ui-menu-item:hover/m,
  /^\.ui-gesture-reveal:hover/m,
]) {
  if (forbidden.test(componentCss)) {
    issues.push(`coarse-pointer sticky hover regression remains: ${forbidden}`);
  }
}
if (
  !/\.ui-choice:not\(\[data-disabled='true'\]\):hover[\s\S]{0,240}\.ui-choice__native:not\(:checked\):not\(\[aria-checked='mixed'\]\)/.test(
    componentCss,
  )
) {
  issues.push('Checkbox/Radio neutral hover must exclude checked and mixed native states');
}
for (const selector of ['.ui-select-option', '.ui-segmented__item', '.ui-disclosure__summary']) {
  const start = componentCss.indexOf(`${selector} {`);
  const end = start >= 0 ? componentCss.indexOf('}', start) : -1;
  const block = start >= 0 && end >= 0 ? componentCss.slice(start, end + 1) : '';
  if (!block.includes('transition:')) issues.push(`${selector}: visual state transition missing`);
}

const visualNames = new Set(['Text', 'Heading', 'Label', 'Code', 'Icon', 'Surface', 'Divider']);
const acceptedVisual = catalog.filter(
  (entry) => visualNames.has(entry.exportName) && entry.status === 'accepted',
);
const spinnerCatalogEntry = catalog.find((entry) => entry.exportName === 'Spinner');
for (const exportName of visualNames) {
  const entry = acceptedVisual.find((candidate) => candidate.exportName === exportName);
  if (!entry) {
    issues.push(`${exportName}: certified UIR04 visual primitive must remain accepted`);
    continue;
  }
  if (!entry.examples?.length)
    issues.push(`${exportName}: accepted visual primitive needs its own Studio example`);
}

const exampleOwners = new Map();
for (const entry of acceptedVisual) {
  for (const example of entry.examples ?? []) {
    const owner = exampleOwners.get(example.component);
    if (owner && owner !== entry.exportName) {
      issues.push(
        `${entry.exportName}: certification example ${example.component} is shared with ${owner}`,
      );
    }
    exampleOwners.set(example.component, entry.exportName);
  }
}

if (!/ComponentPropsWithoutRef\s*<\s*T\s*>/.test(typographySource)) {
  issues.push(
    'Text/Code polymorphism must preserve native prop typing with ComponentPropsWithoutRef<T>',
  );
}
if (!typographySource.includes("'style' | 'color'")) {
  issues.push('polymorphic typography must explicitly exclude inline style/color');
}
if (!typographySource.includes("export type TextOverflowWrap = 'normal' | 'anywhere'")) {
  issues.push('Typography must expose a finite explicit long-token overflow wrapping contract');
}
if (!typographySource.includes("export type TextElement = 'p' | 'span'")) {
  issues.push(
    'Text native semantics must stay bounded to paragraph/inline text rather than arbitrary polymorphism',
  );
}
if (!typographySource.includes("export type CodeElement = 'code' | 'kbd' | 'samp'")) {
  issues.push('Code native semantics must stay bounded to code/kbd/samp');
}
if (/\.ui-heading--display\s*\{[^}]*max-(inline-)?size/s.test(css)) {
  issues.push('Heading visual scale must not own content/layout width');
}
for (const physical of ['text-align: left', 'text-align: right', 'margin-left', 'margin-right']) {
  if (css.slice(0, css.indexOf('.ui-icon')).includes(physical)) {
    issues.push(`Typography CSS contains physical-direction ownership: ${physical}`);
  }
}

if (
  /\banimated\??\s*:/.test(iconSource) ||
  css.includes('ui-icon--animated') ||
  css.includes('oxs-icon-spin')
) {
  issues.push(
    'Icon generic animated/spinner knob is forbidden; motion must belong to declared state transitions',
  );
}
for (const required of ['defaultState', 'states', 'transitions', 'transientState']) {
  if (!iconSource.includes(required))
    issues.push(`Icon multi-state definition contract is missing ${required}`);
}
if (!iconSource.includes("data-oxs-icon-phase={activeTransition ? 'transitioning' : 'stable'}")) {
  issues.push('Icon must publish stable vs transient transition phase explicitly');
}
if (!iconSource.includes('data-oxs-icon-visual-state={visualState}')) {
  issues.push('Icon must publish the transient visual-state identity');
}
if (
  !iconSource.includes('vectorEffect="non-scaling-stroke"') ||
  !iconSource.includes('stroke="currentColor"')
) {
  issues.push('Icon must preserve current-color and non-scaling stroke rendering');
}
if (!css.includes(".ui-root[data-oxs-motion='reduced'] .ui-icon__transition")) {
  issues.push('Icon transitions must consume the resolved UiRoot reduced-motion policy');
}
if (
  !iconSource.includes('readIconTransitionBudgetMs') ||
  !iconSource.includes("addEventListener('animationend', settleFromBoundary)") ||
  !iconSource.includes("addEventListener('animationcancel', settleFromBoundary)")
) {
  issues.push(
    'Icon transition completion must combine owner-node animation boundaries with bounded fallback settlement so transient state cannot deadlock',
  );
}
if (
  !iconSource.includes('useLayoutEffect(() => {') ||
  !iconSource.includes('setVisual((previous) => {')
) {
  issues.push(
    'Icon desired-state reconciliation must run pre-paint so a stale stable frame cannot satisfy reduced-motion convergence before the requested transition is committed',
  );
}
for (const reserved of [
  'role',
  'aria-label',
  'aria-hidden',
  'focusable',
  'onAnimationStart',
  'onAnimationEnd',
]) {
  if (!new RegExp(`\\|?\\s*'${reserved}'`).test(iconSource)) {
    issues.push(`Icon must reserve ${reserved} from raw SVG prop overrides`);
  }
}

if (
  !css.includes(".ui-root[dir='rtl']") ||
  !css.includes(".ui-root [dir='rtl']") ||
  !css.includes('--oxs-icon-inline-transform: scaleX(-1)')
) {
  issues.push(
    'Directional Icon mirroring must publish an inherited mirrored inline transform from explicit nested RTL direction boundaries',
  );
}
if (
  !css.includes(".ui-root[dir='ltr']") ||
  !css.includes(".ui-root [dir='ltr']") ||
  !css.includes('--oxs-icon-inline-transform: none')
) {
  issues.push(
    'Directional Icon mirroring must reset the inherited inline transform at nested LTR direction boundaries',
  );
}
if (
  !css.includes('.ui-icon--mirror-rtl') ||
  !css.includes('var(--oxs-icon-inline-transform, none)')
) {
  issues.push(
    'Directional Icon mirroring must consume the inherited logical-direction transform rather than rely on SVG :dir() matching',
  );
}
if (
  css.includes('.ui-icon--mirror-rtl:dir(rtl)') ||
  css.includes('.ui-root:dir(rtl) .ui-icon--mirror-rtl')
) {
  issues.push(
    'Directional Icon mirroring must not depend on SVG-local :dir() matching or a root-only RTL selector',
  );
}
if (/['"]\.\/icons(?:['"]|\/)/.test(uiIndexSource)) {
  issues.push(
    'The large optional icon pack must not be re-exported from the canonical @ontologyx/ui entry',
  );
}
if (!iconPackEntrySource.includes("export * from './icons/index'")) {
  issues.push('The optional icon pack must have a dedicated source entry');
}
const iconPackExport = packageJson.exports?.['./icons'];
if (
  !iconPackExport ||
  typeof iconPackExport === 'string' ||
  iconPackExport.import !== './dist/icons.js' ||
  iconPackExport.types !== './dist/icons.d.ts'
) {
  issues.push('@ontologyx/ui/icons must remain a dedicated built package subpath');
}
const staticGlyphDefinitions = (
  staticIconPackSource.match(/\/\* @__PURE__ \*\/ staticGlyph\(/g) ?? []
).length;
const staticGlyphExports = (staticIconPackSource.match(/^export const \w+Glyph\s*=/gm) ?? [])
  .length;
const animatedGlyphFamilies = (
  animatedIconPackSource.match(/\/\* @__PURE__ \*\/ defineUiIcon\(/g) ?? []
).length;
const declaredStaticCount = Number(
  staticIconPackSource.match(/STATIC_ICON_PACK_COUNT = (\d+)/)?.[1] ?? -1,
);
const declaredAnimatedCount = Number(
  animatedIconPackSource.match(/ANIMATED_ICON_FAMILY_COUNT = (\d+)/)?.[1] ?? -1,
);
if (
  staticGlyphDefinitions < 160 ||
  staticGlyphExports < 240 ||
  declaredStaticCount !== staticGlyphExports
) {
  issues.push(
    `Icon pack breadth drifted: expected >=160 distinct static glyph definitions, >=240 static exports and an exact declared count; saw ${staticGlyphDefinitions}/${staticGlyphExports}/${declaredStaticCount}`,
  );
}
if (animatedGlyphFamilies < 20 || declaredAnimatedCount !== animatedGlyphFamilies) {
  issues.push(
    `Animated icon family breadth drifted: expected >=20 stateful families and an exact declared count; saw ${animatedGlyphFamilies}/${declaredAnimatedCount}`,
  );
}
for (const [fileName, source] of [
  ['static', staticIconPackSource],
  ['animated', animatedIconPackSource],
]) {
  const imports = [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]);
  if (imports.some((specifier) => specifier !== '../primitives/Icon')) {
    issues.push(
      `${fileName} icon pack must stay self-contained and depend only on the canonical Icon definition contract`,
    );
  }
}

if (!staticIconPackSource.includes('export const OxMarkGlyph =')) {
  issues.push('The optional icon pack must retain the static OntologyX O+X brand mark');
}
if (
  !spinnerCatalogEntry?.examples?.some(
    (example) => example.id === 'ox-loading' && example.component === 'SpinnerExample',
  )
) {
  issues.push(
    'Spinner must retain its dedicated ox-loading Studio example so branded loading-motion certification never relies on another component entry',
  );
}
if (
  !loadingMarkSource.includes('data-oxs-loading-mark="ox"') ||
  !loadingMarkSource.includes('data-oxs-loading-choreography="write-heartbeat-release"') ||
  !loadingMarkSource.includes('ui-ox-loading-mark__orbit') ||
  !loadingMarkSource.includes('ui-ox-loading-mark__cross')
) {
  issues.push(
    'The shared OntologyX loading mark must retain explicit O-ring/orbit/X write-heartbeat-release structure',
  );
}
if (
  (loadingMarkSource.match(/ui-ox-loading-mark__cross-stroke/g) ?? []).length < 2 ||
  (loadingMarkSource.match(/ui-ox-loading-mark__echo/g) ?? []).length < 2
) {
  issues.push(
    'OntologyX loading choreography must keep independently drawable X strokes and a two-beat echo pair',
  );
}
if (
  !buttonSource.includes('<OxLoadingMark className="ui-control-spinner" />') ||
  !feedbackSource.includes('<OxLoadingMark />')
) {
  issues.push('Button loading and Spinner must consume the one shared OntologyX loading mark');
}
for (const legacySpinner of ['@keyframes ui-control-spin', '@keyframes oxs-component-spin']) {
  if (componentCss.includes(legacySpinner))
    issues.push(`Legacy generic spinner animation must not return: ${legacySpinner}`);
}
for (const keyframe of [
  'oxs-ox-loading-orbit',
  'oxs-ox-loading-write-a',
  'oxs-ox-loading-write-b',
  'oxs-ox-loading-heartbeat',
  'oxs-ox-loading-echo-primary',
  'oxs-ox-loading-echo-secondary',
]) {
  if (!componentCss.includes(`@keyframes ${keyframe}`))
    issues.push(`OntologyX loading choreography is missing ${keyframe}`);
}
if (/ui-ox-loading-mark[^}]*animation:[^;]*\blinear\b/s.test(componentCss)) {
  issues.push('OntologyX loading choreography must not fall back to linear timing');
}
if (
  !componentCss.includes('stroke-dasharray: 96 4') ||
  !componentCss.includes('stroke-dasharray: 7 93') ||
  !componentCss.includes('stroke-dashoffset: -100')
) {
  issues.push(
    'OntologyX O-ring must visibly close, release and return through a seam-equivalent dash phase',
  );
}
if (
  !browserScenarioSource.includes('orbitAnimation.effect.getKeyframes()') ||
  !browserScenarioSource.includes('circularDistance(motion.preSeam.orbitDashoffset') ||
  browserScenarioSource.includes('Math.abs(Math.abs(motion.seam.orbitDashoffset')
) {
  issues.push(
    'OX heartbeat G6 must certify authored endpoint equivalence plus pre-seam modular continuity instead of sampling an infinite animation exactly at the wrapped iteration boundary',
  );
}
if (
  !componentCss.includes('transform: scale(1.13)') ||
  !componentCss.includes('transform: scale(1.075)')
) {
  issues.push('OntologyX loading mark must retain its strong two-beat heartbeat choreography');
}
const spinnerPeriod = Number(tokenCss.match(/--oxs-motion-spinner-period:\s*(\d+)ms/)?.[1] ?? 0);
if (spinnerPeriod < 1600 || spinnerPeriod > 2400) {
  issues.push(
    `OntologyX loading heartbeat period must stay in the expressive 1.6–2.4s range; saw ${spinnerPeriod}ms`,
  );
}
if (
  !componentCss.includes(".ui-root[data-oxs-motion='reduced'] .ui-ox-loading-mark__orbit") ||
  !componentCss.includes(".ui-root[data-oxs-motion='reduced'] .ui-ox-loading-mark__cross")
) {
  issues.push('OntologyX loading mark must settle through resolved UiRoot reduced-motion policy');
}

if (
  !feedbackSource.includes("export type SpinnerRenderer = 'svg' | 'canvas'") ||
  !feedbackSource.includes("import('./OxLoadingCanvas')")
) {
  issues.push(
    'Spinner must expose svg/canvas render backends while lazy-loading the optional Canvas implementation.',
  );
}
if (
  !feedbackSource.includes("renderer = 'svg'") ||
  !feedbackSource.includes('data-oxs-spinner-renderer={renderer}')
) {
  issues.push(
    'Spinner SVG must remain the lightweight default and publish its selected renderer for diagnostics.',
  );
}
if (
  !loadingCanvasSource.includes('useMotionRuntime()') ||
  !loadingCanvasSource.includes('runtime.clock.subscribe')
) {
  issues.push('OX Canvas loading renderer must schedule through the current UiRoot MotionClock.');
}
if (
  /\brequestAnimationFrame\s*\(/.test(loadingCanvasSource) ||
  /\bsetTimeout\s*\(/.test(loadingCanvasSource)
) {
  issues.push(
    'OX Canvas loading renderer must not create a global frame/timer loop outside the MotionClock.',
  );
}
if (
  !loadingCanvasSource.includes('ownerDocument.defaultView') ||
  !loadingCanvasSource.includes('devicePixelContentBoxSize')
) {
  issues.push(
    'OX Canvas loading renderer must size against its own DOM realm and physical content-box resolution.',
  );
}
if (!browserScenarioSource.includes('Spinner renderer parity')) {
  issues.push(
    'G6 must certify one-at-a-time SVG/Canvas Spinner rendering and live Canvas animation.',
  );
}

if (!feedbackSource.includes("size?: 'sm' | 'md' | 'lg' | 'hero'")) {
  issues.push('Spinner must preserve the hero size contract for first-entry/boot loading.');
}
if (spinnerCatalogEntry?.playground?.fixture?.size !== 'hero') {
  issues.push(
    'Spinner Studio preview must default to the hero loading presentation so branded choreography is inspectable.',
  );
}
for (const required of [
  '.ui-spinner--hero',
  '--oxs-ox-orbit-stroke: 2.45',
  '--oxs-ox-cross-stroke: 2.35',
]) {
  if (!componentCss.includes(required))
    issues.push(`OX hero loading treatment is missing ${required}`);
}
if (!browserScenarioSource.includes('Spinner canonical example must show one OX loading mark')) {
  issues.push(
    'OX browser certification must reject duplicate loading marks in the canonical Spinner example.',
  );
}
if (!browserScenarioSource.includes('Boot OX loader is too small')) {
  issues.push(
    'OX browser certification must enforce an inspectable hero-scale first-entry loading presentation.',
  );
}

for (const forbidden of ['hovered?:', 'pressed?:', 'selected?:', 'interactive?:']) {
  if (surfaceSource.includes(forbidden)) {
    issues.push(`Surface must not own Component interaction state: ${forbidden.replace('?:', '')}`);
  }
}
const surfaceCssStart = css.indexOf('.ui-surface');
const surfaceCssEnd = css.indexOf('.ui-radius-none');
const surfaceCss = css.slice(surfaceCssStart, surfaceCssEnd);
if (/:hover|:active|:focus|\[data-(state|selected|pressed)/.test(surfaceCss)) {
  issues.push(
    'Surface CSS must remain static; Component interaction pseudo/state selectors are forbidden',
  );
}
for (const role of ['material', 'elevation', 'radius', 'border', 'clip']) {
  if (!new RegExp(`\\b${role}\\?:`).test(surfaceSource))
    issues.push(`Surface visual contract is missing ${role}`);
}
if (!surfaceSource.includes("export type DividerTone = 'subtle' | 'default' | 'strong'")) {
  issues.push('Divider tone must use semantic border roles');
}
if (!surfaceSource.includes("export type DividerThickness = 'hairline' | 'strong'")) {
  issues.push('Divider thickness must stay finite/token-backed');
}
for (const logical of [
  'margin-inline-start',
  'margin-inline-end',
  'margin-inline:',
  'margin-block-start',
  'margin-block-end',
  'margin-block:',
]) {
  if (!css.includes(logical)) issues.push(`Divider logical inset CSS is missing ${logical}`);
}

if (issues.length) {
  console.error('G0 visual primitive contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  `G0 visual primitive contract passed: ${acceptedVisual.length} accepted visual primitive(s) · semantic typography/reflow · multi-state transient Icon motion · optional 240+ static / 20+ animated icon pack · OX brand loading mark · local-direction mirroring · static Surface boundary · logical tokenized Divider.`,
);
