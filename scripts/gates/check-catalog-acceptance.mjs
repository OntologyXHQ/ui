import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalogPath = path.join(ROOT, 'apps/ui-studio/src/catalog/generated/catalog.generated.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const gateState = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/quality/GATE_STATE.json'), 'utf8'),
);
const certifications = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'docs/quality/CERTIFICATIONS.json'), 'utf8'),
);
const certificationEntries = certifications.exports ?? {};
const issues = [];
const allowedStatuses = new Set(['candidate', 'accepted', 'experimental', 'deprecated']);
const ids = new Set();
let accepted = 0;
let candidate = 0;

function meaningful(value, min = 16) {
  return typeof value === 'string' && value.trim().length >= min;
}

for (const entry of catalog) {
  if (ids.has(entry.exportName)) {
    issues.push(`duplicate public catalog export: ${entry.exportName}`);
  }
  ids.add(entry.exportName);

  if (!allowedStatuses.has(entry.status)) {
    issues.push(
      `${entry.exportName}: forbidden/unrecognized lifecycle status ${JSON.stringify(entry.status)}`,
    );
    continue;
  }
  if (entry.status === 'candidate') candidate += 1;
  if (entry.status !== 'accepted') continue;
  accepted += 1;

  const certification = certificationEntries[entry.exportName];
  if (!certification || typeof certification !== 'object') {
    issues.push(
      `${entry.exportName}: accepted export needs a docs/quality/CERTIFICATIONS.json record`,
    );
  } else {
    if (!meaningful(certification.owner, 4)) {
      issues.push(`${entry.exportName}: certification needs an owning roadmap part`);
    }
    if (!Array.isArray(certification.behaviorTests) || certification.behaviorTests.length === 0) {
      issues.push(`${entry.exportName}: certification needs at least one behavior-test owner`);
    } else {
      for (const relative of certification.behaviorTests) {
        if (
          typeof relative !== 'string' ||
          !relative.includes('__tests__') ||
          !fs.existsSync(path.join(ROOT, relative))
        ) {
          issues.push(
            `${entry.exportName}: certification behavior test is missing/not a test path: ${JSON.stringify(relative)}`,
          );
        }
      }
    }
    if (
      !Array.isArray(certification.browserScenarios) ||
      certification.browserScenarios.length === 0
    ) {
      issues.push(
        `${entry.exportName}: certification needs component-specific G6 browser scenario ownership`,
      );
    }
    if (!Array.isArray(certification.requiredAxes) || certification.requiredAxes.length === 0) {
      issues.push(
        `${entry.exportName}: certification needs explicit required browser acceptance axes`,
      );
    }
  }

  for (const field of ['summary', 'usage', 'accessibility', 'rtl', 'touch', 'responsive']) {
    if (!meaningful(entry[field])) {
      issues.push(`${entry.exportName}: accepted export needs meaningful ${field} guidance`);
    }
  }

  const undocumentedProps = (entry.props ?? []).filter(
    (prop) => !prop.deprecated && !meaningful(prop.description, 8),
  );
  for (const prop of undocumentedProps) {
    issues.push(`${entry.exportName}.${prop.name}: accepted public prop needs JSDoc/description`);
  }

  const hasExample = Array.isArray(entry.examples) && entry.examples.length > 0;
  const hasFixture = Boolean(entry.playground?.fixture);
  if (!hasExample && !hasFixture) {
    issues.push(
      `${entry.exportName}: accepted export needs a dedicated example or explicit playground fixture`,
    );
  }
}

for (const exportName of Object.keys(certificationEntries)) {
  const entry = catalog.find((candidate) => candidate.exportName === exportName);
  if (!entry) issues.push(`certification references non-catalog export: ${exportName}`);
  else if (entry.status !== 'accepted') {
    issues.push(
      `${exportName}: certification record is stale while catalog status is ${entry.status}`,
    );
  }
}

if (!gateState.allow_accepted_visual_exports && accepted > 0) {
  issues.push(
    `accepted visual exports are forbidden while browser acceptance is ${gateState.browser_acceptance}; close UIR01 first`,
  );
}

if (issues.length > 0) {
  console.error('G1 catalog acceptance gate failed:');
  for (const issue of issues) console.error(` - ${issue}`);
  process.exit(1);
}

console.log(
  `G1 catalog acceptance gate passed: ${catalog.length} public visual exports · accepted=${accepted} · candidate=${candidate} · no legacy maturity claims.`,
);
