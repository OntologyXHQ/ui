import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const selection = fs.readFileSync(path.join(UI, 'src/components/Selection.tsx'), 'utf8');
const button = fs.readFileSync(path.join(UI, 'src/components/Button.tsx'), 'utf8');
const navigation = fs.readFileSync(path.join(UI, 'src/components/Navigation.tsx'), 'utf8');
const select = fs.readFileSync(path.join(UI, 'src/components/Select.tsx'), 'utf8');
const compositions = fs.readFileSync(path.join(UI, 'src/components/Compositions.tsx'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const componentStyles = fs.readFileSync(path.join(UI, 'src/styles/components.css'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['Checkbox', 'native-contract'],
  ['RadioGroup', 'native-contract'],
  ['Radio', 'native-contract'],
  ['Switch', 'state-contract'],
  ['ToggleButton', 'toggle-contract'],
  ['SegmentedControl', 'group-contract'],
  ['ToggleGroup', 'group-contract'],
  ['Tabs', 'tabs-contract'],
  ['TabPanel', 'tabs-contract'],
  ['Select', 'contract'],
  ['Disclosure', 'disclosure-contract'],
  ['Accordion', 'accordion-contract'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') issues.push(`${name}: UIR08 accepted contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId))
    issues.push(`${name}: missing Studio example ${exampleId}`);
}


const nativeChoiceBlock = componentStyles.match(/\.ui-choice__native\s*\{([\s\S]*?)\}/)?.[1] ?? '';
if (!/\binset\s*:\s*0\b/.test(nativeChoiceBlock))
  issues.push('Checkbox/Radio native input must cover the full shared choice hit target');
if (/pointer-events\s*:\s*none/.test(nativeChoiceBlock))
  issues.push('Checkbox/Radio native input must remain the pointer hit-test owner');
if (/inline-size\s*:\s*1px|block-size\s*:\s*1px/.test(nativeChoiceBlock))
  issues.push('Checkbox/Radio native input may not collapse to a 1px proxy');

for (const token of [
  "form.addEventListener('reset', reset)",
  "aria-checked={indeterminate ? 'mixed' : current}",
  'ownerDocument.defaultView?.setTimeout',
  'const selectedValue = options.some',
  'const visibleCurrent = [...new Set(current)]',
])
  if (!selection.includes(token)) issues.push(`selection contract missing ${token}`);
if (/\bwindow\.setTimeout\b/.test(selection))
  issues.push('Switch/selection controls must not borrow the ambient Window timer');
if (!button.includes('aria-pressed={current}') || !button.includes('!event.defaultPrevented'))
  issues.push('ToggleButton must preserve aria-pressed and cancellation-before-mutation');
for (const token of [
  'aria-orientation={orientation}',
  'idBase?: string',
  'const relationship = tabRelationshipIds(relationshipBase, item.value)',
]) {
  if (!navigation.includes(token)) issues.push(`Tabs contract missing ${token}`);
}
for (const token of [
  "formElement.addEventListener('reset', reset)",
  'ref={nativeProxyRef}',
  'event.preventDefault();',
  'aria-activedescendant',
]) {
  if (!select.includes(token)) issues.push(`Select contract missing ${token}`);
}
for (const token of [
  '<Heading className="ui-disclosure__heading"',
  '<section',
  'aria-labelledby={triggerId}',
  'data-ui-accordion-trigger',
  "['ArrowDown', 'ArrowUp', 'Home', 'End']",
]) {
  if (!compositions.includes(token)) issues.push(`Disclosure/Accordion contract missing ${token}`);
}
for (const id of [
  'selection-controls-certification',
  'tabs-select-certification',
  'disclosure-accordion-certification',
]) {
  if (!scenarios.includes(id)) issues.push(`missing UIR08 G6 scenario: ${id}`);
}

if (issues.length) {
  console.error('G0 selection/disclosure contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 selection/disclosure contract passed: native checkbox/radio reset · mixed/read-only semantics · realm-owned Switch gesture settlement · normalized segmented/toggle state · manual/automatic Tabs · Select form/typeahead/focus · heading/region disclosure authority.',
);
