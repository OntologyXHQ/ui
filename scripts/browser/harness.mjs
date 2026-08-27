import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
export const axeSourcePath = require.resolve('axe-core/axe.min.js');

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(scriptDir, '../..');

const IGNORED_FINGERPRINT_SEGMENTS = new Set([
  '.git',
  'node_modules',
  'artifacts',
  'dist',
  '.vite',
  '.cache',
  '.pnpm-store',
]);

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close(() =>
          reject(new Error('Could not allocate a local browser-acceptance port.')),
        );
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForUrl(url, child, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`Studio preview exited before becoming ready (status ${child.exitCode}).`);
    }
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status >= 200 && response.status < 500) return;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(
    `Studio preview did not become ready at ${url}: ${lastError?.message ?? 'timeout'}`,
  );
}

export async function startStudioPreview() {
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const output = [];
  const child = spawn(
    'pnpm',
    [
      '--filter',
      '@ontologyx/ui-studio',
      'exec',
      'vite',
      'preview',
      '--host',
      '127.0.0.1',
      '--port',
      String(port),
      '--strictPort',
    ],
    {
      cwd: repoRoot,
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  child.stdout.on('data', (chunk) => output.push(String(chunk)));
  child.stderr.on('data', (chunk) => output.push(String(chunk)));

  try {
    await waitForUrl(`${baseUrl}/`, child);
  } catch (error) {
    child.kill('SIGTERM');
    throw new Error(`${error.message}\n${output.join('').trim()}`);
  }

  return {
    baseUrl,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill('SIGTERM');
      await Promise.race([
        new Promise((resolve) => child.once('exit', resolve)),
        sleep(1_500).then(() => {
          if (child.exitCode === null) child.kill('SIGKILL');
        }),
      ]);
    },
  };
}

function executableExists(candidate) {
  if (!candidate) return false;
  if (candidate.includes(path.sep) || candidate.includes('/')) return existsSync(candidate);
  const command = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(command, [candidate], { stdio: 'ignore' }).status === 0;
}

function platformBrowserCandidates() {
  if (process.platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  if (process.platform === 'win32') {
    const roots = [
      process.env.PROGRAMFILES,
      process.env['PROGRAMFILES(X86)'],
      process.env.LOCALAPPDATA,
    ].filter(Boolean);
    return roots.flatMap((root) => [
      path.join(root, 'Google/Chrome/Application/chrome.exe'),
      path.join(root, 'Chromium/Application/chrome.exe'),
      path.join(root, 'Microsoft/Edge/Application/msedge.exe'),
    ]);
  }
  return [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'google-chrome-stable',
    'google-chrome',
    'chromium',
    'chromium-browser',
  ];
}

export async function launchSystemBrowser() {
  const common = {
    headless: true,
    args: process.getuid?.() === 0 ? ['--no-sandbox'] : [],
  };
  const attempts = [];
  const explicit = process.env.ONTOLOGYX_UI_BROWSER?.trim();

  if (explicit) {
    try {
      const browser = await chromium.launch({ ...common, executablePath: explicit });
      return { browser, source: `ONTOLOGYX_UI_BROWSER=${explicit}` };
    } catch (error) {
      attempts.push(`${explicit}: ${error.message}`);
    }
  } else {
    try {
      const browser = await chromium.launch({ ...common, channel: 'chrome' });
      return { browser, source: 'system Google Chrome stable channel' };
    } catch (error) {
      attempts.push(`chrome channel: ${error.message}`);
    }
  }

  for (const candidate of platformBrowserCandidates()) {
    if (!executableExists(candidate)) continue;
    try {
      const browser = await chromium.launch({ ...common, executablePath: candidate });
      return { browser, source: candidate };
    } catch (error) {
      attempts.push(`${candidate}: ${error.message}`);
    }
  }

  throw new Error(
    [
      'G6 requires an installed Chromium-family browser; no Playwright browser download is used.',
      'Install Google Chrome/Chromium or set ONTOLOGYX_UI_BROWSER=/absolute/path/to/browser.',
      ...attempts.slice(-4).map((attempt) => ` - ${attempt}`),
    ].join('\n'),
  );
}

export function routeUrl(
  baseUrl,
  {
    entry = 'Button',
    tab = 'overview',
    theme = 'dark',
    dir = 'ltr',
    density = 'comfortable',
    motion = 'full',
    modality = 'mouse',
    pointer = 'fine',
    viewport = 'fit',
    container = 'auto',
    insets = 'none',
    example = null,
    state = null,
  } = {},
) {
  const url = new URL('/', baseUrl);
  const values = {
    'ui-kit': '1',
    view: 'catalog',
    entry,
    tab,
    theme,
    dir,
    density,
    motion,
    modality,
    pointer,
    viewport,
    container,
    insets,
    example,
    state,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value !== null && value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  return url.toString();
}

export async function assertNoFocusedIsolationConflict(page, label = 'browser surface') {
  const conflict = await page.evaluate(() => {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return null;
    const isolated = active.closest('[aria-hidden="true"], [inert]');
    if (!(isolated instanceof HTMLElement)) return null;

    const describe = (element) => ({
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      className: element.className || null,
      role: element.getAttribute('role'),
      ariaHidden: element.getAttribute('aria-hidden'),
      inert: element.hasAttribute('inert'),
    });

    return {
      focused: describe(active),
      isolatedAncestor: describe(isolated),
    };
  });

  assert.equal(
    conflict,
    null,
    `${label} retained focus inside an aria-hidden/inert ancestor: ${JSON.stringify(conflict)}`,
  );
}

export function attachRuntimeDiagnostics(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const type = message.type();
    const text = message.text();
    const accessibilityWarning =
      type === 'warning' &&
      /blocked aria-hidden|descendant retained focus|focus must not be hidden/i.test(text);
    if (type !== 'error' && !accessibilityWarning) return;
    const location = message.location();
    const source = location.url
      ? ` @ ${location.url}${Number.isInteger(location.lineNumber) ? `:${location.lineNumber + 1}` : ''}`
      : '';
    errors.push(`console.${type}: ${text}${source}`);
  });
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
  });
  page.on('requestfailed', (request) => {
    errors.push(
      `requestfailed: ${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown error'})`,
    );
  });
  return {
    assertClean(label) {
      assert.equal(
        errors.length,
        0,
        `${label} produced browser runtime errors:\n${errors.join('\n')}`,
      );
    },
  };
}

