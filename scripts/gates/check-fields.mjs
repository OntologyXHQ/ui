import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from '../../packages/ui/scripts/catalog-lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const UI = path.join(ROOT, 'packages/ui');
const field = fs.readFileSync(path.join(UI, 'src/components/Field.tsx'), 'utf8');
const textField = fs.readFileSync(path.join(UI, 'src/components/TextField.tsx'), 'utf8');
const editingTypes = fs.readFileSync(path.join(UI, 'src/editing/types.ts'), 'utf8');
const editingContract = fs.readFileSync(path.join(UI, 'src/editing/useEditableText.ts'), 'utf8');
const publicIndex = fs.readFileSync(path.join(UI, 'src/index.ts'), 'utf8');
const css = fs.readFileSync(path.join(UI, 'src/styles/components.css'), 'utf8');
const scenarios = fs.readFileSync(path.join(ROOT, 'scripts/browser/scenarios.mjs'), 'utf8');
const catalog = buildCatalog({ uiRoot: UI });
const issues = [];

const requiredExamples = new Map([
  ['FieldGroup', 'group-contract'],
  ['FieldSection', 'section-contract'],
  ['TextField', 'native-form'],
  ['SearchField', 'composition-safe-search'],
  ['TextArea', 'multiline-native'],
]);
for (const [name, exampleId] of requiredExamples) {
  const entry = catalog.find((item) => item.exportName === name);
  if (entry?.status !== 'accepted')
    issues.push(`${name}: UIR07 accepted field contract is missing`);
  if (!entry?.examples?.some((example) => example.id === exampleId))
    issues.push(`${name}: dedicated ${exampleId} Studio example is missing`);
}

for (const token of [
  'aria-errormessage={error ? ids.errorId : undefined}',
  'data-required={required || undefined}',
  '<fieldset',
  '<legend',
  'aria-labelledby={titleId}',
]) {
  if (!field.includes(token) && !textField.includes(token))
    issues.push(`field relationship contract missing ${token}`);
}

if (textField.includes('role="searchbox"'))
  issues.push(
    'SearchField must rely on native input type=search semantics instead of a redundant searchbox role',
  );
if (!field.includes('FieldsetHTMLAttributes<HTMLFieldSetElement>'))
  issues.push('FieldGroup props must project native fieldset attributes');
if (!field.includes('role="img"') || !field.includes('aria-hidden="true"'))
  issues.push(
    'Field leading visuals must branch explicitly between meaningful image semantics and decorative hiding',
  );
if (/\brequestAnimationFrame\s*\(/.test(textField))
  issues.push('SearchField/TextField must not borrow ambient requestAnimationFrame');
if ((textField.match(/editing\.onKeyDown\(event\);/g) ?? []).length !== 2)
  issues.push('TextField/TextArea must each forward the editing keydown contract exactly once');
if (!textField.includes("resolvedType = resolvedSecure ? 'password'"))
  issues.push(
    'secure TextField must force password rendering regardless of a conflicting type prop',
  );
if (!textField.includes('onDragStart={handleDragStart}'))
  issues.push('secure TextField must block native drag export');
if (
  !textField.includes('!event.nativeEvent.isComposing') ||
  !textField.includes('!composingRef.current')
)
  issues.push('SearchField suggestions must stay composition-safe');
if (!textField.includes('disabled={composing}'))
  issues.push('SearchField clear/suggestion actions must be unavailable during composition');

if (
  !editingTypes.includes('EditableTextSessionDescriptor') ||
  !editingTypes.includes('descriptor: EditableTextSessionDescriptor')
)
  issues.push('editable text bridge needs an explicit host-neutral session descriptor');
if (/EditableTextSessionSnapshot\s*=\s*\{[^}]*\bvalue\s*:/s.test(editingTypes))
  issues.push('editable text bridge must not expose committed text values');
if (!editingContract.includes("preedit: secure ? '' : preeditRef.current"))
  issues.push('secure editing sessions must redact composition preedit text');
if (!editingContract.includes('input.ownerDocument.defaultView?.InputEvent'))
  issues.push('synthetic clipboard editing events must use the owning Window realm');
for (const publicType of [
  'EditableTextBridge',
  'EditableTextSessionSnapshot',
  'EditableTextSessionDescriptor',
]) {
  if (!publicIndex.includes(publicType))
    issues.push(`public host integration surface is missing ${publicType}`);
}

if (!css.includes('scroll-margin-block-end: calc(var(--oxs-environment-inset-block-end)'))
  issues.push('fields must respond to combined host occlusion through logical scroll margin');
if (css.includes('.ui-field__slot--trailing .ui-icon-button'))
  issues.push('Field must not shrink accepted IconButton touch targets inside trailing slots');
if (!css.includes('min-height: max(var(--oxs-control-height-sm), var(--oxs-touch-target-min));'))
  issues.push('SearchField suggestion actions must preserve the accepted touch-target floor');

for (const id of [
  'field-native-form-certification',
  'search-field-composition-certification',
  'editable-text-host-occlusion-certification',
]) {
  if (!scenarios.includes(id)) issues.push(`missing G6 field scenario: ${id}`);
}

if (issues.length) {
  console.error('G0 fields/text-input contract failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  'G0 fields/text-input contract passed: explicit field relationships · native controlled/uncontrolled form semantics · composition-safe SearchField · secure redaction/export guards · host-neutral text-session descriptor · combined occlusion response.',
);
