import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const list = fs.readFileSync(path.join(UI, 'src/components/DataList.tsx'), 'utf8');
const navigation = fs.readFileSync(path.join(UI, 'src/components/Navigation.tsx'), 'utf8');
const compositions = fs.readFileSync(path.join(UI, 'src/components/Compositions.tsx'), 'utf8');
const componentStyles = fs.readFileSync(path.join(UI, 'src/styles/components.css'), 'utf8');
const publicComponents = fs.readFileSync(path.join(UI, 'src/components/index.ts'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['List', 'collection-contract'],
  ['ListItem', 'collection-contract'],
  ['ListSection', 'collection-contract'],
  ['ListSeparator', 'collection-contract'],
  ['AdaptiveNavigation', 'navigation-contract'],
  ['TileGrid', 'spatial-grid'],
  ['Tile', 'spatial-grid'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') issues.push(`${name}: UIR09 accepted contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId))
    issues.push(`${name}: missing Studio example ${exampleId}`);
}

for (const token of [
  'HTMLAttributes<HTMLUListElement>',
  '<ul',
  'LiHTMLAttributes<HTMLLIElement>',
  '<li',
  'state?: ListState',
  "role={state === 'error' ? 'alert' : 'status'}",
]) {
  if (!list.includes(token)) issues.push(`semantic list contract missing ${token}`);
}
if (
  !list.includes('ui-list-item__action-row') ||
  !list.includes('{trailing ? <span className="ui-list-item__trailing">')
)
  issues.push('ListItem trailing controls must remain siblings of the primary action');
for (const token of [
  'href?: string',
  'item.href ? (',
  '<a',
  "aria-current={selected ? 'page' : undefined}",
]) {
  if (!navigation.includes(token))
    issues.push(`AdaptiveNavigation native-destination contract missing ${token}`);
}
if (
  /\b(Breadcrumb|Breadcrumbs|Pagination)\b/.test(publicComponents) ||
  catalog.some((entry) => /^(Breadcrumb|Breadcrumbs|Pagination)$/.test(entry.exportName))
) {
  issues.push(
    'Breadcrumb/Pagination remain intentionally absent until a real public capability demand justifies ownership',
  );
}
if (compositions.includes('document.activeElement'))
  issues.push('TileGrid must resolve activeElement from its ownerDocument realm');
if (/[^.]\bgetComputedStyle\(root\)/.test(compositions))
  issues.push('TileGrid must resolve computed style from ownerDocument.defaultView');
for (const token of [
  'ownerDocument.activeElement',
  'ownerDocument.defaultView?.getComputedStyle(root)',
  'keyboardNavigation',
]) {
  if (!compositions.includes(token))
    issues.push(`TileGrid realm/spatial contract missing ${token}`);
}
const selectedTileDescriptionContrastContract = `.ui-tile[data-selected='true'] .ui-tile__description {
  color: var(--oxs-color-text-secondary);
}`;
if (!componentStyles.includes(selectedTileDescriptionContrastContract))
  issues.push(
    'selected Tile descriptions must promote tertiary copy to text-secondary on accent-soft selection surfaces',
  );

for (const id of [
  'list-navigation-data-certification',
  'tile-grid-spatial-navigation-certification',
]) {
  if (!scenarios.includes(id)) issues.push(`missing UIR09 G6 scenario: ${id}`);
}

if (issues.length) {
  console.error('G0 navigation/data contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 navigation/data contract passed: native ul/li collections · explicit ready/loading/empty/error states · sibling trailing actions · native link destinations · no speculative breadcrumb/pagination API · owner-realm spatial TileGrid focus continuity · contrast-safe selected Tile supporting copy.',
);