export async function assertActiveCatalogDeepTarget(target, label = 'Studio deep link') {
  await target.waitFor({ state: 'attached' });
  const state = await target.evaluate((element) => {
    const panel = element.closest('[role="tabpanel"]');
    return {
      active: element.getAttribute('data-active'),
      panelHidden: panel instanceof HTMLElement ? panel.hidden : null,
    };
  });
  assert.equal(state.active, 'true', `${label} was attached but not marked active.`);
  assert.notEqual(state.panelHidden, true, `${label} remained inside a hidden tab panel.`);
  return state;
}

export async function gotoCatalog(page, baseUrl, options = {}) {
  const url = routeUrl(baseUrl, options);
  await page.goto(url, { waitUntil: 'networkidle' });
  const entry = options.entry ?? 'Button';
  const tab = options.tab ?? 'overview';
  const workbench = page.locator(`[data-studio-entry="${entry}"][data-studio-tab="${tab}"]`);
  await workbench.waitFor({ state: 'visible' });
  const route = new URL(page.url()).searchParams;
  assert.equal(route.get('entry'), entry, 'Studio route did not preserve the requested entry.');
  assert.equal(route.get('tab'), tab, 'Studio route did not preserve the requested tab.');
  let requestedExample = null;
  if (options.example) {
    assert.equal(
      route.get('example'),
      options.example,
      'Studio route did not preserve the requested example.',
    );
    requestedExample = workbench.locator(`#example-${options.example}`);
    await requestedExample.first().waitFor({ state: 'attached' });
    assert.equal(
      await requestedExample.count(),
      1,
      `Studio example deep link ${options.example} did not resolve to exactly one canonical fixture inside ${entry}.`,
    );
    await assertActiveCatalogDeepTarget(
      requestedExample,
      `Studio example deep link ${options.example}`,
    );
  }
  if (options.state) {
    assert.equal(
      route.get('state'),
      options.state,
      'Studio route did not preserve the requested playground state.',
    );
  }
  // Stacked Studio deliberately mounts overview, examples, state samples and playground together.
  // Example journeys therefore receive the exact canonical fixture rather than the whole workbench,
  // preventing duplicated accessible names in adjacent previews from weakening or confusing G6 evidence.
  return requestedExample ?? workbench;
}

