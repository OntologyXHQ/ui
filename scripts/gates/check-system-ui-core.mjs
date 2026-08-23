import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const SYSTEM = path.join(UI, 'src/system');

const coreFiles = [
  'SystemScaffold.tsx',
  'SystemWorkspace.tsx',
  'DesktopShellLayout.tsx',
  'SystemApplicationBrowser.tsx',
  'SystemLauncher.tsx',
  'SystemSettingsLayout.tsx',
];

const coreSources = new Map(
  coreFiles.map((name) => [name, fs.readFileSync(path.join(SYSTEM, name), 'utf8')]),
);
const systemDocs = fs.readFileSync(path.join(SYSTEM, 'System.docs.tsx'), 'utf8');
const systemTests = fs.readFileSync(path.join(SYSTEM, '__tests__/system-layouts.test.tsx'), 'utf8');
const qualityGates = fs.readFileSync(path.join(ROOT, 'docs/quality/QUALITY_GATES.md'), 'utf8');
const systemStyles = fs.readFileSync(path.join(UI, 'src/styles/system-ui.css'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const audit = fs.readFileSync(
  path.join(ROOT, 'docs/quality/UIR14_SYSTEM_UI_CORE_AUDIT.md'),
  'utf8',
);
const certificationDocument = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/quality/CERTIFICATIONS.json'), 'utf8'),
);
const certifications = certificationDocument.exports ?? {};
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'apps/ui-studio/src/catalog/generated/catalog.generated.json'),
    'utf8',
  ),
);
const issues = [];

const uir14Exports = [
  'SystemScaffold',
  'SystemSurface',
  'SystemLauncher',
  'SystemWorkspace',
  'DesktopShellLayout',
  'SystemApplicationBrowser',
  'SystemBar',
  'SystemDock',
  'SystemPanel',
  'SystemChromeGroup',
  'SystemSettingsLayout',
];

for (const name of uir14Exports) {
  const entry = catalog.find((item) => item.exportName === name);
  if (!entry) {
    issues.push(`${name}: public catalog entry is missing`);
    continue;
  }
  if (entry.status !== 'accepted') issues.push(`${name}: UIR14 export is not accepted`);
  const certification = certifications[name];
  if (certification?.owner !== 'UIR14')
    issues.push(`${name}: certification owner must remain UIR14`);
  if (!certification?.browserScenarios?.includes('system-ui-core-certification')) {
    issues.push(`${name}: missing UIR14 browser certification ownership`);
  }
}

const componentFloor = [
  'AdaptiveNavigation',
  'AppBar',
  'ApplicationItem',
  'Badge',
  'BottomSheet',
  'Card',
  'ContentState',
  'List',
  'PageScaffold',
  'ScrollView',
  'SearchField',
  'StatusIndicator',
  'TileGrid',
  'Toolbar',
];
for (const name of componentFloor) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted') {
    issues.push(`${name}: UIR14 Component dependency floor must already be accepted`);
  }
}

