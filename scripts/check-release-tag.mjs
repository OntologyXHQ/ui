import { readFile } from 'node:fs/promises';
const pkg = JSON.parse(
  await readFile(new URL('../packages/ui/package.json', import.meta.url), 'utf8'),
);
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];
if (!tag) throw new Error('Release tag is required');
if (tag !== `v${pkg.version}`)
  throw new Error(`Tag ${tag} does not match @ontologyx/ui version ${pkg.version}`);
console.log(`Release identity passed: ${tag} -> @ontologyx/ui@${pkg.version}`);
