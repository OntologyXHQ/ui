import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog } from './catalog-lib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'oxs-ui-catalog-'));
const src = path.join(root, 'src');
fs.mkdirSync(path.join(src, 'components'), { recursive: true });
fs.mkdirSync(path.join(src, 'docs'), { recursive: true });
fs.writeFileSync(
  path.join(src, 'docs', 'defineUiDocs.ts'),
  'export function defineUiDocs<T>(value: T): T { return value; }\nexport function defineUiDocsGroup<T>(value: T): T { return value; }\n',
);
fs.writeFileSync(
  path.join(src, 'index.ts'),
  "export { FixtureCard } from './components/FixtureCard';\n",
);
fs.writeFileSync(
  path.join(src, 'components', 'FixtureCard.tsx'),
  `
export type FixtureCardProps = { title: string; elevated?: boolean };
export function FixtureCard({ title, elevated = false }: FixtureCardProps) { return <div data-elevated={elevated}>{title}</div>; }
`,
);
fs.writeFileSync(
  path.join(src, 'components', 'FixtureCard.docs.tsx'),
  `
import { defineUiDocsGroup } from '../docs/defineUiDocs';
const common = {
  layer: 'components' as const,
  category: 'Fixture', order: 10,
  status: 'experimental' as const,
  accessibility: 'Fixture accessibility',
  rtl: 'Fixture RTL',
  touch: 'Fixture touch',
  responsive: 'Fixture responsive',
};
export const uiDocs = defineUiDocsGroup([{
  exportName: 'FixtureCard', ...common,
  summary: 'Fixture summary', usage: 'Fixture usage', examples: [],
}] as const);
`,
);

try {
  const catalog = buildCatalog({ uiRoot: root });
  const fixture = catalog.find((entry) => entry.exportName === 'FixtureCard');
  if (!fixture) throw new Error('fixture public export was not auto-discovered');
  if (!fixture.props.some((prop) => prop.name === 'title'))
    throw new Error('fixture props were not extracted');
  if (!fixture.props.some((prop) => prop.name === 'elevated' && prop.optional))
    throw new Error('fixture optional prop metadata missing');
  if (fixture.order !== 10) throw new Error('fixture source-owned navigation order missing');
  console.log('OXS UI catalog fixture passed: public export + colocated docs + source-owned order + local static spread auto-discovered.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}


const realUiRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const realCatalog = buildCatalog({ uiRoot: realUiRoot });
const forbiddenCanonicalEntries = realCatalog.filter((entry) =>
  /RuntimeProvider$/.test(entry.exportName) || /Pattern$/.test(entry.exportName),
);
if (forbiddenCanonicalEntries.length > 0) {
  throw new Error(
    `Canonical catalog leaked advanced/legacy entries: ${forbiddenCanonicalEntries
      .map((entry) => entry.exportName)
      .join(', ')}`,
  );
}
const invalidOrder = realCatalog.filter((entry) => !Number.isFinite(entry.order));
if (invalidOrder.length > 0) {
  throw new Error(`Canonical catalog entries missing source-owned order: ${invalidOrder.map((entry) => entry.exportName).join(', ')}`);
}
const staleCategories = new Set(['Forms', 'Data display', 'Collection', 'Scrolling', 'Pointer', 'Gestures', 'Motion', 'System foundations', 'System surfaces', 'System layouts', 'System chrome', 'Transient System UI', 'Privileged System UI']);
const staleCategoryEntries = realCatalog.filter((entry) => staleCategories.has(entry.category));
if (staleCategoryEntries.length > 0) {
  throw new Error(`Canonical catalog leaked pre-UIP13 taxonomy: ${staleCategoryEntries.map((entry) => `${entry.exportName}:${entry.category}`).join(', ')}`);
}
console.log(
  `OXS UI canonical catalog boundary passed: ${realCatalog.length} SDK visual entries with no runtime providers or legacy patterns.`,
);
