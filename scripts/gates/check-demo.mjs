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
  'SystemLauncher',
  'SystemQuickSettings',
  'SystemNotificationCenter',
  'SystemCommandSurface',
  'SystemSettingsLayout',
  'HOST_APPLICATIONS',
  'hostIcon(',
  'onLaunch={(id)',
]) {
  if (!demo.includes(required)) issues.push(`System demo contract missing ${required}`);
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

if (issues.length) {
  console.error('Pre-publication System demo gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'Pre-publication System demo gate passed: public SDK consumer · host-owned app registry/icon resources · launcher/settings/centers/commands · dev ui/demo/both contract.',
);
