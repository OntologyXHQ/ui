import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(
  await readFile(new URL('../packages/ui/package.json', import.meta.url), 'utf8'),
);
const failures = [];
const expectedRepository = 'git+https://github.com/OntologyXHQ/ui.git';
const expectedHomepage = 'https://ontologyxhq.github.io/ui/';

if (pkg.name !== '@ontologyx/ui')
  failures.push(`package name must be @ontologyx/ui, got ${JSON.stringify(pkg.name)}`);
if (pkg.license !== 'MIT')
  failures.push(`package license must be MIT, got ${JSON.stringify(pkg.license)}`);
if (pkg.repository?.url !== expectedRepository) {
  failures.push(`repository.url must be ${expectedRepository}`);
}
if (pkg.homepage !== expectedHomepage) failures.push(`homepage must be ${expectedHomepage}`);
if (pkg.publishConfig?.access !== 'public') failures.push('publishConfig.access must be public');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['--version'], { encoding: 'utf8' });
if (result.status !== 0) {
  failures.push('npm CLI is unavailable');
} else {
  const [major = 0, minor = 0, patch = 0] = result.stdout.trim().split('.').map(Number);
  if (major < 11 || (major === 11 && (minor < 5 || (minor === 5 && patch < 1)))) {
    failures.push(
      `npm ${result.stdout.trim()} is too old for Trusted Publishing; require >=11.5.1`,
    );
  }
}
if (failures.length) {
  console.error('Public publish readiness failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(
  'Public publish readiness passed: @ontologyx/ui · MIT · OntologyXHQ/ui · public npm · OIDC client floor.',
);
