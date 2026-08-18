import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const pkg = JSON.parse(await readFile(new URL('../packages/ui/package.json', import.meta.url), 'utf8'));
const failures = [];

if (!pkg.repository?.url || !String(pkg.repository.url).includes('github.com/')) {
  failures.push('packages/ui/package.json repository.url must be set to the exact GitHub repository before Trusted Publishing');
}
if (!pkg.license || pkg.license === 'UNLICENSED') {
  failures.push('choose the intended package license before public publication');
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npm, ['--version'], { encoding: 'utf8' });
if (result.status !== 0) {
  failures.push('npm CLI is unavailable');
} else {
  const [major = 0, minor = 0, patch = 0] = result.stdout.trim().split('.').map(Number);
  if (major < 11 || (major === 11 && (minor < 5 || (minor === 5 && patch < 1)))) {
    failures.push(`npm ${result.stdout.trim()} is too old for Trusted Publishing; require >=11.5.1`);
  }
}
if (failures.length) {
  console.error('Public publish readiness failed:');
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log('Public publish readiness passed: repository identity · license · npm OIDC client floor.');