export async function gotoSemanticWorkbench(page, baseUrl, options = {}) {
  const url = new URL(routeUrl(baseUrl, options));
  url.searchParams.set('view', 'semantic');
  for (const key of ['entry', 'tab', 'example', 'state']) url.searchParams.delete(key);
  await page.goto(url.toString(), { waitUntil: 'networkidle' });
  const workbench = page.locator('[data-studio-semantic-workbench]');
  await workbench.waitFor({ state: 'visible' });
  const route = new URL(page.url()).searchParams;
  assert.equal(route.get('view'), 'semantic', 'Studio route did not preserve semantic view.');
  return workbench;
}

export async function waitForStudioExampleControl(
  page,
  locator,
  label,
  { timeoutMs = 8_000 } = {},
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await locator.isVisible().catch(() => false)) return;
    const failure = page
      .locator('.ui-catalog-error')
      .filter({ hasText: 'Isolated example failure' })
      .first();
    if (await failure.isVisible().catch(() => false)) {
      const detail = (await failure.innerText()).replace(/\s+/g, ' ').trim();
      throw new Error(
        `${label} did not render because its public-package Studio example failed: ${detail}`,
      );
    }
    await sleep(50);
  }
  const route = new URL(page.url());
  throw new Error(
    `${label} did not become visible within ${timeoutMs}ms on Studio route entry=${route.searchParams.get('entry')} tab=${route.searchParams.get('tab')} example=${route.searchParams.get('example') ?? '<none>'}.`,
  );
}

export async function assertPublicUiStylesLoaded(page) {
  const root = page.locator('.ui-root').first();
  await root.waitFor({ state: 'attached' });
  const tokens = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      touchTargetMin: style.getPropertyValue('--oxs-touch-target-min').trim(),
      touchTargetCoarse: style.getPropertyValue('--oxs-touch-target-coarse').trim(),
      fontSans: style.getPropertyValue('--oxs-font-sans').trim(),
    };
  });
  assert.ok(
    tokens.touchTargetMin && tokens.touchTargetCoarse && tokens.fontSans,
    'Public @ontologyx/ui stylesheet is not active in the browser host.',
  );
  return tokens;
}

