import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const compositionsPath = path.join(UI, 'src/components/Compositions.tsx');
const navigationPath = path.join(UI, 'src/components/Navigation.tsx');
const componentIndexPath = path.join(UI, 'src/components/index.ts');
const stylesPath = path.join(UI, 'src/styles/components.css');
const compositionDocsPath = path.join(UI, 'src/components/Compositions.docs.tsx');
const navigationDocsPath = path.join(UI, 'src/components/DataNavigation.docs.tsx');
const studioStylesPath = path.join(ROOT, 'apps/ui-studio/src/styles/studio.css');
const scenariosPath = path.join(ROOT, 'scripts/browser/scenarios.mjs');
const auditPath = path.join(ROOT, 'docs/quality/UIR13_COMPOSITION_AUDIT.md');

const compositions = fs.readFileSync(compositionsPath, 'utf8');
const navigation = fs.readFileSync(navigationPath, 'utf8');
const componentIndex = fs.readFileSync(componentIndexPath, 'utf8');
const styles = fs.readFileSync(stylesPath, 'utf8');
const compositionDocs = fs.readFileSync(compositionDocsPath, 'utf8');
const navigationDocs = fs.readFileSync(navigationDocsPath, 'utf8');
const studioStyles = fs.readFileSync(studioStylesPath, 'utf8');
const scenarios = fs.readFileSync(scenariosPath, 'utf8');
const audit = fs.readFileSync(auditPath, 'utf8');
const certificationDocument = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/quality/CERTIFICATIONS.json'), 'utf8'),
);
const certifications = certificationDocument.exports ?? {};
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const uir13Exports = ['Card', 'PageScaffold', 'ApplicationItem', 'ContentState', 'AppBar'];
for (const name of uir13Exports) {
  const entry = catalog.find((item) => item.exportName === name);
  if (!entry) {
    issues.push(`${name}: public catalog entry is missing`);
    continue;
  }
  if (entry.status !== 'accepted') issues.push(`${name}: UIR13 export is not accepted`);
  const certification = certifications[name];
  if (certification?.owner !== 'UIR13')
    issues.push(`${name}: certification owner must remain UIR13`);
  if (!certification?.browserScenarios?.includes('developer-compositions-adaptive-certification'))
    issues.push(`${name}: missing UIR13 browser certification ownership`);
}

for (const name of ['Disclosure', 'Accordion', 'TileGrid', 'Tile', 'EmptyState', 'ScrollView']) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted')
    issues.push(`${name}: UIR13 dependency floor must already be accepted`);
}

for (const speculative of ['Section', 'ContentRegion', 'Sidebar', 'SplitView']) {
  if (catalog.some((entry) => entry.exportName === speculative))
    issues.push(
      `${speculative}: wrapper API is forbidden until it owns distinct semantics/behavior`,
    );
  const publicExportPattern = new RegExp(`\\b${speculative}(?:Props)?\\b`);
  if (publicExportPattern.test(componentIndex))
    issues.push(`${speculative}: speculative wrapper leaked into the public Component surface`);
}

for (const token of [
  '<fieldset',
  'aria-labelledby',
  'aria-describedby',
  '<main',
  '<aside',
  '<footer',
  "contentRole?: 'main' | 'region'",
  "sidebarPosition?: 'start' | 'end'",
  '<Tile',
  '<Spinner',
]) {
  if (!compositions.includes(token)) issues.push(`composition semantic contract missing ${token}`);
}

const appBarStart = navigation.indexOf('export type AppBarProps');
const appBarEnd = navigation.indexOf('\nfunction toolbarItems', appBarStart);
const appBarSource =
  appBarStart >= 0 && appBarEnd > appBarStart ? navigation.slice(appBarStart, appBarEnd) : '';
if (!appBarSource) issues.push('AppBar source boundary could not be located');
for (const token of ['<header', '<Heading', 'leading?: ReactNode', 'actions?: ReactNode']) {
  if (!appBarSource.includes(token)) issues.push(`AppBar composition contract missing ${token}`);
}

if (/from ['"]\.\.\/system/.test(compositions) || /\bSystem[A-Z]/.test(compositions))
  issues.push('developer compositions must not depend on or take ownership from System UI');
if (/from ['"]\.\.\/system/.test(appBarSource) || /\bSystem[A-Z]/.test(appBarSource))
  issues.push('AppBar must remain below System UI');

for (const demoVocabulary of [
  'Project summary',
  'Developer workspace',
  'Browser',
  'Files',
  'Recent activity',
  'Settings',
]) {
  if (compositions.includes(demoVocabulary) || appBarSource.includes(demoVocabulary))
    issues.push(`runtime composition source leaked Studio/product vocabulary: ${demoVocabulary}`);
}

for (const token of [
  '.ui-page-scaffold {',
  'container-type: inline-size;',
  '@container (min-width: 44rem)',
  '.ui-page-scaffold__sidebar,\n.ui-page-scaffold__content {\n  min-inline-size: 0;\n  min-block-size: 0;',
  '.ui-app-bar {',
  'flex-wrap: wrap;',
  '@container (max-width: 28rem)',
  'flex-basis: 100%;',
  'white-space: normal;',
]) {
  if (!styles.includes(token)) issues.push(`container/adaptive style contract missing ${token}`);
}

for (const token of [
  'data-uir13-realistic-application',
  'Scaffold scroll preview',
  '<AppBar',
  '<ScrollView',
  '<ContentState',
]) {
  if (!compositionDocs.includes(token))
    issues.push(`realistic composition Studio fixture missing ${token}`);
}
for (const token of [
  "id: 'application-header'",
  "component: 'AppBarApplicationExample'",
  'data-uir13-appbar-example',
]) {
  if (!navigationDocs.includes(token))
    issues.push(`AppBar adaptive Studio fixture missing ${token}`);
}
for (const token of [
  '.ui-doc-uir13-application',
  '.ui-doc-uir13-scroll',
  '.ui-doc-uir13-appbar-frame',
]) {
  if (!studioStyles.includes(token)) issues.push(`UIR13 Studio fixture sizing missing ${token}`);
}

for (const token of [
  "'developer-compositions-adaptive-certification'",
  "example: 'application-header'",
  "viewport: 'phone'",
  'nestedGeometry.scrollHeight > nestedGeometry.clientHeight + 1',
  "'Nested ScrollView did not retain scroll ownership inside PageScaffold.'",
  "'AppBar copy did not adapt from its measured narrow container.'",
]) {
  if (!scenarios.includes(token)) issues.push(`UIR13 G6 evidence missing ${token}`);
}
for (const name of uir13Exports) {
  if (!scenarios.includes(`'${name}'`))
    issues.push(`${name}: UIR13 G6 scenario does not visibly claim this export`);
}

for (const task of ['UI-1301', 'UI-1302', 'UI-1303', 'UI-1304', 'UI-1305', 'UI-1306']) {
  if (!audit.includes(task)) issues.push(`UIR13 audit evidence missing ${task}`);
}
for (const intentionalAbsence of ['`Section`', '`ContentRegion`', '`Sidebar`', '`SplitView`']) {
  if (!audit.includes(intentionalAbsence))
    issues.push(`UIR13 audit does not explain intentional absence ${intentionalAbsence}`);
}

if (issues.length) {
  console.error('G0 developer-composition contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  'G0 developer-composition contract passed: semantic-value audit · accepted dependency floor · product-neutral runtime · container-driven scaffold/AppBar adaptation · realistic nested-scroll Studio evidence.',
);
