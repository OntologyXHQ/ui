import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_ROOT = path.join(ROOT, 'packages/ui');
const typographySource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Typography.tsx'), 'utf8');
const iconSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Icon.tsx'), 'utf8');
const surfaceSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Surface.tsx'), 'utf8');
const uiIndexSource = fs.readFileSync(path.join(UI_ROOT, 'src/index.ts'), 'utf8');
const iconPackEntrySource = fs.readFileSync(path.join(UI_ROOT, 'src/icons.ts'), 'utf8');
const staticIconPackSource = fs.readFileSync(path.join(UI_ROOT, 'src/icons/static.ts'), 'utf8');
const animatedIconPackSource = fs.readFileSync(path.join(UI_ROOT, 'src/icons/animated.ts'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(UI_ROOT, 'package.json'), 'utf8'));
const css = fs.readFileSync(path.join(UI_ROOT, 'src/styles/primitives.css'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI_ROOT });
const issues = [];

const visualNames = new Set(['Text', 'Heading', 'Label', 'Code', 'Icon', 'Surface', 'Divider']);
const acceptedVisual = catalog.filter((entry) => visualNames.has(entry.exportName) && entry.status === 'accepted');
for (const exportName of visualNames) {
  const entry = acceptedVisual.find((candidate) => candidate.exportName === exportName);
  if (!entry) {
    issues.push(`${exportName}: certified UIR04 visual primitive must remain accepted`);
    continue;
  }
  if (!entry.examples?.length) issues.push(`${exportName}: accepted visual primitive needs its own Studio example`);
}

const exampleOwners = new Map();
for (const entry of acceptedVisual) {
  for (const example of entry.examples ?? []) {
    const owner = exampleOwners.get(example.component);
    if (owner && owner !== entry.exportName) {
      issues.push(`${entry.exportName}: certification example ${example.component} is shared with ${owner}`);
    }
    exampleOwners.set(example.component, entry.exportName);
  }
}

