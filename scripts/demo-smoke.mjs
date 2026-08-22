import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import {
  axeSourcePath,
  getFreePort,
  launchSystemBrowser,
  repoRoot,
  sleep,
} from './browser/harness.mjs';

async function waitForUrl(url, child, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Demo preview exited with ${child.exitCode}.`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await sleep(100);
  }
  throw new Error(`Demo preview did not become ready at ${url}.`);
}

const port = await getFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const preview = spawn(
  'pnpm',
  [
    '--filter',
    '@ontologyx/ui-demo',
    'exec',
    'vite',
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { cwd: repoRoot, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, BROWSER: 'none' } },
);
const previewOutput = [];
preview.stdout.on('data', (chunk) => previewOutput.push(String(chunk)));
preview.stderr.on('data', (chunk) => previewOutput.push(String(chunk)));

const artifactRoot = path.join(repoRoot, 'artifacts/demo-smoke');
await mkdir(artifactRoot, { recursive: true });
let browser;
let context;
try {
  await waitForUrl(baseUrl, preview);
  const launched = await launchSystemBrowser();
  browser = launched.browser;
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.locator('[data-oxs-production-workspace]').waitFor({ state: 'visible' });
  assert.equal(
    await page.locator('[data-active-app="browser"]').count(),
    1,
    'Demo did not start with the browser app active.',
  );

  await page.getByRole('button', { name: 'Open launcher', exact: true }).click();
  const launcher = page.getByRole('dialog', { name: 'Application launcher', exact: true });
  await launcher.waitFor({ state: 'visible' });
  await launcher.locator('[data-oxs-application-id="files"] button').click();
  await page.locator('[data-active-app="files"]').waitFor({ state: 'visible' });
  await launcher.waitFor({ state: 'hidden' });

  await page.getByRole('button', { name: 'Quick settings', exact: true }).click();
  await page
    .getByRole('region', { name: 'Quick settings', exact: true })
    .waitFor({ state: 'visible' });

  await page.addScriptTag({ path: axeSourcePath });
  const axe = await page.evaluate(
    async () => await globalThis.axe.run(document, { resultTypes: ['violations'] }),
  );
  const serious = axe.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact ?? ''),
  );
  assert.deepEqual(
    serious.map((violation) => `${violation.id}: ${violation.help}`),
    [],
    'Demo has serious/critical axe violations.',
  );
  assert.deepEqual(errors, [], `Demo emitted browser errors: ${errors.join(' | ')}`);

  const screenshot = path.join(artifactRoot, 'latest.png');
  await page.screenshot({ path: screenshot, fullPage: true, animations: 'disabled' });
  const evidence = {
    schema: 1,
    createdAt: new Date().toISOString(),
    browser: launched.source,
    assertions: [
      'workspace-visible',
      'launcher-launches-stable-id',
      'quick-settings-visible',
      'axe-serious-critical-zero',
    ],
    screenshot: path.relative(repoRoot, screenshot),
  };
  await writeFile(path.join(artifactRoot, 'latest.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    'OntologyX UI System demo smoke passed: workspace · launcher · app activation · quick settings · axe.',
  );
  console.log(`Evidence: ${path.join(artifactRoot, 'latest.json')}`);
} catch (error) {
  console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
  if (previewOutput.length) console.error(previewOutput.join('').trim());
  process.exitCode = 1;
} finally {
  await context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  if (preview.exitCode === null) preview.kill('SIGTERM');
}