const forbiddenImport =
  /from\s+['"]\.\.\/(?:primitives|foundations|interaction|motion|gestures|drag-drop|editing|cursor|scroll)(?:\/|['"])/u;
const forbiddenUir15Import =
  /from\s+['"]\.\/(?:SystemCenters|SystemTransientLayouts|SystemKeyboard)['"]/u;
const rawInteractive = /<(?:button|input|select|textarea|a)\b/iu;
const forbiddenAuthority = [
  /\bfetch\s*\(/u,
  /\blocalStorage\b/u,
  /\bsessionStorage\b/u,
  /\bwindow\.location\b/u,
  /\bhistory\.(?:pushState|replaceState|back|forward|go)\b/u,
  /\b(?:router|navigate)\s*\(/u,
];

for (const [name, source] of coreSources) {
  if (forbiddenImport.test(source)) issues.push(`${name}: System core bypasses Components`);
  if (forbiddenUir15Import.test(source))
    issues.push(`${name}: UIR14 core depends on UIR15 surface`);
  if (rawInteractive.test(source))
    issues.push(`${name}: raw interactive HTML leaked into System core`);
  for (const pattern of forbiddenAuthority) {
    if (pattern.test(source))
      issues.push(`${name}: host/product authority leaked into reusable System core (${pattern})`);
  }
}

const appBrowser = coreSources.get('SystemApplicationBrowser.tsx') ?? '';
for (const token of [
  'sourcing/ranking/routing authority remains external',
  'filterSystemApplicationItems',
  'onActivate: (id: string) => void',
  '<ApplicationItem',
  '<SearchField',
  '<TileGrid',
  '<List',
]) {
  if (!appBrowser.includes(token))
    issues.push(`SystemApplicationBrowser ownership contract missing ${token}`);
}

const launcher = coreSources.get('SystemLauncher.tsx') ?? '';
for (const token of [
  'onLaunch: (id: string) => boolean',
  'onClose: () => void',
  '<BottomSheet',
  '<SystemApplicationBrowser',
]) {
  if (!launcher.includes(token)) issues.push(`SystemLauncher authority boundary missing ${token}`);
}

const desktop = coreSources.get('DesktopShellLayout.tsx') ?? '';
for (const token of [
  "dockEdge?: Extract<SystemSurfaceEdge, 'block-end' | 'inline-start' | 'inline-end'>",
  "panelEdge?: Extract<SystemSurfaceEdge, 'inline-start' | 'inline-end'>",
  '<Toolbar',
  '<Card',
  '<ScrollView',
]) {
  if (!desktop.includes(token)) issues.push(`desktop/chrome contract missing ${token}`);
}

const settings = coreSources.get('SystemSettingsLayout.tsx') ?? '';
for (const token of [
  '<PageScaffold',
  '<AdaptiveNavigation',
  '<AppBar',
  '<ScrollView',
  'value?: string',
  'onValueChange?: (value: string) => void',
]) {
  if (!settings.includes(token))
    issues.push(`SystemSettingsLayout host-neutral contract missing ${token}`);
}

for (const token of [
  'container-name: oxs-system-settings;',
  '@container oxs-system-settings (min-width: 44rem)',
  '.ui-system-settings-layout__navigation .ui-navigation__items',
  'display: grid;',
  'grid-template-columns: minmax(0, 1fr);',
  'inline-size: 100%;',
]) {
  if (!systemStyles.includes(token))
    issues.push(`SystemSettingsLayout named-container geometry contract missing ${token}`);
}

for (const physical of [
  /\bleft\s*:/u,
  /\bright\s*:/u,
  /\bmargin-left\s*:/u,
  /\bmargin-right\s*:/u,
  /\bpadding-left\s*:/u,
  /\bpadding-right\s*:/u,
]) {
  if (physical.test(systemStyles))
    issues.push(`System UI CSS uses physical horizontal geometry (${physical})`);
}

for (const token of [
  'data-uir14-layout-library',
  'data-uir14-application-browser-example',
  'label="Connectivity"',
  'dockEdge="inline-start"',
  'panelEdge="inline-end"',
  'label="Privileged host preview"',
  'UIR14 proves only the structural host; privileged behavior belongs to UIR15.',
]) {
  if (!systemDocs.includes(token)) issues.push(`UIR14 Studio evidence missing ${token}`);
}

for (const token of [
  'SystemChromeGroup label="Connectivity"',
  'data-oxs-system-edge',
  'query="web"',
  "name: 'Files'",
]) {
  if (!systemTests.includes(token)) issues.push(`UIR14 behavior evidence missing ${token}`);
}

for (const token of [
  "'system-ui-core-certification'",
  "example: 'application-browser'",
  "viewport: 'phone'",
  "viewport: 'desktop'",
  "name: 'Connectivity'",
  'RTL inline-start dock and inline-end panel',
  'UIR14 core certification must not depend on UIR15 privileged keyboard behavior.',
  'SystemApplicationBrowser coarse-pointer application action',
  'Requested application id: files',
  "launcher.locator('xpath=ancestor::*[@data-oxs-scope][1]')",
  "':scope > [data-oxs-portal-root]'",
  "':scope > .ui-system-launcher-layer'",
  "element.dataset.open === 'false'",
  "element.getAttribute('aria-hidden') === 'true'",
  'Narrow SystemSettingsLayout did not collapse navigation above content.',
  'Wide SystemSettingsLayout fixture did not provide the 44rem container required by its split query',
  'Wide SystemSettingsLayout did not adapt into a split navigation/content composition.',
  'Wide SystemSettingsLayout navigation did not remain vertically stacked inside the split sidebar.',
]) {
  if (!scenarios.includes(token)) issues.push(`UIR14 G6 evidence missing ${token}`);
}
for (const name of uir14Exports) {
  if (!scenarios.includes(`'${name}'`))
    issues.push(`${name}: UIR14 G6 scenario does not visibly claim this export`);
}

for (const token of [
  'System UI core stays above accepted Components',
  'pnpm gate:system-ui-core',
]) {
  if (!qualityGates.includes(token))
    issues.push(`UIR14 quality-gate documentation missing ${token}`);
}

for (const task of ['UI-1401', 'UI-1402', 'UI-1403', 'UI-1404', 'UI-1405', 'UI-1406']) {
  if (!audit.includes(task)) issues.push(`UIR14 audit evidence missing ${task}`);
}
for (const statement of [
  'does **not** own notification center, quick settings, OSD/command/lock surfaces, or the privileged touch keyboard',
  'No new generic System-owned Button/Input/List/Grid/Overlay primitive is justified.',
  'planning advances only after the UIR14 closeout passes the canonical UI verify and the real OXS consumer validation',
]) {
  if (!audit.includes(statement)) issues.push(`UIR14 audit invariant missing: ${statement}`);
}

if (issues.length) {
  console.error('G0 UIR14 System UI core gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  'G0 UIR14 System UI core gate passed: 11 accepted core exports · Component-only dependency floor · no raw interactive/host authority · logical System geometry · UIR15 isolation · strengthened G6 evidence.',
);