if (!/ComponentPropsWithoutRef\s*<\s*T\s*>/.test(typographySource)) {
  issues.push('Text/Code polymorphism must preserve native prop typing with ComponentPropsWithoutRef<T>');
}
if (!typographySource.includes("'style' | 'color'")) {
  issues.push('polymorphic typography must explicitly exclude inline style/color');
}
if (!typographySource.includes("export type TextOverflowWrap = 'normal' | 'anywhere'")) {
  issues.push('Typography must expose a finite explicit long-token overflow wrapping contract');
}
if (!typographySource.includes("export type TextElement = 'p' | 'span'")) {
  issues.push('Text native semantics must stay bounded to paragraph/inline text rather than arbitrary polymorphism');
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

if (/\banimated\??\s*:/.test(iconSource) || css.includes('ui-icon--animated') || css.includes('oxs-icon-spin')) {
  issues.push('Icon generic animated/spinner knob is forbidden; motion must belong to declared state transitions');
}
for (const required of ['defaultState', 'states', 'transitions', 'transientState']) {
  if (!iconSource.includes(required)) issues.push(`Icon multi-state definition contract is missing ${required}`);
}
if (!iconSource.includes("data-oxs-icon-phase={activeTransition ? 'transitioning' : 'stable'}")) {
  issues.push('Icon must publish stable vs transient transition phase explicitly');
}
if (!iconSource.includes('data-oxs-icon-visual-state={visualState}')) {
  issues.push('Icon must publish the transient visual-state identity');
}
if (!iconSource.includes('vectorEffect="non-scaling-stroke"') || !iconSource.includes('stroke="currentColor"')) {
  issues.push('Icon must preserve current-color and non-scaling stroke rendering');
}
if (!css.includes(".ui-root[data-oxs-motion='reduced'] .ui-icon__transition")) {
  issues.push('Icon transitions must consume the resolved UiRoot reduced-motion policy');
}
if (!iconSource.includes('readIconTransitionBudgetMs')
  || !iconSource.includes("addEventListener('animationend', settleFromBoundary)")
  || !iconSource.includes("addEventListener('animationcancel', settleFromBoundary)")) {
  issues.push('Icon transition completion must combine owner-node animation boundaries with bounded fallback settlement so transient state cannot deadlock');
}
if (!iconSource.includes('useLayoutEffect(() => {')
  || !iconSource.includes('setVisual((previous) => {')) {
  issues.push('Icon desired-state reconciliation must run pre-paint so a stale stable frame cannot satisfy reduced-motion convergence before the requested transition is committed');
}
for (const reserved of ['role', 'aria-label', 'aria-hidden', 'focusable', 'onAnimationStart', 'onAnimationEnd']) {
  if (!new RegExp(`\\|?\\s*'${reserved}'`).test(iconSource)) {
    issues.push(`Icon must reserve ${reserved} from raw SVG prop overrides`);
  }
}


if (!css.includes(".ui-root[dir='rtl']") || !css.includes(".ui-root [dir='rtl']") || !css.includes('--oxs-icon-inline-transform: scaleX(-1)')) {
  issues.push('Directional Icon mirroring must publish an inherited mirrored inline transform from explicit nested RTL direction boundaries');
}
if (!css.includes(".ui-root[dir='ltr']") || !css.includes(".ui-root [dir='ltr']") || !css.includes('--oxs-icon-inline-transform: none')) {
  issues.push('Directional Icon mirroring must reset the inherited inline transform at nested LTR direction boundaries');
}
if (!css.includes('.ui-icon--mirror-rtl') || !css.includes('var(--oxs-icon-inline-transform, none)')) {
  issues.push('Directional Icon mirroring must consume the inherited logical-direction transform rather than rely on SVG :dir() matching');
}
if (css.includes('.ui-icon--mirror-rtl:dir(rtl)') || css.includes('.ui-root:dir(rtl) .ui-icon--mirror-rtl')) {
  issues.push('Directional Icon mirroring must not depend on SVG-local :dir() matching or a root-only RTL selector');
}
if (/['"]\.\/icons(?:['"]|\/)/.test(uiIndexSource)) {
  issues.push('The large optional icon pack must not be re-exported from the canonical @ontologyx/ui entry');
}
if (!iconPackEntrySource.includes("export * from './icons/index'")) {
  issues.push('The optional icon pack must have a dedicated source entry');
}
const iconPackExport = packageJson.exports?.['./icons'];
if (!iconPackExport || typeof iconPackExport === 'string' || iconPackExport.import !== './dist/icons.js' || iconPackExport.types !== './dist/icons.d.ts') {
  issues.push('@ontologyx/ui/icons must remain a dedicated built package subpath');
}
const staticGlyphDefinitions = (staticIconPackSource.match(/\/\* @__PURE__ \*\/ staticGlyph\(/g) ?? []).length;
const staticGlyphExports = (staticIconPackSource.match(/^export const \w+Glyph\s*=/gm) ?? []).length;
const animatedGlyphFamilies = (animatedIconPackSource.match(/\/\* @__PURE__ \*\/ defineUiIcon\(/g) ?? []).length;
const declaredStaticCount = Number(staticIconPackSource.match(/STATIC_ICON_PACK_COUNT = (\d+)/)?.[1] ?? -1);
const declaredAnimatedCount = Number(animatedIconPackSource.match(/ANIMATED_ICON_FAMILY_COUNT = (\d+)/)?.[1] ?? -1);
if (staticGlyphDefinitions < 160 || staticGlyphExports < 240 || declaredStaticCount !== staticGlyphExports) {
  issues.push(`Icon pack breadth drifted: expected >=160 distinct static glyph definitions, >=240 static exports and an exact declared count; saw ${staticGlyphDefinitions}/${staticGlyphExports}/${declaredStaticCount}`);
}
if (animatedGlyphFamilies < 20 || declaredAnimatedCount !== animatedGlyphFamilies) {
  issues.push(`Animated icon family breadth drifted: expected >=20 stateful families and an exact declared count; saw ${animatedGlyphFamilies}/${declaredAnimatedCount}`);
}
for (const [fileName, source] of [['static', staticIconPackSource], ['animated', animatedIconPackSource]]) {
  const imports = [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map((match) => match[1]);
  if (imports.some((specifier) => specifier !== '../primitives/Icon')) {
    issues.push(`${fileName} icon pack must stay self-contained and depend only on the canonical Icon definition contract`);
  }
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
  issues.push('Surface CSS must remain static; Component interaction pseudo/state selectors are forbidden');
}
for (const role of ['material', 'elevation', 'radius', 'border', 'clip']) {
  if (!new RegExp(`\\b${role}\\?:`).test(surfaceSource)) issues.push(`Surface visual contract is missing ${role}`);
}
if (!surfaceSource.includes("export type DividerTone = 'subtle' | 'default' | 'strong'")) {
  issues.push('Divider tone must use semantic border roles');
}
if (!surfaceSource.includes("export type DividerThickness = 'hairline' | 'strong'")) {
  issues.push('Divider thickness must stay finite/token-backed');
}
for (const logical of ['margin-inline-start', 'margin-inline-end', 'margin-inline:', 'margin-block-start', 'margin-block-end', 'margin-block:']) {
  if (!css.includes(logical)) issues.push(`Divider logical inset CSS is missing ${logical}`);
}

if (issues.length) {
  console.error('G0 visual primitive contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  `G0 visual primitive contract passed: ${acceptedVisual.length} accepted visual primitive(s) · semantic typography/reflow · multi-state transient Icon motion · optional 240+ static / 20+ animated icon pack · local-direction mirroring · static Surface boundary · logical tokenized Divider.`,
);
