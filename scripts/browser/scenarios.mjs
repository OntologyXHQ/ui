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
    'typography-semantic-bidi-reflow-certification',
    ['visual', 'typography', 'semantics', 'bidi', 'rtl', 'font-fallback', 'long-string', 'zoom', 'reflow', 'selection', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 820 }, colorScheme: 'light' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Text',
          tab: 'examples',
          example: 'mixed-copy',
          theme: 'light',
          dir: 'rtl',
          viewport: 'phone',
          container: 'compact',
        });
        await page.locator('.ui-root').first().evaluate((root) => {
          root.style.setProperty('--oxs-font-sans', '"Definitely Missing OntologyX Font", system-ui, sans-serif');
        });
        const text = page.locator('[data-visual-cert="text"]');
        await text.waitFor({ state: 'visible' });
        const textState = await text.evaluate((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return {
            tagName: element.tagName,
            direction: style.direction,
            overflowWrap: style.overflowWrap,
            userSelect: style.userSelect,
            fontFamily: style.fontFamily,
            width: rect.width,
            scrollWidth: element.scrollWidth,
          };
        });
        assert.equal(textState.tagName, 'P', 'Text did not preserve paragraph semantics.');
        assert.equal(textState.direction, 'rtl', 'dir="auto" did not resolve the Persian-first mixed copy to RTL.');
        assert.equal(textState.overflowWrap, 'anywhere', 'Text long-token wrapping policy did not reach browser CSS.');
        assert.equal(textState.userSelect, 'text', 'Text selectable policy did not reach browser selection behavior.');
        assert.match(textState.fontFamily, /Definitely Missing OntologyX Font/, 'Text did not consume the overridden Foundation font stack.');
        assert.ok(textState.width > 0 && textState.scrollWidth <= Math.ceil(textState.width) + 1, 'Mixed/long Text escaped its containing width.');
        await assertNoGlobalHorizontalOverflow(page, 'Text mixed-script compact reflow');

        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.75 });
        const zoomMetrics = await cdp.send('Page.getLayoutMetrics');
        const zoom = zoomMetrics.cssVisualViewport?.scale ?? zoomMetrics.visualViewport?.scale ?? 1;
        assert.ok(zoom >= 1.7, `Chrome page-scale emulation did not apply (scale=${zoom}).`);
        await assertNoGlobalHorizontalOverflow(page, 'Text browser zoom reflow');
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });

        await gotoCatalog(page, baseUrl, {
          entry: 'Heading', tab: 'examples', example: 'semantic-rank', theme: 'light', dir: 'rtl', viewport: 'phone', container: 'compact',
        });
        const heading = page.locator('[data-visual-cert="heading"]');
        const headingState = await heading.evaluate((element) => ({
          tagName: element.tagName,
          fontSize: getComputedStyle(element).fontSize,
          maxInlineSize: getComputedStyle(element).maxInlineSize,
        }));
        assert.equal(headingState.tagName, 'H3', 'Heading visual size changed native semantic rank.');
        assert.notEqual(headingState.maxInlineSize, '11ch', 'Display/heading typography still owns a legacy content-width cap.');

        await gotoCatalog(page, baseUrl, {
          entry: 'Label', tab: 'examples', example: 'metadata-label', theme: 'light', dir: 'rtl', viewport: 'phone', container: 'compact',
        });
        const label = page.locator('[data-visual-cert="label"]');
        const labelState = await label.evaluate((element) => ({
          tagName: element.tagName,
          role: element.getAttribute('role'),
          tabIndex: element.tabIndex,
        }));
        assert.deepEqual(labelState, { tagName: 'SPAN', role: null, tabIndex: -1 }, 'Label invented control/focus semantics.');

        await gotoCatalog(page, baseUrl, {
          entry: 'Code', tab: 'examples', example: 'native-code-semantics', theme: 'dark', dir: 'rtl', viewport: 'phone', container: 'compact',
        });
        const code = page.locator('[data-visual-cert="code"]');
        const codeState = await code.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            tagName: element.tagName,
            direction: style.direction,
            overflowWrap: style.overflowWrap,
            fontFamily: style.fontFamily,
          };
        });
        assert.equal(codeState.tagName, 'KBD', 'Code did not preserve native kbd semantics.');
        assert.equal(codeState.direction, 'ltr', 'Code explicit native bidi override was lost inside RTL.');
        assert.equal(codeState.overflowWrap, 'anywhere', 'Code long-token reflow was not explicit.');
        assert.match(codeState.fontFamily, /SFMono-Regular|Cascadia Code|Roboto Mono|ui-monospace|monospace/, 'Code did not consume the Foundation monospace fallback stack.');
        await assertNoGlobalHorizontalOverflow(page, 'Code compact reflow');
        const axe = await runAxe(page, 'Typography semantic/bidi/reflow certification');
        diagnostics.assertClean('Typography semantic/bidi/reflow certification');
        return { axe, text: textState, heading: headingState, label: labelState, code: codeState, zoom };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Text', 'Heading', 'Label', 'Code'] },
  ),

  scenario(
    'icon-multistate-transition-certification',
    ['visual', 'icon', 'multi-state', 'transient-state', 'motion', 'reduced-motion', 'interruption', 'current-color', 'rtl', 'custom-glyph', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 920, height: 760 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Icon', tab: 'examples', example: 'state-transition', theme: 'dark', dir: 'ltr', motion: 'full', viewport: 'fit', container: 'compact',
        });
        const icon = page.locator('[data-visual-cert="stateful-icon"]');
        const toggle = page.getByRole('button', { name: 'Toggle playback icon' });
        await icon.waitFor({ state: 'visible' });
        const initial = await icon.evaluate((element) => ({
          state: element.getAttribute('data-oxs-icon-state'),
          visual: element.getAttribute('data-oxs-icon-visual-state'),
          phase: element.getAttribute('data-oxs-icon-phase'),
          stroke: getComputedStyle(element).stroke,
          color: getComputedStyle(element).color,
          geometry: element.getBoundingClientRect().toJSON(),
        }));
        assert.deepEqual(
          { state: initial.state, visual: initial.visual, phase: initial.phase },
          { state: 'play', visual: 'play', phase: 'stable' },
          'Playback Icon did not begin in its declared stable state.',
        );
        assert.equal(initial.stroke, initial.color, 'Icon stroke did not resolve through currentColor.');

        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () => {
            const target = document.querySelector('[data-visual-cert="stateful-icon"]');
            return target?.getAttribute('data-oxs-icon-phase') === 'transitioning'
              && target.getAttribute('data-oxs-icon-visual-state') === 'pausing';
          },
          undefined,
          { timeout: 1000 },
        );
        const firstTransition = await icon.evaluate((target) => ({
          state: target.getAttribute('data-oxs-icon-state'),
          visual: target.getAttribute('data-oxs-icon-visual-state'),
          phase: target.getAttribute('data-oxs-icon-phase'),
          from: target.getAttribute('data-oxs-icon-from'),
          to: target.getAttribute('data-oxs-icon-to'),
          transient: target.querySelector('.ui-icon__transition')?.getAttribute('data-oxs-icon-transient') ?? null,
        }));
        assert.deepEqual(firstTransition, {
          state: 'pause', visual: 'pausing', phase: 'transitioning', from: 'play', to: 'pause', transient: 'pausing',
        }, 'Icon did not publish the explicit play → pausing → pause transition contract.');

        await page.waitForFunction(
          () => document.querySelector('[data-visual-cert="stateful-icon"]')?.getAttribute('data-oxs-icon-phase') === 'stable',
          undefined,
          { timeout: 1000 },
        );
        assert.equal(await icon.getAttribute('data-oxs-icon-visual-state'), 'pause', 'Icon did not settle on the destination stable state.');

        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () => document.querySelector('[data-visual-cert="stateful-icon"]')?.getAttribute('data-oxs-icon-visual-state') === 'playing',
          undefined,
          { timeout: 1000 },
        );
        const interruptedFirst = await icon.getAttribute('data-oxs-icon-visual-state');
        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () => {
            const target = document.querySelector('[data-visual-cert="stateful-icon"]');
            return target?.getAttribute('data-oxs-icon-phase') === 'transitioning'
              && target.getAttribute('data-oxs-icon-visual-state') === 'pausing'
              && target.getAttribute('data-oxs-icon-state') === 'pause';
          },
          undefined,
          { timeout: 1000 },
        );
        const interrupted = {
          first: interruptedFirst,
          second: await icon.getAttribute('data-oxs-icon-visual-state'),
          phase: await icon.getAttribute('data-oxs-icon-phase'),
          destination: await icon.getAttribute('data-oxs-icon-state'),
        };
        assert.deepEqual(interrupted, { first: 'playing', second: 'pausing', phase: 'transitioning', destination: 'pause' }, 'Interrupted Icon transition did not retarget through declared transient states.');
        await page.waitForFunction(
          () => document.querySelector('[data-visual-cert="stateful-icon"]')?.getAttribute('data-oxs-icon-phase') === 'stable',
          undefined,
          { timeout: 1000 },
        );
        assert.equal(await icon.getAttribute('data-oxs-icon-state'), 'pause', 'Interrupted Icon did not settle at the newest semantic destination.');

        await gotoCatalog(page, baseUrl, {
          entry: 'Icon', tab: 'examples', example: 'state-transition', theme: 'dark', dir: 'ltr', motion: 'reduced', viewport: 'fit', container: 'compact',
        });
        const reducedIcon = page.locator('[data-visual-cert="stateful-icon"]');
        const reducedToggle = page.getByRole('button', { name: 'Toggle playback icon' });
        const reducedBefore = await reducedIcon.getAttribute('data-oxs-icon-state');
        const reducedExpected = reducedBefore === 'play' ? 'pause' : 'play';
        await reducedToggle.click();
        await page.waitForFunction(
          (expected) => {
            const target = document.querySelector('[data-visual-cert="stateful-icon"]');
            return target?.getAttribute('data-oxs-icon-phase') === 'stable'
              && target.getAttribute('data-oxs-icon-state') === expected
              && target.getAttribute('data-oxs-icon-visual-state') === expected;
          },
          reducedExpected,
          { timeout: 1000 },
        );
        assert.equal(await reducedIcon.getAttribute('data-oxs-icon-state'), reducedExpected, 'Reduced-motion Icon did not settle at the requested stable state.');
        assert.equal(await reducedIcon.getAttribute('data-oxs-icon-visual-state'), reducedExpected, 'Reduced-motion Icon leaked a persistent transient visual state.');

        await gotoCatalog(page, baseUrl, {
          entry: 'Icon', tab: 'examples', example: 'static-extension', theme: 'light', dir: 'ltr', motion: 'full', viewport: 'fit', container: 'compact',
        });
        const rtlIcon = page.locator('[data-visual-cert="rtl-icon"]');
        const ltrIcon = page.locator('[data-visual-cert="ltr-icon"]');
        const custom = page.locator('[data-visual-cert="custom-icon"]');
        const staticState = await Promise.all([rtlIcon, ltrIcon, custom].map((locator) => locator.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            transform: style.transform,
            direction: style.direction,
            inlineTransform: style.getPropertyValue('--oxs-icon-inline-transform').trim(),
            paths: element.querySelectorAll('path').length,
            role: element.getAttribute('role'),
            focusable: element.getAttribute('focusable'),
          };
        })));
        assert.equal(staticState[0].direction, 'rtl', 'Nested RTL fixture did not resolve RTL direction on the Icon itself.');
        assert.equal(staticState[0].inlineTransform, 'scaleX(-1)', 'Nested RTL direction boundary did not publish the mirrored inline transform to Icon.');
        assert.notEqual(staticState[0].transform, 'none', 'Directional Icon did not mirror from its nested local RTL direction.');
        assert.equal(staticState[1].direction, 'ltr', 'Nested LTR fixture did not resolve LTR direction on the Icon itself.');
        assert.equal(staticState[1].inlineTransform, 'none', 'Nested LTR direction boundary did not reset the inherited Icon inline transform.');
        assert.equal(staticState[1].transform, 'none', 'Directional Icon leaked mirroring into a nested local LTR direction.');
        assert.equal(staticState[2].paths, 1, 'Custom defineUiIcon path shorthand did not render through the shared glyph contract.');
        assert.equal(staticState[2].role, 'img', 'Labeled custom Icon did not expose standalone image semantics.');
        assert.equal(staticState[2].focusable, 'false', 'Icon became independently focusable.');
        const axe = await runAxe(page, 'Icon multi-state transition certification');
        diagnostics.assertClean('Icon multi-state transition certification');
        return { axe, initial, firstTransition, interrupted, staticState };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Icon'] },
  ),

  scenario(
    'icon-pack-breadth-certification',
    ['visual', 'icon', 'icon-pack', 'static-pack', 'animated-pack', 'multi-state', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1040, height: 820 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Icon', tab: 'examples', example: 'icon-pack', theme: 'dark', dir: 'ltr', motion: 'full', viewport: 'fit', container: 'wide',
        });
        const pack = page.locator('[data-visual-cert="icon-pack"]');
        await pack.waitFor({ state: 'visible' });
        const staticSamples = pack.locator('[data-icon-pack-static="true"]');
        const animatedSamples = pack.locator('[data-icon-pack-animated]');
        assert.ok(await staticSamples.count() >= 12, 'Icon pack Studio evidence did not render a broad static sample.');
        assert.ok(await animatedSamples.count() >= 6, 'Icon pack Studio evidence did not render multiple animated families.');
        const reportedStaticCount = Number(await pack.getAttribute('data-icon-pack-static-count'));
        const reportedAnimatedCount = Number(await pack.getAttribute('data-icon-pack-animated-count'));
        assert.ok(
          Number.isInteger(reportedStaticCount) && reportedStaticCount >= 240,
          `Icon pack reported an invalid static export count: ${reportedStaticCount}.`,
        );
        assert.ok(
          Number.isInteger(reportedAnimatedCount) && reportedAnimatedCount >= 20,
          `Icon pack reported an invalid animated-family count: ${reportedAnimatedCount}.`,
        );
        await pack.getByText(`${reportedStaticCount} static exports`, { exact: false }).waitFor({ state: 'visible' });
        await pack.getByText(`${reportedAnimatedCount} animated state families`, { exact: false }).waitFor({ state: 'visible' });

        const playback = pack.locator('[data-icon-pack-animated="playback"]');
        assert.equal(await playback.getAttribute('data-oxs-icon-state'), 'play', 'Pack playback family did not expose its initial stable state.');
        await page.getByRole('button', { name: 'Toggle animated icon pack' }).click();
        await page.waitForFunction(
          () => {
            const target = document.querySelector('[data-icon-pack-animated="playback"]');
            return target?.getAttribute('data-oxs-icon-state') === 'pause'
              && target.getAttribute('data-oxs-icon-phase') === 'stable'
              && target.getAttribute('data-oxs-icon-visual-state') === 'pause';
          },
          undefined,
          { timeout: 1000 },
        );
        await page.waitForFunction(
          () => {
            const expected = {
              favorite: 'on',
              lock: 'unlocked',
              connectivity: 'online',
              theme: 'dark',
              activity: 'active',
            };
            return Object.entries(expected).every(([selector, state]) => {
              const target = document.querySelector(`[data-icon-pack-animated="${selector}"]`);
              return target?.getAttribute('data-oxs-icon-phase') === 'stable'
                && target.getAttribute('data-oxs-icon-state') === state
                && target.getAttribute('data-oxs-icon-visual-state') === state;
            });
          },
          undefined,
          { timeout: 1000 },
        );
        for (const [selector, expected] of [
          ['favorite', 'on'],
          ['lock', 'unlocked'],
          ['connectivity', 'online'],
          ['theme', 'dark'],
          ['activity', 'active'],
        ]) {
          assert.equal(
            await pack.locator(`[data-icon-pack-animated="${selector}"]`).getAttribute('data-oxs-icon-state'),
            expected,
            `Animated icon-pack family ${selector} did not converge to its requested stable state.`,
          );
        }
        await assertNoGlobalHorizontalOverflow(page, 'Icon pack breadth');
        const axe = await runAxe(page, 'Icon pack breadth certification');
        diagnostics.assertClean('Icon pack breadth certification');
        return { axe, staticSamples: await staticSamples.count(), animatedSamples: await animatedSamples.count() };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Icon'] },
  ),

  scenario(
    'surface-divider-visual-boundary-certification',
    ['visual', 'surface', 'material', 'elevation', 'border', 'static-state', 'divider', 'separator', 'logical-inset', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 780 }, colorScheme: 'dark' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        await gotoCatalog(page, baseUrl, {
          entry: 'Surface', tab: 'examples', example: 'material-boundary', theme: 'dark', dir: 'rtl', viewport: 'fit', container: 'compact',
        });
        const surface = page.locator('[data-visual-cert="surface"]');
        await surface.waitFor({ state: 'visible' });
        const surfaceState = await surface.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            background: style.backgroundColor,
            backdropFilter: style.backdropFilter,
            boxShadow: style.boxShadow,
            borderWidth: style.borderTopWidth,
            borderColor: style.borderTopColor,
            borderRadius: style.borderRadius,
            overflow: style.overflow,
            role: element.getAttribute('role'),
            tabIndex: element.tabIndex,
          };
        });
        assert.notEqual(surfaceState.background, 'rgba(0, 0, 0, 0)', 'Glass Surface did not resolve a semantic material background.');
        assert.notEqual(surfaceState.backdropFilter, 'none', 'Glass Surface did not resolve its material blur/saturation token.');
        assert.notEqual(surfaceState.boxShadow, 'none', 'Surface elevation=2 did not resolve Foundation elevation.');
        assert.equal(surfaceState.borderWidth, '1px', 'Surface strong border did not remain token-backed hairline geometry.');
        assert.equal(surfaceState.overflow, 'hidden', 'Surface clip did not clip visual descendants.');
        assert.deepEqual({ role: surfaceState.role, tabIndex: surfaceState.tabIndex }, { role: null, tabIndex: -1 }, 'Surface invented interaction/accessibility semantics by default.');

        await gotoCatalog(page, baseUrl, {
          entry: 'Divider', tab: 'examples', example: 'separator-semantics', theme: 'dark', dir: 'rtl', viewport: 'fit', container: 'compact',
        });
        const horizontal = page.locator('[data-visual-cert="horizontal-divider"]');
        const vertical = page.locator('[data-visual-cert="vertical-divider"]');
        const decorative = page.locator('[data-visual-cert="decorative-divider"]');
        const dividerState = await Promise.all([horizontal, vertical, decorative].map((locator) => locator.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            role: element.getAttribute('role'),
            ariaHidden: element.getAttribute('aria-hidden'),
            orientation: element.getAttribute('aria-orientation'),
            inlineSize: style.inlineSize,
            blockSize: style.blockSize,
            marginInlineStart: style.marginInlineStart,
            marginInlineEnd: style.marginInlineEnd,
            marginBlockStart: style.marginBlockStart,
            marginBlockEnd: style.marginBlockEnd,
            background: style.backgroundColor,
          };
        })));
        assert.equal(dividerState[0].role, 'separator', 'Horizontal Divider lost separator semantics.');
        assert.equal(dividerState[0].orientation, 'horizontal', 'Horizontal Divider lost aria-orientation.');
        assert.equal(dividerState[0].marginInlineStart, '16px', 'Divider inset="start" did not use logical inline-start spacing under RTL.');
        assert.equal(dividerState[1].orientation, 'vertical', 'Vertical Divider lost aria-orientation.');
        assert.equal(dividerState[1].inlineSize, '2px', 'Strong vertical Divider did not resolve the strong border thickness token.');
        assert.equal(dividerState[1].marginBlockStart, '16px', 'Vertical Divider inset did not use logical block-start spacing.');
        assert.equal(dividerState[1].marginBlockEnd, '16px', 'Vertical Divider inset did not use logical block-end spacing.');
        assert.equal(dividerState[2].role, 'none', 'Decorative Divider did not remove separator semantics.');
        assert.equal(dividerState[2].ariaHidden, 'true', 'Decorative Divider was not hidden from accessibility APIs.');
        await assertNoGlobalHorizontalOverflow(page, 'Surface/Divider visual boundary');
        const axe = await runAxe(page, 'Surface and Divider visual boundary certification');
        diagnostics.assertClean('Surface and Divider visual boundary certification');
        return { axe, surface: surfaceState, dividers: dividerState };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Surface', 'Divider'] },
  ),

  scenario(
    'ox-loading-heartbeat-motion-certification',
    ['visual', 'brand', 'loading', 'motion', 'heartbeat', 'reduced-motion'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 920, height: 720 }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, { entry: 'Spinner', tab: 'examples', example: 'ox-loading', motion: 'full' });
        const marks = workbench.locator('[data-oxs-loading-mark="ox"]');
        assert.equal(await marks.count(), 1, 'Spinner canonical example must show one OX loading mark, not duplicate the control-loading treatment.');
        const mark = marks.first();
        await mark.waitFor({ state: 'visible' });
        const bootSpinner = workbench.locator('[data-oxs-spinner-purpose="boot"]');
        await bootSpinner.waitFor({ state: 'visible' });
        const bootGeometry = await bootSpinner.evaluate((element) => {
          const orbit = element.querySelector('.ui-ox-loading-mark__orbit');
          const rect = element.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            orbitStrokeWidth: orbit ? Number.parseFloat(getComputedStyle(orbit).strokeWidth) : Number.NaN,
          };
        });
        assert.ok(bootGeometry.width >= 120 && bootGeometry.height >= 120, `Boot OX loader is too small (${bootGeometry.width}×${bootGeometry.height}).`);
        assert.ok(bootGeometry.orbitStrokeWidth >= 2.3, `Boot OX loader lost its display-scale stroke weight (${bootGeometry.orbitStrokeWidth}).`);
        assert.equal(await mark.getAttribute('data-oxs-loading-choreography'), 'write-heartbeat-release', 'OX loader lost its branded choreography identity.');
        const motion = await mark.evaluate(async (element) => {
          const orbit = element.querySelector('.ui-ox-loading-mark__orbit');
          const strokeA = element.querySelector('.ui-ox-loading-mark__cross-stroke--a');
          const strokeB = element.querySelector('.ui-ox-loading-mark__cross-stroke--b');
          const cross = element.querySelector('.ui-ox-loading-mark__cross');
          const primaryEcho = element.querySelector('.ui-ox-loading-mark__echo--primary');
          if (!(orbit && strokeA && strokeB && cross && primaryEcho)) throw new Error('OX heartbeat fixture is incomplete.');
          const animations = element.getAnimations({ subtree: true });
          const orbitAnimation = orbit.getAnimations()[0];
          if (!orbitAnimation?.effect || typeof orbitAnimation.effect.getKeyframes !== 'function') {
            throw new Error('OX orbit animation does not expose inspectable keyframes.');
          }
          await Promise.all(animations.map((animation) => animation.ready));
          animations.forEach((animation) => animation.pause());
          const duration = Number(getComputedStyle(orbit).animationDuration.replace('s', '')) * 1000;
          const parseDasharray = (value) => String(value)
            .split(/[\s,]+/)
            .map((part) => Number.parseFloat(part))
            .filter(Number.isFinite);
          const keyframes = orbitAnimation.effect.getKeyframes();
          const firstKeyframe = keyframes[0];
          const lastKeyframe = keyframes.at(-1);
          const sample = async (time) => {
            animations.forEach((animation) => { animation.currentTime = time; });
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const orbitStyle = getComputedStyle(orbit);
            return {
              orbitDasharray: orbitStyle.strokeDasharray,
              orbitDasharrayParts: parseDasharray(orbitStyle.strokeDasharray),
              orbitDashoffset: Number.parseFloat(orbitStyle.strokeDashoffset),
              timing: orbitStyle.animationTimingFunction,
              strokeA: Number.parseFloat(getComputedStyle(strokeA).strokeDashoffset),
              strokeB: Number.parseFloat(getComputedStyle(strokeB).strokeDashoffset),
              crossTransform: getComputedStyle(cross).transform,
              echoOpacity: Number.parseFloat(getComputedStyle(primaryEcho).opacity),
            };
          };
          const start = await sample(0);
          const preSeam = await sample(Math.max(0, duration - Math.min(16, duration * 0.008)));
          const wrapped = await sample(duration);
          return {
            duration,
            animationCount: animations.length,
            keyframeSeam: {
              startDasharray: parseDasharray(firstKeyframe?.strokeDasharray ?? ''),
              endDasharray: parseDasharray(lastKeyframe?.strokeDasharray ?? ''),
              startDashoffset: Number.parseFloat(String(firstKeyframe?.strokeDashoffset ?? 'NaN')),
              endDashoffset: Number.parseFloat(String(lastKeyframe?.strokeDashoffset ?? 'NaN')),
            },
            start,
            writing: await sample(duration * 0.24),
            locked: await sample(duration * 0.39),
            firstBeat: await sample(duration * 0.42),
            secondBeat: await sample(duration * 0.49),
            release: await sample(duration * 0.82),
            preSeam,
            wrapped,
          };
        });
        assert.ok(motion.animationCount >= 6, `OX loader lost part of its choreography (${motion.animationCount} animations).`);
        assert.ok(motion.duration >= 1600 && motion.duration <= 2400, `OX heartbeat period is outside the expressive range (${motion.duration}ms).`);
        assert.notEqual(motion.start.timing, 'linear', 'OX loading motion regressed to linear timing.');
        assert.ok(Math.abs(motion.writing.strokeA) < Math.abs(motion.start.strokeA), 'First X stroke did not visibly write into the mark.');
        assert.ok(Math.abs(motion.locked.strokeA) < 0.05 && Math.abs(motion.locked.strokeB) < 0.05, 'OX mark did not reach a fully written lock phase.');
        assert.notEqual(motion.firstBeat.crossTransform, motion.locked.crossTransform, 'Primary heartbeat did not deform the X mark.');
        assert.notEqual(motion.secondBeat.crossTransform, motion.locked.crossTransform, 'Secondary heartbeat did not produce the dub beat.');
        assert.ok(motion.firstBeat.echoOpacity > 0.1, 'Primary heartbeat did not emit the O-ring echo.');
        assert.notEqual(motion.release.orbitDasharray, motion.locked.orbitDasharray, 'O-ring did not release after the heartbeat lock.');
        const dashDistance = (left, right) => Math.max(
          ...left.map((value, index) => Math.abs(value - (right[index] ?? Number.NaN))),
        );
        const circularDistance = (left, right, period) => {
          const raw = Math.abs(left - right) % period;
          return Math.min(raw, period - raw);
        };
        assert.ok(
          motion.keyframeSeam.startDasharray.length === motion.keyframeSeam.endDasharray.length
            && dashDistance(motion.keyframeSeam.startDasharray, motion.keyframeSeam.endDasharray) < 0.05,
          'OX authored loop endpoints do not preserve the same orbit shape.',
        );
        assert.ok(
          Math.abs(Math.abs(motion.keyframeSeam.endDashoffset - motion.keyframeSeam.startDashoffset) - 100) < 0.05,
          'OX authored loop endpoints are not one pathLength-equivalent revolution apart.',
        );
        assert.ok(
          motion.preSeam.orbitDasharrayParts.length === motion.start.orbitDasharrayParts.length
            && dashDistance(motion.preSeam.orbitDasharrayParts, motion.start.orbitDasharrayParts) < 2.5,
          'OX orbit shape does not converge smoothly into the loop boundary.',
        );
        assert.ok(
          circularDistance(motion.preSeam.orbitDashoffset, motion.start.orbitDashoffset, 100) < 2.5,
          'OX orbit phase does not converge smoothly into the loop boundary.',
        );
        assert.ok(
          motion.wrapped.orbitDasharrayParts.length === motion.start.orbitDasharrayParts.length
            && dashDistance(motion.wrapped.orbitDasharrayParts, motion.start.orbitDasharrayParts) < 0.05,
          'OX wrapped iteration does not restart at the authored orbit shape.',
        );
        assert.ok(
          circularDistance(motion.wrapped.orbitDashoffset, motion.start.orbitDashoffset, 100) < 0.05,
          'OX wrapped iteration does not restart at the equivalent orbit phase.',
        );

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.locator('.ui-root').evaluate((root) => root.setAttribute('data-oxs-motion', 'reduced'));
        const reduced = await mark.evaluate((element) => {
          const orbit = element.querySelector('.ui-ox-loading-mark__orbit');
          const strokes = [...element.querySelectorAll('.ui-ox-loading-mark__cross-stroke')];
          const echoes = [...element.querySelectorAll('.ui-ox-loading-mark__echo')];
          return {
            animations: element.getAnimations({ subtree: true }).length,
            orbitDasharray: getComputedStyle(orbit).strokeDasharray,
            strokeOffsets: strokes.map((stroke) => Number.parseFloat(getComputedStyle(stroke).strokeDashoffset)),
            echoOpacity: echoes.map((echo) => Number.parseFloat(getComputedStyle(echo).opacity)),
          };
        });
        assert.equal(reduced.animations, 0, 'Reduced-motion OX mark retained active animations.');
        assert.ok(reduced.strokeOffsets.every((offset) => Math.abs(offset) < 0.05), 'Reduced-motion OX mark did not settle to a fully written X.');
        assert.ok(reduced.echoOpacity.every((opacity) => opacity === 0), 'Reduced-motion OX mark retained heartbeat echoes.');
        diagnostics.assertClean('OX loading heartbeat motion');
        return { motion, reduced };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'interaction-kernel-shared-typeahead',
    ['interaction-kernel', 'keyboard', 'typeahead', 'selection', 'focus'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1100, height: 820 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const selectWorkbench = await gotoCatalog(page, baseUrl, { entry: 'Select', tab: 'examples', example: 'overview' });
        const select = selectWorkbench.getByRole('combobox', { name: 'Density', exact: true });
        await select.waitFor({ state: 'visible' });
        await select.focus();
        await page.keyboard.press('c');
        await page.keyboard.press('c');
        assert.match(await select.innerText(), /Compact/, 'Repeated-key Select typeahead did not cycle through the shared matcher.');
        await page.waitForTimeout(760);
        await page.keyboard.press('c');
        assert.match(await select.innerText(), /Comfortable/, 'Delayed Select typeahead did not reset to the first matching choice.');

        const menuWorkbench = await gotoCatalog(page, baseUrl, { entry: 'Menu', tab: 'examples', example: 'preview' });
        const trigger = menuWorkbench.getByRole('button', { name: 'Open menu', exact: true });
        await trigger.click();
        const menu = page.getByRole('menu', { name: 'Preview menu' });
        await menu.waitFor({ state: 'visible' });
        await page.keyboard.press('d');
        const duplicate = page.getByRole('menuitem', { name: 'Duplicate', exact: true });
        assert.equal(
          await duplicate.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Menu did not use the shared typeahead matcher relative to its owning Document focus.',
        );
        await page.keyboard.press('Space');
        await menu.waitFor({ state: 'detached' });
        assert.equal(
          await trigger.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Space activation after typeahead did not preserve native MenuItem activation/focus return.',
        );
        diagnostics.assertClean('interaction kernel shared typeahead');
        return { repeatedSelectCycle: true, delayedReset: true, menuFocus: true };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'pointer-cancellation-and-activation',
    ['interaction-kernel', 'pointer', 'cancellation', 'activation'],
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
    ['interaction-kernel', 'touch', 'coarse-pointer', 'long-press', 'overlay', 'a11y'],
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
