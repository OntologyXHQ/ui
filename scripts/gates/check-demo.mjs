import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const read = (relative) => readFileSync(path.join(root, relative), 'utf8');
const rootPkg = JSON.parse(read('package.json'));
const demoPkg = JSON.parse(read('apps/ui-demo/package.json'));
const uiPkg = JSON.parse(read('packages/ui/package.json'));
const demo = read('apps/ui-demo/src/main.tsx');
const manager = read('apps/ui-demo/src/window-manager.ts');
const demoCss = read('apps/ui-demo/src/demo.css');
const systemCss = read('packages/ui/src/styles/system-ui.css');
const demoIndex = read('apps/ui-demo/index.html');
const demoViteEnv = read('apps/ui-demo/src/vite-env.d.ts');
const dev = read('scripts/dev.mjs');
const issues = [];

if (demoPkg.dependencies?.['@ontologyx/ui'] !== 'workspace:*')
  issues.push(
    'System demo must consume @ontologyx/ui through the public workspace package boundary',
  );
for (const peer of ['react', 'react-dom']) {
  if (demoPkg.dependencies?.[peer] !== uiPkg.peerDependencies?.[peer])
    issues.push(`System demo ${peer} version must match the public UI peer exactly`);
}
for (const forbidden of ['@ontologyx/ui/src', '../../packages/ui/src', '../packages/ui/src']) {
  if (demo.includes(forbidden))
    issues.push(`System demo contains a private UI import: ${forbidden}`);
}
for (const required of [
  'DesktopShellLayout',
  'SystemQuickSettings',
  'SystemNotificationCenter',
  'SystemCommandSurface',
  'SystemSettingsLayout',
  'HOST_APPLICATIONS',
  'hostIcon(',
]) {
  if (!demo.includes(required)) issues.push(`System demo contract missing ${required}`);
}

for (const required of [
  'ReplaceTransition',
  'SlideTransition',
  'ScaleTransition',
  "motion={animateWorkspace ? 'full' : 'reduced'}",
  'Appearance & motion',
  'Network & wireless',
  'Software updates',
]) {
  if (!demo.includes(required))
    issues.push(`System demo product/motion contract missing ${required}`);
}
if (demo.includes('demo-registry-proof'))
  issues.push(
    'System demo must not expose acceptance/debug boundary cards in the normal product surface',
  );
for (const required of [".ui-root[data-oxs-motion='reduced']"]) {
  if (!demoCss.includes(required)) issues.push(`System demo visual contract missing ${required}`);
}
for (const required of [
  '.ui-system-settings-layout__navigation .ui-navigation__items',
  '@container oxs-system-settings (min-width: 44rem)',
]) {
  if (!systemCss.includes(required))
    issues.push(`System UI desktop composition contract missing ${required}`);
}
if (!demo.includes('This array stands in for an OXS App/Package Registry result'))
  issues.push(
    'System demo must document host/App Registry ownership of app metadata and icon resources',
  );
if (!dev.includes("mode = process.argv[2] ?? 'both'"))
  issues.push('root dev runner must default to both Studio and demo');
if (!dev.includes("'ui'")) issues.push('root dev runner must support `pnpm dev ui`');
if (!dev.includes("'demo'")) issues.push('root dev runner must support `pnpm dev demo`');
if (rootPkg.scripts?.dev !== 'node scripts/dev.mjs')
  issues.push('root `pnpm dev` must use the unified dev runner');

if (!demoViteEnv.includes('reference types="vite/client"'))
  issues.push(
    'System demo must include Vite client ambient declarations so explicit CSS side-effect imports typecheck',
  );

if (!demoIndex.includes('<link rel="icon" href="data:image/svg+xml,'))
  issues.push(
    'System demo must provide a self-contained favicon so preview smoke does not emit /favicon.ico 404 browser errors',
  );

// Window-manager product-demo contract. Keep this independent of the older
// product-polish checks so formatter changes cannot make patching brittle.
for (const required of [
  'SystemApplicationBrowser',
  'SharedBounds',
  '@ontologyx/ui/icons',
  'OxMarkGlyph',
  'HostApplicationIcon',
]) {
  if (!demo.includes(required)) issues.push(`System demo WM surface contract missing ${required}`);
}
for (const required of [
  'Demo host simulation only',
  "const policy = app.launchPolicy ?? 'new-window'",
  "launchPolicy: 'single-instance'",
  'demoWindowManagerReducer',
  "type: 'open'",
  "type: 'focus'",
  "type: 'minimize'",
  "type: 'toggle-maximize'",
  "type: 'request-close'",
  "type: 'move-to-workspace'",
  "type: 'cycle-focus'",
  'DEMO_WORKSPACES',
  'Window overview',
  'Drag launcher down to dismiss',
  'demo-launcher-motion',
  'data-demo-window-id',
  'data-workspace-id',
]) {
  if (!demo.includes(required))
    issues.push(`System demo window-manager contract missing ${required}`);
}
for (const required of [
  'createInitialDemoWindowManagerState',
  'demoWindowManagerReducer',
  'DemoWindowInstance',
  'activeWorkspaceId',
  'focusedWindowId',
  "case 'open'",
  "case 'restore'",
  "case 'switch-workspace'",
  "case 'move-to-workspace'",
  'clampDemoWindowBounds',
]) {
  if (!manager.includes(required)) issues.push(`System demo manager model missing ${required}`);
}
if (demo.includes('<SystemLauncher')) {
  issues.push('Desktop demo must not regress to the BottomSheet-backed SystemLauncher surface');
}
for (const productLeak of [
  'Workspaces + Recents',
  'GNOME-style',
  'Android-style',
  'browser journeys',
  'visual exports',
  'UI 1.0',
]) {
  if (demo.includes(productLeak))
    issues.push(`System demo exposes release/test language in the product surface: ${productLeak}`);
}
for (const required of [
  '.demo-workspace-stage',
  '.demo-workspace-scene',
  '.demo-window-frame',
  '.demo-launcher__handle',
  '.demo-overview-workspaces',
  '.demo-overview-recents',
  '.demo-overview-card',
  '.demo-dock-app[data-running',
  '.demo-dock-app__button',
  '.demo-dock-app__icon',
  '.demo-system-home',
]) {
  if (!demoCss.includes(required))
    issues.push(`System demo visual/window contract missing ${required}`);
}

if (issues.length) {
  console.error('Pre-publication System demo gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'Pre-publication System demo gate passed: public SDK consumer · host-owned multi-window stack · GNOME-style workspaces · Android-style recents · draggable launcher dismissal · focus/minimize/maximize/close · motion/reduced-motion · settings/centers · dev ui/demo/both contract.',
);
