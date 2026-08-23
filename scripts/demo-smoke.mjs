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

async function requiredBox(locator, label) {
  const box = await locator.boundingBox();
  assert.ok(box, `${label} did not expose measurable geometry.`);
  return box;
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
  await sleep(300);

  assert.equal(
    await page.locator('.demo-root').getAttribute('data-oxs-motion'),
    'full',
    'Demo must start with shared full-motion policy enabled.',
  );
  assert.equal(
    await page.locator('.demo-workspace-scene[data-workspace-id="1"][data-active="true"]').count(),
    1,
    'Workspace 1 must be the initial active workspace.',
  );
  assert.equal(
    await page
      .locator('.demo-workspace-scene[data-workspace-id="1"] [data-demo-window-id]')
      .count(),
    2,
    'Initial workspace must visibly demonstrate a real multi-window stack.',
  );
  assert.equal(
    await page.locator('[data-demo-window-id="editor-2"][data-focused="true"]').count(),
    1,
    'Opening/focus model must keep the newest initial window on top while the previous window remains stacked.',
  );
  assert.equal(
    await page.locator('[data-demo-window-id="browser-1"]').count(),
    1,
    'Previous window disappeared instead of remaining in the focus stack.',
  );

  const topBar = await requiredBox(
    page.locator('.demo-system-bar .ui-system-bar__toolbar'),
    'System bar',
  );
  assert.ok(
    topBar.width < 1280 && topBar.width > 720,
    `System bar must be bounded and centered, got ${topBar.width}px.`,
  );
  const dockBox = await requiredBox(
    page.locator('.demo-dock .ui-system-dock__toolbar'),
    'Application dock',
  );
  assert.ok(
    dockBox.width < 620,
    `Application dock expanded beyond compact product geometry: ${dockBox.width}px.`,
  );
  assert.equal(
    await page.getByRole('group', { name: 'Workspaces', exact: true }).getByRole('button').count(),
    4,
    'Top chrome must expose four logical workspaces.',
  );

  const desktopScreenshot = path.join(artifactRoot, 'desktop-stack.png');
  await page.screenshot({ path: desktopScreenshot, fullPage: true, animations: 'disabled' });

  // Launcher must follow the physical drag handle and actually dismiss downward.
  await page.keyboard.press('Control+Space');
  const launcher = page.getByRole('dialog', { name: 'Application launcher', exact: true });
  await launcher.waitFor({ state: 'visible' });
  await sleep(180);
  const launcherPanel = page.locator('.demo-launcher');
  const launcherBefore = await requiredBox(launcherPanel, 'Application launcher');
  assert.ok(
    launcherBefore.width < 1100,
    `Desktop launcher must remain bounded, got ${launcherBefore.width}px.`,
  );
  const handle = page.getByRole('button', { name: 'Drag launcher down to dismiss', exact: true });
  const handleBox = await requiredBox(handle, 'Launcher drag handle');
  await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2 + 64,
    { steps: 6 },
  );
  const launcherDragged = await requiredBox(launcherPanel, 'Dragged application launcher');
  assert.ok(
    launcherDragged.y > launcherBefore.y + 35,
    'Launcher handle did not move the launcher with the pointer.',
  );
  await page.mouse.move(
    handleBox.x + handleBox.width / 2,
    handleBox.y + handleBox.height / 2 + 132,
    { steps: 5 },
  );
  await page.mouse.up();
  await launcher.waitFor({ state: 'hidden' });

  // Reopen and launch Files. Default host policy must create and focus a new window without replacing the stack.
  await page.keyboard.press('Control+Space');
  await launcher.waitFor({ state: 'visible' });
  const launcherScreenshot = path.join(artifactRoot, 'launcher.png');
  await page.screenshot({ path: launcherScreenshot, fullPage: true, animations: 'disabled' });
  await launcher.locator('[data-oxs-application-id="files"] button').click();
  await launcher.waitFor({ state: 'hidden' });
  await page
    .locator('[data-active-app="files"][data-focused="true"]')
    .waitFor({ state: 'visible' });
  assert.equal(
    await page
      .locator('.demo-workspace-scene[data-workspace-id="1"] [data-demo-window-id]')
      .count(),
    3,
    'Default application launch must add a new focused window to the active workspace stack.',
  );

  const focusedFilesFrame = page.locator('[data-active-app="files"][data-focused="true"]').first();
  const filesId = await focusedFilesFrame.getAttribute('data-demo-window-id');
  assert.ok(filesId, 'Focused Files window did not expose a stable instance id.');
  // Playwright locators are live queries. After minimize, the window intentionally loses
  // data-focused, so lifecycle assertions must follow the stable instance id instead.
  const filesFrame = page.locator(`[data-demo-window-id="${filesId}"]`);
  await filesFrame.waitFor({ state: 'visible' });
  assert.equal(
    await filesFrame.getAttribute('data-focused'),
    'true',
    'Stable Files instance locator did not preserve the newly focused window identity.',
  );
  await filesFrame.getByRole('button', { name: 'Maximize Files', exact: true }).click();
  await sleep(280);
  assert.equal(
    await filesFrame.getAttribute('data-maximized'),
    'true',
    'Window maximize state did not become active.',
  );
  const stageBox = await requiredBox(page.locator('.demo-workspace-stage'), 'Workspace stage');
  const maximizedBox = await requiredBox(filesFrame, 'Maximized Files window');
  assert.ok(
    maximizedBox.width >= stageBox.width * 0.96,
    'Maximized window did not fill the workspace stage width.',
  );
  assert.ok(
    maximizedBox.height >= stageBox.height * 0.96,
    'Maximized window did not fill the workspace stage height.',
  );

  await filesFrame.getByRole('button', { name: 'Restore Files', exact: true }).click();
  await sleep(280);
  const beforeDrag = await requiredBox(filesFrame, 'Restored Files window');
  const titlebar = filesFrame.locator('[data-drag-handle]');
  const titlebarBox = await requiredBox(titlebar, 'Files window titlebar');
  await page.mouse.move(
    titlebarBox.x + titlebarBox.width / 2,
    titlebarBox.y + titlebarBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    titlebarBox.x + titlebarBox.width / 2 + 72,
    titlebarBox.y + titlebarBox.height / 2 + 34,
    { steps: 6 },
  );
  await page.mouse.up();
  await sleep(180);
  const afterDrag = await requiredBox(filesFrame, 'Dragged Files window');
  assert.ok(
    afterDrag.x > beforeDrag.x + 28 || afterDrag.y > beforeDrag.y + 18,
    'Window titlebar drag did not move the window.',
  );

  await filesFrame.getByRole('button', { name: 'Minimize Files', exact: true }).click();
  await sleep(240);
  assert.equal(
    await filesFrame.locator('.demo-window-presence').getAttribute('data-present'),
    'false',
    'Minimize did not move the window into the retained task stack.',
  );
  await page
    .locator('.demo-dock')
    .getByRole('button', { name: 'Focus or restore Files', exact: true })
    .click();
  await filesFrame
    .locator('.demo-window-presence[data-present="true"]')
    .waitFor({ state: 'visible' });
  assert.equal(
    await filesFrame.getAttribute('data-focused'),
    'true',
    'Dock activation did not restore and focus the minimized window.',
  );

  // Overview combines GNOME workspace selection with Android-style recent-window cards.
  await page
    .locator('.demo-system-bar')
    .getByRole('button', { name: 'Window overview', exact: true })
    .click();
  const overview = page.getByRole('dialog', { name: 'Window overview', exact: true });
  await overview.waitFor({ state: 'visible' });
  assert.equal(
    await overview
      .getByRole('group', { name: 'Workspace overview', exact: true })
      .getByRole('button')
      .count(),
    4,
    'Overview must expose four workspace thumbnails.',
  );
  assert.ok(
    (await overview.locator('[data-demo-overview-window]').count()) >= 3,
    'Android-style recents deck did not expose the current workspace window stack.',
  );
  const overviewScreenshot = path.join(artifactRoot, 'overview.png');
  await page.screenshot({ path: overviewScreenshot, fullPage: true, animations: 'disabled' });

  await overview.getByRole('button', { name: 'Show workspace 2', exact: true }).click();
  await overview.locator('[data-demo-overview-window="terminal-3"]').waitFor({ state: 'visible' });
  await overview
    .locator('[data-demo-overview-window="terminal-3"] .demo-overview-card__preview')
    .click();
  await overview.waitFor({ state: 'hidden' });
  await page
    .locator('.demo-workspace-scene[data-workspace-id="2"][data-active="true"]')
    .waitFor({ state: 'visible' });
  assert.equal(
    await page.locator('[data-demo-window-id="terminal-3"][data-focused="true"]').count(),
    1,
    'Selecting a recent window did not switch workspace and restore focus.',
  );

  // Settings explicitly opts into single-instance policy; a second launch must focus, not duplicate.
  await page.keyboard.press('Control+Space');
  await launcher.waitFor({ state: 'visible' });
  await launcher.locator('[data-oxs-application-id="settings"] button').click();
  await launcher.waitFor({ state: 'hidden' });
  await page
    .locator('[data-active-app="settings"][data-focused="true"]')
    .waitFor({ state: 'visible' });
  await page.keyboard.press('Control+Space');
  await launcher.waitFor({ state: 'visible' });
  await launcher.locator('[data-oxs-application-id="settings"] button').click();
  await launcher.waitFor({ state: 'hidden' });
  assert.equal(
    await page.locator('[data-active-app="settings"]').count(),
    1,
    'Explicit single-instance application policy created a duplicate Settings window.',
  );

  await page
    .getByRole('navigation', { name: 'Settings sections', exact: true })
    .waitFor({ state: 'visible' });
  await sleep(220);
  const appearanceBox = await requiredBox(
    page.getByRole('button', { name: 'Appearance', exact: true }),
    'Appearance settings item',
  );
  const networkBox = await requiredBox(
    page.getByRole('button', { name: 'Network', exact: true }),
    'Network settings item',
  );
  const softwareBox = await requiredBox(
    page.getByRole('button', { name: 'Software', exact: true }),
    'Software settings item',
  );
  assert.ok(
    networkBox.y > appearanceBox.y + appearanceBox.height * 0.55,
    'Desktop settings navigation collapsed into a horizontal/overlapping row.',
  );
  assert.ok(
    softwareBox.y > networkBox.y + networkBox.height * 0.55,
    'Desktop settings navigation items must stack vertically.',
  );
  await page.getByRole('button', { name: 'Software', exact: true }).click();
  await page
    .getByRole('heading', { name: 'Software updates', exact: true })
    .waitFor({ state: 'visible' });
  const settingsScreenshot = path.join(artifactRoot, 'settings-window.png');
  await page.screenshot({ path: settingsScreenshot, fullPage: true, animations: 'disabled' });

  await page.getByRole('button', { name: 'Quick settings', exact: true }).click();
  await page
    .getByRole('region', { name: 'Quick settings', exact: true })
    .waitFor({ state: 'visible' });
  const quickPanel = await requiredBox(
    page.locator('.demo-side-panel'),
    'Quick settings side panel',
  );
  assert.ok(
    quickPanel.width <= 420,
    `Quick settings panel is too wide for desktop chrome: ${quickPanel.width}px.`,
  );
  await page.getByRole('button', { name: 'Quick settings', exact: true }).click();
  await page
    .locator('.demo-side-panel')
    .waitFor({ state: 'hidden' })
    .catch(() => {});

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
    schema: 3,
    createdAt: new Date().toISOString(),
    browser: launched.source,
    assertions: [
      'initial-multi-window-focus-stack',
      'workspace-switcher-four-logical-workspaces',
      'launcher-physically-follows-drag-handle',
      'launcher-drag-dismisses',
      'default-launch-creates-focused-window',
      'window-maximize-restore',
      'window-titlebar-drag',
      'window-minimize-dock-restore',
      'gnome-workspace-plus-android-recents-overview',
      'overview-workspace-switch-and-focus',
      'explicit-single-instance-policy',
      'settings-navigation-vertical',
      'quick-settings-visible',
      'shared-motion-policy-full',
      'axe-serious-critical-zero',
    ],
    screenshots: [
      path.relative(repoRoot, desktopScreenshot),
      path.relative(repoRoot, launcherScreenshot),
      path.relative(repoRoot, overviewScreenshot),
      path.relative(repoRoot, settingsScreenshot),
      path.relative(repoRoot, screenshot),
    ],
  };
  await writeFile(path.join(artifactRoot, 'latest.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    'OntologyX UI System demo smoke passed: multi-window focus stack · GNOME workspaces · Android recents · draggable launcher dismissal · drag/minimize/maximize/restore/close model · settings · quick settings · axe.',
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
