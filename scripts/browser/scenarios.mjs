import assert from 'node:assert/strict';
import {
  assertEnvironment,
  assertMinimumBlockSize,
  assertPublicUiStylesLoaded,
  assertNoGlobalHorizontalOverflow,
  assertVisibleFocus,
  assertWithinViewport,
  attachRuntimeDiagnostics,
  focusByTab,
  waitForStudioExampleControl,
  gotoCatalog,
  performPointerCancel,
  performTouchLongPress,
  runAxe,
} from './harness.mjs';

function scenario(id, axes, run, { accepts = [] } = {}) {
  return { id, axes, accepts, run };
}

export const browserScenarios = [
  scenario(
    'studio-route-environment-a11y',
    ['route', 'a11y', 'theme', 'ltr', 'desktop'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Button',
          tab: 'overview',
          theme: 'dark',
          dir: 'ltr',
          density: 'comfortable',
          motion: 'full',
          modality: 'mouse',
          pointer: 'fine',
          viewport: 'fit',
          container: 'auto',
          safe: 'none',
        });
        await assertEnvironment(page, {
          dir: 'ltr',
          theme: 'dark',
          density: 'comfortable',
          motion: 'full',
          modality: 'mouse',
          pointer: 'fine',
          viewport: 'fit',
          viewportWidth: '100%',
          containerWidth: '88rem',
        });
        await assertPublicUiStylesLoaded(page);
        await assertWithinViewport(workbench, 'Button Studio workbench');
        const axe = await runAxe(page, 'Button Studio route');
        diagnostics.assertClean('Button Studio route');
        return { axe };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'keyboard-roving-visible-focus',
    ['keyboard', 'focus', 'roving', 'activation'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, { entry: 'Button', tab: 'overview' });
        const overview = page.getByRole('tab', { name: 'Overview', exact: true });
        await focusByTab(page, overview);
        await assertVisibleFocus(overview, 'Overview documentation tab');

        await page.keyboard.press('ArrowRight');
        const api = page.getByRole('tab', { name: 'API', exact: true });
        await api.waitFor({ state: 'visible' });
        assert.equal(await api.getAttribute('aria-selected'), 'true', 'ArrowRight did not automatically activate the API tab.');
        assert.equal(await api.evaluate((element) => document.activeElement === element), true, 'Roving focus did not move to the API tab.');
        assert.equal(new URL(page.url()).searchParams.get('tab'), 'api', 'Roving activation did not update the deterministic Studio route.');
        await assertVisibleFocus(api, 'API documentation tab');

        await page.keyboard.press('ArrowLeft');
        assert.equal(await overview.getAttribute('aria-selected'), 'true', 'ArrowLeft did not return selection to Overview.');
        diagnostics.assertClean('keyboard/roving journey');
        return { tabStopsToOverview: 'reachable', activation: 'automatic' };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'dialog-modal-focus-restoration',
    ['keyboard', 'focus', 'overlay', 'escape', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, { entry: 'Dialog', tab: 'examples', example: 'overview' });
        const trigger = page.getByRole('button', { name: 'Open dialog', exact: true });
        await waitForStudioExampleControl(page, trigger, 'Dialog trigger');
        await focusByTab(page, trigger);
        await assertVisibleFocus(trigger, 'Dialog trigger');
        await page.keyboard.press('Enter');

        const dialog = page.getByRole('dialog', { name: 'Example dialog' });
        await dialog.waitFor({ state: 'visible' });
        assert.equal(await dialog.getAttribute('aria-modal'), 'true', 'Modal Dialog did not expose aria-modal=true.');
        assert.equal(await dialog.evaluate((element) => element.contains(document.activeElement)), true, 'Focus was not moved into the opened Dialog.');

        const isolated = await page.locator('.ui-studio-shell').evaluate((element) => {
          const boundary = element.closest('[inert]');
          return {
            inert: Boolean(boundary),
            ariaHidden: boundary?.getAttribute('aria-hidden') ?? null,
          };
        });
        assert.deepEqual(isolated, { inert: true, ariaHidden: 'true' }, 'Modal overlay did not isolate the nearest Studio boundary with inert + aria-hidden.');
        const axe = await runAxe(page, 'Open Dialog');

        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'detached' });
        assert.equal(await trigger.evaluate((element) => document.activeElement === element), true, 'Escape did not restore focus to the Dialog trigger.');
        const restored = await page.locator('.ui-studio-shell').evaluate((element) => {
          const boundary = element.closest('[inert], [aria-hidden="true"]');
          return {
            inert: Boolean(boundary?.hasAttribute('inert')),
            ariaHidden: boundary?.getAttribute('aria-hidden') ?? null,
          };
        });
        assert.deepEqual(restored, { inert: false, ariaHidden: null }, 'Modal isolation leaked after Dialog dismissal.');
        diagnostics.assertClean('Dialog lifecycle journey');
        return { axe, focusRestored: true, modalIsolationRestored: true };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'pointer-cancellation-and-activation',
    ['pointer', 'cancellation', 'activation'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, { entry: 'Button', tab: 'examples', modality: 'mouse', pointer: 'fine' });
        const toggle = page.getByRole('button', { name: 'Favorite', exact: true });
        await toggle.waitFor({ state: 'visible' });
        assert.equal(await toggle.getAttribute('aria-pressed'), 'true', 'Pointer fixture must begin pressed.');
        await performPointerCancel(page, toggle);
        assert.equal(await toggle.getAttribute('aria-pressed'), 'true', 'Pointer release outside the target incorrectly activated ToggleButton.');
        assert.equal(await toggle.getAttribute('data-pressed'), null, 'Pressed visual state leaked after pointer cancellation.');
        await toggle.click();
        assert.equal(await toggle.getAttribute('aria-pressed'), 'false', 'Normal pointer activation did not toggle ToggleButton.');
        diagnostics.assertClean('pointer cancellation journey');
        return { cancellationPreservedValue: true, normalActivation: true };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'touch-long-press-context-menu',
    ['touch', 'coarse-pointer', 'long-press', 'overlay', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: false,
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'ContextMenu',
          tab: 'examples',
          example: 'preview',
          theme: 'light',
          dir: 'rtl',
          density: 'compact',
          motion: 'reduced',
          modality: 'touch',
          pointer: 'coarse',
          viewport: 'phone',
          container: 'compact',
          safe: 'gesture',
        });
        await assertEnvironment(page, {
          dir: 'rtl',
          theme: 'light',
          density: 'compact',
          motion: 'reduced',
          modality: 'touch',
          pointer: 'coarse',
          viewport: 'phone',
          viewportWidth: '390px',
          containerWidth: '48rem',
          safeArea: { safeBlockEnd: '28px' },
        });
        const documentationViewport = page.locator('.ui-studio-workspace-scroll > .ui-scroll-view__viewport');
        const documentationViewportHeight = await assertMinimumBlockSize(
          documentationViewport,
          176,
          'Phone Studio documentation viewport',
        );
        const trigger = page.getByRole('button', { name: 'Right-click or long-press', exact: true });
        const size = await trigger.boundingBox();
        assert.ok(size && size.height >= 44, `Coarse-pointer trigger is below the 44px browser target floor (${size?.height ?? 0}px).`);
        const menu = page.getByRole('menu', { name: 'File actions' });
        const activationMs = await performTouchLongPress(page, trigger, menu, { activationBudgetMs: 1000 });
        assert.equal(await page.getByRole('menuitem').count(), 3, 'Long-press ContextMenu exposed the wrong command count.');
        const axe = await runAxe(page, 'Touch ContextMenu');
        diagnostics.assertClean('touch long-press journey');
        return { axe, targetHeight: size.height, documentationViewportHeight, commands: 3, activationMs };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'environment-and-reflow-matrix',
    ['rtl', 'ltr', 'theme', 'density', 'reduced-motion', 'responsive', 'safe-area', 'reflow'],
    async ({ browser, baseUrl }) => {
      const cases = [
        {
          id: 'narrow-rtl-reduced',
          context: { viewport: { width: 320, height: 720 }, reducedMotion: 'reduce', colorScheme: 'light' },
          route: { entry: 'TextField', tab: 'overview', theme: 'light', dir: 'rtl', density: 'compact', motion: 'system', modality: 'keyboard', pointer: 'coarse', viewport: 'fit', container: 'compact', safe: 'notch' },
          expected: { dir: 'rtl', theme: 'light', density: 'compact', motion: 'system', modality: 'keyboard', pointer: 'coarse', viewport: 'fit', viewportWidth: '100%', containerWidth: '48rem', safeArea: { safeBlockStart: '32px', safeInlineEnd: '12px', safeBlockEnd: '12px', safeInlineStart: '12px' } },
        },
        {
          id: 'tablet-custom-keyboard-occlusion',
          context: { viewport: { width: 1024, height: 900 }, reducedMotion: 'no-preference', colorScheme: 'dark' },
          route: { entry: 'Button', tab: 'overview', theme: 'custom', dir: 'ltr', density: 'comfortable', motion: 'full', modality: 'pen', pointer: 'coarse', viewport: 'tablet', container: 'content', safe: 'keyboard' },
          expected: { dir: 'ltr', theme: 'custom', density: 'comfortable', motion: 'full', modality: 'pen', pointer: 'coarse', viewport: 'tablet', viewportWidth: '820px', containerWidth: '68rem', safeArea: { safeBlockEnd: '280px' } },
        },
      ];
      const observations = [];
      for (const testCase of cases) {
        const context = await browser.newContext(testCase.context);
        const page = await context.newPage();
        const diagnostics = attachRuntimeDiagnostics(page);
        try {
          const workbench = await gotoCatalog(page, baseUrl, testCase.route);
          await assertEnvironment(page, testCase.expected);
          const geometry = await assertNoGlobalHorizontalOverflow(page, testCase.id);
          await assertWithinViewport(workbench, `${testCase.id} workbench`);
          const media = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
          if (testCase.context.reducedMotion === 'reduce') assert.equal(media, true, `${testCase.id} did not receive browser reduced-motion emulation.`);
          observations.push({ id: testCase.id, geometry, reducedMotionMedia: media });
          diagnostics.assertClean(testCase.id);
        } finally {
          await context.close();
        }
      }
      return { cases: observations };
    },
  ),
];