export async function assertEnvironment(page, expected) {
  const root = page.locator('.ui-root').first();
  // Environment projection is an attribute/style contract, not a geometry contract.
  // The caller proves visible product content separately; requiring visibility here
  // makes adversarial projection fixtures fail for the wrong reason when the root
  // is intentionally empty. Attachment is the correct prerequisite for reading it.
  await root.waitFor({ state: 'attached' });
  if (expected.adaptiveBand !== undefined) {
    await page.waitForFunction(
      (band) => document.querySelector('.ui-root')?.getAttribute('data-oxs-adaptive-band') === band,
      expected.adaptiveBand,
    );
  }
  const actual = await root.evaluate((element) => {
    const style = getComputedStyle(element);
    const insetProbe = document.createElement('div');
    insetProbe.style.cssText = [
      'position:absolute',
      'visibility:hidden',
      'pointer-events:none',
      'padding-block-start:var(--oxs-environment-inset-block-start)',
      'padding-inline-end:var(--oxs-environment-inset-inline-end)',
      'padding-block-end:var(--oxs-environment-inset-block-end)',
      'padding-inline-start:var(--oxs-environment-inset-inline-start)',
    ].join(';');
    element.append(insetProbe);
    const insetStyle = getComputedStyle(insetProbe);
    const environmentInsets = {
      insetBlockStart: insetStyle.paddingBlockStart,
      insetInlineEnd: insetStyle.paddingInlineEnd,
      insetBlockEnd: insetStyle.paddingBlockEnd,
      insetInlineStart: insetStyle.paddingInlineStart,
    };
    insetProbe.remove();
    return {
      dir: element.getAttribute('dir'),
      theme: element.getAttribute('data-oxs-theme'),
      colorScheme: element.getAttribute('data-oxs-color-scheme'),
      colorSchemePreference: element.getAttribute('data-oxs-color-scheme-preference'),
      density: element.getAttribute('data-oxs-density'),
      densityPreference: element.getAttribute('data-oxs-density-preference'),
      directionPreference: element.getAttribute('data-oxs-direction-preference'),
      motion: element.getAttribute('data-oxs-motion'),
      motionPreference: element.getAttribute('data-oxs-motion-preference'),
      modality: element.getAttribute('data-oxs-modality'),
      modalityPreference: element.getAttribute('data-oxs-modality-preference'),
      pointer: element.getAttribute('data-oxs-pointer-precision'),
      pointerPreference: element.getAttribute('data-oxs-pointer-precision-preference'),
      adaptiveBand: element.getAttribute('data-oxs-adaptive-band'),
      safeBlockStart: style.getPropertyValue('--oxs-safe-block-start').trim(),
      safeInlineEnd: style.getPropertyValue('--oxs-safe-inline-end').trim(),
      safeBlockEnd: style.getPropertyValue('--oxs-safe-block-end').trim(),
      safeInlineStart: style.getPropertyValue('--oxs-safe-inline-start').trim(),
      occlusionBlockStart: style.getPropertyValue('--oxs-occlusion-block-start').trim(),
      occlusionInlineEnd: style.getPropertyValue('--oxs-occlusion-inline-end').trim(),
      occlusionBlockEnd: style.getPropertyValue('--oxs-occlusion-block-end').trim(),
      occlusionInlineStart: style.getPropertyValue('--oxs-occlusion-inline-start').trim(),
      ...environmentInsets,
    };
  });
  const viewport = await page.locator('.ui-studio-viewport').evaluate((element) => ({
    preset: element.getAttribute('data-viewport'),
    width: element.style.getPropertyValue('--ui-studio-viewport-width').trim(),
    containerWidth: element.style.getPropertyValue('--ui-studio-content-width').trim(),
  }));

  for (const key of [
    'dir',
    'theme',
    'colorScheme',
    'colorSchemePreference',
    'density',
    'densityPreference',
    'directionPreference',
    'motion',
    'motionPreference',
    'modality',
    'modalityPreference',
    'pointer',
    'pointerPreference',
    'adaptiveBand',
  ]) {
    if (expected[key] !== undefined)
      assert.equal(actual[key], expected[key], `Environment mismatch for ${key}.`);
  }
  if (expected.viewport !== undefined)
    assert.equal(viewport.preset, expected.viewport, 'Viewport preset mismatch.');
  if (expected.viewportWidth !== undefined)
    assert.equal(viewport.width, expected.viewportWidth, 'Viewport width projection mismatch.');
  if (expected.containerWidth !== undefined)
    assert.equal(
      viewport.containerWidth,
      expected.containerWidth,
      'Container width projection mismatch.',
    );
  for (const [label, projection] of [
    ['Safe-area', expected.safeArea],
    ['Occlusion', expected.occlusion],
    ['Environment inset', expected.environmentInset],
  ]) {
    if (!projection) continue;
    for (const [key, value] of Object.entries(projection)) {
      assert.equal(actual[key], value, `${label} projection mismatch for ${key}.`);
    }
  }
  return { actual, viewport };
}

