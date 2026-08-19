import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const button = fs.readFileSync(path.join(UI, 'src/components/Button.tsx'), 'utf8');
const iconButton = fs.readFileSync(path.join(UI, 'src/components/IconButton.tsx'), 'utf8');
const navigation = fs.readFileSync(path.join(UI, 'src/components/Navigation.tsx'), 'utf8');
const css = fs.readFileSync(path.join(UI, 'src/styles/components.css'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];
const required = ['Button', 'IconButton', 'ActionGroup', 'Toolbar'];
for (const name of required) {
  const entry = catalog.find((item) => item.exportName === name);
  if (!entry || entry.status !== 'accepted') issues.push(`${name}: UIR06 accepted action contract is missing`);
  if (!entry?.examples?.length) issues.push(`${name}: accepted action needs a dedicated Studio example`);
}
for (const legacy of ["'ghost'", "'soft'", "'filled'", 'ButtonTone', 'ui-button--ghost', 'ui-button--soft', 'ui-button--filled', 'ui-button--tone-danger']) {
  if (button.includes(legacy) || css.includes(legacy)) issues.push(`legacy action vocabulary remains: ${legacy}`);
}

const actionConsumerRoots = [path.join(UI, 'src'), path.join(ROOT, 'apps/ui-studio/src')];
const actionConsumerFiles = actionConsumerRoots.flatMap((root) => {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(target);
      else if (/\.tsx?$/.test(entry.name)) files.push(target);
    }
  };
  visit(root);
  return files;
});
for (const file of actionConsumerFiles) {
  const source = fs.readFileSync(file, 'utf8');
  if (/\bvariant\s*=\s*(?:["'](?:ghost|soft|filled)["']|\{[^}\n]*(?:'ghost'|'soft'|'filled')[^}\n]*\})/.test(source)
      || /\bvariant\s*:\s*["'](?:ghost|soft|filled)["']/.test(source)) {
    issues.push(`legacy Button variant consumer remains: ${path.relative(ROOT, file)}`);
  }
}

for (const requiredSource of ["'quiet' | 'secondary' | 'primary'", "'neutral' | 'destructive'", "type?: 'button' | 'submit' | 'reset'", 'aria-busy={loading || undefined}']) {
  if (!button.includes(requiredSource)) issues.push(`Button action contract missing ${requiredSource}`);
}
if (!iconButton.includes('aria-describedby={combinedDescription}') || !iconButton.includes('role="tooltip"')) issues.push('IconButton tooltip must be explicitly related through aria-describedby');
if (navigation.includes("collapse?: 'never' | 'compact'") || css.includes("data-collapse='compact'")) issues.push('ActionGroup must not silently hide actions through private responsive collapse');
if (!navigation.includes('role="toolbar"') || !navigation.includes('aria-orientation={orientation}') || !navigation.includes('useRovingFocus')) issues.push('Toolbar must own named orientation-aware roving focus');
if (!navigation.includes('overflow?: ReactNode')) issues.push('Toolbar must expose an explicit caller-owned overflow slot');
for (const id of ['button-action-contract-certification','icon-button-action-contract-certification','action-group-toolbar-certification']) if (!scenarios.includes(id)) issues.push(`missing G6 action scenario: ${id}`);
if (issues.length) { console.error('G0 actions contract failed:'); for (const issue of issues) console.error(` - ${issue}`); process.exit(1); }
console.log('G0 actions contract passed: native Button form/loading semantics · quiet/secondary/primary + destructive intent · labeled IconButton tooltip relationship/targets · semantic ActionGroup · orientation-aware roving Toolbar with explicit overflow.');
