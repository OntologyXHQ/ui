import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url));
await rm(path.resolve(here, '..', 'dist'), { recursive: true, force: true });