export async function runAxe(page, label) {
  await page.addScriptTag({ path: axeSourcePath });
  const result = await page.evaluate(async () => {
    const axe = globalThis.axe;
    if (!axe) throw new Error('axe-core did not attach to the document.');
    return await axe.run(document, {
      resultTypes: ['violations', 'incomplete'],
    });
  });
  const blockers = result.violations.filter(
    (violation) => violation.impact === 'serious' || violation.impact === 'critical',
  );
  if (blockers.length) {
    const detail = blockers
      .map((violation) => {
        const targets = violation.nodes
          .slice(0, 4)
          .map((node) => node.target.join(' '))
          .join(', ');
        return `${violation.impact} ${violation.id}: ${violation.help} [${targets}]`;
      })
      .join('\n');
    throw new Error(
      `${label} has ${blockers.length} serious/critical axe violation(s):\n${detail}`,
    );
  }
  return {
    violations: result.violations.length,
    incomplete: result.incomplete.length,
    seriousCritical: blockers.length,
  };
}

export async function focusByTab(page, locator, { maxSteps = 120 } = {}) {
  await locator.waitFor({ state: 'visible' });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.body.tabIndex = -1;
    document.body.focus();
  });
  for (let index = 0; index < maxSteps; index += 1) {
    await page.keyboard.press('Tab');
    if (await locator.evaluate((element) => document.activeElement === element)) return index + 1;
  }
  throw new Error(
    `Element was not reachable in sequential keyboard navigation after ${maxSteps} Tab presses.`,
  );
}

export async function assertVisibleFocus(locator, label) {
  const state = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      active: document.activeElement === element,
      focusVisible: element.matches(':focus-visible'),
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow,
    };
  });
  assert.equal(state.active, true, `${label} is not the active element.`);
  assert.equal(
    state.focusVisible,
    true,
    `${label} does not match :focus-visible after keyboard navigation.`,
  );
  const outlineVisible =
    state.outlineStyle !== 'none' &&
    Number.parseFloat(state.outlineWidth) > 0 &&
    state.outlineColor !== 'transparent';
  const shadowVisible = state.boxShadow !== 'none' && !state.boxShadow.includes('rgba(0, 0, 0, 0)');
  assert.equal(
    outlineVisible || shadowVisible,
    true,
    `${label} has no observable focus indicator.`,
  );
}

export async function assertNoGlobalHorizontalOverflow(page, label, tolerance = 1) {
  const geometry = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      viewport: window.innerWidth,
      documentClient: doc.clientWidth,
      documentScroll: doc.scrollWidth,
      bodyScroll: body.scrollWidth,
    };
  });
  const overflow = Math.max(geometry.documentScroll, geometry.bodyScroll) - geometry.documentClient;
  assert.ok(
    overflow <= tolerance,
    `${label} has ${overflow}px of page-level horizontal overflow at ${geometry.viewport}px viewport width.`,
  );
  return geometry;
}

export async function assertWithinViewport(locator, label, tolerance = 1) {
  const result = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      width: rect.width,
      viewport: window.innerWidth,
    };
  });
  assert.ok(
    result.left >= -tolerance,
    `${label} starts outside the inline viewport (${result.left}px).`,
  );
  assert.ok(
    result.right <= result.viewport + tolerance,
    `${label} escapes the inline viewport (${result.right}px > ${result.viewport}px).`,
  );
}

