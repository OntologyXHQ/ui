import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI_ROOT = path.join(ROOT, 'packages/ui');
const layoutSource = fs.readFileSync(path.join(UI_ROOT, 'src/primitives/Layout.tsx'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI_ROOT });
const issues = [];

const acceptedLayout = catalog.filter(
  (entry) => entry.category === 'Layout' && entry.status === 'accepted',
);
const expectedCore = new Set(['Box', 'Stack', 'Row', 'Wrap']);
for (const exportName of expectedCore) {
  if (!acceptedLayout.some((entry) => entry.exportName === exportName)) {
    issues.push(`${exportName}: UIR03 core primitive must remain accepted once certified`);
  }
}

const forbiddenProps = new Set([
  'style',
  'color',
  'margin',
  'marginLeft',
  'marginRight',
  'padding',
  'paddingLeft',
  'paddingRight',
  'left',
  'right',
  'top',
  'bottom',
  'order',
  'reverse',
]);

const exampleOwners = new Map();
for (const entry of acceptedLayout) {
  for (const prop of entry.props ?? []) {
    if (forbiddenProps.has(prop.name)) {
      issues.push(`${entry.exportName}.${prop.name}: layout API bypasses logical/typed composition policy`);
    }
  }
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
  issues.push('Layout.tsx must not serialize arbitrary inline style values; use finite typed props/classes');
}
if (/\b(reverse|order)\??\s*:/.test(layoutSource)) {
  issues.push('Layout.tsx must not expose visual-order APIs that can diverge from DOM/accessibility order');
}
if (!/Omit\s*<\s*ComponentPropsWithoutRef\s*<\s*T\s*>/.test(layoutSource)) {
  issues.push('layout polymorphism must preserve intrinsic native-prop typing through ComponentPropsWithoutRef<T>');
}
if (!layoutSource.includes("'style' | 'color'")) {
  issues.push('polymorphic layout props must explicitly exclude inline style/color escape hatches');
}

if (issues.length) {
  console.error('G0 layout contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  `G0 layout contract passed: ${acceptedLayout.length} accepted layout primitive(s) · finite logical props · typed polymorphism · dedicated examples · no visual reordering/style serialization.`,
);
