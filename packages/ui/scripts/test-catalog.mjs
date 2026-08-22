import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCatalog, writeCatalog } from './catalog-lib.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ontologyx-ui-catalog-'));
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
export type FixtureCardProps = {
  /** Visible fixture title. */
  title: string;
  /** Optional elevation state. */
  elevated?: boolean;
  /** Controlled fixture value. */
  value?: string;
  /** Uncontrolled fixture initializer. */
  defaultValue?: string;
  /** Reports controlled value changes. */
  onValueChange?: (value: string) => void;
};
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
  summary: 'Fixture summary', usage: 'Fixture usage',
  preview: { component: 'FixtureCardPreview' },
  examples: [],
}] as const);
export function FixtureCardPreview() { return null; }
`,
);

const fixtureCertificationsPath = path.join(root, 'CERTIFICATIONS.json');
fs.writeFileSync(
  fixtureCertificationsPath,
  `${JSON.stringify(
    {
      schema: 1,
      exports: {
        FixtureCard: {
          owner: 'catalog-fixture',
          behaviorTests: ['fixture/behavior.test.tsx'],
          browserScenarios: ['fixture-browser-certification'],
          requiredAxes: ['fixture'],
        },
      },
    },
    null,
    2,
  )}\n`,
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
  if (fixture.preview?.component !== 'FixtureCardPreview') {
    throw new Error('fixture dedicated preview metadata missing');
  }
  if (
    fixture.stateModels?.[0]?.valueProp !== 'value' ||
    fixture.stateModels?.[0]?.changeProp !== 'onValueChange' ||
    fixture.stateModels?.[0]?.defaultProp !== 'defaultValue'
  ) {
    throw new Error('fixture controlled/uncontrolled state guidance missing');
  }

  const studioRoot = path.join(root, 'studio');
  writeCatalog({ uiRoot: root, studioRoot, certificationsPath: fixtureCertificationsPath });
  const generatedJson = path.join(
    studioRoot,
    'src',
    'catalog',
    'generated',
    'catalog.generated.json',
  );
  const generatedData = JSON.parse(fs.readFileSync(generatedJson, 'utf8'));
  if (generatedData[0]?.certification?.owner !== 'catalog-fixture') {
    throw new Error('fixture certification metadata was not attached to the generated catalog');
  }
  if (
    generatedData[0]?.certification?.result !== 'certified' ||
    generatedData[0]?.certification?.behaviorSources?.[0] !== 'fixture/behavior.test.tsx' ||
    generatedData[0]?.certification?.browserSource !== 'scripts/browser/scenarios.mjs'
  ) {
    throw new Error('fixture source-linked certification evidence metadata missing');
  }
  fs.writeFileSync(generatedJson, `${JSON.stringify(generatedData)}\n`);
  writeCatalog({
    uiRoot: root,
    studioRoot,
    check: true,
    certificationsPath: fixtureCertificationsPath,
  });

  generatedData[0].summary = 'Semantically stale fixture summary';
  fs.writeFileSync(generatedJson, `${JSON.stringify(generatedData, null, 4)}\n`);
  let semanticStaleDetected = false;
  try {
    writeCatalog({
      uiRoot: root,
      studioRoot,
      check: true,
      certificationsPath: fixtureCertificationsPath,
    });
  } catch (error) {
    semanticStaleDetected =
      error instanceof Error && error.message.includes('catalog.generated.json');
  }
  if (!semanticStaleDetected) {
    throw new Error('catalog JSON semantic freshness failed to detect changed generated data');
  }

  console.log(
    'OntologyX UI catalog fixture passed: public export + colocated docs + source-owned order + local static spread auto-discovered + formatter-stable JSON semantic freshness.',
  );
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

const realUiRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const realCatalog = buildCatalog({ uiRoot: realUiRoot });
const forbiddenCanonicalEntries = realCatalog.filter(
  (entry) => /RuntimeProvider$/.test(entry.exportName) || /Pattern$/.test(entry.exportName),
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
  throw new Error(
    `Canonical catalog entries missing source-owned order: ${invalidOrder.map((entry) => entry.exportName).join(', ')}`,
  );
}
console.log(
  `OntologyX UI canonical catalog boundary passed: ${realCatalog.length} SDK visual entries with no runtime providers or legacy patterns.`,
);
