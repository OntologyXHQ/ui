import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  attachRuntimeDiagnostics,
  launchSystemBrowser,
  repoRoot,
  routeUrl,
  startStudioPreview,
} from './browser/harness.mjs';

const sentinelExports = [
  'Text',
  'Icon',
  'Button',
  'TextField',
  'Checkbox',
  'Select',
  'Tabs',
  'TileGrid',
  'Dialog',
  'SystemLauncher',
  'SystemSettingsLayout',
  'SystemKeyboardHost',
];

const profiles = [
  {
    id: 'dark-ltr-comfortable-desktop',
    browserViewport: { width: 1440, height: 1000 },
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    theme: 'dark',
    dir: 'ltr',
    density: 'comfortable',
    motion: 'full',
    modality: 'mouse',
    pointer: 'fine',
    viewport: 'desktop',
    container: 'wide',
    insets: 'none',
    hasTouch: false,
  },
  {
    id: 'light-rtl-compact-phone',
    browserViewport: { width: 520, height: 900 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    theme: 'light',
    dir: 'rtl',
    density: 'compact',
    motion: 'reduced',
    modality: 'touch',
    pointer: 'coarse',
    viewport: 'phone',
    container: 'compact',
    insets: 'gesture',
    hasTouch: true,
  },
  {
    id: 'dark-rtl-comfortable-tablet',
    browserViewport: { width: 980, height: 900 },
    colorScheme: 'dark',
    reducedMotion: 'reduce',
    theme: 'dark',
    dir: 'rtl',
    density: 'comfortable',
    motion: 'reduced',
    modality: 'keyboard',
    pointer: 'fine',
    viewport: 'tablet',
    container: 'content',
    insets: 'notch',
    hasTouch: false,
  },
  {
    id: 'light-ltr-compact-desktop',
    browserViewport: { width: 1440, height: 1000 },
    colorScheme: 'light',
    reducedMotion: 'no-preference',
    theme: 'light',
    dir: 'ltr',
    density: 'compact',
    motion: 'full',
    modality: 'mouse',
    pointer: 'fine',
    viewport: 'desktop',
    container: 'wide',
    insets: 'none',
    hasTouch: false,
  },
];

const catalogPath = path.join(
  repoRoot,
  'apps/ui-studio/src/catalog/generated/catalog.generated.json',
);
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const entries = sentinelExports.map((exportName) => {
  const entry = catalog.find((candidate) => candidate.exportName === exportName);
  assert(entry, `Cross-axis sentinel ${exportName} is missing from the generated catalog.`);
  assert.equal(entry.status, 'accepted', `Cross-axis sentinel ${exportName} is not accepted.`);
  return entry;
});

const artifactRoot = path.join(repoRoot, 'artifacts/cross-axis-visual');
const screenshotRoot = path.join(artifactRoot, 'screenshots');
await rm(screenshotRoot, { recursive: true, force: true });
await mkdir(screenshotRoot, { recursive: true });

const preview = await startStudioPreview();
const { browser, source: browserSource } = await launchSystemBrowser();
const observations = [];
const violations = [];

try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile.browserViewport,
      colorScheme: profile.colorScheme,
      reducedMotion: profile.reducedMotion,
      hasTouch: profile.hasTouch,
    });
    const page = await context.newPage();
    const diagnostics = attachRuntimeDiagnostics(page);
    const profileRoot = path.join(screenshotRoot, profile.id);
    await mkdir(profileRoot, { recursive: true });

    try {
      for (const entry of entries) {
        const url = routeUrl(preview.baseUrl, {
          entry: entry.id,
          tab: 'overview',
          theme: profile.theme,
          dir: profile.dir,
          density: profile.density,
          motion: profile.motion,
          modality: profile.modality,
          pointer: profile.pointer,
          viewport: profile.viewport,
          container: profile.container,
          insets: profile.insets,
        });
        await page.goto(url, { waitUntil: 'networkidle' });

        const studioRoot = page.locator('.ui-studio-root');
        const workbench = page.locator(`[data-studio-entry="${entry.id}"]`);
        const componentPreview = workbench.locator('.ui-studio-component-preview').first();
        await studioRoot.waitFor({ state: 'visible' });
        await workbench.waitFor({ state: 'visible' });
        await componentPreview.waitFor({ state: 'visible' });
        await componentPreview
          .getByText('Loading dedicated preview…', { exact: true })
          .waitFor({ state: 'hidden', timeout: 7_000 });
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );

        const state = await studioRoot.evaluate((element) => {
          const style = getComputedStyle(element);
          const viewport = document.querySelector('.ui-studio-viewport');
          const shell = document.querySelector('.ui-studio-shell');
          return {
            theme: element.getAttribute('data-oxs-theme'),
            colorScheme: element.getAttribute('data-oxs-color-scheme'),
            direction: element.getAttribute('data-oxs-direction'),
            density: element.getAttribute('data-oxs-density'),
            motion: element.getAttribute('data-oxs-motion'),
            modality: element.getAttribute('data-oxs-modality'),
            pointerPrecision: element.getAttribute('data-oxs-pointer-precision'),
            viewportPreset: viewport?.getAttribute('data-viewport') ?? null,
            computedDirection: style.direction,
            computedColorScheme: style.colorScheme,
            motionNormal: style.getPropertyValue('--oxs-motion-normal').trim(),
            touchTargetMin: style.getPropertyValue('--oxs-touch-target-min').trim(),
            controlHeightSm: style.getPropertyValue('--oxs-control-height-sm').trim(),
            controlHeightMd: style.getPropertyValue('--oxs-control-height-md').trim(),
            controlHeightLg: style.getPropertyValue('--oxs-control-height-lg').trim(),
            canvas: style.getPropertyValue('--oxs-color-canvas').trim(),
            text: style.getPropertyValue('--oxs-color-text-primary').trim(),
            shellOverflowX: shell ? shell.scrollWidth - shell.clientWidth : 0,
          };
        });

        const expected = {
          theme: profile.theme,
          colorScheme: profile.colorScheme,
          direction: profile.dir,
          density: profile.density,
          motion: profile.motion,
          modality: profile.modality,
          pointerPrecision: profile.pointer,
          viewportPreset: profile.viewport,
          computedDirection: profile.dir,
        };
        for (const [key, value] of Object.entries(expected)) {
          if (state[key] !== value) {
            violations.push(
              `${profile.id}/${entry.exportName}: ${key}=${state[key]} expected ${value}`,
            );
          }
        }
        if (state.shellOverflowX > 1) {
          violations.push(
            `${profile.id}/${entry.exportName}: Studio shell horizontally overflows by ${state.shellOverflowX}px`,
          );
        }
        if (!state.canvas || !state.text || state.canvas === state.text) {
          violations.push(
            `${profile.id}/${entry.exportName}: resolved semantic palette is incomplete`,
          );
        }
        if (profile.motion === 'reduced' && !['1ms', '0.001s'].includes(state.motionNormal)) {
          violations.push(
            `${profile.id}/${entry.exportName}: reduced motion did not collapse --oxs-motion-normal (${state.motionNormal})`,
          );
        }

        const previewBox = await componentPreview.boundingBox();
        if (!previewBox || previewBox.width <= 0 || previewBox.height <= 0) {
          violations.push(`${profile.id}/${entry.exportName}: preview has no visible geometry`);
          continue;
        }

        const primaryControlHeight = await componentPreview
          .locator(
            'button, input, select, textarea, [role="button"], [role="checkbox"], [role="tab"]',
          )
          .first()
          .evaluate((element) => element.getBoundingClientRect().height)
          .catch(() => null);

        const screenshotPath = path.join(profileRoot, `${entry.exportName}.png`);
        await componentPreview.screenshot({ path: screenshotPath, animations: 'disabled' });
        const screenshot = await readFile(screenshotPath);
        const screenshotSha256 = createHash('sha256').update(screenshot).digest('hex');

        observations.push({
          profile: profile.id,
          exportName: entry.exportName,
          entryId: entry.id,
          state,
          width: Math.round(previewBox.width),
          height: Math.round(previewBox.height),
          primaryControlHeight:
            primaryControlHeight == null ? null : Number(primaryControlHeight.toFixed(1)),
          screenshot: path.relative(repoRoot, screenshotPath),
          screenshotSha256,
        });
        process.stdout.write(`Cross-axis ${profile.id}: ${entry.exportName} passed\n`);
      }
      diagnostics.assertClean(`cross-axis visual ${profile.id}`);
    } catch (error) {
      violations.push(`${profile.id}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }
} finally {
  await browser.close().catch(() => {});
  await preview.stop().catch(() => {});
}

const buttonObservations = observations.filter((entry) => entry.exportName === 'Button');

// Density and pointer-target floors are independent contracts. Compare density only under the
// same fine-pointer desktop conditions; coarse pointers may legitimately raise a compact control
// above a comfortable fine-pointer control to preserve the accessibility target floor.
const fineDesktopButtons = buttonObservations.filter(
  (entry) =>
    entry.state.pointerPrecision === 'fine' &&
    entry.state.viewportPreset === 'desktop' &&
    entry.primaryControlHeight != null,
);
const comfortableFineButtons = fineDesktopButtons.filter(
  (entry) => entry.state.density === 'comfortable',
);
const compactFineButtons = fineDesktopButtons.filter((entry) => entry.state.density === 'compact');
if (!comfortableFineButtons.length || !compactFineButtons.length) {
  violations.push('Button density contrast is missing paired fine-pointer desktop observations.');
} else {
  // Density is a token contract, while rendered control geometry is also constrained by the
  // independent minimum target floor. Certify the density tokens directly instead of requiring
  // an arbitrary pixel delta after max(control-height, touch-target-min) has been applied.
  for (const [label, key] of [
    ['sm', 'controlHeightSm'],
    ['md', 'controlHeightMd'],
    ['lg', 'controlHeightLg'],
  ]) {
    const comfortableValues = comfortableFineButtons.map((entry) =>
      Number.parseFloat(entry.state[key]),
    );
    const compactValues = compactFineButtons.map((entry) => Number.parseFloat(entry.state[key]));
    if (
      comfortableValues.some((value) => !Number.isFinite(value)) ||
      compactValues.some((value) => !Number.isFinite(value))
    ) {
      violations.push(`Button ${label} density token did not resolve to a CSS length.`);
      continue;
    }
    const comfortableTokenMin = Math.min(...comfortableValues);
    const compactTokenMax = Math.max(...compactValues);
    if (comfortableTokenMin <= compactTokenMax) {
      violations.push(
        `Button ${label} density token ordering is invalid: comfortable min ${comfortableTokenMin}px vs compact max ${compactTokenMax}px`,
      );
    }
  }

  // The representative Button sample should preserve the ordering when both observations use the
  // same pointer precision and viewport. A small rendered delta is valid when the compact control
  // is clamped upward by the shared 44px minimum target floor.
  const comfortableMin = Math.min(
    ...comfortableFineButtons.map((entry) => entry.primaryControlHeight),
  );
  const compactMax = Math.max(...compactFineButtons.map((entry) => entry.primaryControlHeight));
  if (comfortableMin <= compactMax) {
    violations.push(
      `Button rendered density ordering is invalid under fine-pointer desktop conditions: comfortable min ${comfortableMin}px vs compact max ${compactMax}px`,
    );
  }
}

for (const entry of buttonObservations.filter(
  (candidate) =>
    candidate.state.pointerPrecision === 'coarse' && candidate.primaryControlHeight != null,
)) {
  const coarseFloor = Number.parseFloat(entry.state.touchTargetMin);
  if (!Number.isFinite(coarseFloor)) {
    violations.push(`${entry.profile}/Button: unresolved coarse-pointer touch target floor.`);
  } else if (entry.primaryControlHeight + 0.1 < coarseFloor) {
    violations.push(
      `${entry.profile}/Button: ${entry.primaryControlHeight}px is below the coarse-pointer target floor ${coarseFloor}px`,
    );
  }
}

const darkCanvases = new Set(
  observations.filter((entry) => entry.state.theme === 'dark').map((entry) => entry.state.canvas),
);
const lightCanvases = new Set(
  observations.filter((entry) => entry.state.theme === 'light').map((entry) => entry.state.canvas),
);
if ([...darkCanvases].some((value) => lightCanvases.has(value))) {
  violations.push('Dark and light profiles resolved to the same canvas token.');
}

const report = {
  schema: 1,
  createdAt: new Date().toISOString(),
  browser: browserSource,
  sentinels: sentinelExports,
  profiles: profiles.map(({ hasTouch, ...profile }) => ({ ...profile, hasTouch })),
  summary: {
    profiles: profiles.length,
    sentinels: entries.length,
    captures: observations.length,
    expectedCaptures: profiles.length * entries.length,
    failed: violations.length,
  },
  violations,
  observations,
};
await mkdir(artifactRoot, { recursive: true });
await writeFile(path.join(artifactRoot, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`);

if (observations.length !== profiles.length * entries.length) {
  violations.push(
    `Cross-axis capture count ${observations.length} != expected ${profiles.length * entries.length}`,
  );
}
if (violations.length) {
  report.summary.failed = violations.length;
  report.violations = violations;
  await writeFile(path.join(artifactRoot, 'latest.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.error('Cross-axis visual certification failed:');
  for (const violation of violations) console.error(` - ${violation}`);
  console.error(`Evidence: ${path.join(artifactRoot, 'latest.json')}`);
  process.exit(1);
}

console.log(
  `Cross-axis visual certification passed: ${profiles.length} environments × ${entries.length} sentinels = ${observations.length} deterministic captures.`,
);
console.log(`Evidence: ${path.join(artifactRoot, 'latest.json')}`);
