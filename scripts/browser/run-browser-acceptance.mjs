import { mkdir, readFile, writeFile } from 'node:fs/promises';
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

function parseScenarioSelection() {
  const args = process.argv.slice(2);
  let scenarioId = null;
  let fromId = null;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument !== '--scenario' && argument !== '--from') {
      throw new Error(`Unknown browser-acceptance argument: ${argument}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`${argument} requires a scenario id.`);
    }
    if (argument === '--scenario') scenarioId = value;
    else fromId = value;
    index += 1;
  }
  if (scenarioId && fromId) {
    throw new Error('Use either --scenario or --from, not both.');
  }
  return { scenarioId, fromId };
}

function selectScenarios(selection) {
  if (selection.scenarioId) {
    const selected = browserScenarios.find((scenario) => scenario.id === selection.scenarioId);
    if (!selected) throw new Error(`Unknown browser scenario: ${selection.scenarioId}`);
    return [selected];
  }
  if (selection.fromId) {
    const index = browserScenarios.findIndex((scenario) => scenario.id === selection.fromId);
    if (index < 0) throw new Error(`Unknown browser scenario: ${selection.fromId}`);
    return browserScenarios.slice(index);
  }
  return browserScenarios;
}

async function writeFocusedEvidence(evidence, selection) {
  const directory = path.join(repoRoot, 'artifacts/browser-acceptance/focused');
  await mkdir(directory, { recursive: true });
  const timestamp = evidence.finishedAt.replace(/[:.]/g, '').replace(/-/g, '');
  const selected = selection.scenarioId ?? `from-${selection.fromId ?? 'unknown'}`;
  const safeId = selected.replace(/[^a-zA-Z0-9._-]+/g, '-');
  const file = path.join(directory, `${safeId}-${timestamp}.json`);
  await writeFile(file, `${JSON.stringify(evidence, null, 2)}\n`);
  return { versioned: file, latest: file };
}

async function acceptedExports() {
  const generated = path.join(
    repoRoot,
    'apps/ui-studio/src/catalog/generated/catalog.generated.ts',
  );
  const text = await readFile(generated, 'utf8');
  const accepted = [];
  const entryPattern =
    /\n {2}\{\n {4}id: "([^"]+)",\n {4}exportName: "([^"]+)",[\s\S]*?\n {4}status: "(candidate|accepted|experimental|deprecated)",/g;
  for (const match of text.matchAll(entryPattern)) {
    if (match[3] === 'accepted') accepted.push(match[2]);
  }
  return accepted.sort();
}

async function certificationContract() {
  const file = path.join(repoRoot, 'docs/quality/CERTIFICATIONS.json');
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  return parsed.exports ?? {};
}

function validateAcceptedCertification(accepted, certifications, results) {
  const passedById = new Map(
    results.filter((result) => result.status === 'passed').map((result) => [result.id, result]),
  );
  const scenariosById = new Map(browserScenarios.map((scenario) => [scenario.id, scenario]));
  const issues = [];

  for (const exportName of accepted) {
    const certification = certifications[exportName];
    if (!certification) {
      issues.push(`${exportName}: missing certification contract`);
      continue;
    }
    const declared = certification.browserScenarios ?? [];
    const requiredAxes = new Set(certification.requiredAxes ?? []);
    const observedAxes = new Set();
    for (const scenarioId of declared) {
      const scenario = scenariosById.get(scenarioId);
      if (!scenario) {
        issues.push(`${exportName}: declared G6 scenario does not exist: ${scenarioId}`);
        continue;
      }
      if (!scenario.accepts.includes(exportName)) {
        issues.push(
          `${exportName}: declared G6 scenario ${scenarioId} does not claim this export in accepts[]`,
        );
      }
      const result = passedById.get(scenarioId);
      if (!result) {
        issues.push(`${exportName}: declared G6 scenario did not pass: ${scenarioId}`);
        continue;
      }
      for (const axis of result.axes) observedAxes.add(axis);
    }
    const missingAxes = [...requiredAxes].filter((axis) => !observedAxes.has(axis));
    if (missingAxes.length) {
      issues.push(
        `${exportName}: G6 certification is missing required axes: ${missingAxes.join(', ')}`,
      );
    }
  }

  if (issues.length) {
    throw new Error(`Accepted public export certification failed:\n - ${issues.join('\n - ')}`);
  }
}

async function main() {
  const scenarioSelection = parseScenarioSelection();
  const selectedScenarios = selectScenarios(scenarioSelection);
  const focusedRun = selectedScenarios.length !== browserScenarios.length;
  const startedAt = new Date().toISOString();
  const sourceHash = await fingerprintWorkspace();
  const head = await gitHead();
  const preview = await startStudioPreview();
  let browser;
  let browserSource;
  let browserVersion = null;
  const results = [];
  const certifications = await certificationContract();
  let selfTests = [];
  let failure = null;

  try {
    const launched = await launchSystemBrowser();
    browser = launched.browser;
    browserSource = launched.source;
    browserVersion = browser.version();
    selfTests = await runHarnessSelfTests(browser);

    for (const scenario of selectedScenarios) {
      const scenarioStart = performance.now();
      process.stdout.write(`G6 browser: ${scenario.id} ... `);
      try {
        const detail = await scenario.run({ browser, baseUrl: preview.baseUrl });
        const durationMs = Math.round(performance.now() - scenarioStart);
        results.push({
          id: scenario.id,
          status: 'passed',
          axes: scenario.axes,
          accepts: scenario.accepts,
          durationMs,
          detail,
        });
        process.stdout.write(`passed (${durationMs}ms)\n`);
      } catch (error) {
        const durationMs = Math.round(performance.now() - scenarioStart);
        results.push({
          id: scenario.id,
          status: 'failed',
          axes: scenario.axes,
          accepts: scenario.accepts,
          durationMs,
          error: String(error.stack ?? error),
        });
        failure = error;
        process.stdout.write(`FAILED (${durationMs}ms)\n`);
        break;
      }
    }

    if (!failure && !focusedRun) {
      const accepted = await acceptedExports();
      validateAcceptedCertification(accepted, certifications, results);
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
    selection: scenarioSelection,
    startedAt,
    finishedAt,
    sourceHash,
    gitHead: head,
    browser: browserVersion
      ? { version: browserVersion, source: browserSource }
      : { source: browserSource ?? null },
    harnessSelfTests: selfTests,
    scenarios: results,
  };
  const paths = focusedRun
    ? await writeFocusedEvidence(evidence, scenarioSelection)
    : await writeEvidence(evidence);

  if (failure) {
    console.error(`G6 browser acceptance failed. Evidence: ${paths.latest}`);
    throw failure;
  }

  const axisCount = new Set(results.flatMap((result) => result.axes)).size;
  if (focusedRun) {
    console.log(
      `G6 browser focused acceptance passed: ${results.length} selected journey(s) · ${axisCount} acceptance axes · ${selfTests.length} adversarial harness self-tests.`,
    );
  } else {
    console.log(
      `G6 browser acceptance passed: ${results.length} real-browser journeys · ${axisCount} acceptance axes · ${selfTests.length} adversarial harness self-tests.`,
    );
  }
  console.log(`Evidence: ${paths.latest}`);
}

main().catch((error) => {
  console.error(error.stack ?? error);
  process.exitCode = 1;
});
