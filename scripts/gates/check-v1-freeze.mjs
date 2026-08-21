import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/ui/package.json'), 'utf8'));
const catalog = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, 'apps/ui-studio/src/catalog/generated/catalog.generated.json'),
    'utf8',
  ),
);
const certifications =
  JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/quality/CERTIFICATIONS.json'), 'utf8'))
    .exports ?? {};
const release = fs.readFileSync(path.join(ROOT, 'docs/RELEASE.md'), 'utf8');
const issues = [];

if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) {
  issues.push(
    `V1 package version must be stable semver without a prerelease suffix: ${pkg.version}`,
  );
}
const nonAccepted = catalog.filter((entry) => entry.status !== 'accepted');
if (nonAccepted.length) {
  issues.push(
    `V1 public visual catalog contains non-accepted exports: ${nonAccepted.map((entry) => `${entry.exportName}:${entry.status}`).join(', ')}`,
  );
}
for (const entry of catalog) {
  const certification = certifications[entry.exportName];
  if (!certification) issues.push(`${entry.exportName}: missing V1 certification record`);
}
for (const name of Object.keys(certifications)) {
  if (!catalog.some((entry) => entry.exportName === name)) {
    issues.push(`${name}: stale certification record is outside the V1 visual catalog`);
  }
}
if (!release.includes(`V1 stable line: \`${pkg.version}\``)) {
  issues.push('Release contract does not agree with the stable package version.');
}
if (!release.includes('dist-tag `latest`')) {
  issues.push('Stable release contract must explicitly own the npm latest channel.');
}
if (/npm publish --access public --tag beta|git tag v0\.1\.0-beta\.1/.test(release)) {
  issues.push('Release contract still contains bootstrap-beta publication instructions.');
}

if (issues.length) {
  console.error('V1 freeze gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(
  `V1 freeze gate passed: @ontologyx/ui@${pkg.version} · ${catalog.length}/${catalog.length} accepted visual exports · certification-complete stable release contract.`,
);
