import { readFile, writeFile } from 'node:fs/promises';
import { budgetFile, measuredLimit, measureV1Artifacts } from './v1-artifact-budgets.mjs';

const measured = await measureV1Artifacts();
if (!/^\d+\.\d+\.\d+$/.test(measured.version)) {
  throw new Error(`UIR17 budget freeze requires a stable package version, got ${measured.version}`);
}

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
const policy =
  'Final V1 measured output plus 10% or 1 KiB minimum headroom, rounded to the next KiB; any post-freeze rebaseline requires explicit release review.';

let existing = null;
try {
  existing = JSON.parse(await readFile(budgetFile, 'utf8'));
} catch {
  existing = null;
}
const sameMeasurement =
  existing?.schema === 2 &&
  existing?.packageVersion === measured.version &&
  existing?.freezeOwner === 'UIR17' &&
  existing?.measurement === 'final-v1-release-candidate' &&
  existing?.policy === policy &&
  JSON.stringify(existing?.metrics) === JSON.stringify(metrics);

if (sameMeasurement) {
  console.log(
    'UIR17 V1 artifact budgets already match the current measured release output; no rewrite needed.',
  );
  process.exit(0);
}

const document = {
  schema: 2,
  packageVersion: measured.version,
  freezeOwner: 'UIR17',
  measurement: 'final-v1-release-candidate',
  measuredAt: new Date().toISOString(),
  policy,
  metrics,
};

await writeFile(budgetFile, `${JSON.stringify(document, null, 2)}\n`);
console.log(
  `UIR17 V1 artifact budgets rebaselined from the current verified release output: ${budgetFile}`,
);
