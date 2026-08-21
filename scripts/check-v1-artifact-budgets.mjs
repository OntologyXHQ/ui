import { access, readFile } from 'node:fs/promises';
import { budgetFile, measureV1Artifacts } from './v1-artifact-budgets.mjs';

const ifPresent = process.argv.includes('--if-present');
try {
  await access(budgetFile);
} catch {
  if (ifPresent) {
    console.log('V1 artifact budget check skipped: measured V1 baseline is not frozen yet.');
    process.exit(0);
  }
  console.error(`Frozen V1 artifact budget file is missing: ${budgetFile}`);
  process.exit(1);
}

const baseline = JSON.parse(await readFile(budgetFile, 'utf8'));
const measured = await measureV1Artifacts();
const issues = [];
if (baseline.packageVersion !== measured.version) {
  issues.push(
    `budget version ${baseline.packageVersion} does not match package ${measured.version}`,
  );
}
for (const [name, value] of Object.entries(measured.metrics)) {
  const budget = baseline.metrics?.[name];
  if (!budget) {
    issues.push(`${name}: missing frozen budget`);
    continue;
  }
  if (value.bytes > budget.limitBytes) {
    issues.push(
      `${name}: ${value.bytes} bytes exceeds measured V1 limit ${budget.limitBytes} bytes`,
    );
  }
}
if (issues.length) {
  console.error('V1 artifact budget gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}
console.log(`V1 artifact budget gate passed for @ontologyx/ui@${measured.version}.`);
