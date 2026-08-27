import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const catalog = JSON.parse(read('apps/ui-studio/src/catalog/generated/catalog.generated.json'));
const issues = [];

const playgroundText = read('apps/ui-studio/src/catalog/CatalogPlayground.tsx');
const pageText = read('apps/ui-studio/src/catalog/CatalogPage.tsx');
const routingText = read('apps/ui-studio/src/catalog/routing.ts');
const sidebarText = read('apps/ui-studio/src/studio/StudioSidebar.tsx');
const environmentText = read('apps/ui-studio/src/studio/StudioEnvironmentToolbar.tsx');
const errorText = read('apps/ui-studio/src/catalog/CatalogErrorBoundary.tsx');
const systemDocs = read('packages/ui/src/system/System.docs.tsx');
const studioCss = read('apps/ui-studio/src/styles/studio.css');
const scenarios = read('scripts/browser/scenarios.mjs');

const semanticText = read('apps/ui-studio/src/studio/SemanticWorkbench.tsx');
const studioShellText = read('apps/ui-studio/src/studio/UiKitStudio.tsx');

function parseableDefault(prop) {
  if (!prop.default) return false;
  const value = prop.default.trim();
  return (
    value === 'true' ||
    value === 'false' ||
    /^-?\d+(\.\d+)?$/.test(value) ||
    /^['"].*['"]$/.test(value)
  );
}

function stringUnion(type) {
  const parts = type.split('|').map((part) => part.trim());
  return parts.length > 0 && parts.every((part) => /^'[^']*'$/.test(part));
}

function canSeedProp(entry, prop) {
  const fixture = entry.playground?.fixture ?? {};
  if (Object.hasOwn(fixture, prop.name)) return true;
  if (
    entry.exportName === 'Icon' &&
    (Object.hasOwn(fixture, 'name') || Object.hasOwn(fixture, 'glyph'))
  ) {
    return true;
  }
  if (parseableDefault(prop) || stringUnion(prop.type)) return true;
  if (['string', 'number', 'boolean', 'ReactNode'].includes(prop.type)) return true;
  return prop.type.includes('=>');
}

for (const entry of catalog) {
  if (entry.status !== 'accepted') continue;
  const missingDescriptions = (entry.props ?? []).filter(
    (prop) => !prop.deprecated && (!prop.description || prop.description.trim().length < 8),
  );
  for (const prop of missingDescriptions) {
    issues.push(`${entry.exportName}.${prop.name}: accepted prop is missing complete JSDoc`);
  }

  const directPreview = (entry.props ?? [])
    .filter((prop) => !prop.optional)
    .every((prop) => canSeedProp(entry, prop));
  if (!directPreview && !entry.preview?.component) {
    issues.push(
      `${entry.exportName}: complex required props need an explicit dedicated preview component`,
    );
  }

  const propNames = new Set((entry.props ?? []).map((prop) => prop.name));
  const expectedModels = [
    ['value', 'onValueChange', 'defaultValue'],
    ['checked', 'onCheckedChange', 'defaultChecked'],
    ['pressed', 'onPressedChange', 'defaultPressed'],
    ['selected', 'onSelectedChange', 'defaultSelected'],
    ['open', 'onOpenChange', 'defaultOpen'],
    ['query', 'onQueryChange', 'defaultQuery'],
  ].filter(([valueProp, changeProp]) => propNames.has(valueProp) && propNames.has(changeProp));
  if ((entry.stateModels ?? []).length !== expectedModels.length) {
    issues.push(`${entry.exportName}: generated controlled/uncontrolled state guidance is stale`);
  }

  const certification = entry.certification;
  if (!certification) {
    issues.push(`${entry.exportName}: accepted entry lost certification binding`);
  } else {
    if (certification.result !== 'certified') {
      issues.push(`${entry.exportName}: certification result must be explicit`);
    }
    if (certification.behaviorSources?.length !== certification.behaviorTests?.length) {
      issues.push(`${entry.exportName}: behavior evidence source links are incomplete`);
    }
    if (certification.browserSource !== 'scripts/browser/scenarios.mjs') {
      issues.push(`${entry.exportName}: browser evidence source link is missing`);
    }
  }
}

for (const [token, message] of [
  ['data-studio-preview-mode', 'Studio preview must publish direct/dedicated preview ownership'],
  [
    '!entry.preview && Component && canSeedRequiredProps(entry)',
    'explicit source-owned previews must override generic direct preview seeding',
  ],
  [
    '<DedicatedPreview entry={entry} componentProps={resolved} state={state} />',
    'dedicated previews must receive generated props/state instead of rendering as static fixtures',
  ],
]) {
  if (!playgroundText.includes(token)) issues.push(message);
}
if (playgroundText.includes('entry.examples[0]')) {
  issues.push(
    'Studio preview must never infer a component preview from the first family/example demo',
  );
}

const radioEntry = catalog.find((entry) => entry.exportName === 'Radio');
if (radioEntry?.preview?.component !== 'RadioStudioPreview') {
  issues.push('Radio must use a source-owned RadioGroup-backed dedicated preview');
}

for (const [token, message] of [
  ['data-studio-state-guidance', 'Studio API must render generated state-ownership guidance'],
  ['data-studio-evidence-links', 'Studio acceptance evidence must expose source links'],
  [
    'data-studio-certification-result',
    'Studio acceptance evidence must expose a concrete certification result',
  ],
  [
    'repositorySourceBase',
    'Studio acceptance evidence must link to repository-owned source evidence',
  ],
  [
    'resetKey={active.id}',
    'Studio detail error isolation must reset when navigation changes entry',
  ],
]) {
  if (!pageText.includes(token)) issues.push(message);
}

for (const [token, message] of [
  ["params.get('q')", 'catalog search must round-trip through shareable URL state'],
  ["params.get('layer')", 'catalog layer filter must round-trip through shareable URL state'],
  ["params.get('status')", 'catalog lifecycle filter must round-trip through shareable URL state'],
]) {
  if (!routingText.includes(token)) issues.push(message);
}
for (const token of [
  'Catalog layer',
  'Lifecycle status',
  'data-studio-catalog-filters',
  '<Box className="ui-studio-sidebar__filters"',
]) {
  if (!sidebarText.includes(token)) issues.push(`Studio information architecture missing ${token}`);
}
for (const [token, message] of [
  [
    '.ui-studio-sidebar__filters > .ui-select-field',
    'Studio catalog filter sizing must target the actual public Select field root',
  ],
  [
    'grid-template-columns: repeat(2, minmax(0, 1fr))',
    'Studio catalog filters must retain deterministic two-column geometry',
  ],
]) {
  if (!studioCss.includes(token)) issues.push(message);
}
if (studioCss.includes('.ui-studio-sidebar__filters .ui-field-frame')) {
  issues.push('Studio catalog filter sizing still targets the nonexistent ui-field-frame wrapper');
}
for (const token of ['<UiRoot', '<Toolbar', '<Select']) {
  if (!environmentText.includes(token))
    issues.push(`Studio environment control plane must self-host ${token}`);
}
if (!errorText.includes('componentDidUpdate') || !errorText.includes('previous.resetKey')) {
  issues.push('Studio error boundary must recover when its reset key changes');
}

for (const [token, message] of [
  [
    'data-studio-semantic-workbench',
    'Studio must keep the semantic V2 inspection fixture reachable',
  ],
  ['Author IR', 'semantic workbench must expose Author IR'],
  ['Runtime IR', 'semantic workbench must expose Runtime IR'],
  ['SemanticForm', 'semantic workbench must render the canonical semantic form bridge'],
  ['SemanticCollection', 'semantic workbench must render the canonical semantic collection bridge'],
  ['SemanticWorkspace', 'semantic workbench must render the semantic workspace bridge'],
  [
    'totalCount: 12',
    'semantic workbench must prove a bounded collection snapshot rather than an eager full-data assumption',
  ],
]) {
  if (!semanticText.includes(token)) issues.push(message);
}
if (
  !routingText.includes("view') === 'semantic'") ||
  !studioShellText.includes('<SemanticWorkbench')
) {
  issues.push('Studio semantic V2 route must stay reachable through normal Studio routing');
}

for (const token of [
  'hostResolvedApplicationIcon',
  'Host/App Registry owns application discovery, icon resolution and launch authority',
  'icon resource resolved by host/App Registry',
]) {
  if (!systemDocs.includes(token))
    issues.push(`SystemApplicationBrowser host-owned icon example missing ${token}`);
}

for (const token of [
  'data-studio-catalog-filters',
  'catalogFilters.getByRole',
  'filterGeometry.triggers',
  "routeState.get('q')",
  'data-studio-certification-result',
  'data-studio-preview-mode',
  'Host/App Registry owns application discovery, icon resolution and launch authority',
]) {
  if (!scenarios.includes(token)) issues.push(`Studio G6 certification missing ${token}`);
}

if (issues.length > 0) {
  console.error('G4 UIR16 Studio workbench gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

const dedicated = catalog.filter((entry) => entry.preview?.component).length;
const controlled = catalog.filter((entry) => (entry.stateModels ?? []).length > 0).length;
console.log(
  `G4 UIR16 Studio workbench gate passed: ${catalog.length} public exports · explicit dedicated previews=${dedicated} · generated state-guidance entries=${controlled} · source-linked certification evidence · shareable search/layer/status state · recoverable error isolation · host-owned app-icon example.`,
);