export async function assertMinimumBlockSize(locator, minimumPx, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label} has no browser geometry.`);
  assert.ok(
    box.height >= minimumPx,
    `${label} collapsed below its ${minimumPx}px minimum browser block-size budget (${Math.round(box.height)}px).`,
  );
  return box.height;
}

export async function performPointerCancel(page, locator) {
  const box = await locator.boundingBox();
  assert.ok(box, 'Pointer-cancellation target has no browser geometry.');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const viewport = page.viewportSize();
  assert.ok(viewport, 'Pointer-cancellation page has no deterministic viewport.');
  const outsideX = box.x > viewport.width / 2 ? 2 : viewport.width - 2;
  const outsideY = box.y > viewport.height / 2 ? 2 : viewport.height - 2;
  await page.mouse.move(outsideX, outsideY);
  await page.mouse.up();
}

export async function performTouchLongPress(
  page,
  locator,
  activationLocator,
  { activationBudgetMs = 1000, releaseSettleMs = 100 } = {},
) {
  await locator.scrollIntoViewIfNeeded();
  // Intersection visibility is not hit-test visibility: sticky/floating UI can fully
  // intersect a target while covering its center. Center the actual target in every
  // scroll container before deriving CDP coordinates, then prove ownership below.
  await locator.evaluate((target) => {
    target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'auto' });
  });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }),
  );

  const box = await locator.boundingBox();
  assert.ok(box, 'Long-press target has no browser geometry.');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const viewport = page.viewportSize();
  assert.ok(viewport, 'Long-press page has no deterministic viewport.');
  assert.ok(
    x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height,
    `Long-press target center is outside the browser viewport (${Math.round(x)}, ${Math.round(y)} within ${viewport.width}x${viewport.height}).`,
  );
  const hitTest = await locator.evaluate(
    (target, point) => {
      const hit = document.elementFromPoint(point.x, point.y);
      const describe = (element) => {
        if (!(element instanceof Element)) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : null,
          role: element.getAttribute('role'),
          ariaLabel: element.getAttribute('aria-label'),
          pointerEvents: style.pointerEvents,
          position: style.position,
          zIndex: style.zIndex,
          rect: {
            x: Math.round(rect.x),
            y: Math.round(rect.y),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
        };
      };
      return {
        owned: hit === target || (hit instanceof Node && target.contains(hit)),
        target: describe(target),
        hit: describe(hit),
      };
    },
    { x, y },
  );
  assert.equal(
    hitTest.owned,
    true,
    `Long-press target center is occluded after deterministic centering. target=${JSON.stringify(hitTest.target)} hit=${JSON.stringify(hitTest.hit)}`,
  );
  const session = await page.context().newCDPSession(page);
  const startedAt = Date.now();
  let touchStarted = false;
  try {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y, radiusX: 2, radiusY: 2, force: 1, id: 1 }],
    });
    touchStarted = true;
    await activationLocator.waitFor({ state: 'visible', timeout: activationBudgetMs });
    const activationMs = Date.now() - startedAt;
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    touchStarted = false;
    await page.waitForTimeout(releaseSettleMs);
    assert.equal(
      await activationLocator.isVisible(),
      true,
      'Long-press activation disappeared after the touch pointer was released.',
    );
    return activationMs;
  } finally {
    if (touchStarted) {
      await session
        .send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        .catch(() => {});
    }
    await session.detach();
  }
}

export async function fingerprintWorkspace() {
  const hash = createHash('sha256');
  async function walk(directory, relative = '') {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      if (entry.isDirectory() && IGNORED_FINGERPRINT_SEGMENTS.has(entry.name)) continue;
      const rel = path.posix.join(relative.split(path.sep).join('/'), entry.name);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute, rel);
      } else if (entry.isFile()) {
        hash.update(rel);
        hash.update('\0');
        hash.update(await readFile(absolute));
        hash.update('\0');
      }
    }
  }
  await walk(repoRoot);
  return hash.digest('hex');
}

export async function gitHead() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

export async function writeEvidence(evidence) {
  const directory = path.join(repoRoot, 'artifacts/browser-acceptance');
  await mkdir(directory, { recursive: true });
  const timestamp = evidence.finishedAt.replace(/[:.]/g, '').replace(/-/g, '');
  const versioned = path.join(directory, `browser-acceptance-${timestamp}.json`);
  const latest = path.join(directory, 'latest.json');
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  await writeFile(versioned, serialized);
  await writeFile(latest, serialized);
  return { versioned, latest };
}

export async function screenshotFailure(page, scenarioId) {
  const directory = path.join(repoRoot, 'artifacts/browser-acceptance/failures');
  await mkdir(directory, { recursive: true });
  const file = path.join(directory, `${scenarioId}.png`);
  await page.screenshot({ path: file, fullPage: true }).catch(() => undefined);
  return file;
}
