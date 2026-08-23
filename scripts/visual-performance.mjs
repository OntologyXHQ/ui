import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import process from 'node:process';
import {
  attachRuntimeDiagnostics,
  launchSystemBrowser,
  repoRoot,
  routeUrl,
  startStudioPreview,
} from './browser/harness.mjs';

const args = process.argv.slice(2);
const entryIndex = args.indexOf('--entry');
const focusedEntry = entryIndex >= 0 ? args[entryIndex + 1] : null;
const themeIndex = args.indexOf('--theme');
const theme = themeIndex >= 0 ? args[themeIndex + 1] : 'dark';
const allowedThemes = new Set(['dark', 'light']);
if (!allowedThemes.has(theme)) throw new Error(`Unsupported --theme ${theme}. Use dark or light.`);

const budgets = {
  visibleMs: 7_000,
  frameP95Ms: 66.7,
  longTaskTotalMs: 750,
  domNodes: 5_000,
};
const frameSampling = {
  warmupFrames: 2,
  sampleFrames: 20,
  percentile: 0.95,
};

const catalogPath = path.join(
  repoRoot,
  'apps/ui-studio/src/catalog/generated/catalog.generated.json',
);
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const entries = focusedEntry ? catalog.filter((entry) => entry.id === focusedEntry) : catalog;
if (!entries.length) throw new Error(`No catalog entry matched ${JSON.stringify(focusedEntry)}.`);

const artifactRoot = path.join(repoRoot, 'artifacts/visual-performance');
const screenshotRoot = path.join(artifactRoot, 'screenshots', theme);
await rm(screenshotRoot, { recursive: true, force: true });
await mkdir(screenshotRoot, { recursive: true });

