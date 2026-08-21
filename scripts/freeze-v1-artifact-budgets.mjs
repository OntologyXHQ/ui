import { access, writeFile } from 'node:fs/promises';
import { budgetFile, measureV1Artifacts, measuredLimit } from './v1-artifact-budgets.mjs';

const ifMissing = process.argv.includes('--if-missing');
let exists = true;
try {
  await access(budgetFile);
} catch {
  exists = false;
}
if (exists) {
  if (ifMissing) {
    console.log('V1 artifact budgets already frozen; preserving the measured baseline.');
    process.exit(0);
  }
  console.error(`Refusing to overwrite frozen V1 artifact budgets: ${budgetFile}`);
  process.exit(1);
}

const measured = await measureV1Artifacts();
const metrics = Object.fromEntries(
  Object.entries(measured.metrics).map(([name, value]) => [
    name,
    {
      measuredBytes: value.bytes,
      limitBytes: measuredLimit(value.bytes),
      measuredFiles: value.files,
    },
  ]),
);
const document = {
  schema: 1,
  packageVersion: measured.version,
  measuredAt: new Date().toISOString(),
  policy:
    'V1 measured output plus 10% or 1 KiB minimum headroom, rounded to the next KiB; rebaseline requires explicit review.',
  metrics,
};
await writeFile(budgetFile, `${JSON.stringify(document, null, 2)}\n`);
console.log(`V1 artifact budgets frozen from measured release output: ${budgetFile}`);
