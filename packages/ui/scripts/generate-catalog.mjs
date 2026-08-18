import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeCatalog } from './catalog-lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const uiRoot = path.resolve(here, '..');
const studioRoot = path.resolve(uiRoot, '..', '..', 'apps', 'ui-studio');
const check = process.argv.includes('--check');

try {
  const catalog = writeCatalog({ uiRoot, studioRoot, check });
  console.log(
    `OXS UI catalog ${check ? 'check' : 'generation'} passed: ${catalog.length} public visual entries.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
