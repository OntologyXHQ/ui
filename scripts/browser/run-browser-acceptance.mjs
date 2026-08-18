import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  fingerprintWorkspace,
  gitHead,
  launchSystemBrowser,
  repoRoot,
  startStudioPreview,
  writeEvidence,
} from './harness.mjs';
import { browserScenarios } from './scenarios.mjs';
import { runHarnessSelfTests } from './self-test.mjs';

async function acceptedExports() {
  const generated = path.join(repoRoot, 'apps/ui-studio/src/catalog/generated/catalog.generated.ts');
  const text = await readFile(generated, 'utf8');
  const accepted = [];
  const entryPattern = /\n  \{\n    id: "([^"]+)",\n    exportName: "([^"]+)",[\s\S]*?\n    status: "(candidate|accepted|experimental|deprecated)",/g;
  for (const match of text.matchAll(entryPattern)) {
    if (match[3] === 'accepted') accepted.push(match[2]);
  }
  return accepted.sort();
}

function componentEvidenceCoverage() {
  const covered = new Set();
  for (const scenario of browserScenarios) {
    for (const exportName of scenario.accepts) covered.add(exportName);
  }
  return covered;
}

async function main() {
  const startedAt = new Date().toISOString();
  const sourceHash = await fingerprintWorkspace();
  const head = await gitHead();
  const preview = await startStudioPreview();
  let browser;
  let browserSource;
  let browserVersion = null;
  const results = [];
  let selfTests = [];
  let failure = null;

  try {
    const launched = await launchSystemBrowser();
    browser = launched.browser;
    browserSource = launched.source;
    browserVersion = browser.version();
    selfTests = await runHarnessSelfTests(browser);

    for (const scenario of browserScenarios) {
      const scenarioStart = performance.now();
      process.stdout.write(`G6 browser: ${scenario.id} ... `);
      try {
        const detail = await scenario.run({ browser, baseUrl: preview.baseUrl });
        const durationMs = Math.round(performance.now() - scenarioStart);
        results.push({ id: scenario.id, status: 'passed', axes: scenario.axes, accepts: scenario.accepts, durationMs, detail });
        process.stdout.write(`passed (${durationMs}ms)\n`);
      } catch (error) {
        const durationMs = Math.round(performance.now() - scenarioStart);
        results.push({ id: scenario.id, status: 'failed', axes: scenario.axes, accepts: scenario.accepts, durationMs, error: String(error.stack ?? error) });
        failure = error;
        process.stdout.write(`FAILED (${durationMs}ms)\n`);
        break;
      }
    }

    if (!failure) {
      const accepted = await acceptedExports();
      const coverage = componentEvidenceCoverage();
      const missing = accepted.filter((exportName) => !coverage.has(exportName));
      if (missing.length) {
        throw new Error(`Accepted public exports lack component-specific G6 browser evidence: ${missing.join(', ')}. Harness scenarios never count as component certification.`);
      }
    }
  } catch (error) {
    failure = error;
  } finally {
    if (browser) await browser.close();
    await preview.stop();
  }

  const finishedAt = new Date().toISOString();
  const evidence = {
    schemaVersion: 1,
    gate: 'G6',
    status: failure ? 'failed' : 'passed',
    startedAt,
    finishedAt,
    sourceHash,
    gitHead: head,
    browser: browserVersion ? { version: browserVersion, source: browserSource } : { source: browserSource ?? null },
    harnessSelfTests: selfTests,
    scenarios: results,
  };
  const paths = await writeEvidence(evidence);

  if (failure) {
    console.error(`G6 browser acceptance failed. Evidence: ${paths.latest}`);
    throw failure;
  }

  const axisCount = new Set(results.flatMap((result) => result.axes)).size;
  console.log(`G6 browser acceptance passed: ${results.length} real-browser journeys · ${axisCount} acceptance axes · ${selfTests.length} adversarial harness self-tests.`);
  console.log(`Evidence: ${paths.latest}`);
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
