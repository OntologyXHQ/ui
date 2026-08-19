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
          insets: 'none',
        });
        await assertEnvironment(page, {
          dir: 'ltr',
          theme: 'dark',
          colorScheme: 'dark',
          colorSchemePreference: 'auto',
          density: 'comfortable',
          densityPreference: 'comfortable',
          directionPreference: 'ltr',
          motion: 'full',
          motionPreference: 'full',
          modality: 'mouse',
          modalityPreference: 'mouse',
          pointer: 'fine',
          pointerPreference: 'fine',
          adaptiveBand: 'expanded',
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
    'foundation-semantic-token-substrate',
    ['foundations', 'theme', 'a11y', 'semantic-tokens'],
    async ({ browser, baseUrl }) => {
      const cases = [
        { id: 'dark', colorScheme: 'dark' },
        { id: 'light', colorScheme: 'light' },
        { id: 'custom', colorScheme: 'dark' },
      ];
      const observations = [];
      for (const testCase of cases) {
        const context = await browser.newContext({ viewport: { width: 1100, height: 820 }, colorScheme: testCase.colorScheme });
        const page = await context.newPage();
        const diagnostics = attachRuntimeDiagnostics(page);
        try {
          await gotoCatalog(page, baseUrl, {
            entry: 'UiRoot',
            tab: 'examples',
            example: 'token-contract',
            theme: testCase.id,
          });
          const root = page.locator('.ui-root').first();
          const substrate = await root.evaluate((element) => {
            const style = getComputedStyle(element);
            const roles = [
              '--oxs-color-accent',
              '--oxs-color-accent-text',
              '--oxs-color-on-accent',
              '--oxs-color-accent-soft',
              '--oxs-color-accent-border',
              '--oxs-color-danger',
              '--oxs-color-danger-text',
              '--oxs-color-on-danger',
              '--oxs-color-success-text',
              '--oxs-color-warning-text',
            ];
            return {
              values: Object.fromEntries(roles.map((name) => [name, style.getPropertyValue(name).trim()])),
              backgroundImage: style.backgroundImage,
            };
          });
          for (const [name, value] of Object.entries(substrate.values)) {
            assert.ok(value, `${testCase.id} theme did not resolve semantic token ${name}.`);
          }
          assert.equal(substrate.backgroundImage, 'none', `${testCase.id} UiRoot foundation leaked ornamental background imagery.`);
          const axe = await runAxe(page, `${testCase.id} foundation token substrate`);
          diagnostics.assertClean(`${testCase.id} foundation token substrate`);
          observations.push({ id: testCase.id, axe, neutralRoot: true });
        } finally {
          await context.close();
        }
      }
      return { themes: observations };
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
    'modal-popover-focus-isolation',
    ['keyboard', 'focus', 'overlay', 'modal-isolation', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, { entry: 'Popover', tab: 'examples', example: 'modal-focus' });
        const trigger = page.getByRole('button', { name: 'Open modal popover', exact: true });
        await waitForStudioExampleControl(page, trigger, 'Modal Popover trigger');
        await focusByTab(page, trigger);
        await page.keyboard.press('Enter');

        const popover = page.getByRole('dialog', { name: 'Modal popover example' });
        await popover.waitFor({ state: 'visible' });
        const state = await popover.evaluate((element) => {
          const active = document.activeElement;
          const hiddenAncestor = active instanceof HTMLElement
            ? active.closest('[aria-hidden="true"], [inert]')
            : null;
          return {
            focusInside: active instanceof HTMLElement && element.contains(active),
            hiddenAncestor: Boolean(hiddenAncestor),
            ariaModal: element.getAttribute('aria-modal'),
          };
        });
        assert.deepEqual(
          state,
          { focusInside: true, hiddenAncestor: false, ariaModal: 'true' },
          'Modal Popover isolated the focused node instead of establishing overlay focus first.',
        );
        const axe = await runAxe(page, 'Modal Popover');
        diagnostics.assertClean('modal Popover focus-isolation journey');
        return { axe, focusInside: true, noHiddenFocusedAncestor: true };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'uiroot-nested-runtime-certification',
    ['foundations', 'uiroot', 'nested-roots', 'inheritance', 'portal', 'modal-isolation', 'focus', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 1100, height: 860 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'UiRoot',
          tab: 'examples',
          example: 'nested-certification',
          theme: 'light',
          dir: 'ltr',
          density: 'comfortable',
          motion: 'reduced',
        });

        const outer = page.locator('.ui-doc-uiroot-outer');
        const inner = page.locator('.ui-doc-uiroot-inner');
        await outer.waitFor({ state: 'visible' });
        await inner.waitFor({ state: 'visible' });
        const environment = await page.evaluate(() => {
          const outer = document.querySelector('.ui-doc-uiroot-outer');
          const inner = document.querySelector('.ui-doc-uiroot-inner');
          if (!(outer instanceof HTMLElement) || !(inner instanceof HTMLElement)) return null;
          const outerStyle = getComputedStyle(outer);
          const innerStyle = getComputedStyle(inner);
          return {
            outer: {
              scope: outer.dataset.oxsScope,
              theme: outer.dataset.oxsTheme,
              direction: outer.dataset.oxsDirection,
              density: outer.dataset.oxsDensity,
              radius: outerStyle.getPropertyValue('--oxs-radius-md').trim(),
              safeBlockStart: outerStyle.getPropertyValue('--oxs-safe-block-start').trim(),
              portalCount: outer.querySelectorAll(':scope > [data-oxs-portal-root]').length,
            },
            inner: {
              scope: inner.dataset.oxsScope,
              theme: inner.dataset.oxsTheme,
              direction: inner.dataset.oxsDirection,
              density: inner.dataset.oxsDensity,
              radius: innerStyle.getPropertyValue('--oxs-radius-md').trim(),
              safeBlockStart: innerStyle.getPropertyValue('--oxs-safe-block-start').trim(),
              occlusionBlockEnd: innerStyle.getPropertyValue('--oxs-occlusion-block-end').trim(),
              portalCount: inner.querySelectorAll(':scope > [data-oxs-portal-root]').length,
            },
          };
        });
        assert.deepEqual(environment, {
          outer: {
            scope: 'nested',
            theme: 'dark',
            direction: 'rtl',
            density: 'comfortable',
            radius: '18px',
            safeBlockStart: '12px',
            portalCount: 1,
          },
          inner: {
            scope: 'nested',
            theme: 'dark',
            direction: 'rtl',
            density: 'compact',
            radius: '6px',
            safeBlockStart: '12px',
            occlusionBlockEnd: '40px',
            portalCount: 1,
          },
        }, 'Nested UiRoot did not inherit/override its environment contract deterministically.');

        const outerAction = page.getByRole('button', { name: 'Outer action', exact: true });
        const trigger = page.getByRole('button', { name: 'Open nested dialog', exact: true });
        await focusByTab(page, trigger);
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Nested root dialog' });
        await dialog.waitFor({ state: 'visible' });

        const ownership = await dialog.evaluate((element) => {
          const inner = document.querySelector('.ui-doc-uiroot-inner');
          const outerAction = [...document.querySelectorAll('button')].find(
            (button) => button.textContent?.trim() === 'Outer action',
          );
          const portal = element.closest('[data-oxs-portal-root]');
          const ownerRoot = portal?.parentElement;
          const active = document.activeElement;
          const hiddenFocusedAncestor = active instanceof HTMLElement
            ? active.closest('[aria-hidden="true"], [inert]')
            : null;
          return {
            portalOwnedByInner: Boolean(inner && ownerRoot === inner),
            outerActionIsolated: Boolean(
              outerAction instanceof HTMLElement &&
                outerAction.closest('[aria-hidden="true"], [inert]'),
            ),
            focusInsideDialog: active instanceof HTMLElement && element.contains(active),
            hiddenFocusedAncestor: Boolean(hiddenFocusedAncestor),
          };
        });
        assert.deepEqual(ownership, {
          portalOwnedByInner: true,
          outerActionIsolated: false,
          focusInsideDialog: true,
          hiddenFocusedAncestor: false,
        }, 'Nested modal escaped its nearest UiRoot ownership boundary.');

        await page.getByRole('button', { name: 'Done', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate((element) => document.activeElement === element), true, 'Nested UiRoot did not restore focus to its trigger.');
        await outerAction.click();
        const axe = await runAxe(page, 'UiRoot nested certification');
        diagnostics.assertClean('UiRoot nested certification');
        return { axe, environment, ownership, focusRestored: true };
      } finally {
        await context.close();
      }
    },
    { accepts: ['UiRoot'] },
  ),

  scenario(
    'box-layout-boundary-certification',
    ['layout', 'polymorphism', 'overflow', 'min-size', 'flex-child', 'grid-span', 'rtl', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 760, height: 760 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Box',
          tab: 'examples',
          example: 'boundary-contract',
          dir: 'rtl',
          theme: 'dark',
          viewport: 'fit',
          container: 'compact',
        });
        const box = page.getByRole('region', { name: 'Certified Box boundary' });
        await box.waitFor({ state: 'visible' });
        const boundary = await box.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            tagName: element.tagName,
            overflow: style.overflow,
            minInlineSize: style.minInlineSize,
            flexGrow: style.flexGrow,
            direction: style.direction,
          };
        });
        assert.equal(boundary.tagName, 'SECTION', 'Box polymorphism did not preserve the requested semantic section element.');
        assert.equal(boundary.overflow, 'auto', 'Box overflow contract did not reach browser layout.');
        assert.equal(boundary.minInlineSize, '0px', 'Box minInlineSize="zero" did not prevent intrinsic overflow pressure.');
        assert.equal(boundary.flexGrow, '1', 'Box flex="grow" did not participate in its Row parent.');
        assert.equal(boundary.direction, 'rtl', 'Box did not inherit the resolved logical direction.');

        const fullSpan = page.locator('[aria-label="Full-span Box"]');
        const span = await fullSpan.evaluate((element) => getComputedStyle(element).gridColumnEnd);
        assert.equal(span, '-1', 'Box gridSpan="full" did not span the full Grid inline track range.');
        await assertNoGlobalHorizontalOverflow(page, 'Box layout boundary');
        const axe = await runAxe(page, 'Box layout boundary certification');
        diagnostics.assertClean('Box layout boundary certification');
        return { axe, boundary, fullSpan: true };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Box'] },
  ),

  scenario(
    'logical-flow-layout-certification',
    ['layout', 'stack', 'row', 'wrap', 'polymorphism', 'rtl', 'logical-order', 'responsive', 'reflow', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 520, height: 760 }, colorScheme: 'light' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Stack',
          tab: 'examples',
          example: 'block-flow',
          dir: 'ltr',
          theme: 'light',
          viewport: 'fit',
          container: 'compact',
        });
        const stack = page.getByRole('region', { name: 'Certified Stack flow' });
        await stack.waitFor({ state: 'visible' });
        const stackState = await stack.evaluate((element) => {
          const style = getComputedStyle(element);
          const children = [...element.children].map((child) => child.getBoundingClientRect());
          return {
            display: style.display,
            flexDirection: style.flexDirection,
            gap: style.gap,
            blockOrder: children.map((rect) => rect.y),
          };
        });
        assert.equal(stackState.display, 'flex', 'Stack did not render as a flex layout.');
        assert.equal(stackState.flexDirection, 'column', 'Stack did not own block-axis flow.');
        assert.ok(stackState.blockOrder[0] < stackState.blockOrder[1] && stackState.blockOrder[1] < stackState.blockOrder[2], 'Stack visual order diverged from DOM order.');
        const stackAxe = await runAxe(page, 'Stack flow certification');

        await gotoCatalog(page, baseUrl, {
          entry: 'Row',
          tab: 'examples',
          example: 'inline-flow',
          dir: 'rtl',
          theme: 'light',
          viewport: 'fit',
          container: 'compact',
        });
        const row = page.getByRole('region', { name: 'Certified Row flow' });
        await row.waitFor({ state: 'visible' });
        const rowState = await row.evaluate((element) => {
          const style = getComputedStyle(element);
          const children = [...element.children].map((child) => ({
            text: child.textContent,
            x: child.getBoundingClientRect().x,
          }));
          return { display: style.display, flexDirection: style.flexDirection, direction: style.direction, children };
        });
        assert.equal(rowState.display, 'flex', 'Row did not render as a flex layout.');
        assert.equal(rowState.flexDirection, 'row', 'Row must use the logical inline flow rather than reverse DOM order.');
        assert.equal(rowState.direction, 'rtl', 'Row did not resolve RTL from UiRoot.');
        assert.deepEqual(rowState.children.map((child) => child.text), ['First', 'Second', 'Third'], 'Row DOM/content order changed under RTL.');
        assert.ok(rowState.children[0].x > rowState.children[1].x, 'RTL Row did not place the first DOM child at inline-start.');
        const rowAxe = await runAxe(page, 'Row RTL certification');

        await gotoCatalog(page, baseUrl, {
          entry: 'Wrap',
          tab: 'examples',
          example: 'intrinsic-wrap',
          dir: 'ltr',
          theme: 'light',
          viewport: 'phone',
          container: 'compact',
        });
        const wrap = page.getByRole('region', { name: 'Certified Wrap flow' });
        await wrap.waitFor({ state: 'visible' });
        const wrapState = await wrap.evaluate((element) => {
          const style = getComputedStyle(element);
          const rows = [...new Set([...element.children].map((child) => Math.round(child.getBoundingClientRect().y)))];
          return { display: style.display, flexWrap: style.flexWrap, rows: rows.length };
        });
        assert.equal(wrapState.display, 'flex', 'Wrap did not render as flex.');
        assert.equal(wrapState.flexWrap, 'wrap', 'Wrap did not enable intrinsic wrapping.');
        assert.ok(wrapState.rows >= 2, `Wrap did not reflow into multiple rows in a compact container (rows=${wrapState.rows}).`);
        await assertNoGlobalHorizontalOverflow(page, 'Wrap compact reflow');
        const wrapAxe = await runAxe(page, 'Wrap reflow certification');

        diagnostics.assertClean('logical flow layout certification');
        return { stack: stackState, row: rowState, wrap: wrapState, axe: [stackAxe, rowAxe, wrapAxe] };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Stack', 'Row', 'Wrap'] },
  ),

  scenario(
    'grid-track-strategy-certification',
    ['layout', 'grid', 'tracks', 'auto-fit', 'minmax', 'grid-span', 'responsive', 'polymorphism', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1500, height: 900 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Grid',
          tab: 'examples',
          example: 'track-strategies',
          dir: 'ltr',
          theme: 'dark',
          viewport: 'phone',
          container: 'compact',
        });
        const studioGeometry = await page.locator('.ui-studio-viewport').evaluate((viewport) => {
          const rect = (selector) => {
            const element = viewport.querySelector(selector);
            if (!(element instanceof HTMLElement)) return null;
            const box = element.getBoundingClientRect();
            return { width: box.width, height: box.height };
          };
          const own = viewport.getBoundingClientRect();
          return {
            viewport: { width: own.width, height: own.height },
            shell: rect('.ui-studio-shell'),
            workspace: rect('.ui-studio-shell__workspace'),
            exampleCanvas: rect('.ui-catalog-example__canvas'),
          };
        });
        assert.ok(
          studioGeometry.viewport.width >= 380 && studioGeometry.viewport.width <= 400,
          `Studio phone preset did not resolve near 390px (${JSON.stringify(studioGeometry)}).`,
        );
        assert.ok(
          (studioGeometry.workspace?.width ?? 0) > 200 && (studioGeometry.exampleCanvas?.width ?? 0) > 100,
          `Studio simulated viewport collapsed the active example before Grid layout could be certified: ${JSON.stringify(studioGeometry)}`,
        );
        const intrinsic = page.getByRole('region', { name: 'Certified intrinsic Grid' });
        await intrinsic.waitFor({ state: 'visible' });
        const readIntrinsicState = (locator) => locator.evaluate((element) => {
          const style = getComputedStyle(element);
          const columns = style.gridTemplateColumns.split(/\s+/).filter(Boolean);
          return {
            tagName: element.tagName,
            display: style.display,
            columns,
            minInlineSize: style.minInlineSize,
          };
        });
        const phoneIntrinsicState = await readIntrinsicState(intrinsic);
        assert.equal(phoneIntrinsicState.tagName, 'SECTION', 'Grid polymorphism did not preserve semantic section output.');
        assert.equal(phoneIntrinsicState.display, 'grid', 'Grid did not reach browser Grid layout.');
        assert.ok(phoneIntrinsicState.columns.length >= 1, 'auto-fit Grid did not form an intrinsic track in the compact container.');
        assert.equal(phoneIntrinsicState.minInlineSize, '0px', 'Grid did not preserve nested-layout min-inline-size safety.');

        const fixed = page.getByRole('region', { name: 'Certified fixed Grid' });
        const fixedState = await fixed.evaluate((element) => ({
          columns: getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length,
          children: [...element.children].map((child) => child.textContent?.replace(/\s+/g, ' ').trim()),
        }));
        assert.equal(fixedState.columns, 4, 'Grid columns={4} did not produce exactly four finite tracks.');
        assert.deepEqual(fixedState.children, ['Span 2', 'Peer A', 'Peer B'], 'Grid visual contract must preserve DOM/content order.');
        const span = await page.getByLabel('Two-column Grid item').evaluate((element) => getComputedStyle(element).gridColumnEnd);
        assert.match(span, /span\s+2/, 'Box gridSpan={2} did not participate in the fixed Grid track model.');
        await assertNoGlobalHorizontalOverflow(page, 'Grid compact track strategies');

        await gotoCatalog(page, baseUrl, {
          entry: 'Grid',
          tab: 'examples',
          example: 'track-strategies',
          dir: 'ltr',
          theme: 'dark',
          viewport: 'desktop',
          container: 'wide',
        });
        const wideIntrinsic = page.getByRole('region', { name: 'Certified intrinsic Grid' });
        await wideIntrinsic.waitFor({ state: 'visible' });
        const wideIntrinsicState = await readIntrinsicState(wideIntrinsic);
        assert.ok(
          wideIntrinsicState.columns.length > phoneIntrinsicState.columns.length,
          `auto-fit Grid did not add tracks when its containing space grew (compact=${phoneIntrinsicState.columns.length}, wide=${wideIntrinsicState.columns.length}).`,
        );
        await assertNoGlobalHorizontalOverflow(page, 'Grid wide track strategies');
        const axe = await runAxe(page, 'Grid track strategy certification');
        diagnostics.assertClean('Grid track strategy certification');
        return {
          axe,
          compactIntrinsicTracks: phoneIntrinsicState.columns.length,
          wideIntrinsicTracks: wideIntrinsicState.columns.length,
          fixedTracks: fixedState.columns,
          span,
        };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Grid'] },
  ),

  scenario(
    'container-semantic-width-certification',
    ['layout', 'container', 'semantic-width', 'readable', 'responsive', 'polymorphism', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1720, height: 900 }, colorScheme: 'light' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Container',
          tab: 'examples',
          example: 'semantic-widths',
          theme: 'light',
          dir: 'ltr',
          viewport: 'ultrawide',
          container: 'wide',
        });
        const readable = page.getByRole('region', { name: 'Certified readable Container' });
        const full = page.getByRole('region', { name: 'Certified full Container' });
        await readable.waitFor({ state: 'visible' });
        const geometry = await Promise.all([readable, full].map((locator) => locator.evaluate((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            tagName: element.tagName,
            width: rect.width,
            maxInlineSize: style.maxInlineSize,
            marginInlineStart: style.marginInlineStart,
            marginInlineEnd: style.marginInlineEnd,
          };
        })));
        assert.equal(geometry[0].tagName, 'SECTION', 'Container polymorphism did not preserve section semantics.');
        assert.equal(geometry[0].maxInlineSize, '704px', 'Container width="readable" is not backed by the 44rem semantic token.');
        assert.ok(geometry[1].width > geometry[0].width + 80, 'Full Container did not expand beyond the readable semantic tier.');
        assert.ok(Number.parseFloat(geometry[0].marginInlineStart) > 0, 'Readable Container was not centered on the inline axis.');
        assert.ok(Number.parseFloat(geometry[0].marginInlineEnd) > 0, 'Readable Container did not retain symmetric inline centering.');
        await assertNoGlobalHorizontalOverflow(page, 'Container semantic widths');
        const axe = await runAxe(page, 'Container semantic width certification');
        diagnostics.assertClean('Container semantic width certification');
        return { axe, readable: geometry[0], full: geometry[1] };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Container'] },
  ),

  scenario(
    'inset-logical-spacing-certification',
    ['layout', 'inset', 'logical-spacing', 'precedence', 'rtl', 'polymorphism', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 900, height: 760 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Inset',
          tab: 'examples',
          example: 'logical-spacing',
          theme: 'dark',
          dir: 'rtl',
          viewport: 'fit',
          container: 'compact',
        });
        const inset = page.getByRole('region', { name: 'Certified logical Inset' });
        await inset.waitFor({ state: 'visible' });
        const state = await inset.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            tagName: element.tagName,
            direction: style.direction,
            inlineStart: style.paddingInlineStart,
            inlineEnd: style.paddingInlineEnd,
            blockStart: style.paddingBlockStart,
            blockEnd: style.paddingBlockEnd,
            physicalLeft: style.paddingLeft,
            physicalRight: style.paddingRight,
          };
        });
        assert.equal(state.tagName, 'SECTION', 'Inset polymorphism did not preserve section semantics.');
        assert.equal(state.direction, 'rtl', 'Inset did not inherit the resolved RTL direction.');
        assert.deepEqual(
          { inlineStart: state.inlineStart, inlineEnd: state.inlineEnd, blockStart: state.blockStart, blockEnd: state.blockEnd },
          { inlineStart: '48px', inlineEnd: '24px', blockStart: '8px', blockEnd: '0px' },
          'Inset all → axis → edge precedence did not resolve to the expected token values.',
        );
        assert.equal(state.physicalRight, '48px', 'RTL logical inline-start did not map to the physical right edge in browser layout.');
        assert.equal(state.physicalLeft, '24px', 'RTL logical inline-end did not map to the physical left edge in browser layout.');
        const axe = await runAxe(page, 'Inset logical spacing certification');
        diagnostics.assertClean('Inset logical spacing certification');
        return { axe, state };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Inset'] },
  ),

  scenario(
    'safe-area-logical-edge-certification',
    ['layout', 'safe-area', 'logical-edges', 'persistent-insets', 'occlusion-isolation', 'rtl', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 900, height: 760 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'SafeArea',
          tab: 'examples',
          example: 'logical-edges',
          theme: 'dark',
          dir: 'rtl',
          insets: 'notch',
          viewport: 'fit',
          container: 'compact',
        });
        const safeArea = page.getByRole('region', { name: 'Certified SafeArea edges' });
        await safeArea.waitFor({ state: 'visible' });
        const notch = await safeArea.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            direction: style.direction,
            blockStart: style.paddingBlockStart,
            inlineEnd: style.paddingInlineEnd,
            blockEnd: style.paddingBlockEnd,
            inlineStart: style.paddingInlineStart,
          };
        });
        assert.deepEqual(
          notch,
          { direction: 'rtl', blockStart: '0px', inlineEnd: '0px', blockEnd: '12px', inlineStart: '12px' },
          'SafeArea consumed edges outside its explicit logical ownership set.',
        );

        await gotoCatalog(page, baseUrl, {
          entry: 'SafeArea',
          tab: 'examples',
          example: 'logical-edges',
          theme: 'dark',
          dir: 'rtl',
          insets: 'keyboard',
          viewport: 'fit',
          container: 'compact',
        });
        const keyboardSafeArea = page.getByRole('region', { name: 'Certified SafeArea edges' });
        const keyboard = await keyboardSafeArea.evaluate((element) => {
          const root = element.closest('.ui-root');
          const style = getComputedStyle(element);
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            blockEnd: style.paddingBlockEnd,
            safeBlockEnd: rootStyle?.getPropertyValue('--oxs-safe-block-end').trim() ?? null,
            occlusionBlockEnd: rootStyle?.getPropertyValue('--oxs-occlusion-block-end').trim() ?? null,
          };
        });
        assert.equal(keyboard.safeBlockEnd, '0px', 'Keyboard preset unexpectedly changed the persistent safe-area input.');
        assert.equal(keyboard.occlusionBlockEnd, '280px', 'Keyboard preset did not project transient occlusion.');
        assert.equal(keyboard.blockEnd, '0px', 'SafeArea incorrectly consumed transient keyboard occlusion.');
        const axe = await runAxe(page, 'SafeArea logical edge certification');
        diagnostics.assertClean('SafeArea logical edge certification');
        return { axe, notch, keyboard };
      } finally {
        await context.close();
      }
    },
    { accepts: ['SafeArea'] },
  ),

  scenario(
    'spacer-logical-axis-certification',
    ['layout', 'spacer', 'logical-axis', 'decorative', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 900, height: 760 }, colorScheme: 'light' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Spacer',
          tab: 'examples',
          example: 'logical-axis',
          theme: 'light',
          dir: 'ltr',
          viewport: 'fit',
          container: 'compact',
        });
        const inlineSpacer = page.locator('.ui-doc-spacer-inline');
        const blockSpacer = page.locator('.ui-doc-spacer-block');
        await inlineSpacer.waitFor({ state: 'attached' });
        const inline = await inlineSpacer.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            inlineSize: style.inlineSize,
            blockSize: style.blockSize,
            ariaHidden: element.getAttribute('aria-hidden'),
            tabIndex: element.tabIndex,
          };
        });
        const block = await blockSpacer.evaluate((element) => {
          const style = getComputedStyle(element);
          return { inlineSize: style.inlineSize, blockSize: style.blockSize };
        });
        assert.deepEqual(inline, { inlineSize: '48px', blockSize: '0px', ariaHidden: 'true', tabIndex: -1 }, 'Inline Spacer geometry/accessibility invariant failed.');
        assert.deepEqual(block, { inlineSize: '0px', blockSize: '24px' }, 'Block Spacer geometry invariant failed.');
        const axe = await runAxe(page, 'Spacer logical axis certification');
        diagnostics.assertClean('Spacer logical axis certification');
        return { axe, inline, block };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Spacer'] },
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
          insets: 'gesture',
        });
        await assertEnvironment(page, {
          dir: 'rtl',
          theme: 'light',
          colorScheme: 'light',
          colorSchemePreference: 'auto',
          density: 'compact',
          densityPreference: 'compact',
          directionPreference: 'rtl',
          motion: 'reduced',
          motionPreference: 'reduced',
          modality: 'touch',
          modalityPreference: 'touch',
          pointer: 'coarse',
          pointerPreference: 'coarse',
          adaptiveBand: 'compact',
          viewport: 'phone',
          viewportWidth: '390px',
          containerWidth: '48rem',
          safeArea: { safeBlockEnd: '28px' },
          environmentInset: { insetBlockEnd: '28px' },
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
    ['rtl', 'ltr', 'theme', 'density', 'reduced-motion', 'responsive', 'adaptive-band', 'safe-area', 'occlusion', 'reflow'],
    async ({ browser, baseUrl }) => {
      const cases = [
        {
          id: 'narrow-rtl-reduced',
          context: { viewport: { width: 320, height: 720 }, reducedMotion: 'reduce', colorScheme: 'light' },
          route: { entry: 'TextField', tab: 'overview', theme: 'light', dir: 'rtl', density: 'compact', motion: 'system', modality: 'keyboard', pointer: 'coarse', viewport: 'fit', container: 'compact', insets: 'notch' },
          expected: {
            dir: 'rtl',
            directionPreference: 'rtl',
            theme: 'light',
            colorScheme: 'light',
            colorSchemePreference: 'auto',
            density: 'compact',
            densityPreference: 'compact',
            motion: 'reduced',
            motionPreference: 'system',
            modality: 'keyboard',
            modalityPreference: 'keyboard',
            pointer: 'coarse',
            pointerPreference: 'coarse',
            adaptiveBand: 'compact',
            viewport: 'fit',
            viewportWidth: '100%',
            containerWidth: '48rem',
            safeArea: { safeBlockStart: '32px', safeInlineEnd: '12px', safeBlockEnd: '12px', safeInlineStart: '12px' },
            environmentInset: { insetBlockStart: '32px', insetInlineEnd: '12px', insetBlockEnd: '12px', insetInlineStart: '12px' },
          },
        },
        {
          id: 'tablet-custom-keyboard-occlusion',
          context: { viewport: { width: 1024, height: 900 }, reducedMotion: 'no-preference', colorScheme: 'dark' },
          route: { entry: 'Button', tab: 'overview', theme: 'custom', dir: 'ltr', density: 'comfortable', motion: 'full', modality: 'pen', pointer: 'coarse', viewport: 'tablet', container: 'content', insets: 'keyboard' },
          expected: {
            dir: 'ltr',
            directionPreference: 'ltr',
            theme: 'custom',
            colorScheme: 'dark',
            colorSchemePreference: 'dark',
            density: 'comfortable',
            densityPreference: 'comfortable',
            motion: 'full',
            motionPreference: 'full',
            modality: 'pen',
            modalityPreference: 'pen',
            pointer: 'coarse',
            pointerPreference: 'coarse',
            adaptiveBand: 'medium',
            viewport: 'tablet',
            viewportWidth: '820px',
            containerWidth: '68rem',
            occlusion: { occlusionBlockEnd: '280px' },
            environmentInset: { insetBlockEnd: '280px' },
          },
        },
        {
          id: 'phone-auto-density-system',
          context: { viewport: { width: 900, height: 900 }, reducedMotion: 'no-preference', colorScheme: 'dark' },
          route: { entry: 'Button', tab: 'overview', theme: 'system', dir: 'auto', density: 'auto', motion: 'system', modality: 'mouse', pointer: 'coarse', viewport: 'phone', container: 'compact', insets: 'gesture' },
          expected: {
            dir: 'ltr',
            directionPreference: 'auto',
            theme: 'system',
            colorScheme: 'dark',
            colorSchemePreference: 'auto',
            density: 'comfortable',
            densityPreference: 'auto',
            motion: 'full',
            motionPreference: 'system',
            modality: 'mouse',
            modalityPreference: 'mouse',
            pointer: 'coarse',
            pointerPreference: 'coarse',
            adaptiveBand: 'compact',
            viewport: 'phone',
            viewportWidth: '390px',
            containerWidth: '48rem',
            safeArea: { safeBlockEnd: '28px' },
            environmentInset: { insetBlockEnd: '28px' },
          },
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
