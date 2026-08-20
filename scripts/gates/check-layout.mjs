import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_ROOT = path.join(ROOT, 'packages/ui');
const layoutSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Layout.tsx'), 'utf8');
const layoutCss = fs.readFileSync(path.join(UI_ROOT, 'src/styles/primitives.css'), 'utf8');
const tokenSource = fs.readFileSync(path.join(UI_ROOT, 'src/foundations/tokens.ts'), 'utf8');
const tokenCss = fs.readFileSync(path.join(UI_ROOT, 'src/styles/tokens.css'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI_ROOT });
const issues = [];

const acceptedLayout = catalog.filter(
  (entry) => entry.category === 'Layout' && entry.status === 'accepted',
);
const requiredAccepted = new Set([
  'Box',
  'Stack',
  'Row',
  'Wrap',
  'Grid',
  'Container',
  'Inset',
  'SafeArea',
  'Spacer',
]);
for (const exportName of requiredAccepted) {
  if (!acceptedLayout.some((entry) => entry.exportName === exportName)) {
    issues.push(`${exportName}: certified UIR03 layout primitive must remain accepted`);
  }
}

const forbiddenProps = new Set([
  'style',
  'color',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'padding',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'left',
  'right',
  'top',
  'bottom',
  'width',
  'height',
  'order',
  'reverse',
]);

const exampleOwners = new Map();
for (const entry of acceptedLayout) {
  for (const prop of entry.props ?? []) {
    if (
      forbiddenProps.has(prop.name) &&
      !(entry.exportName === 'Container' && prop.name === 'width')
    ) {
      issues.push(
        `${entry.exportName}.${prop.name}: layout API bypasses logical/typed composition policy`,
      );
    }
  }
  if (!entry.examples?.length)
    issues.push(`${entry.exportName}: accepted layout primitive has no dedicated Studio example`);
  for (const example of entry.examples ?? []) {
    const owner = exampleOwners.get(example.component);
    if (owner && owner !== entry.exportName) {
      issues.push(
        `${entry.exportName}: dedicated example ${example.component} is shared with ${owner}; family demos cannot certify individual primitives`,
      );
    }
    exampleOwners.set(example.component, entry.exportName);
  }
}

if (/\bstyle\s*=|CSSProperties|React\.CSSProperties/.test(layoutSource)) {
  issues.push(
    'Layout.tsx must not serialize arbitrary inline style values; use finite typed props/classes',
  );
}
if (/\b(reverse|order)\??\s*:/.test(layoutSource)) {
  issues.push(
    'Layout.tsx must not expose visual-order APIs that can diverge from DOM/accessibility order',
  );
}
if (!/Omit\s*<\s*ComponentPropsWithoutRef\s*<\s*T\s*>/.test(layoutSource)) {
  issues.push(
    'layout polymorphism must preserve intrinsic native-prop typing through ComponentPropsWithoutRef<T>',
  );
}
if (!layoutSource.includes("'style' | 'color'")) {
  issues.push('polymorphic layout props must explicitly exclude inline style/color escape hatches');
}

for (const physical of [
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  "'left'",
  "'right'",
]) {
  if (layoutSource.includes(physical))
    issues.push(`Layout.tsx contains forbidden physical-direction API vocabulary: ${physical}`);
}

if (!layoutSource.includes("export type GridColumns = 'auto-fit' | GridColumnCount")) {
  issues.push(
    'Grid must expose finite fixed columns plus intrinsic auto-fit rather than arbitrary track strings',
  );
}
if (!layoutSource.includes("export type GridMinColumn = 'tile' | 'card' | 'wide'")) {
  issues.push('Grid auto-fit minimums must stay on the semantic tile/card/wide vocabulary');
}
if (!layoutCss.includes('repeat(auto-fit, minmax(min(100%, var(--ui-grid-min-column)), 1fr))')) {
  issues.push(
    'Grid auto-fit CSS must use bounded minmax tracks that cannot force page-level overflow',
  );
}
for (let columns = 1; columns <= 12; columns += 1) {
  if (!layoutCss.includes(`.ui-grid-columns-${columns} {`)) {
    issues.push(`Grid finite track class missing for ${columns} column(s)`);
  }
}

if (!tokenSource.includes("'layout-readable'")) {
  issues.push('Container readable width must be backed by the semantic layout-readable token');
}
if (!tokenCss.includes('--oxs-layout-readable:')) {
  issues.push('semantic layout-readable token has no .ui-root CSS default');
}
for (const width of ['readable', 'content', 'wide', 'full']) {
  if (!layoutCss.includes(`.ui-container-width-${width} {`)) {
    issues.push(`Container semantic width class missing: ${width}`);
  }
}
if (layoutSource.includes("'compact'")) {
  issues.push(
    'Container must use semantic readable/content/wide/full vocabulary; compact is device-like/ambiguous',
  );
}

for (const logicalInset of [
  'inline',
  'block',
  'inlineStart',
  'inlineEnd',
  'blockStart',
  'blockEnd',
]) {
  if (!new RegExp(`\\b${logicalInset}\\?:\\s*SpaceToken`).test(layoutSource)) {
    issues.push(`Inset logical override missing: ${logicalInset}`);
  }
}
if (
  !layoutCss.includes('--ui-inset-inline-start: var(--ui-inset-inline);') ||
  !layoutCss.includes('padding-inline-start: var(--ui-inset-inline-start);')
) {
  issues.push('Inset must encode scoped deterministic all → axis → edge precedence in CSS');
}

for (const edge of ['block-start', 'inline-end', 'block-end', 'inline-start']) {
  if (!layoutSource.includes(`'${edge}'`))
    issues.push(`SafeArea logical edge type missing: ${edge}`);
  if (!layoutCss.includes(`.ui-safe-area-edge-${edge} {`))
    issues.push(`SafeArea CSS edge ownership missing: ${edge}`);
}
if (/SafeAreaEdge[^\n]*\b(left|right|top|bottom)\b/.test(layoutSource)) {
  issues.push('SafeArea public edge contract must remain logical, never physical');
}
if (
  /--oxs-occlusion-/.test(
    layoutCss.slice(layoutCss.indexOf('.ui-safe-area'), layoutCss.indexOf('.ui-spacer')),
  )
) {
  issues.push(
    'SafeArea must consume persistent safe-area variables only, never transient occlusion',
  );
}

if (!layoutSource.includes("export type SpacerAxis = 'inline' | 'block'")) {
  issues.push('Spacer must reserve exactly one logical axis');
}
if (
  /export type SpacerProps\s*=\s*PrimitiveHtmlProps/.test(layoutSource) ||
  /\.\.\.props/.test(layoutSource.slice(layoutSource.indexOf('export function Spacer')))
) {
  issues.push(
    'Spacer must not expose a DOM prop bag that can make its aria-hidden node focusable/semantic',
  );
}
if (!layoutSource.includes('aria-hidden="true"')) {
  issues.push('Spacer must hard-code aria-hidden=true');
}

for (const legacySelector of [
  '.ui-grid--tile',
  '.ui-grid--card',
  '.ui-grid--wide',
  '.ui-container--compact',
  '.ui-safe-area--inline',
  '.ui-spacer--axis-both',
]) {
  if (layoutCss.includes(legacySelector))
    issues.push(`legacy pre-certification layout selector remains: ${legacySelector}`);
}

if (issues.length) {
  console.error('G0 layout contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  `G0 layout contract passed: ${acceptedLayout.length} accepted layout primitive(s) · finite Grid tracks · semantic Container widths · logical Inset/SafeArea edges · decorative one-axis Spacer · no visual reordering/style serialization.`,
);