const preview = await startStudioPreview();
const { browser, source: browserSource } = await launchSystemBrowser();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: theme,
});
const page = await context.newPage();
const diagnostics = attachRuntimeDiagnostics(page);
await page.addInitScript(() => {
  globalThis.__oxsVisualLongTasks = [];
  const Observer = globalThis.PerformanceObserver;
  if (!Observer) return;
  try {
    const observer = new Observer((list) => {
      for (const entry of list.getEntries()) {
        globalThis.__oxsVisualLongTasks.push({
          duration: entry.duration,
          startTime: entry.startTime,
        });
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  } catch {
    // Long-task timing is optional; frame sampling remains authoritative when unavailable.
  }
});

const results = [];
const violations = [];
try {
  const warmEntry = entries[0].id === 'Button' ? 'Accordion' : 'Button';
  const warmUrl = routeUrl(preview.baseUrl, {
    entry: warmEntry,
    tab: 'overview',
    theme,
    motion: 'reduced',
    density: 'comfortable',
    dir: 'ltr',
    viewport: 'desktop',
    container: 'wide',
  });
  await page.goto(warmUrl, { waitUntil: 'networkidle' });
  await page.locator('.ui-studio-shell').waitFor({ state: 'visible' });

  for (const [index, entry] of entries.entries()) {
    const url = routeUrl(preview.baseUrl, {
      entry: entry.id,
      tab: 'overview',
      theme,
      motion: 'reduced',
      density: 'comfortable',
      dir: 'ltr',
      viewport: 'desktop',
      container: 'wide',
    });
    const started = performance.now();
    await page.evaluate((nextUrl) => {
      globalThis.__oxsVisualLongTasks = [];
      history.pushState(null, '', nextUrl);
      dispatchEvent(new PopStateEvent('popstate'));
    }, url);
    const workbench = page.locator(`[data-studio-entry="${entry.id}"]`);
    await workbench.waitFor({ state: 'visible', timeout: budgets.visibleMs });
    const componentPreview = workbench.locator('.ui-studio-component-preview').first();
    await componentPreview.waitFor({ state: 'visible', timeout: budgets.visibleMs });
    await componentPreview
      .getByText('Loading dedicated preview…', { exact: true })
      .waitFor({ state: 'hidden', timeout: budgets.visibleMs });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const visibleMs = performance.now() - started;

    const metrics = await page.evaluate(async (sampling) => {
      for (let index = 0; index < sampling.warmupFrames; index += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      const intervals = [];
      let previous = performance.now();
      for (let index = 0; index < sampling.sampleFrames; index += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const now = performance.now();
        intervals.push(now - previous);
        previous = now;
      }
      const sorted = [...intervals].sort((a, b) => a - b);
      const percentileIndex = Math.min(
        sorted.length - 1,
        Math.max(0, Math.ceil(sorted.length * sampling.percentile) - 1),
      );
      const frameP95Ms = sorted[percentileIndex] ?? 0;
      const root = document.querySelector('[data-studio-entry]');
      const preview = root?.querySelector('.ui-studio-component-preview');
      const longTasks = globalThis.__oxsVisualLongTasks ?? [];
      return {
        frameP95Ms,
        frameMaxMs: Math.max(...intervals, 0),
        frameSampleCount: intervals.length,
        domNodes: root?.querySelectorAll('*').length ?? 0,
        previewNodes: preview?.querySelectorAll('*').length ?? 0,
        longTaskCount: longTasks.length,
        longTaskTotalMs: longTasks.reduce((total, task) => total + task.duration, 0),
      };
    }, frameSampling);

    const screenshotPath = path.join(screenshotRoot, `${entry.id}.png`);
    await componentPreview.screenshot({ path: screenshotPath, animations: 'disabled' });
    const screenshot = await readFile(screenshotPath);
    const screenshotSha256 = createHash('sha256').update(screenshot).digest('hex');
    const box = await componentPreview.boundingBox();
    assert(box && box.width > 0 && box.height > 0, `${entry.id} preview has no visible geometry.`);

    const entryViolations = [];
    if (visibleMs > budgets.visibleMs)
      entryViolations.push(`visible ${visibleMs.toFixed(0)}ms > ${budgets.visibleMs}ms`);
    if (metrics.frameP95Ms > budgets.frameP95Ms)
      entryViolations.push(
        `frame p95 ${metrics.frameP95Ms.toFixed(1)}ms > ${budgets.frameP95Ms}ms`,
      );
    if (metrics.longTaskTotalMs > budgets.longTaskTotalMs)
      entryViolations.push(
        `long tasks ${metrics.longTaskTotalMs.toFixed(1)}ms > ${budgets.longTaskTotalMs}ms`,
      );
    if (metrics.domNodes > budgets.domNodes)
      entryViolations.push(`DOM nodes ${metrics.domNodes} > ${budgets.domNodes}`);
    if (entryViolations.length) violations.push(`${entry.id}: ${entryViolations.join('; ')}`);

    results.push({
      id: entry.id,
      exportName: entry.exportName,
      visibleMs: Number(visibleMs.toFixed(1)),
      ...Object.fromEntries(
        Object.entries(metrics).map(([key, value]) => [
          key,
          typeof value === 'number' ? Number(value.toFixed(1)) : value,
        ]),
      ),
      width: Math.round(box.width),
      height: Math.round(box.height),
      screenshot: path.relative(repoRoot, screenshotPath),
      screenshotSha256,
      passed: entryViolations.length === 0,
    });
    process.stdout.write(
      `Visual/perf ${index + 1}/${entries.length}: ${entry.exportName} ${entryViolations.length ? 'FAILED' : 'passed'}\n`,
    );
  }
  diagnostics.assertClean('visual/performance capture');
} finally {
  await page.close().catch(() => {});
  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await preview.stop().catch(() => {});
}

const sortedVisible = results.map((entry) => entry.visibleMs).sort((a, b) => a - b);
const p95 =
  sortedVisible[Math.min(sortedVisible.length - 1, Math.floor(sortedVisible.length * 0.95))] ?? 0;
const report = {
  schema: 1,
  createdAt: new Date().toISOString(),
  browser: browserSource,
  theme,
  canonicalEnvironment: {
    direction: 'ltr',
    density: 'comfortable',
    motion: 'reduced',
    viewport: 'desktop',
    container: 'wide',
  },
  budgets,
  frameSampling,
  summary: {
    entries: results.length,
    passed: results.filter((entry) => entry.passed).length,
    failed: violations.length,
    visibleP95Ms: p95,
    screenshots: results.length,
  },
  violations,
  results,
};
await mkdir(artifactRoot, { recursive: true });
await writeFile(path.join(artifactRoot, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`);

if (violations.length) {
  console.error('Visual/performance certification failed:');
  for (const violation of violations) console.error(` - ${violation}`);
  console.error(`Evidence: ${path.join(artifactRoot, 'latest.json')}`);
  process.exit(1);
}
console.log(
  `Visual/performance certification passed: ${results.length} component screenshot(s) · visible p95 ${p95.toFixed(1)}ms · conservative frame/long-task/DOM budgets.`,
);
console.log(`Evidence: ${path.join(artifactRoot, 'latest.json')}`);
