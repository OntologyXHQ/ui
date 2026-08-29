import assert from 'node:assert/strict';
import {
  assertEnvironment,
  assertMinimumBlockSize,
  assertNoGlobalHorizontalOverflow,
  assertPublicUiStylesLoaded,
  assertVisibleFocus,
  assertWithinViewport,
  attachRuntimeDiagnostics,
  focusByTab,
  gotoCatalog,
  gotoSemanticWorkbench,
  performPointerCancel,
  performTouchLongPress,
  runAxe,
  waitForStudioExampleControl,
} from './harness.mjs';

function scenario(id, axes, run, { accepts = [] } = {}) {
  return { id, axes, accepts, run };
}

export const browserScenarios = [
  scenario(
    'studio-route-environment-a11y',
    [
      'route',
      'a11y',
      'theme',
      'ltr',
      'desktop',
      'studio',
      'catalog',
      'search',
      'deep-link',
      'api-docs',
      'evidence',
      'real-preview',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        colorScheme: 'dark',
      });
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

        const environmentToolbar = page.getByRole('toolbar', {
          name: 'Global UI environment',
          exact: true,
        });
        const controlRoot = page.locator('.ui-studio-environment-control-root');
        const directionTrigger = environmentToolbar.getByRole('combobox', {
          name: 'Direction',
          exact: true,
        });
        const densityTrigger = environmentToolbar.getByRole('combobox', {
          name: 'Density',
          exact: true,
        });
        await assertWithinViewport(
          directionTrigger,
          'Studio direction control before environment change',
        );

        await directionTrigger.click();
        await page.getByRole('option', { name: 'Direction: RTL', exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('.ui-studio-root')?.getAttribute('data-oxs-direction') === 'rtl',
        );
        assert.deepEqual(
          await controlRoot.evaluate((element) => ({
            direction: element.getAttribute('data-oxs-direction'),
            density: element.getAttribute('data-oxs-density'),
          })),
          { direction: 'ltr', density: 'comfortable' },
          'Studio environment controls must stay on a stable LTR/comfortable control plane.',
        );
        await assertWithinViewport(
          directionTrigger,
          'Studio direction control after RTL preview change',
        );

        await directionTrigger.click();
        await page.getByRole('option', { name: 'Direction: LTR', exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('.ui-studio-root')?.getAttribute('data-oxs-direction') === 'ltr',
        );
        await assertWithinViewport(
          directionTrigger,
          'Studio direction control after LTR preview change',
        );

        const densityProbe = workbench
          .locator('#example-contract')
          .getByRole('button', { name: 'Secondary', exact: true });
        await densityProbe.waitFor({ state: 'visible' });
        const comfortableHeight = await densityProbe.evaluate(
          (element) => element.getBoundingClientRect().height,
        );
        await densityTrigger.click();
        await page.getByRole('option', { name: 'Density: compact', exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('.ui-studio-root')?.getAttribute('data-oxs-density') ===
            'compact',
        );
        const compactHeight = await densityProbe.evaluate(
          (element) => element.getBoundingClientRect().height,
        );
        assert.ok(
          comfortableHeight - compactHeight >= 6,
          `Studio density control did not produce a visible Component density delta (${comfortableHeight}px comfortable vs ${compactHeight}px compact).`,
        );
        assert.equal(
          await controlRoot.getAttribute('data-oxs-density'),
          'comfortable',
          'Preview density leaked back into the Studio control plane.',
        );
        await densityTrigger.click();
        await page.getByRole('option', { name: 'Density: comfortable', exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('.ui-studio-root')?.getAttribute('data-oxs-density') ===
            'comfortable',
        );

        await assertWithinViewport(workbench, 'Button Studio workbench');
        const stacked = await workbench.evaluate((element) => {
          const sections = [...element.querySelectorAll('[data-studio-section]')];
          return {
            layout: element.getAttribute('data-studio-layout'),
            tablists: element.querySelectorAll('[role="tablist"]').length,
            sections: sections.map((section) => ({
              id: section.getAttribute('data-studio-section'),
              visible: section instanceof HTMLElement && section.getBoundingClientRect().height > 0,
              top: section instanceof HTMLElement ? section.getBoundingClientRect().top : 0,
            })),
            apiScrollRegion: (() => {
              const region = element.querySelector('.ui-studio-api-table-wrap');
              return region instanceof HTMLElement
                ? {
                    role: region.getAttribute('role'),
                    label: region.getAttribute('aria-label'),
                    tabIndex: region.tabIndex,
                  }
                : null;
            })(),
          };
        });
        assert.equal(
          stacked.layout,
          'stacked',
          'Studio catalog did not publish the stacked reading-flow contract.',
        );
        assert.equal(
          stacked.tablists,
          0,
          'Studio catalog chrome regressed to a tabbed documentation layout.',
        );
        assert.deepEqual(
          stacked.sections.map((section) => section.id),
          ['overview', 'api', 'examples', 'playground'],
          'Studio stacked section order drifted.',
        );
        assert.ok(
          stacked.sections.every((section) => section.visible),
          'Studio stacked documentation did not keep every section mounted and visible.',
        );
        assert.ok(
          stacked.sections.every(
            (section, index) => index === 0 || section.top > stacked.sections[index - 1].top,
          ),
          'Studio stacked documentation sections are not laid out in reading order.',
        );
        assert.deepEqual(
          stacked.apiScrollRegion,
          { role: 'region', label: 'Button API reference', tabIndex: 0 },
          'Studio API overflow wrapper must remain a named keyboard-focusable scroll region.',
        );

        const livePreview = workbench.locator('.ui-studio-component-preview');
        await livePreview.getByRole('button', { name: 'Continue', exact: true }).waitFor({
          state: 'visible',
        });
        assert.equal(
          await workbench
            .locator('[data-studio-acceptance-evidence]')
            .getAttribute('data-studio-acceptance-evidence'),
          'bound',
          'Studio inferred documentation completeness instead of binding real certification evidence.',
        );
        assert.ok(
          (await workbench.locator('[data-studio-certification-owner]').textContent())?.trim(),
          'Studio acceptance evidence did not expose its certification owner.',
        );
        assert.ok(
          (await workbench.locator('[data-studio-browser-scenario]').textContent())?.includes(
            'button-action-contract-certification',
          ),
          'Studio acceptance evidence did not expose the real Button G6 scenario.',
        );
        assert.equal(
          await workbench
            .locator('[data-studio-certification-result]')
            .getAttribute('data-studio-certification-result'),
          'certified',
          'Studio acceptance evidence did not expose a concrete certification result.',
        );
        assert.ok(
          (await workbench.locator('[data-studio-evidence-links] a').count()) >= 2,
          'Studio acceptance evidence did not expose source links for G5/G6 ownership.',
        );
        assert.equal(
          await workbench.getByText('No JSDoc yet.', { exact: true }).count(),
          0,
          'Accepted Studio API reference still contains inferred/missing prop documentation.',
        );

        assert.equal(
          await page.locator('[data-studio-catalog-filters]').count(),
          1,
          'Studio catalog did not expose its status/layer information-architecture filters.',
        );
        let catalogSearch = page.getByRole('searchbox', {
          name: 'Search UI catalog',
          exact: true,
        });
        const catalogFilters = page.locator('[data-studio-catalog-filters]');
        await catalogFilters.waitFor({ state: 'visible' });
        let layerFilter = catalogFilters.getByRole('combobox', {
          name: 'Catalog layer',
          exact: true,
        });
        let statusFilter = catalogFilters.getByRole('combobox', {
          name: 'Lifecycle status',
          exact: true,
        });
        const filterGeometry = await catalogFilters.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const triggers = [...element.querySelectorAll('[role="combobox"]')].map((trigger) => {
            const triggerRect = trigger.getBoundingClientRect();
            return {
              width: triggerRect.width,
              height: triggerRect.height,
              visibility: getComputedStyle(trigger).visibility,
            };
          });
          return { width: rect.width, height: rect.height, triggers };
        });
        assert.ok(
          filterGeometry.width > 0 &&
            filterGeometry.height > 0 &&
            filterGeometry.triggers.length === 2 &&
            filterGeometry.triggers.every(
              (trigger) =>
                trigger.width > 0 && trigger.height >= 44 && trigger.visibility === 'visible',
            ),
          `Studio catalog filters are not visibly reachable: ${JSON.stringify(filterGeometry)}`,
        );
        await assertWithinViewport(layerFilter, 'Studio catalog layer filter');
        await assertWithinViewport(statusFilter, 'Studio lifecycle status filter');

        await layerFilter.click();
        await page.getByRole('option', { name: 'Components', exact: true }).click();
        await statusFilter.click();
        await page.getByRole('option', { name: 'Accepted', exact: true }).click();
        await catalogSearch.fill('Button');
        let routeState = new URL(page.url()).searchParams;
        assert.equal(
          routeState.get('q'),
          'Button',
          'Studio search query is not shareable URL state.',
        );
        assert.equal(
          routeState.get('layer'),
          'components',
          'Studio layer filter is not shareable.',
        );
        assert.equal(
          routeState.get('status'),
          'accepted',
          'Studio status filter is not shareable.',
        );

        await page.reload({ waitUntil: 'domcontentloaded' });
        catalogSearch = page.getByRole('searchbox', { name: 'Search UI catalog', exact: true });
        layerFilter = catalogFilters.getByRole('combobox', {
          name: 'Catalog layer',
          exact: true,
        });
        statusFilter = catalogFilters.getByRole('combobox', {
          name: 'Lifecycle status',
          exact: true,
        });
        await page.getByRole('button', { name: 'Open Button', exact: true }).waitFor({
          state: 'visible',
        });
        assert.equal(
          await catalogSearch.inputValue(),
          'Button',
          'Reload lost shareable catalog query.',
        );

        await layerFilter.click();
        await page.getByRole('option', { name: 'All layers', exact: true }).click();
        await catalogSearch.fill('SystemKeyboardHost');
        const keyboardLink = page.getByRole('button', {
          name: 'Open SystemKeyboardHost',
          exact: true,
        });
        await keyboardLink.waitFor({ state: 'visible' });
        await keyboardLink.click();
        const keyboardWorkbench = page.locator('[data-studio-entry="SystemKeyboardHost"]');
        await keyboardWorkbench.waitFor({ state: 'visible' });
        const keyboardPreview = keyboardWorkbench.locator('.ui-studio-component-preview');
        await keyboardPreview
          .getByRole('group', { name: 'System touch keyboard', exact: true })
          .waitFor({ state: 'visible' });
        assert.equal(
          await keyboardPreview.locator('[data-oxs-system-keyboard-purpose="text"]').count(),
          1,
          'Studio live preview retained stale props across Button -> SystemKeyboardHost navigation.',
        );
        assert.equal(
          new URL(page.url()).searchParams.get('entry'),
          'SystemKeyboardHost',
          'Studio catalog search navigation did not produce a durable deep link.',
        );
        assert.equal(
          new URL(page.url()).searchParams.get('q'),
          'SystemKeyboardHost',
          'Studio search navigation lost the shareable query state.',
        );
        assert.equal(
          await keyboardWorkbench
            .locator('[data-studio-acceptance-evidence]')
            .getAttribute('data-studio-acceptance-evidence'),
          'bound',
          'System Studio entry lost its real certification evidence binding.',
        );

        await catalogSearch.fill('ContextMenu');
        await page.getByRole('button', { name: 'Open ContextMenu', exact: true }).click();
        const contextWorkbench = page.locator('[data-studio-entry="ContextMenu"]');
        await contextWorkbench.waitFor({ state: 'visible' });
        assert.equal(
          await contextWorkbench
            .locator('.ui-studio-component-preview [data-studio-preview-mode]')
            .getAttribute('data-studio-preview-mode'),
          'dedicated',
          'Complex ContextMenu preview regressed to an inferred family/example fallback.',
        );
        await contextWorkbench
          .locator('.ui-studio-component-preview')
          .getByRole('button', { name: 'Right-click or long-press', exact: true })
          .waitFor({ state: 'visible' });

        await catalogSearch.fill('SystemApplicationBrowser');
        await page
          .getByRole('button', { name: 'Open SystemApplicationBrowser', exact: true })
          .click();
        const appBrowserWorkbench = page.locator('[data-studio-entry="SystemApplicationBrowser"]');
        await appBrowserWorkbench.waitFor({ state: 'visible' });
        const hostIcon = appBrowserWorkbench.locator(
          '.ui-studio-component-preview .ui-application-item__image',
        );
        await hostIcon.waitFor({ state: 'visible' });
        assert.ok(
          (await hostIcon.getAttribute('src'))?.startsWith('data:image/svg+xml'),
          'SystemApplicationBrowser Studio preview did not render a caller-supplied host icon resource.',
        );
        await appBrowserWorkbench
          .getByText(
            'Host/App Registry owns application discovery, icon resolution and launch authority; SystemApplicationBrowser only renders supplied view models.',
            { exact: true },
          )
          .waitFor({ state: 'visible' });

        routeState = new URL(page.url()).searchParams;
        assert.equal(
          routeState.get('q'),
          'SystemApplicationBrowser',
          'Studio final deep link lost its shareable catalog search.',
        );

        const axe = await runAxe(page, 'Studio V1 workbench route');
        diagnostics.assertClean('Studio V1 workbench route');
        return {
          axe,
          stacked,
          deepLinkEntry: 'SystemApplicationBrowser',
          catalogFilters: 'shareable',
          complexPreview: 'dedicated',
          appIconOwnership: 'host',
        };
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
        const context = await browser.newContext({
          viewport: { width: 1100, height: 820 },
          colorScheme: testCase.colorScheme,
        });
        const page = await context.newPage();
        const diagnostics = attachRuntimeDiagnostics(page);
        try {
          const example = await gotoCatalog(page, baseUrl, {
            entry: 'UiRoot',
            tab: 'examples',
            example: 'token-contract',
            theme: testCase.id,
          });
          await example.waitFor({ state: 'visible' });
          const substrate = await example.evaluate((fixture) => {
            const element = fixture.closest('.ui-root');
            if (!(element instanceof HTMLElement))
              throw new Error('Foundation token fixture lost its owning UiRoot.');
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
              values: Object.fromEntries(
                roles.map((name) => [name, style.getPropertyValue(name).trim()]),
              ),
              backgroundImage: style.backgroundImage,
            };
          });
          for (const [name, value] of Object.entries(substrate.values)) {
            assert.ok(value, `${testCase.id} theme did not resolve semantic token ${name}.`);
          }
          assert.equal(
            substrate.backgroundImage,
            'none',
            `${testCase.id} UiRoot foundation leaked ornamental background imagery.`,
          );
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
    ['keyboard', 'focus', 'roving', 'activation', 'component-tabs'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Tabs',
          tab: 'examples',
          example: 'tabs-contract',
        });
        const automaticTabs = workbench.getByRole('tablist', {
          name: 'Automatic sections',
          exact: true,
        });
        const overview = automaticTabs.getByRole('tab', { name: 'Overview', exact: true });
        await focusByTab(page, overview);
        await assertVisibleFocus(overview, 'Tabs component Overview control');

        await page.keyboard.press('ArrowRight');
        const activity = automaticTabs.getByRole('tab', { name: 'Activity', exact: true });
        await activity.waitFor({ state: 'visible' });
        assert.equal(
          await activity.getAttribute('aria-selected'),
          'true',
          'ArrowRight did not automatically activate the component Activity tab.',
        );
        assert.equal(
          await activity.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Roving focus did not move to the component Activity tab.',
        );
        await assertVisibleFocus(activity, 'Tabs component Activity control');

        await page.keyboard.press('ArrowLeft');
        assert.equal(
          await overview.getAttribute('aria-selected'),
          'true',
          'ArrowLeft did not return component selection to Overview.',
        );
        diagnostics.assertClean('keyboard/roving journey');
        return { componentTabs: 'reachable', activation: 'automatic' };
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
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Dialog',
          tab: 'examples',
          example: 'overview',
        });
        const trigger = example.getByRole('button', { name: 'Open dialog', exact: true });
        await waitForStudioExampleControl(page, trigger, 'Dialog trigger');
        await focusByTab(page, trigger);
        await assertVisibleFocus(trigger, 'Dialog trigger');
        await page.keyboard.press('Enter');

        const dialog = page.getByRole('dialog', { name: 'Example dialog' });
        await dialog.waitFor({ state: 'visible' });
        assert.equal(
          await dialog.getAttribute('aria-modal'),
          'true',
          'Modal Dialog did not expose aria-modal=true.',
        );
        assert.equal(
          await dialog.evaluate((element) => element.contains(document.activeElement)),
          true,
          'Focus was not moved into the opened Dialog.',
        );

        const isolated = await page.locator('.ui-studio-shell').evaluate((element) => {
          const boundary = element.closest('[inert]');
          return {
            inert: Boolean(boundary),
            ariaHidden: boundary?.getAttribute('aria-hidden') ?? null,
          };
        });
        assert.deepEqual(
          isolated,
          { inert: true, ariaHidden: 'true' },
          'Modal overlay did not isolate the nearest Studio boundary with inert + aria-hidden.',
        );
        const axe = await runAxe(page, 'Open Dialog');

        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'detached' });
        assert.equal(
          await trigger.evaluate((element) => document.activeElement === element),
          true,
          'Escape did not restore focus to the Dialog trigger.',
        );
        const restored = await page.locator('.ui-studio-shell').evaluate((element) => {
          const boundary = element.closest('[inert], [aria-hidden="true"]');
          return {
            inert: Boolean(boundary?.hasAttribute('inert')),
            ariaHidden: boundary?.getAttribute('aria-hidden') ?? null,
          };
        });
        assert.deepEqual(
          restored,
          { inert: false, ariaHidden: null },
          'Modal isolation leaked after Dialog dismissal.',
        );
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
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Popover',
          tab: 'examples',
          example: 'modal-focus',
        });
        const trigger = example.getByRole('button', { name: 'Open modal popover', exact: true });
        await waitForStudioExampleControl(page, trigger, 'Modal Popover trigger');
        await focusByTab(page, trigger);
        await page.keyboard.press('Enter');

        const popover = page.getByRole('dialog', { name: 'Modal popover example' });
        await popover.waitFor({ state: 'visible' });
        const state = await popover.evaluate((element) => {
          const active = document.activeElement;
          const hiddenAncestor =
            active instanceof HTMLElement ? active.closest('[aria-hidden="true"], [inert]') : null;
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
    [
      'foundations',
      'uiroot',
      'nested-roots',
      'inheritance',
      'portal',
      'modal-isolation',
      'focus',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 1100, height: 860 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'UiRoot',
          tab: 'examples',
          example: 'nested-certification',
          theme: 'light',
          dir: 'ltr',
          density: 'comfortable',
          motion: 'reduced',
        });

        const outer = example.locator('.ui-doc-uiroot-outer');
        const inner = example.locator('.ui-doc-uiroot-inner');
        await outer.waitFor({ state: 'visible' });
        await inner.waitFor({ state: 'visible' });
        const environment = await example.evaluate((fixture) => {
          const outer = fixture.querySelector('.ui-doc-uiroot-outer');
          const inner = fixture.querySelector('.ui-doc-uiroot-inner');
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
        assert.deepEqual(
          environment,
          {
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
          },
          'Nested UiRoot did not inherit/override its environment contract deterministically.',
        );

        const outerAction = example.getByRole('button', { name: 'Outer action', exact: true });
        const trigger = example.getByRole('button', { name: 'Open nested dialog', exact: true });
        await focusByTab(page, trigger);
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Nested root dialog' });
        await dialog.waitFor({ state: 'visible' });

        const ownership = await dialog.evaluate((element) => {
          const example = document.querySelector('#example-nested-certification');
          const inner = example?.querySelector('.ui-doc-uiroot-inner');
          const outerAction = [...(example?.querySelectorAll('button') ?? [])].find(
            (button) => button.textContent?.trim() === 'Outer action',
          );
          const portal = element.closest('[data-oxs-portal-root]');
          const ownerRoot = portal?.parentElement;
          const active = document.activeElement;
          const hiddenFocusedAncestor =
            active instanceof HTMLElement ? active.closest('[aria-hidden="true"], [inert]') : null;
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
        assert.deepEqual(
          ownership,
          {
            portalOwnedByInner: true,
            outerActionIsolated: false,
            focusInsideDialog: true,
            hiddenFocusedAncestor: false,
          },
          'Nested modal escaped its nearest UiRoot ownership boundary.',
        );

        await dialog.getByRole('button', { name: 'Done', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.equal(
          await trigger.evaluate((element) => document.activeElement === element),
          true,
          'Nested UiRoot did not restore focus to its trigger.',
        );
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
      const context = await browser.newContext({
        viewport: { width: 760, height: 760 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Box',
          tab: 'examples',
          example: 'boundary-contract',
          dir: 'rtl',
          theme: 'dark',
          viewport: 'fit',
          container: 'compact',
        });
        const box = example.getByRole('region', { name: 'Certified Box boundary' });
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
        assert.equal(
          boundary.tagName,
          'SECTION',
          'Box polymorphism did not preserve the requested semantic section element.',
        );
        assert.equal(
          boundary.overflow,
          'auto',
          'Box overflow contract did not reach browser layout.',
        );
        assert.equal(
          boundary.minInlineSize,
          '0px',
          'Box minInlineSize="zero" did not prevent intrinsic overflow pressure.',
        );
        assert.equal(
          boundary.flexGrow,
          '1',
          'Box flex="grow" did not participate in its Row parent.',
        );
        assert.equal(
          boundary.direction,
          'rtl',
          'Box did not inherit the resolved logical direction.',
        );

        const fullSpan = example.locator('[aria-label="Full-span Box"]');
        const span = await fullSpan.evaluate((element) => getComputedStyle(element).gridColumnEnd);
        assert.equal(
          span,
          '-1',
          'Box gridSpan="full" did not span the full Grid inline track range.',
        );
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
    [
      'layout',
      'stack',
      'row',
      'wrap',
      'polymorphism',
      'rtl',
      'logical-order',
      'responsive',
      'reflow',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 520, height: 760 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'Stack',
          tab: 'examples',
          example: 'block-flow',
          dir: 'ltr',
          theme: 'light',
          viewport: 'fit',
          container: 'compact',
        });
        const stack = example.getByRole('region', { name: 'Certified Stack flow' });
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
        assert.ok(
          stackState.blockOrder[0] < stackState.blockOrder[1] &&
            stackState.blockOrder[1] < stackState.blockOrder[2],
          'Stack visual order diverged from DOM order.',
        );
        const stackAxe = await runAxe(page, 'Stack flow certification');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Row',
          tab: 'examples',
          example: 'inline-flow',
          dir: 'rtl',
          theme: 'light',
          viewport: 'fit',
          container: 'compact',
        });
        const row = example.getByRole('region', { name: 'Certified Row flow' });
        await row.waitFor({ state: 'visible' });
        const rowState = await row.evaluate((element) => {
          const style = getComputedStyle(element);
          const children = [...element.children].map((child) => ({
            text: child.textContent,
            x: child.getBoundingClientRect().x,
          }));
          return {
            display: style.display,
            flexDirection: style.flexDirection,
            direction: style.direction,
            children,
          };
        });
        assert.equal(rowState.display, 'flex', 'Row did not render as a flex layout.');
        assert.equal(
          rowState.flexDirection,
          'row',
          'Row must use the logical inline flow rather than reverse DOM order.',
        );
        assert.equal(rowState.direction, 'rtl', 'Row did not resolve RTL from UiRoot.');
        assert.deepEqual(
          rowState.children.map((child) => child.text),
          ['First', 'Second', 'Third'],
          'Row DOM/content order changed under RTL.',
        );
        assert.ok(
          rowState.children[0].x > rowState.children[1].x,
          'RTL Row did not place the first DOM child at inline-start.',
        );
        const rowAxe = await runAxe(page, 'Row RTL certification');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Wrap',
          tab: 'examples',
          example: 'intrinsic-wrap',
          dir: 'ltr',
          theme: 'light',
          viewport: 'phone',
          container: 'compact',
        });
        const wrap = example.getByRole('region', { name: 'Certified Wrap flow' });
        await wrap.waitFor({ state: 'visible' });
        const wrapState = await wrap.evaluate((element) => {
          const style = getComputedStyle(element);
          const rows = [
            ...new Set(
              [...element.children].map((child) => Math.round(child.getBoundingClientRect().y)),
            ),
          ];
          return { display: style.display, flexWrap: style.flexWrap, rows: rows.length };
        });
        assert.equal(wrapState.display, 'flex', 'Wrap did not render as flex.');
        assert.equal(wrapState.flexWrap, 'wrap', 'Wrap did not enable intrinsic wrapping.');
        assert.ok(
          wrapState.rows >= 2,
          `Wrap did not reflow into multiple rows in a compact container (rows=${wrapState.rows}).`,
        );
        await assertNoGlobalHorizontalOverflow(page, 'Wrap compact reflow');
        const wrapAxe = await runAxe(page, 'Wrap reflow certification');

        diagnostics.assertClean('logical flow layout certification');
        return {
          stack: stackState,
          row: rowState,
          wrap: wrapState,
          axe: [stackAxe, rowAxe, wrapAxe],
        };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Stack', 'Row', 'Wrap'] },
  ),

  scenario(
    'grid-track-strategy-certification',
    [
      'layout',
      'grid',
      'tracks',
      'auto-fit',
      'minmax',
      'grid-span',
      'responsive',
      'polymorphism',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 1500, height: 900 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
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
          (studioGeometry.workspace?.width ?? 0) > 200 &&
            (studioGeometry.exampleCanvas?.width ?? 0) > 100,
          `Studio simulated viewport collapsed the active example before Grid layout could be certified: ${JSON.stringify(studioGeometry)}`,
        );
        const intrinsic = example.getByRole('region', { name: 'Certified intrinsic Grid' });
        await intrinsic.waitFor({ state: 'visible' });
        const readIntrinsicState = (locator) =>
          locator.evaluate((element) => {
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
        assert.equal(
          phoneIntrinsicState.tagName,
          'SECTION',
          'Grid polymorphism did not preserve semantic section output.',
        );
        assert.equal(
          phoneIntrinsicState.display,
          'grid',
          'Grid did not reach browser Grid layout.',
        );
        assert.ok(
          phoneIntrinsicState.columns.length >= 1,
          'auto-fit Grid did not form an intrinsic track in the compact container.',
        );
        assert.equal(
          phoneIntrinsicState.minInlineSize,
          '0px',
          'Grid did not preserve nested-layout min-inline-size safety.',
        );

        const fixed = example.getByRole('region', { name: 'Certified fixed Grid' });
        const fixedState = await fixed.evaluate((element) => ({
          columns: getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean)
            .length,
          children: [...element.children].map((child) =>
            child.textContent?.replace(/\s+/g, ' ').trim(),
          ),
        }));
        assert.equal(
          fixedState.columns,
          4,
          'Grid columns={4} did not produce exactly four finite tracks.',
        );
        assert.deepEqual(
          fixedState.children,
          ['Span 2', 'Peer A', 'Peer B'],
          'Grid visual contract must preserve DOM/content order.',
        );
        const span = await example
          .getByLabel('Two-column Grid item')
          .evaluate((element) => getComputedStyle(element).gridColumnEnd);
        assert.match(
          span,
          /span\s+2/,
          'Box gridSpan={2} did not participate in the fixed Grid track model.',
        );
        await assertNoGlobalHorizontalOverflow(page, 'Grid compact track strategies');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Grid',
          tab: 'examples',
          example: 'track-strategies',
          dir: 'ltr',
          theme: 'dark',
          viewport: 'desktop',
          container: 'wide',
        });
        const wideIntrinsic = example.getByRole('region', { name: 'Certified intrinsic Grid' });
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
      const context = await browser.newContext({
        viewport: { width: 1720, height: 900 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Container',
          tab: 'examples',
          example: 'semantic-widths',
          theme: 'light',
          dir: 'ltr',
          viewport: 'ultrawide',
          container: 'wide',
        });
        const readable = example.getByRole('region', { name: 'Certified readable Container' });
        const full = example.getByRole('region', { name: 'Certified full Container' });
        await readable.waitFor({ state: 'visible' });
        const geometry = await Promise.all(
          [readable, full].map((locator) =>
            locator.evaluate((element) => {
              const style = getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return {
                tagName: element.tagName,
                width: rect.width,
                maxInlineSize: style.maxInlineSize,
                marginInlineStart: style.marginInlineStart,
                marginInlineEnd: style.marginInlineEnd,
              };
            }),
          ),
        );
        assert.equal(
          geometry[0].tagName,
          'SECTION',
          'Container polymorphism did not preserve section semantics.',
        );
        assert.equal(
          geometry[0].maxInlineSize,
          '704px',
          'Container width="readable" is not backed by the 44rem semantic token.',
        );
        assert.ok(
          geometry[1].width > geometry[0].width + 80,
          'Full Container did not expand beyond the readable semantic tier.',
        );
        assert.ok(
          Number.parseFloat(geometry[0].marginInlineStart) > 0,
          'Readable Container was not centered on the inline axis.',
        );
        assert.ok(
          Number.parseFloat(geometry[0].marginInlineEnd) > 0,
          'Readable Container did not retain symmetric inline centering.',
        );
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
      const context = await browser.newContext({
        viewport: { width: 900, height: 760 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Inset',
          tab: 'examples',
          example: 'logical-spacing',
          theme: 'dark',
          dir: 'rtl',
          viewport: 'fit',
          container: 'compact',
        });
        const inset = example.getByRole('region', { name: 'Certified logical Inset' });
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
        assert.equal(
          state.tagName,
          'SECTION',
          'Inset polymorphism did not preserve section semantics.',
        );
        assert.equal(state.direction, 'rtl', 'Inset did not inherit the resolved RTL direction.');
        assert.deepEqual(
          {
            inlineStart: state.inlineStart,
            inlineEnd: state.inlineEnd,
            blockStart: state.blockStart,
            blockEnd: state.blockEnd,
          },
          { inlineStart: '48px', inlineEnd: '24px', blockStart: '8px', blockEnd: '0px' },
          'Inset all → axis → edge precedence did not resolve to the expected token values.',
        );
        assert.equal(
          state.physicalRight,
          '48px',
          'RTL logical inline-start did not map to the physical right edge in browser layout.',
        );
        assert.equal(
          state.physicalLeft,
          '24px',
          'RTL logical inline-end did not map to the physical left edge in browser layout.',
        );
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
    [
      'layout',
      'safe-area',
      'logical-edges',
      'persistent-insets',
      'occlusion-isolation',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 900, height: 760 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'SafeArea',
          tab: 'examples',
          example: 'logical-edges',
          theme: 'dark',
          dir: 'rtl',
          insets: 'notch',
          viewport: 'fit',
          container: 'compact',
        });
        const safeArea = example.getByRole('region', { name: 'Certified SafeArea edges' });
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
          {
            direction: 'rtl',
            blockStart: '0px',
            inlineEnd: '0px',
            blockEnd: '12px',
            inlineStart: '12px',
          },
          'SafeArea consumed edges outside its explicit logical ownership set.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'SafeArea',
          tab: 'examples',
          example: 'logical-edges',
          theme: 'dark',
          dir: 'rtl',
          insets: 'keyboard',
          viewport: 'fit',
          container: 'compact',
        });
        const keyboardSafeArea = example.getByRole('region', { name: 'Certified SafeArea edges' });
        const keyboard = await keyboardSafeArea.evaluate((element) => {
          const root = element.closest('.ui-root');
          const style = getComputedStyle(element);
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            blockEnd: style.paddingBlockEnd,
            safeBlockEnd: rootStyle?.getPropertyValue('--oxs-safe-block-end').trim() ?? null,
            occlusionBlockEnd:
              rootStyle?.getPropertyValue('--oxs-occlusion-block-end').trim() ?? null,
          };
        });
        assert.equal(
          keyboard.safeBlockEnd,
          '0px',
          'Keyboard preset unexpectedly changed the persistent safe-area input.',
        );
        assert.equal(
          keyboard.occlusionBlockEnd,
          '280px',
          'Keyboard preset did not project transient occlusion.',
        );
        assert.equal(
          keyboard.blockEnd,
          '0px',
          'SafeArea incorrectly consumed transient keyboard occlusion.',
        );
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
      const context = await browser.newContext({
        viewport: { width: 900, height: 760 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Spacer',
          tab: 'examples',
          example: 'logical-axis',
          theme: 'light',
          dir: 'ltr',
          viewport: 'fit',
          container: 'compact',
        });
        const inlineSpacer = example.locator('.ui-doc-spacer-inline');
        const blockSpacer = example.locator('.ui-doc-spacer-block');
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
        assert.deepEqual(
          inline,
          { inlineSize: '48px', blockSize: '0px', ariaHidden: 'true', tabIndex: -1 },
          'Inline Spacer geometry/accessibility invariant failed.',
        );
        assert.deepEqual(
          block,
          { inlineSize: '0px', blockSize: '24px' },
          'Block Spacer geometry invariant failed.',
        );
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
    [
      'visual',
      'typography',
      'semantics',
      'bidi',
      'rtl',
      'font-fallback',
      'long-string',
      'zoom',
      'reflow',
      'selection',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 980, height: 820 },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'Text',
          tab: 'examples',
          example: 'mixed-copy',
          theme: 'light',
          dir: 'rtl',
          viewport: 'phone',
          container: 'compact',
        });
        await example.evaluate((fixture) => {
          const root = fixture.closest('.ui-root');
          if (!(root instanceof HTMLElement))
            throw new Error('Text certification fixture lost its owning UiRoot.');
          root.style.setProperty(
            '--oxs-font-sans',
            '"Definitely Missing OntologyX Font", system-ui, sans-serif',
          );
        });
        const text = example.locator('[data-visual-cert="text"]');
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
        assert.equal(
          textState.direction,
          'rtl',
          'dir="auto" did not resolve the Persian-first mixed copy to RTL.',
        );
        assert.equal(
          textState.overflowWrap,
          'anywhere',
          'Text long-token wrapping policy did not reach browser CSS.',
        );
        assert.equal(
          textState.userSelect,
          'text',
          'Text selectable policy did not reach browser selection behavior.',
        );
        assert.match(
          textState.fontFamily,
          /Definitely Missing OntologyX Font/,
          'Text did not consume the overridden Foundation font stack.',
        );
        assert.ok(
          textState.width > 0 && textState.scrollWidth <= Math.ceil(textState.width) + 1,
          'Mixed/long Text escaped its containing width.',
        );
        await assertNoGlobalHorizontalOverflow(page, 'Text mixed-script compact reflow');

        const cdp = await context.newCDPSession(page);
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1.75 });
        const zoomMetrics = await cdp.send('Page.getLayoutMetrics');
        const zoom = zoomMetrics.cssVisualViewport?.scale ?? zoomMetrics.visualViewport?.scale ?? 1;
        assert.ok(zoom >= 1.7, `Chrome page-scale emulation did not apply (scale=${zoom}).`);
        await assertNoGlobalHorizontalOverflow(page, 'Text browser zoom reflow');
        await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Heading',
          tab: 'examples',
          example: 'semantic-rank',
          theme: 'light',
          dir: 'rtl',
          viewport: 'phone',
          container: 'compact',
        });
        const heading = example.locator('[data-visual-cert="heading"]');
        const headingState = await heading.evaluate((element) => ({
          tagName: element.tagName,
          fontSize: getComputedStyle(element).fontSize,
          maxInlineSize: getComputedStyle(element).maxInlineSize,
        }));
        assert.equal(
          headingState.tagName,
          'H3',
          'Heading visual size changed native semantic rank.',
        );
        assert.notEqual(
          headingState.maxInlineSize,
          '11ch',
          'Display/heading typography still owns a legacy content-width cap.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Label',
          tab: 'examples',
          example: 'metadata-label',
          theme: 'light',
          dir: 'rtl',
          viewport: 'phone',
          container: 'compact',
        });
        const label = example.locator('[data-visual-cert="label"]');
        const labelState = await label.evaluate((element) => ({
          tagName: element.tagName,
          role: element.getAttribute('role'),
          tabIndex: element.tabIndex,
        }));
        assert.deepEqual(
          labelState,
          { tagName: 'SPAN', role: null, tabIndex: -1 },
          'Label invented control/focus semantics.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Code',
          tab: 'examples',
          example: 'native-code-semantics',
          theme: 'dark',
          dir: 'rtl',
          viewport: 'phone',
          container: 'compact',
        });
        const code = example.locator('[data-visual-cert="code"]');
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
        assert.equal(
          codeState.direction,
          'ltr',
          'Code explicit native bidi override was lost inside RTL.',
        );
        assert.equal(
          codeState.overflowWrap,
          'anywhere',
          'Code long-token reflow was not explicit.',
        );
        assert.match(
          codeState.fontFamily,
          /SFMono-Regular|Cascadia Code|Roboto Mono|ui-monospace|monospace/,
          'Code did not consume the Foundation monospace fallback stack.',
        );
        await assertNoGlobalHorizontalOverflow(page, 'Code compact reflow');
        const axe = await runAxe(page, 'Typography semantic/bidi/reflow certification');
        diagnostics.assertClean('Typography semantic/bidi/reflow certification');
        return {
          axe,
          text: textState,
          heading: headingState,
          label: labelState,
          code: codeState,
          zoom,
        };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Text', 'Heading', 'Label', 'Code'] },
  ),

  scenario(
    'icon-multistate-transition-certification',
    [
      'visual',
      'icon',
      'multi-state',
      'transient-state',
      'motion',
      'reduced-motion',
      'interruption',
      'current-color',
      'rtl',
      'custom-glyph',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 920, height: 760 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'Icon',
          tab: 'examples',
          example: 'state-transition',
          theme: 'dark',
          dir: 'ltr',
          motion: 'full',
          viewport: 'fit',
          container: 'compact',
        });
        let icon = example.locator('[data-visual-cert="stateful-icon"]');
        let toggle = example.getByRole('button', { name: 'Toggle playback icon' });
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
        assert.equal(
          initial.stroke,
          initial.color,
          'Icon stroke did not resolve through currentColor.',
        );

        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () => {
            const target = document.querySelector(
              '#example-state-transition [data-visual-cert="stateful-icon"]',
            );
            return (
              target?.getAttribute('data-oxs-icon-phase') === 'transitioning' &&
              target.getAttribute('data-oxs-icon-visual-state') === 'pausing'
            );
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
          transient:
            target.querySelector('.ui-icon__transition')?.getAttribute('data-oxs-icon-transient') ??
            null,
        }));
        assert.deepEqual(
          firstTransition,
          {
            state: 'pause',
            visual: 'pausing',
            phase: 'transitioning',
            from: 'play',
            to: 'pause',
            transient: 'pausing',
          },
          'Icon did not publish the explicit play → pausing → pause transition contract.',
        );

        await page.waitForFunction(
          () =>
            document
              .querySelector('#example-state-transition [data-visual-cert="stateful-icon"]')
              ?.getAttribute('data-oxs-icon-phase') === 'stable',
          undefined,
          { timeout: 1000 },
        );
        assert.equal(
          await icon.getAttribute('data-oxs-icon-visual-state'),
          'pause',
          'Icon did not settle on the destination stable state.',
        );

        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () =>
            document
              .querySelector('#example-state-transition [data-visual-cert="stateful-icon"]')
              ?.getAttribute('data-oxs-icon-visual-state') === 'playing',
          undefined,
          { timeout: 1000 },
        );
        const interruptedFirst = await icon.getAttribute('data-oxs-icon-visual-state');
        await toggle.evaluate((button) => button.click());
        await page.waitForFunction(
          () => {
            const target = document.querySelector(
              '#example-state-transition [data-visual-cert="stateful-icon"]',
            );
            return (
              target?.getAttribute('data-oxs-icon-phase') === 'transitioning' &&
              target.getAttribute('data-oxs-icon-visual-state') === 'pausing' &&
              target.getAttribute('data-oxs-icon-state') === 'pause'
            );
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
        assert.deepEqual(
          interrupted,
          { first: 'playing', second: 'pausing', phase: 'transitioning', destination: 'pause' },
          'Interrupted Icon transition did not retarget through declared transient states.',
        );
        await page.waitForFunction(
          () =>
            document
              .querySelector('#example-state-transition [data-visual-cert="stateful-icon"]')
              ?.getAttribute('data-oxs-icon-phase') === 'stable',
          undefined,
          { timeout: 1000 },
        );
        assert.equal(
          await icon.getAttribute('data-oxs-icon-state'),
          'pause',
          'Interrupted Icon did not settle at the newest semantic destination.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Icon',
          tab: 'examples',
          example: 'state-transition',
          theme: 'dark',
          dir: 'ltr',
          motion: 'reduced',
          viewport: 'fit',
          container: 'compact',
        });
        icon = example.locator('[data-visual-cert="stateful-icon"]');
        toggle = example.getByRole('button', { name: 'Toggle playback icon' });
        const reducedIcon = icon;
        const reducedToggle = toggle;
        const reducedBefore = await reducedIcon.getAttribute('data-oxs-icon-state');
        const reducedExpected = reducedBefore === 'play' ? 'pause' : 'play';
        await reducedToggle.click();
        await page.waitForFunction(
          (expected) => {
            const target = document.querySelector(
              '#example-state-transition [data-visual-cert="stateful-icon"]',
            );
            return (
              target?.getAttribute('data-oxs-icon-phase') === 'stable' &&
              target.getAttribute('data-oxs-icon-state') === expected &&
              target.getAttribute('data-oxs-icon-visual-state') === expected
            );
          },
          reducedExpected,
          { timeout: 1000 },
        );
        assert.equal(
          await reducedIcon.getAttribute('data-oxs-icon-state'),
          reducedExpected,
          'Reduced-motion Icon did not settle at the requested stable state.',
        );
        assert.equal(
          await reducedIcon.getAttribute('data-oxs-icon-visual-state'),
          reducedExpected,
          'Reduced-motion Icon leaked a persistent transient visual state.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Icon',
          tab: 'examples',
          example: 'static-extension',
          theme: 'light',
          dir: 'ltr',
          motion: 'full',
          viewport: 'fit',
          container: 'compact',
        });
        const rtlIcon = example.locator('[data-visual-cert="rtl-icon"]');
        const ltrIcon = example.locator('[data-visual-cert="ltr-icon"]');
        const custom = example.locator('[data-visual-cert="custom-icon"]');
        const staticState = await Promise.all(
          [rtlIcon, ltrIcon, custom].map((locator) =>
            locator.evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                transform: style.transform,
                direction: style.direction,
                inlineTransform: style.getPropertyValue('--oxs-icon-inline-transform').trim(),
                paths: element.querySelectorAll('path').length,
                role: element.getAttribute('role'),
                focusable: element.getAttribute('focusable'),
              };
            }),
          ),
        );
        assert.equal(
          staticState[0].direction,
          'rtl',
          'Nested RTL fixture did not resolve RTL direction on the Icon itself.',
        );
        assert.equal(
          staticState[0].inlineTransform,
          'scaleX(-1)',
          'Nested RTL direction boundary did not publish the mirrored inline transform to Icon.',
        );
        assert.notEqual(
          staticState[0].transform,
          'none',
          'Directional Icon did not mirror from its nested local RTL direction.',
        );
        assert.equal(
          staticState[1].direction,
          'ltr',
          'Nested LTR fixture did not resolve LTR direction on the Icon itself.',
        );
        assert.equal(
          staticState[1].inlineTransform,
          'none',
          'Nested LTR direction boundary did not reset the inherited Icon inline transform.',
        );
        assert.equal(
          staticState[1].transform,
          'none',
          'Directional Icon leaked mirroring into a nested local LTR direction.',
        );
        assert.equal(
          staticState[2].paths,
          1,
          'Custom defineUiIcon path shorthand did not render through the shared glyph contract.',
        );
        assert.equal(
          staticState[2].role,
          'img',
          'Labeled custom Icon did not expose standalone image semantics.',
        );
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
      const context = await browser.newContext({
        viewport: { width: 1040, height: 820 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Icon',
          tab: 'examples',
          example: 'icon-pack',
          theme: 'dark',
          dir: 'ltr',
          motion: 'full',
          viewport: 'fit',
          container: 'wide',
        });
        const pack = example.locator('[data-visual-cert="icon-pack"]');
        await pack.waitFor({ state: 'visible' });
        const staticSamples = pack.locator('[data-icon-pack-static="true"]');
        const animatedSamples = pack.locator('[data-icon-pack-animated]');
        assert.ok(
          (await staticSamples.count()) >= 12,
          'Icon pack Studio evidence did not render a broad static sample.',
        );
        assert.ok(
          (await animatedSamples.count()) >= 6,
          'Icon pack Studio evidence did not render multiple animated families.',
        );
        const reportedStaticCount = Number(await pack.getAttribute('data-icon-pack-static-count'));
        const reportedAnimatedCount = Number(
          await pack.getAttribute('data-icon-pack-animated-count'),
        );
        assert.ok(
          Number.isInteger(reportedStaticCount) && reportedStaticCount >= 240,
          `Icon pack reported an invalid static export count: ${reportedStaticCount}.`,
        );
        assert.ok(
          Number.isInteger(reportedAnimatedCount) && reportedAnimatedCount >= 20,
          `Icon pack reported an invalid animated-family count: ${reportedAnimatedCount}.`,
        );
        await pack
          .getByText(`${reportedStaticCount} static exports`, { exact: false })
          .waitFor({ state: 'visible' });
        await pack
          .getByText(`${reportedAnimatedCount} animated state families`, { exact: false })
          .waitFor({ state: 'visible' });

        const playback = pack.locator('[data-icon-pack-animated="playback"]');
        assert.equal(
          await playback.getAttribute('data-oxs-icon-state'),
          'play',
          'Pack playback family did not expose its initial stable state.',
        );
        await example.getByRole('button', { name: 'Toggle animated icon pack' }).click();
        await page.waitForFunction(
          () => {
            const target = document.querySelector(
              '#example-icon-pack [data-icon-pack-animated="playback"]',
            );
            return (
              target?.getAttribute('data-oxs-icon-state') === 'pause' &&
              target.getAttribute('data-oxs-icon-phase') === 'stable' &&
              target.getAttribute('data-oxs-icon-visual-state') === 'pause'
            );
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
              const target = document.querySelector(
                `#example-icon-pack [data-icon-pack-animated="${selector}"]`,
              );
              return (
                target?.getAttribute('data-oxs-icon-phase') === 'stable' &&
                target.getAttribute('data-oxs-icon-state') === state &&
                target.getAttribute('data-oxs-icon-visual-state') === state
              );
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
            await pack
              .locator(`[data-icon-pack-animated="${selector}"]`)
              .getAttribute('data-oxs-icon-state'),
            expected,
            `Animated icon-pack family ${selector} did not converge to its requested stable state.`,
          );
        }
        await assertNoGlobalHorizontalOverflow(page, 'Icon pack breadth');
        const axe = await runAxe(page, 'Icon pack breadth certification');
        diagnostics.assertClean('Icon pack breadth certification');
        return {
          axe,
          staticSamples: await staticSamples.count(),
          animatedSamples: await animatedSamples.count(),
        };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Icon'] },
  ),

  scenario(
    'surface-divider-visual-boundary-certification',
    [
      'visual',
      'surface',
      'material',
      'elevation',
      'border',
      'static-state',
      'divider',
      'separator',
      'logical-inset',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 980, height: 780 },
        colorScheme: 'dark',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'Surface',
          tab: 'examples',
          example: 'material-boundary',
          theme: 'dark',
          dir: 'rtl',
          viewport: 'fit',
          container: 'compact',
        });
        const surface = example.locator('[data-visual-cert="surface"]');
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
        assert.notEqual(
          surfaceState.background,
          'rgba(0, 0, 0, 0)',
          'Glass Surface did not resolve a semantic material background.',
        );
        assert.notEqual(
          surfaceState.backdropFilter,
          'none',
          'Glass Surface did not resolve its material blur/saturation token.',
        );
        assert.notEqual(
          surfaceState.boxShadow,
          'none',
          'Surface elevation=2 did not resolve Foundation elevation.',
        );
        assert.equal(
          surfaceState.borderWidth,
          '1px',
          'Surface strong border did not remain token-backed hairline geometry.',
        );
        assert.equal(
          surfaceState.overflow,
          'hidden',
          'Surface clip did not clip visual descendants.',
        );
        assert.deepEqual(
          { role: surfaceState.role, tabIndex: surfaceState.tabIndex },
          { role: null, tabIndex: -1 },
          'Surface invented interaction/accessibility semantics by default.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'Divider',
          tab: 'examples',
          example: 'separator-semantics',
          theme: 'dark',
          dir: 'rtl',
          viewport: 'fit',
          container: 'compact',
        });
        const horizontal = example.locator('[data-visual-cert="horizontal-divider"]');
        const vertical = example.locator('[data-visual-cert="vertical-divider"]');
        const decorative = example.locator('[data-visual-cert="decorative-divider"]');
        const dividerState = await Promise.all(
          [horizontal, vertical, decorative].map((locator) =>
            locator.evaluate((element) => {
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
            }),
          ),
        );
        assert.equal(
          dividerState[0].role,
          'separator',
          'Horizontal Divider lost separator semantics.',
        );
        assert.equal(
          dividerState[0].orientation,
          'horizontal',
          'Horizontal Divider lost aria-orientation.',
        );
        assert.equal(
          dividerState[0].marginInlineStart,
          '16px',
          'Divider inset="start" did not use logical inline-start spacing under RTL.',
        );
        assert.equal(
          dividerState[1].orientation,
          'vertical',
          'Vertical Divider lost aria-orientation.',
        );
        assert.equal(
          dividerState[1].inlineSize,
          '2px',
          'Strong vertical Divider did not resolve the strong border thickness token.',
        );
        assert.equal(
          dividerState[1].marginBlockStart,
          '16px',
          'Vertical Divider inset did not use logical block-start spacing.',
        );
        assert.equal(
          dividerState[1].marginBlockEnd,
          '16px',
          'Vertical Divider inset did not use logical block-end spacing.',
        );
        assert.equal(
          dividerState[2].role,
          'none',
          'Decorative Divider did not remove separator semantics.',
        );
        assert.equal(
          dividerState[2].ariaHidden,
          'true',
          'Decorative Divider was not hidden from accessibility APIs.',
        );
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
      const context = await browser.newContext({
        viewport: { width: 920, height: 720 },
        reducedMotion: 'no-preference',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Spinner',
          tab: 'examples',
          example: 'ox-loading',
          motion: 'full',
        });
        const marks = workbench.locator('[data-oxs-loading-mark="ox"]');
        assert.equal(
          await marks.count(),
          1,
          'Spinner canonical example must show one OX loading mark, not duplicate the control-loading treatment.',
        );
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
            orbitStrokeWidth: orbit
              ? Number.parseFloat(getComputedStyle(orbit).strokeWidth)
              : Number.NaN,
          };
        });
        assert.ok(
          bootGeometry.width >= 120 && bootGeometry.height >= 120,
          `Boot OX loader is too small (${bootGeometry.width}×${bootGeometry.height}).`,
        );
        assert.ok(
          bootGeometry.orbitStrokeWidth >= 2.3,
          `Boot OX loader lost its display-scale stroke weight (${bootGeometry.orbitStrokeWidth}).`,
        );
        assert.equal(
          await mark.getAttribute('data-oxs-loading-choreography'),
          'write-heartbeat-release',
          'OX loader lost its branded choreography identity.',
        );
        const motion = await mark.evaluate(async (element) => {
          const orbit = element.querySelector('.ui-ox-loading-mark__orbit');
          const strokeA = element.querySelector('.ui-ox-loading-mark__cross-stroke--a');
          const strokeB = element.querySelector('.ui-ox-loading-mark__cross-stroke--b');
          const cross = element.querySelector('.ui-ox-loading-mark__cross');
          const primaryEcho = element.querySelector('.ui-ox-loading-mark__echo--primary');
          if (!(orbit && strokeA && strokeB && cross && primaryEcho))
            throw new Error('OX heartbeat fixture is incomplete.');
          const animations = element.getAnimations({ subtree: true });
          const orbitAnimation = orbit.getAnimations()[0];
          if (!orbitAnimation?.effect || typeof orbitAnimation.effect.getKeyframes !== 'function') {
            throw new Error('OX orbit animation does not expose inspectable keyframes.');
          }
          await Promise.all(animations.map((animation) => animation.ready));
          animations.forEach((animation) => {
            animation.pause();
          });
          const duration =
            Number(getComputedStyle(orbit).animationDuration.replace('s', '')) * 1000;
          const parseDasharray = (value) =>
            String(value)
              .split(/[\s,]+/)
              .map((part) => Number.parseFloat(part))
              .filter(Number.isFinite);
          const keyframes = orbitAnimation.effect.getKeyframes();
          const firstKeyframe = keyframes[0];
          const lastKeyframe = keyframes.at(-1);
          const sample = async (time) => {
            animations.forEach((animation) => {
              animation.currentTime = time;
            });
            await new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
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
        assert.ok(
          motion.animationCount >= 6,
          `OX loader lost part of its choreography (${motion.animationCount} animations).`,
        );
        assert.ok(
          motion.duration >= 1600 && motion.duration <= 2400,
          `OX heartbeat period is outside the expressive range (${motion.duration}ms).`,
        );
        assert.notEqual(
          motion.start.timing,
          'linear',
          'OX loading motion regressed to linear timing.',
        );
        assert.ok(
          Math.abs(motion.writing.strokeA) < Math.abs(motion.start.strokeA),
          'First X stroke did not visibly write into the mark.',
        );
        assert.ok(
          Math.abs(motion.locked.strokeA) < 0.05 && Math.abs(motion.locked.strokeB) < 0.05,
          'OX mark did not reach a fully written lock phase.',
        );
        assert.notEqual(
          motion.firstBeat.crossTransform,
          motion.locked.crossTransform,
          'Primary heartbeat did not deform the X mark.',
        );
        assert.notEqual(
          motion.secondBeat.crossTransform,
          motion.locked.crossTransform,
          'Secondary heartbeat did not produce the dub beat.',
        );
        assert.ok(
          motion.firstBeat.echoOpacity > 0.1,
          'Primary heartbeat did not emit the O-ring echo.',
        );
        assert.notEqual(
          motion.release.orbitDasharray,
          motion.locked.orbitDasharray,
          'O-ring did not release after the heartbeat lock.',
        );
        const dashDistance = (left, right) =>
          Math.max(...left.map((value, index) => Math.abs(value - (right[index] ?? Number.NaN))));
        const circularDistance = (left, right, period) => {
          const raw = Math.abs(left - right) % period;
          return Math.min(raw, period - raw);
        };
        assert.ok(
          motion.keyframeSeam.startDasharray.length === motion.keyframeSeam.endDasharray.length &&
            dashDistance(motion.keyframeSeam.startDasharray, motion.keyframeSeam.endDasharray) <
              0.05,
          'OX authored loop endpoints do not preserve the same orbit shape.',
        );
        assert.ok(
          Math.abs(
            Math.abs(motion.keyframeSeam.endDashoffset - motion.keyframeSeam.startDashoffset) - 100,
          ) < 0.05,
          'OX authored loop endpoints are not one pathLength-equivalent revolution apart.',
        );
        assert.ok(
          motion.preSeam.orbitDasharrayParts.length === motion.start.orbitDasharrayParts.length &&
            dashDistance(motion.preSeam.orbitDasharrayParts, motion.start.orbitDasharrayParts) <
              2.5,
          'OX orbit shape does not converge smoothly into the loop boundary.',
        );
        assert.ok(
          circularDistance(motion.preSeam.orbitDashoffset, motion.start.orbitDashoffset, 100) < 2.5,
          'OX orbit phase does not converge smoothly into the loop boundary.',
        );
        assert.ok(
          motion.wrapped.orbitDasharrayParts.length === motion.start.orbitDasharrayParts.length &&
            dashDistance(motion.wrapped.orbitDasharrayParts, motion.start.orbitDasharrayParts) <
              0.05,
          'OX wrapped iteration does not restart at the authored orbit shape.',
        );
        assert.ok(
          circularDistance(motion.wrapped.orbitDashoffset, motion.start.orbitDashoffset, 100) <
            0.05,
          'OX wrapped iteration does not restart at the equivalent orbit phase.',
        );

        await page.emulateMedia({ reducedMotion: 'reduce' });
        await mark.evaluate((element) =>
          element.closest('.ui-root')?.setAttribute('data-oxs-motion', 'reduced'),
        );
        const reduced = await mark.evaluate((element) => {
          const orbit = element.querySelector('.ui-ox-loading-mark__orbit');
          const strokes = [...element.querySelectorAll('.ui-ox-loading-mark__cross-stroke')];
          const echoes = [...element.querySelectorAll('.ui-ox-loading-mark__echo')];
          return {
            animations: element.getAnimations({ subtree: true }).length,
            orbitDasharray: getComputedStyle(orbit).strokeDasharray,
            strokeOffsets: strokes.map((stroke) =>
              Number.parseFloat(getComputedStyle(stroke).strokeDashoffset),
            ),
            echoOpacity: echoes.map((echo) => Number.parseFloat(getComputedStyle(echo).opacity)),
          };
        });
        assert.equal(reduced.animations, 0, 'Reduced-motion OX mark retained active animations.');
        assert.ok(
          reduced.strokeOffsets.every((offset) => Math.abs(offset) < 0.05),
          'Reduced-motion OX mark did not settle to a fully written X.',
        );
        assert.ok(
          reduced.echoOpacity.every((opacity) => opacity === 0),
          'Reduced-motion OX mark retained heartbeat echoes.',
        );
        diagnostics.assertClean('OX loading heartbeat motion');
        return { motion, reduced };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'spinner-svg-canvas-renderer-parity',
    ['visual', 'brand', 'loading', 'svg', 'canvas', 'motion', 'realm'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 920, height: 720 },
        reducedMotion: 'no-preference',
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Spinner',
          tab: 'examples',
          example: 'ox-loading',
          motion: 'full',
        });
        const bootSpinner = workbench.locator('[data-oxs-spinner-purpose="boot"]');
        await bootSpinner.waitFor({ state: 'visible' });
        assert.equal(
          await bootSpinner.getAttribute('data-oxs-spinner-renderer'),
          'svg',
          'Spinner renderer parity must start from the lightweight SVG backend.',
        );
        assert.equal(
          await bootSpinner.locator('svg[data-oxs-loading-mark="ox"]').count(),
          1,
          'Spinner renderer parity lost the canonical SVG mark.',
        );
        assert.equal(
          await bootSpinner.locator('canvas[data-oxs-loading-renderer="canvas"]').count(),
          0,
          'Canvas backend loaded before it was requested.',
        );

        await workbench.getByRole('button', { name: 'Canvas', exact: true }).click();
        const canvas = bootSpinner.locator('canvas[data-oxs-loading-renderer="canvas"]');
        await canvas.waitFor({ state: 'visible' });
        assert.equal(
          await bootSpinner.getAttribute('data-oxs-spinner-renderer'),
          'canvas',
          'Spinner did not publish the selected Canvas backend.',
        );
        assert.equal(
          await bootSpinner.locator('[data-oxs-loading-mark]').count(),
          1,
          'Spinner renderer parity rendered SVG and Canvas marks at the same time.',
        );
        const canvasState = await canvas.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const ownerWindow = element.ownerDocument.defaultView;
          return {
            cssWidth: rect.width,
            cssHeight: rect.height,
            backingWidth: element.width,
            backingHeight: element.height,
            realmReady: Boolean(ownerWindow),
            choreography: element.getAttribute('data-oxs-loading-choreography'),
          };
        });
        assert.ok(
          canvasState.cssWidth >= 120 && canvasState.cssHeight >= 120,
          'Canvas OX boot renderer lost the hero presentation size.',
        );
        assert.ok(
          canvasState.backingWidth >= Math.floor(canvasState.cssWidth),
          'Canvas OX renderer did not allocate a physical/content-box backing store.',
        );
        assert.equal(
          canvasState.realmReady,
          true,
          'Canvas OX renderer lost its owner Window realm.',
        );
        assert.equal(
          canvasState.choreography,
          'write-heartbeat-release',
          'Canvas OX renderer drifted from the shared branded choreography identity.',
        );
        const firstFrame = await canvas.evaluate((element) => element.toDataURL());
        await page.waitForTimeout(140);
        const secondFrame = await canvas.evaluate((element) => element.toDataURL());
        assert.notEqual(
          firstFrame,
          secondFrame,
          'Spinner renderer parity found a static Canvas backend while full motion was requested.',
        );

        await workbench.getByRole('button', { name: 'SVG', exact: true }).click();
        await bootSpinner.locator('svg[data-oxs-loading-mark="ox"]').waitFor({ state: 'visible' });
        assert.equal(
          await bootSpinner.locator('canvas[data-oxs-loading-renderer="canvas"]').count(),
          0,
          'Canvas backend did not unmount when Spinner returned to SVG.',
        );
        diagnostics.assertClean('Spinner renderer parity');
        return { canvas: canvasState, animated: true, exclusiveBackend: true };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'overlay-authority-cross-root-certification',
    [
      'overlay-kernel',
      'overlay',
      'portal',
      'modal-isolation',
      'focus',
      'escape',
      'nested-root',
      'realm',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1180, height: 860 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Dialog',
          tab: 'examples',
          example: 'authority',
        });
        const rootA = workbench.locator('.ui-doc-overlay-authority-root--a');
        const rootB = workbench.locator('.ui-doc-overlay-authority-root--b');
        const triggerA = workbench.getByRole('button', { name: 'Open modal A', exact: true });
        const triggerB = workbench.getByRole('button', { name: 'Open modal B', exact: true });
        await waitForStudioExampleControl(page, triggerA, 'Overlay authority root A trigger');
        await waitForStudioExampleControl(page, triggerB, 'Overlay authority root B trigger');
        await Promise.all([
          rootA.waitFor({ state: 'visible' }),
          rootB.waitFor({ state: 'visible' }),
        ]);
        await triggerA.click();
        const dialogA = page.getByRole('dialog', { name: 'Authority modal A' });
        await dialogA.waitFor({ state: 'visible' });

        // Role locators intentionally stop resolving while their owning background is inert.
        // Inspect the stable UiRoot DOM identities instead of re-resolving an inaccessible trigger.
        const [aBackgroundInert, bBackgroundInert, portalOwnedByA] = await Promise.all([
          rootA
            .locator('.ui-drag-drop-runtime')
            .evaluate((element) => element.hasAttribute('inert')),
          rootB
            .locator('.ui-drag-drop-runtime')
            .evaluate((element) => element.hasAttribute('inert')),
          dialogA.evaluate((element) =>
            Boolean(
              element
                .closest('[data-oxs-portal-root]')
                ?.parentElement?.classList.contains('ui-doc-overlay-authority-root--a'),
            ),
          ),
        ]);
        const firstScope = { aBackgroundInert, bBackgroundInert, portalOwnedByA };
        assert.deepEqual(
          firstScope,
          { aBackgroundInert: true, bBackgroundInert: false, portalOwnedByA: true },
          'Root A modal leaked isolation or portal ownership across UiRoot boundaries.',
        );

        await triggerB.click();
        const dialogB = page.getByRole('dialog', { name: 'Authority modal B' });
        await dialogB.waitFor({ state: 'visible' });
        assert.equal(
          await dialogA.isVisible(),
          true,
          'Cross-root stacking fixture lost modal A while opening modal B; outside dismissal must stay disabled for this coexistence certification.',
        );
        const aOwnership = await dialogA.evaluate((element) => {
          const portal = element.closest('[data-oxs-portal-root]');
          return {
            ownerClass: portal?.parentElement?.className ?? '',
            z: portal ? Number.parseInt(getComputedStyle(portal).zIndex, 10) : Number.NaN,
          };
        });
        const bOwnership = await dialogB.evaluate((element) => {
          const portal = element.closest('[data-oxs-portal-root]');
          return {
            ownerClass: portal?.parentElement?.className ?? '',
            z: portal ? Number.parseInt(getComputedStyle(portal).zIndex, 10) : Number.NaN,
          };
        });
        const portalOwnership = {
          distinct:
            aOwnership.ownerClass !== '' &&
            bOwnership.ownerClass !== '' &&
            aOwnership.ownerClass !== bOwnership.ownerClass,
          aRoot: aOwnership.ownerClass.includes('ui-doc-overlay-authority-root--a'),
          bRoot: bOwnership.ownerClass.includes('ui-doc-overlay-authority-root--b'),
          aZ: aOwnership.z,
          bZ: bOwnership.z,
        };
        assert.equal(
          portalOwnership.distinct,
          true,
          'Independent UiRoots did not retain independent portal hosts.',
        );
        assert.equal(portalOwnership.aRoot, true, 'Root A overlay escaped its own portal host.');
        assert.equal(portalOwnership.bRoot, true, 'Root B overlay escaped its own portal host.');
        assert.ok(
          Number.isFinite(portalOwnership.aZ) &&
            Number.isFinite(portalOwnership.bZ) &&
            portalOwnership.bZ > portalOwnership.aZ,
          'Document overlay order did not project into cross-root visual stacking.',
        );

        await page.keyboard.press('Escape');
        await dialogB.waitFor({ state: 'detached' });
        assert.equal(
          await dialogA.isVisible(),
          true,
          'Document-level Escape arbitration dismissed more than the top-most overlay.',
        );
        assert.equal(
          await triggerB.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Top-most cross-root overlay did not restore focus to its own trigger.',
        );

        await page.keyboard.press('Escape');
        await dialogA.waitFor({ state: 'detached' });
        assert.equal(
          await triggerA.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Lower overlay did not become event-top-most after upper-root dismissal.',
        );
        const axe = await runAxe(page, 'Overlay authority cross-root closeout');
        diagnostics.assertClean('Overlay authority cross-root closeout');
        return { portalOwnership, escapeOrder: ['B', 'A'], axe };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'scroll-motion-certification',
    [
      'scroll',
      'logical-coordinates',
      'rtl',
      'nested-scroll',
      'native-chaining',
      'restoration',
      'snap',
      'variable-geometry',
      'resize',
      'motion',
      'interruption',
      'shared-bounds',
      'reduced-motion',
      'performance-budget',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1180, height: 900 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'ScrollView',
          tab: 'examples',
          example: 'scroll-contract',
          dir: 'rtl',
          motion: 'full',
        });
        let restorable = example.getByLabel('Restorable scroll', { exact: true });
        await restorable.waitFor({ state: 'visible' });
        const savedOffset = await restorable.evaluate((element) => {
          element.scrollTop = 112;
          element.dispatchEvent(new Event('scroll'));
          return element.scrollTop;
        });
        assert.ok(
          savedOffset > 40,
          'Restoration fixture did not establish a non-zero scroll offset.',
        );
        await example
          .getByRole('button', { name: 'Unmount restorable scroll', exact: true })
          .click();
        await example.getByRole('button', { name: 'Mount restorable scroll', exact: true }).click();
        restorable = example.getByLabel('Restorable scroll', { exact: true });
        await restorable.waitFor({ state: 'visible' });
        assert.ok(
          Math.abs((await restorable.evaluate((element) => element.scrollTop)) - savedOffset) <= 2,
          'ScrollView did not restore the caller-keyed logical offset after remount.',
        );

        const nativeAncestor = example.locator('[data-native-scroll]');
        const nativeChild = example.getByLabel('Native-chain inner scroll', { exact: true });
        await nativeChild.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await nativeAncestor.evaluate((element) => {
          element.scrollTop = 0;
        });
        await nativeChild.hover();
        await page.mouse.wheel(0, 180);
        await page.waitForTimeout(120);
        assert.ok(
          (await nativeAncestor.evaluate((element) => element.scrollTop)) > 0,
          'Exhausted ScrollView did not release wheel input to its native scrollable ancestor.',
        );

        const outer = example.getByLabel('Outer nested scroll', { exact: true });
        const inner = example.getByLabel('Inner nested scroll', { exact: true });
        await inner.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        await outer.evaluate((element) => {
          element.scrollTop = 0;
        });
        await inner.hover();
        await page.mouse.wheel(0, 180);
        await page.waitForTimeout(80);
        assert.ok(
          (await outer.evaluate((element) => element.scrollTop)) > 0,
          'Nested ScrollView did not consume overflow before native ancestor chaining.',
        );

        const snap = example.getByLabel('Logical snap strip', { exact: true });
        const snapDirection = await snap.evaluate(
          (element) => element.ownerDocument.defaultView?.getComputedStyle(element).direction,
        );
        assert.equal(snapDirection, 'rtl', 'Horizontal ScrollView did not inherit resolved RTL.');
        await snap.hover();
        await page.mouse.wheel(-220, 0);
        await page.waitForTimeout(700);
        const snapState = await snap.evaluate((element) => {
          const viewport = element.getBoundingClientRect();
          const rtl =
            element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl';
          const alignmentErrors = [...element.querySelectorAll('[data-snap-card]')].map((item) => {
            const rect = item.getBoundingClientRect();
            const align = item.getAttribute('data-snap-align') ?? 'start';
            if (align === 'center') {
              return Math.abs((rect.left + rect.right) / 2 - (viewport.left + viewport.right) / 2);
            }
            if (align === 'end')
              return rtl
                ? Math.abs(rect.left - viewport.left)
                : Math.abs(rect.right - viewport.right);
            return rtl
              ? Math.abs(rect.right - viewport.right)
              : Math.abs(rect.left - viewport.left);
          });
          return {
            physical: element.scrollLeft,
            max: Math.max(0, element.scrollWidth - element.clientWidth),
            nearestAlignmentError: Math.min(...alignmentErrors),
          };
        });
        assert.ok(
          Math.abs(snapState.physical) <= snapState.max + 1,
          'RTL scroll settlement escaped the native physical scroll range.',
        );
        assert.ok(
          snapState.nearestAlignmentError <= 6,
          `Variable-geometry RTL snap did not settle to start/center/end alignment (${snapState.nearestAlignmentError}px).`,
        );
        const resizeFrame = example.locator('.ui-doc-scroll-resize-frame');
        await resizeFrame.evaluate((element) => {
          element.style.inlineSize = '14rem';
        });
        await page.waitForTimeout(180);
        const resizedState = await snap.evaluate((element) => ({
          physical: element.scrollLeft,
          max: Math.max(0, element.scrollWidth - element.clientWidth),
        }));
        assert.ok(
          Math.abs(resizedState.physical) <= resizedState.max + 1,
          'Resize reconciliation left ScrollView outside its current bounds.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'MotionTransition',
          tab: 'examples',
          example: 'lifecycle',
          dir: 'rtl',
          motion: 'full',
        });
        let aliases = example.locator('[data-motion-alias]');
        await aliases.first().waitFor({ state: 'visible' });
        assert.equal(await aliases.count(), 6, 'Motion alias lifecycle fixture is incomplete.');
        const slide = example.locator('[data-motion-alias="slide"]');
        assert.equal(
          await slide.getAttribute('data-motion-kind'),
          'slide-right',
          'Logical inline-start slide did not mirror in RTL.',
        );
        const toggle = example.getByRole('button', { name: 'Toggle transitions', exact: true });
        await toggle.click();
        await page.waitForTimeout(30);
        await toggle.click();
        await page.waitForTimeout(30);
        await toggle.click();
        await page.waitForTimeout(30);
        await toggle.click();
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll('#example-lifecycle [data-motion-alias]')].every(
              (element) =>
                element.getAttribute('data-present') === 'true' &&
                element.getAttribute('data-hidden') === 'false' &&
                !element.hasAttribute('data-motion-active'),
            ),
          null,
          { timeout: 2200 },
        );
        const idlePromotion = await aliases.evaluateAll((elements) =>
          elements.map(
            (element) =>
              element.ownerDocument.defaultView?.getComputedStyle(element).willChange ?? '',
          ),
        );
        assert.ok(
          idlePromotion.every((value) => value === 'auto'),
          `Settled transitions retained compositor promotion: ${idlePromotion.join(', ')}`,
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'MotionTransition',
          tab: 'examples',
          example: 'lifecycle',
          dir: 'rtl',
          motion: 'reduced',
        });
        aliases = example.locator('[data-motion-alias]');
        await example.getByRole('button', { name: 'Toggle transitions', exact: true }).click();
        await page.waitForTimeout(40);
        const reducedState = await aliases.evaluateAll((elements) =>
          elements.map((element) => ({
            hidden: element.getAttribute('data-hidden'),
            active: element.hasAttribute('data-motion-active'),
            transform: element.ownerDocument.defaultView?.getComputedStyle(element).transform,
          })),
        );
        assert.ok(
          reducedState.every(
            (state) => state.hidden === 'true' && !state.active && state.transform === 'none',
          ),
          'Reduced motion did not semantically settle aliases without spatial interpolation.',
        );

        example = await gotoCatalog(page, baseUrl, {
          entry: 'SharedBounds',
          tab: 'examples',
          example: 'bounds-lifecycle',
          motion: 'full',
        });
        const shared = example.locator('[data-shared-bounds-target]');
        const before = await shared.boundingBox();
        await example.getByRole('button', { name: 'Move shared surface', exact: true }).click();
        await page.waitForFunction(
          () => {
            const element = document.querySelector(
              '#example-bounds-lifecycle [data-shared-bounds-target]',
            );
            return element && !element.hasAttribute('data-motion-active');
          },
          null,
          { timeout: 2200 },
        );
        const after = await shared.boundingBox();
        assert.ok(
          before && after && Math.abs(before.x - after.x) > 8,
          'SharedBounds lifecycle fixture did not produce a measurable destination change.',
        );
        assert.equal(
          await shared.evaluate((element) => element.style.transform),
          '',
          'SharedBounds left an inline transform after settlement.',
        );

        const axe = await runAxe(page, 'UIR11 scroll and motion contracts');
        diagnostics.assertClean('UIR11 scroll and motion contracts');
        return {
          restoredOffset: savedOffset,
          nestedChained: true,
          rtlSnapBounded: true,
          resizeReconciled: true,
          interruptionConverged: true,
          reducedSettled: true,
          sharedBoundsSettled: true,
          idlePromotion,
          axe,
        };
      } finally {
        await context.close();
      }
    },
    {
      accepts: [
        'ScrollView',
        'ScrollSnapItem',
        'MotionTransition',
        'FadeTransition',
        'ScaleTransition',
        'SlideTransition',
        'RevealTransition',
        'CollapseTransition',
        'ReplaceTransition',
        'SharedBounds',
      ],
    },
  ),

  scenario(
    'gesture-drag-editing-cursor-certification',
    [
      'gestures',
      'arena',
      'native-scroll',
      'text-selection',
      'drag-drop',
      'pointer-continuation',
      'preview',
      'edge-autoscroll',
      'keyboard',
      'editing',
      'clipboard-race',
      'cursor',
      'hotspot',
      'modality',
      'nested-root',
      'realm',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1120, height: 860 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'GestureRevealHandle',
          tab: 'examples',
          example: 'interaction-runtime',
          motion: 'full',
        });
        const reveal = example.getByRole('button', { name: 'Runtime reveal handle', exact: true });
        await reveal.click();
        assert.equal(
          await example.locator('[data-reveal-state]').textContent(),
          'open',
          'GestureRevealHandle activation did not converge with the arena-owned reveal state.',
        );

        const pan = example.locator('[data-pan-competition]');
        const panBox = await pan.boundingBox();
        assert.ok(panBox, 'Pan competition fixture has no measurable geometry.');
        const panX = panBox.x + Math.min(42, panBox.width / 3);
        const panY = panBox.y + panBox.height / 2;
        await page.mouse.move(panX, panY);
        await page.mouse.down();
        await page.mouse.move(panX + 4, panY);
        assert.equal(
          await example.locator('[data-pan-state]').textContent(),
          'native',
          'Pan cancelled native text/scroll ownership before crossing its arena threshold.',
        );
        await page.mouse.move(panX + 28, panY);
        await page.waitForFunction(
          () =>
            document.querySelector('#example-interaction-runtime [data-pan-state]')?.textContent ===
            'claimed',
        );
        await page.mouse.up();

        const scroll = example.locator('[data-dnd-scroll]');
        const source = example.getByRole('button', { name: 'Drag Studio card', exact: true });
        const target = example.getByRole('button', { name: 'Studio drop target', exact: true });
        await source.scrollIntoViewIfNeeded();
        await target.scrollIntoViewIfNeeded();
        const sourceBox = await source.boundingBox();
        let targetBox = await target.boundingBox();
        assert.ok(
          sourceBox && targetBox,
          'Drag/drop fixture controls have no measurable geometry.',
        );
        const sourceHit = await page.evaluate(
          ({ x, y }) => {
            const hit = document.elementFromPoint(x, y);
            return (
              hit?.closest('[data-oxs-drag-source]')?.getAttribute('data-oxs-drag-source') ?? null
            );
          },
          {
            x: sourceBox.x + sourceBox.width / 2,
            y: sourceBox.y + sourceBox.height / 2,
          },
        );
        assert.equal(
          sourceHit,
          'studio-drag-source',
          'DnD source center was not hit-testable after Studio scrolling.',
        );
        await page.evaluate(() => {
          const trace = [];
          const record = (event) => {
            const target = event.target instanceof Element ? event.target : null;
            trace.push({
              type: event.type,
              pointerId: event.pointerId,
              pointerType: event.pointerType,
              buttons: event.buttons,
              defaultPrevented: event.defaultPrevented,
              target:
                target?.getAttribute('data-oxs-drag-source') ??
                target?.getAttribute('data-oxs-drop-target') ??
                target?.tagName ??
                null,
            });
          };
          for (const type of [
            'pointerdown',
            'gotpointercapture',
            'pointermove',
            'lostpointercapture',
            'pointercancel',
            'pointerup',
          ]) {
            window.addEventListener(type, record, true);
          }
          window.__oxsUir12DndTrace = trace;
        });
        const sourceCenter = {
          x: sourceBox.x + sourceBox.width / 2,
          y: sourceBox.y + sourceBox.height / 2,
        };
        await page.mouse.move(sourceCenter.x, sourceCenter.y);
        await page.mouse.down();
        // Cross the drag threshold locally first. Once the session is active, Studio/drag
        // auto-scroll may move scroll ancestors, so any target geometry captured before drag
        // ownership is stale by definition.
        await page.mouse.move(sourceCenter.x + 12, sourceCenter.y);
        const preview = page.locator('[data-dnd-preview-content]');
        try {
          await preview.waitFor({ state: 'visible', timeout: 1200 });
        } catch (_error) {
          const state = await page.evaluate(() => {
            const runtime = document
              .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
              ?.closest('.ui-root')
              ?.querySelector('.ui-drag-drop-runtime');
            const portal = document
              .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
              ?.closest('.ui-root')
              ?.querySelector('[data-oxs-portal-root]');
            const previewContent = document.querySelector('[data-dnd-preview-content]');
            const previewLayer = previewContent?.closest('.ui-drag-preview');
            const rect = previewLayer?.getBoundingClientRect();
            const style = previewLayer ? getComputedStyle(previewLayer) : null;
            const live = runtime?.parentElement?.querySelector('[aria-live="polite"]');
            return {
              runtimeActive: runtime?.getAttribute('data-oxs-drag-active') ?? null,
              runtimeCursorRole: runtime?.getAttribute('data-oxs-drag-cursor-role') ?? null,
              announcement: live?.textContent ?? null,
              portalPresent: Boolean(portal),
              portalChildren: portal?.children.length ?? null,
              previewPresent: Boolean(previewContent),
              previewRect: rect
                ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                : null,
              previewStyle: style
                ? { display: style.display, visibility: style.visibility, opacity: style.opacity }
                : null,
              trace: window.__oxsUir12DndTrace ?? [],
            };
          });
          assert.fail(
            `DnD preview did not become visible. Runtime trace: ${JSON.stringify(state)}`,
          );
        }
        assert.ok(
          await preview.evaluate((element) => Boolean(element.closest('[data-oxs-portal-root]'))),
          'Pointer drag preview escaped the owning UiRoot portal coordinate space.',
        );

        // Re-resolve the drop target after drag ownership begins. The DragDrop runtime is
        // allowed to auto-scroll the nearest eligible ancestor while the pointer is stationary,
        // so pre-drag bounding boxes cannot be used as a durable drop coordinate. Do not use a
        // Playwright actionability scroll here: it requires the element to become stable while
        // active drag auto-scroll is explicitly allowed to keep its ancestors moving.
        const activeScrollBox = await scroll.boundingBox();
        assert.ok(
          activeScrollBox,
          'DnD scroll container lost measurable geometry after drag activation.',
        );
        await page.mouse.move(
          activeScrollBox.x + activeScrollBox.width / 2,
          activeScrollBox.y + activeScrollBox.height / 2,
        );
        await target.evaluate((element) => {
          element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        });
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        targetBox = await target.boundingBox();
        assert.ok(targetBox, 'Drop target lost measurable geometry after drag activation.');
        const targetCenter = {
          x: targetBox.x + targetBox.width / 2,
          y: targetBox.y + targetBox.height / 2,
        };
        const targetHit = await page.evaluate(({ x, y }) => {
          const hit = document.elementFromPoint(x, y);
          return (
            hit?.closest('[data-oxs-drop-target]')?.getAttribute('data-oxs-drop-target') ?? null
          );
        }, targetCenter);
        assert.equal(
          targetHit,
          'studio-drop-target',
          'DnD target center was not hit-testable after drag activation.',
        );
        await page.evaluate((point) => {
          window.__oxsUir12LastDropPoint = point;
        }, targetCenter);
        await page.mouse.move(targetCenter.x, targetCenter.y);
        try {
          await page.waitForFunction(
            () =>
              document
                .querySelector(
                  '#example-interaction-runtime [data-oxs-drop-target="studio-drop-target"]',
                )
                ?.getAttribute('data-oxs-drop-active') === 'true',
            null,
            { timeout: 1200 },
          );
        } catch (_error) {
          const state = await page.evaluate(() => {
            const runtime = document
              .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
              ?.closest('.ui-root')
              ?.querySelector('.ui-drag-drop-runtime');
            const target = document.querySelector(
              '#example-interaction-runtime [data-oxs-drop-target="studio-drop-target"]',
            );
            const rect = target?.getBoundingClientRect();
            return {
              runtimeActive: runtime?.getAttribute('data-oxs-drag-active') ?? null,
              runtimeCursorRole: runtime?.getAttribute('data-oxs-drag-cursor-role') ?? null,
              targetActive: target?.getAttribute('data-oxs-drop-active') ?? null,
              targetRect: rect
                ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
                : null,
              hitAtPointer:
                document
                  .elementFromPoint(
                    window.__oxsUir12LastDropPoint?.x ?? -1,
                    window.__oxsUir12LastDropPoint?.y ?? -1,
                  )
                  ?.closest('[data-oxs-drop-target]')
                  ?.getAttribute('data-oxs-drop-target') ?? null,
              trace: window.__oxsUir12DndTrace ?? [],
            };
          });
          assert.fail(`DnD target did not become active. Runtime trace: ${JSON.stringify(state)}`);
        }
        await page.mouse.up();
        try {
          await page.waitForFunction(
            () =>
              document.querySelector('#example-interaction-runtime [data-drop-result]')
                ?.textContent === 'studio-card:move',
            null,
            { timeout: 1200 },
          );
        } catch (_error) {
          const state = await page.evaluate(() => ({
            dropResult:
              document.querySelector('#example-interaction-runtime [data-drop-result]')
                ?.textContent ?? null,
            runtimeActive:
              document
                .querySelector('#example-interaction-runtime .ui-drag-drop-runtime')
                ?.getAttribute('data-oxs-drag-active') ?? null,
            targetActive:
              document
                .querySelector(
                  '#example-interaction-runtime [data-oxs-drop-target="studio-drop-target"]',
                )
                ?.getAttribute('data-oxs-drop-active') ?? null,
            announcement:
              document
                .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
                ?.closest('.ui-root')
                ?.querySelector('[aria-live="polite"]')?.textContent ?? null,
            trace: window.__oxsUir12DndTrace ?? [],
          }));
          assert.fail(`DnD drop did not commit. Runtime trace: ${JSON.stringify(state)}`);
        }

        // Edge auto-scroll is an independent acceptance axis. Reload the exact canonical
        // fixture so a completed pointer drop cannot leak pending press/arena/session state into
        // the second pointer stream. This keeps the evidence deterministic without weakening the
        // runtime contract: the edge journey still uses real pointer ownership and stationary RAF
        // auto-scroll in the owning Window.
        example = await gotoCatalog(page, baseUrl, {
          entry: 'GestureRevealHandle',
          tab: 'examples',
          example: 'interaction-runtime',
          motion: 'full',
        });
        const edgeScroll = example.locator('[data-dnd-scroll]');
        const edgeSource = example.getByRole('button', { name: 'Drag Studio card', exact: true });
        await edgeScroll.evaluate((element) => {
          element.scrollTop = 0;
          element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        });
        await edgeSource.scrollIntoViewIfNeeded();
        const edgeSourceBox = await edgeSource.boundingBox();
        let edgeScrollBox = await edgeScroll.boundingBox();
        assert.ok(
          edgeSourceBox && edgeScrollBox,
          'Fresh edge auto-scroll fixture lost measurable geometry.',
        );
        const edgeSourceCenter = {
          x: edgeSourceBox.x + edgeSourceBox.width / 2,
          y: edgeSourceBox.y + edgeSourceBox.height / 2,
        };
        const edgeSourceHit = await page.evaluate(({ x, y }) => {
          const hit = document.elementFromPoint(x, y);
          return (
            hit?.closest('[data-oxs-drag-source]')?.getAttribute('data-oxs-drag-source') ?? null
          );
        }, edgeSourceCenter);
        assert.equal(
          edgeSourceHit,
          'studio-drag-source',
          'Fresh edge auto-scroll source center was not hit-testable.',
        );
        await page.evaluate(() => {
          const trace = [];
          const record = (event) => {
            const target = event.target instanceof Element ? event.target : null;
            trace.push({
              type: event.type,
              pointerId: event.pointerId,
              pointerType: event.pointerType,
              clientX: event.clientX,
              clientY: event.clientY,
              buttons: event.buttons,
              defaultPrevented: event.defaultPrevented,
              target:
                target?.getAttribute('data-oxs-drag-source') ??
                target?.getAttribute('data-oxs-drop-target') ??
                target?.tagName ??
                null,
            });
          };
          for (const type of [
            'pointerdown',
            'gotpointercapture',
            'pointermove',
            'lostpointercapture',
            'pointercancel',
            'pointerup',
          ]) {
            window.addEventListener(type, record, true);
          }
          window.__oxsUir12DndTrace = trace;
        });
        await page.mouse.move(edgeSourceCenter.x, edgeSourceCenter.y);
        await page.mouse.down();
        await page.mouse.move(edgeSourceCenter.x + 12, edgeSourceCenter.y);
        try {
          await page.waitForFunction(
            () =>
              document
                .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
                ?.closest('.ui-root')
                ?.querySelector('.ui-drag-drop-runtime')
                ?.getAttribute('data-oxs-drag-active') === 'true',
            null,
            { timeout: 1200 },
          );
        } catch (_error) {
          const state = await page.evaluate(() => {
            const source = document.querySelector(
              '#example-interaction-runtime [data-oxs-drag-source="studio-drag-source"]',
            );
            const runtime = document
              .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
              ?.closest('.ui-root')
              ?.querySelector('.ui-drag-drop-runtime');
            const rect = source?.getBoundingClientRect();
            const point = rect
              ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
              : { x: -1, y: -1 };
            return {
              runtimeActive: runtime?.getAttribute('data-oxs-drag-active') ?? null,
              sourcePressed: source?.getAttribute('data-pressed') ?? null,
              previewPresent: Boolean(document.querySelector('[data-dnd-preview-content]')),
              hitAtSource:
                document
                  .elementFromPoint(point.x, point.y)
                  ?.closest('[data-oxs-drag-source]')
                  ?.getAttribute('data-oxs-drag-source') ?? null,
              trace: window.__oxsUir12DndTrace ?? [],
            };
          });
          assert.fail(
            `Fresh edge pointer stream did not activate drag ownership. Runtime trace: ${JSON.stringify(state)}`,
          );
        }
        // Drag activation may start RAF auto-scroll on a scrollable Studio ancestor before the
        // pointer reaches this inner fixture. Never drive the edge journey with a pre-ownership
        // bounding box: neutralize the active pointer inside the live container, let ancestor
        // geometry settle, then derive the physical bottom edge from a fresh DOMRect.
        edgeScrollBox = await edgeScroll.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        await page.mouse.move(
          edgeScrollBox.x + edgeScrollBox.width / 2,
          edgeScrollBox.y + edgeScrollBox.height / 2,
        );
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        await edgeScroll.evaluate((element) => {
          element.scrollTop = 0;
        });
        edgeScrollBox = await edgeScroll.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        });
        const liveEdgePoint = {
          x: edgeScrollBox.x + edgeScrollBox.width / 2,
          y: edgeScrollBox.y + edgeScrollBox.height - 5,
        };
        await page.evaluate((point) => {
          window.__oxsUir12ExpectedEdgePoint = point;
        }, liveEdgePoint);
        await page.mouse.move(liveEdgePoint.x, liveEdgePoint.y, { steps: 5 });
        try {
          await page.waitForFunction(
            () =>
              (document.querySelector('#example-interaction-runtime [data-dnd-scroll]')
                ?.scrollTop ?? 0) > 0,
            null,
            { timeout: 1800 },
          );
        } catch (_error) {
          const state = await page.evaluate(() => {
            const scroll = document.querySelector('#example-interaction-runtime [data-dnd-scroll]');
            const runtime = document
              .querySelector('#example-interaction-runtime [data-uir12-interaction-runtime]')
              ?.closest('.ui-root')
              ?.querySelector('.ui-drag-drop-runtime');
            const rect = scroll?.getBoundingClientRect();
            const point = rect
              ? { x: rect.left + rect.width / 2, y: rect.bottom - 5 }
              : { x: -1, y: -1 };
            const trace = window.__oxsUir12DndTrace ?? [];
            const lastPointerMove = [...trace]
              .reverse()
              .find((entry) => entry.type === 'pointermove');
            const actualPointer = lastPointerMove
              ? { x: lastPointerMove.clientX, y: lastPointerMove.clientY }
              : null;
            return {
              runtimeActive: runtime?.getAttribute('data-oxs-drag-active') ?? null,
              scrollTop: scroll?.scrollTop ?? null,
              scrollHeight: scroll?.scrollHeight ?? null,
              clientHeight: scroll?.clientHeight ?? null,
              expectedEdgePoint: window.__oxsUir12ExpectedEdgePoint ?? null,
              actualPointer,
              hitAtExpectedEdge:
                document.elementFromPoint(point.x, point.y)?.closest('[data-dnd-scroll]') !== null,
              hitAtActualPointer: actualPointer
                ? document
                    .elementFromPoint(actualPointer.x, actualPointer.y)
                    ?.closest('[data-dnd-scroll]') !== null
                : null,
              trace,
            };
          });
          assert.fail(
            `Stationary edge auto-scroll did not begin. Runtime trace: ${JSON.stringify(state)}`,
          );
        }
        const edgeScrolled = await edgeScroll.evaluate((element) => element.scrollTop);
        assert.ok(
          edgeScrolled > 0,
          'Stationary drag did not trigger owner-realm edge auto-scroll.',
        );
        await page.keyboard.press('Escape');
        await page.mouse.up();

        // Keyboard drag is another independent modality axis. Start from a fresh canonical fixture
        // rather than inheriting the cancelled pointer stream above.
        example = await gotoCatalog(page, baseUrl, {
          entry: 'GestureRevealHandle',
          tab: 'examples',
          example: 'interaction-runtime',
          motion: 'full',
        });
        const keyboardScroll = example.locator('[data-dnd-scroll]');
        const keyboardSource = example.getByRole('button', {
          name: 'Drag Studio card',
          exact: true,
        });
        await keyboardScroll.evaluate((element) => {
          element.scrollTop = 0;
        });
        await keyboardSource.scrollIntoViewIfNeeded();
        await keyboardSource.focus();
        await page.keyboard.press('Space');
        await page.waitForFunction(
          () =>
            document.activeElement?.getAttribute('data-oxs-drop-target') === 'studio-drop-target',
        );
        await page.keyboard.press('Enter');
        assert.equal(
          await example.locator('[data-drop-result]').textContent(),
          'studio-card:move',
          'Keyboard drag did not use the same authoritative target/drop lifecycle.',
        );
        const gestureAxe = await runAxe(page, 'UIR12 gesture and drag/drop runtime');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'TextField',
          tab: 'examples',
          example: 'clipboard-race',
        });
        const clipboardTarget = example.getByLabel('Clipboard race target', { exact: true });
        await clipboardTarget.focus();
        await clipboardTarget.evaluate((element) => {
          element.setSelectionRange(element.value.length, element.value.length);
        });
        await page.keyboard.press('Control+V');
        await example
          .locator('[data-rotate-clipboard-adapter]')
          .evaluate((element) => element.click());
        await page.waitForFunction(
          () =>
            document.querySelector('#example-clipboard-race [data-clipboard-adapter-version]')
              ?.textContent === '2',
        );
        await example
          .locator('[data-resolve-pending-paste]')
          .evaluate((element) => element.click());
        await page.waitForTimeout(40);
        assert.equal(
          await clipboardTarget.inputValue(),
          'seed',
          'A paste response from a replaced clipboard adapter mutated the active editable session.',
        );
        const editingAxe = await runAxe(page, 'UIR12 editing clipboard race');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'CursorRegion',
          tab: 'examples',
          example: 'cursor-contract',
          pointer: 'fine',
        });
        const outerCursorRoot = example.locator('.ui-doc-cursor-root--outer');
        const innerCursorRoot = example.locator('.ui-doc-cursor-root--inner');
        const customIntent = example.locator(
          '[data-oxs-cursor-intent="custom:precision-crosshair"]',
        );
        await Promise.all([
          outerCursorRoot.waitFor({ state: 'visible' }),
          innerCursorRoot.waitFor({ state: 'visible' }),
          customIntent.waitFor({ state: 'visible' }),
        ]);
        assert.equal(await outerCursorRoot.getAttribute('data-oxs-pointer-visible'), 'false');
        assert.equal(await innerCursorRoot.getAttribute('data-oxs-pointer-visible'), 'true');
        assert.equal(await customIntent.getAttribute('data-oxs-cursor-role'), 'default');
        assert.equal(
          await customIntent.getAttribute('data-oxs-cursor-intent'),
          'custom:precision-crosshair',
          'Custom cursor host intent was lost while deriving the browser fallback role.',
        );
        const cursorProjection = await outerCursorRoot.evaluate((element) => ({
          theme: element.getAttribute('data-oxs-cursor-theme'),
          hotspot: element.getAttribute('data-oxs-cursor-hotspot'),
          scale: element.style.getPropertyValue('--oxs-cursor-scale'),
        }));
        assert.deepEqual(cursorProjection, {
          theme: 'studio-host-theme',
          hotspot: '6,8',
          scale: '1.5',
        });
        assert.notEqual(
          await innerCursorRoot.evaluate(
            (element) => element.ownerDocument.defaultView?.getComputedStyle(element).cursor,
          ),
          'none',
          'Outer touch cursor suppression leaked through the nested UiRoot authority boundary.',
        );
        const cursorAxe = await runAxe(page, 'UIR12 cursor host intent');

        diagnostics.assertClean('UIR12 gesture/drag/editing/cursor contracts');
        return {
          panThresholdOwnership: true,
          pointerPreviewScoped: true,
          edgeScrolled,
          keyboardDrop: true,
          stalePasteRejected: true,
          nestedCursorAuthority: true,
          gestureAxe,
          editingAxe,
          cursorAxe,
        };
      } finally {
        await context.close();
      }
    },
    { accepts: ['GestureRevealHandle', 'CursorRegion'] },
  ),

  scenario(
    'motion-authority-realm-interruption-certification',
    [
      'motion-kernel',
      'motion',
      'realm',
      'scheduler',
      'interruption',
      'reduced-motion',
      'nested-root',
      'frame-rate',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1180, height: 860 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let workbench = await gotoCatalog(page, baseUrl, {
          entry: 'MotionTransition',
          tab: 'examples',
          example: 'authority',
          motion: 'full',
        });
        let probes = workbench.locator('[data-motion-authority-probe]');
        await probes.first().waitFor({ state: 'visible' });
        assert.equal(
          await probes.count(),
          2,
          'Motion authority fixture did not expose independent root runtimes.',
        );
        const fullState = await probes.evaluateAll((elements) =>
          elements.map((element) => {
            const root = element.closest('.ui-root');
            return {
              label: element.getAttribute('data-motion-authority-probe'),
              realmReady: root?.getAttribute('data-oxs-motion-realm-ready'),
              frameHost: root?.getAttribute('data-oxs-motion-frame-host'),
              targetFrameRate: root?.getAttribute('data-oxs-frame-rate'),
              preference: root?.getAttribute('data-oxs-motion'),
            };
          }),
        );
        assert.ok(
          fullState.every((state) => state.realmReady === 'true' && state.frameHost === 'true'),
          'Motion runtime did not bind scheduling to the concrete owner Window.',
        );
        assert.deepEqual(
          fullState.map((state) => state.targetFrameRate),
          ['60', '120'],
          'Nested UiRoot did not own an independent target frame-rate runtime.',
        );
        assert.ok(
          fullState.every((state) => state.preference === 'full'),
          'Full-motion fixture did not resolve full preference.',
        );

        const outer = probes.filter({ hasText: 'Outer runtime:' });
        const toggle = outer.getByRole('button', { name: 'Toggle motion', exact: true });
        const surface = outer.locator('[data-motion-probe-surface]');
        await toggle.click();
        await page.waitForTimeout(35);
        await toggle.click();
        await page.waitForTimeout(35);
        await toggle.click();
        await page.waitForTimeout(35);
        await toggle.click();
        await page.waitForFunction(
          () => {
            const probe = [
              ...document.querySelectorAll('#example-authority [data-motion-authority-probe]'),
            ].find(
              (element) => element.getAttribute('data-motion-authority-probe') === 'Outer runtime',
            );
            const surface = probe?.querySelector('[data-motion-probe-surface]');
            return (
              surface?.getAttribute('data-present') === 'true' &&
              surface?.getAttribute('data-hidden') === 'false'
            );
          },
          null,
          { timeout: 1800 },
        );
        assert.equal(
          await surface.getAttribute('data-present'),
          'true',
          'Interrupted motion did not converge to the latest requested state.',
        );
        assert.equal(
          await surface.getAttribute('data-hidden'),
          'false',
          'Interrupted motion left the destination hidden.',
        );

        workbench = await gotoCatalog(page, baseUrl, {
          entry: 'MotionTransition',
          tab: 'examples',
          example: 'authority',
          motion: 'reduced',
        });
        probes = workbench.locator('[data-motion-authority-probe]');
        const reducedOuter = probes.filter({ hasText: 'Outer runtime:' });
        const reducedToggle = reducedOuter.getByRole('button', {
          name: 'Toggle motion',
          exact: true,
        });
        const reducedSurface = reducedOuter.locator('[data-motion-probe-surface]');
        assert.equal(
          await reducedOuter.evaluate((element) =>
            element.closest('.ui-root')?.getAttribute('data-oxs-motion'),
          ),
          'reduced',
          'Reduced-motion route did not resolve through the motion runtime.',
        );
        await reducedToggle.click();
        await page.waitForFunction(
          () => {
            const probe = [
              ...document.querySelectorAll('#example-authority [data-motion-authority-probe]'),
            ].find(
              (element) => element.getAttribute('data-motion-authority-probe') === 'Outer runtime',
            );
            const surface = probe?.querySelector('[data-motion-probe-surface]');
            return (
              surface?.getAttribute('data-present') === 'false' &&
              surface?.getAttribute('data-hidden') === 'true'
            );
          },
          null,
          { timeout: 250 },
        );
        assert.equal(
          await reducedSurface.getAttribute('data-hidden'),
          'true',
          'Reduced motion did not settle immediately to hidden semantics.',
        );
        diagnostics.assertClean('Motion authority runtime closeout');
        return { fullState, interruptionConverged: true, reducedSettled: true };
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
        const selectWorkbench = await gotoCatalog(page, baseUrl, {
          entry: 'Select',
          tab: 'examples',
          example: 'contract',
        });
        const select = selectWorkbench.getByRole('combobox', { name: 'Density', exact: true });
        await select.waitFor({ state: 'visible' });
        await select.focus();
        await page.keyboard.press('c');
        await page.keyboard.press('c');
        assert.match(
          await select.innerText(),
          /Compact/,
          'Repeated-key Select typeahead did not cycle through the shared matcher.',
        );
        await page.waitForTimeout(760);
        await page.keyboard.press('c');
        assert.match(
          await select.innerText(),
          /Comfortable/,
          'Delayed Select typeahead did not reset to the first matching choice.',
        );

        const menuWorkbench = await gotoCatalog(page, baseUrl, {
          entry: 'Menu',
          tab: 'examples',
          example: 'preview',
        });
        const trigger = menuWorkbench.getByRole('button', { name: 'Open menu', exact: true });
        await trigger.click();
        const menu = page.getByRole('menu', { name: 'Preview menu' });
        await menu.waitFor({ state: 'visible' });
        await page.keyboard.press('d');
        const duplicate = menu.getByRole('menuitem', { name: 'Duplicate', exact: true });
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
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'Button',
          tab: 'examples',
          example: 'contract',
          modality: 'mouse',
          pointer: 'fine',
        });
        const primary = example.getByRole('button', { name: 'Primary', exact: true });
        const counter = example.locator('[data-action-primary-count]');
        await primary.waitFor({ state: 'visible' });
        const beforeCancel = await counter.getAttribute('data-action-primary-count');
        await performPointerCancel(page, primary);
        assert.equal(
          await counter.getAttribute('data-action-primary-count'),
          beforeCancel,
          'Pointer release outside the target incorrectly activated Button.',
        );
        assert.equal(
          await primary.getAttribute('data-pressed'),
          null,
          'Pressed visual state leaked after pointer cancellation.',
        );
        await primary.click();
        assert.equal(
          await counter.getAttribute('data-action-primary-count'),
          String(Number(beforeCancel) + 1),
          'Normal pointer activation did not activate Button exactly once.',
        );
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
        const example = await gotoCatalog(page, baseUrl, {
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
        const documentationViewport = page.locator(
          '.ui-studio-workspace-scroll > .ui-scroll-view__viewport',
        );
        const documentationViewportHeight = await assertMinimumBlockSize(
          documentationViewport,
          176,
          'Phone Studio documentation viewport',
        );
        const trigger = example.getByRole('button', {
          name: 'Right-click or long-press',
          exact: true,
        });
        const size = await trigger.boundingBox();
        assert.ok(
          size && size.height >= 44,
          `Coarse-pointer trigger is below the 44px browser target floor (${size?.height ?? 0}px).`,
        );
        const menu = page.getByRole('menu', { name: 'File actions' });
        const activationMs = await performTouchLongPress(page, trigger, menu, {
          activationBudgetMs: 1000,
        });
        assert.equal(
          await menu.getByRole('menuitem').count(),
          3,
          'Long-press ContextMenu exposed the wrong command count.',
        );
        const axe = await runAxe(page, 'Touch ContextMenu');
        diagnostics.assertClean('touch long-press journey');
        return {
          axe,
          targetHeight: size.height,
          documentationViewportHeight,
          commands: 3,
          activationMs,
        };
      } finally {
        await context.close();
      }
    },
  ),

  scenario(
    'environment-and-reflow-matrix',
    [
      'rtl',
      'ltr',
      'theme',
      'density',
      'reduced-motion',
      'responsive',
      'adaptive-band',
      'safe-area',
      'occlusion',
      'reflow',
    ],
    async ({ browser, baseUrl }) => {
      const cases = [
        {
          id: 'narrow-rtl-reduced',
          context: {
            viewport: { width: 320, height: 720 },
            reducedMotion: 'reduce',
            colorScheme: 'light',
          },
          route: {
            entry: 'TextField',
            tab: 'overview',
            theme: 'light',
            dir: 'rtl',
            density: 'compact',
            motion: 'system',
            modality: 'keyboard',
            pointer: 'coarse',
            viewport: 'fit',
            container: 'compact',
            insets: 'notch',
          },
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
            safeArea: {
              safeBlockStart: '32px',
              safeInlineEnd: '12px',
              safeBlockEnd: '12px',
              safeInlineStart: '12px',
            },
            environmentInset: {
              insetBlockStart: '32px',
              insetInlineEnd: '12px',
              insetBlockEnd: '12px',
              insetInlineStart: '12px',
            },
          },
        },
        {
          id: 'tablet-custom-keyboard-occlusion',
          context: {
            viewport: { width: 1024, height: 900 },
            reducedMotion: 'no-preference',
            colorScheme: 'dark',
          },
          route: {
            entry: 'Button',
            tab: 'overview',
            theme: 'custom',
            dir: 'ltr',
            density: 'comfortable',
            motion: 'full',
            modality: 'pen',
            pointer: 'coarse',
            viewport: 'tablet',
            container: 'content',
            insets: 'keyboard',
          },
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
          context: {
            viewport: { width: 900, height: 900 },
            reducedMotion: 'no-preference',
            colorScheme: 'dark',
          },
          route: {
            entry: 'Button',
            tab: 'overview',
            theme: 'system',
            dir: 'auto',
            density: 'auto',
            motion: 'system',
            modality: 'mouse',
            pointer: 'coarse',
            viewport: 'phone',
            container: 'compact',
            insets: 'gesture',
          },
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
          const media = await page.evaluate(
            () => matchMedia('(prefers-reduced-motion: reduce)').matches,
          );
          if (testCase.context.reducedMotion === 'reduce')
            assert.equal(
              media,
              true,
              `${testCase.id} did not receive browser reduced-motion emulation.`,
            );
          observations.push({ id: testCase.id, geometry, reducedMotionMedia: media });
          diagnostics.assertClean(testCase.id);
        } finally {
          await context.close();
        }
      }
      return { cases: observations };
    },
  ),

  scenario(
    'button-action-contract-certification',
    [
      'actions',
      'button',
      'native-form',
      'loading',
      'disabled',
      'pointer',
      'touch',
      'keyboard',
      'cancellation',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 900, height: 760 },
        hasTouch: true,
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Button',
          tab: 'examples',
          example: 'contract',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const primary = workbench.getByRole('button', { name: 'Primary', exact: true });
        const submit = workbench.getByRole('button', { name: 'Submit form', exact: true });
        const loading = workbench.getByRole('button', { name: 'Saving changes', exact: true });
        const disabled = workbench.getByRole('button', { name: 'Disabled', exact: true });
        const destructive = workbench.getByRole('button', { name: 'Delete', exact: true });
        await primary.waitFor({ state: 'visible' });
        assert.equal(
          await loading.isDisabled(),
          true,
          'Loading Button did not suppress native activation.',
        );
        assert.equal(
          await loading.getAttribute('aria-busy'),
          'true',
          'Loading Button did not expose aria-busy.',
        );
        assert.equal(
          await disabled.isDisabled(),
          true,
          'Disabled Button lost native disabled semantics.',
        );
        assert.ok(
          (await destructive.getAttribute('class'))?.includes('ui-button--intent-destructive'),
          'Destructive intent did not project independently from emphasis.',
        );
        assert.equal(
          await submit.getAttribute('type'),
          'submit',
          'Explicit Button submit type was not preserved.',
        );
        await submit.focus();
        await page.keyboard.press('Enter');
        assert.equal(
          await workbench
            .locator('[data-action-submit-count]')
            .getAttribute('data-action-submit-count'),
          '1',
          'Keyboard activation did not preserve native form submission.',
        );
        const beforeCancel = await workbench
          .locator('[data-action-primary-count]')
          .getAttribute('data-action-primary-count');
        await performPointerCancel(page, primary);
        assert.equal(
          await workbench
            .locator('[data-action-primary-count]')
            .getAttribute('data-action-primary-count'),
          beforeCancel,
          'Pointer cancellation still activated Button.',
        );
        const box = await primary.boundingBox();
        assert.ok(box, 'Primary Button has no touch geometry.');
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
        assert.equal(
          await workbench
            .locator('[data-action-primary-count]')
            .getAttribute('data-action-primary-count'),
          String(Number(beforeCancel) + 1),
          'Touch activation diverged from Button native action behavior.',
        );
        assert.equal(
          await primary.evaluate((element) => getComputedStyle(element).direction),
          'rtl',
          'Button did not inherit RTL action flow.',
        );
        const axe = await runAxe(page, 'Button action contract');
        diagnostics.assertClean('Button action contract');
        return { submit: 'native', cancellation: 'preserved', touch: 'equivalent', axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Button'] },
  ),

  scenario(
    'icon-button-action-contract-certification',
    [
      'actions',
      'icon-button',
      'label',
      'tooltip',
      'target-size',
      'toggle',
      'rtl',
      'coarse-pointer',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 760, height: 680 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoCatalog(page, baseUrl, {
          entry: 'IconButton',
          tab: 'examples',
          example: 'contract',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const search = workbench.getByRole('button', { name: 'Search', exact: true });
        const pinned = workbench.getByRole('button', { name: 'Pinned', exact: true });
        const next = workbench.getByRole('button', { name: 'Next', exact: true });
        await search.waitFor({ state: 'visible' });
        const descriptionId = await search.getAttribute('aria-describedby');
        assert.ok(descriptionId, 'IconButton tooltip was not linked through aria-describedby.');
        assert.equal(
          await page.locator(`#${descriptionId}`).getAttribute('role'),
          'tooltip',
          'IconButton tooltip relationship does not target tooltip semantics.',
        );
        const searchBox = await search.boundingBox();
        assert.ok(
          searchBox && searchBox.width >= 44 && searchBox.height >= 44,
          `Coarse-pointer IconButton target collapsed (${searchBox?.width}x${searchBox?.height}).`,
        );
        assert.equal(
          await pinned.getAttribute('aria-pressed'),
          'true',
          'IconButton toggle did not expose initial pressed state.',
        );
        await pinned.click();
        assert.equal(
          await pinned.getAttribute('aria-pressed'),
          'false',
          'IconButton toggle did not update pressed state.',
        );
        const iconTransform = await next
          .locator('svg')
          .evaluate((element) => getComputedStyle(element).transform);
        assert.notEqual(
          iconTransform,
          'none',
          'Directional IconButton glyph did not mirror from local RTL direction.',
        );
        const axe = await runAxe(page, 'IconButton action contract');
        diagnostics.assertClean('IconButton action contract');
        return { target: searchBox, tooltip: descriptionId, rtlTransform: iconTransform, axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['IconButton'] },
  ),

  scenario(
    'action-group-toolbar-certification',
    [
      'actions',
      'group',
      'semantics',
      'no-hidden-actions',
      'responsive',
      'toolbar',
      'roving',
      'keyboard',
      'rtl',
      'home-end',
      'overflow',
      'target-size',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 820, height: 720 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let workbench = await gotoCatalog(page, baseUrl, {
          entry: 'ActionGroup',
          tab: 'examples',
          example: 'contract',
          viewport: 'phone',
          container: 'compact',
        });
        const group = workbench.getByRole('group', { name: 'Document actions' });
        await group.waitFor({ state: 'visible' });
        const groupButtons = group.getByRole('button');
        assert.equal(
          await groupButtons.count(),
          3,
          'ActionGroup silently hid or moved commands in a compact container.',
        );
        for (const label of ['Save', 'Duplicate', 'Delete'])
          assert.equal(
            await group.getByRole('button', { name: label, exact: true }).isVisible(),
            true,
            `ActionGroup hid ${label}.`,
          );

        workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Toolbar',
          tab: 'examples',
          example: 'contract',
          dir: 'ltr',
          pointer: 'coarse',
        });
        const toolbar = workbench.getByRole('toolbar', { name: 'Editor commands' });
        const undo = toolbar.getByRole('button', { name: 'Undo', exact: true });
        const redo = toolbar.getByRole('button', { name: 'Redo', exact: true });
        const save = toolbar.getByRole('button', { name: 'Save', exact: true });
        const more = toolbar.getByRole('button', { name: 'More commands', exact: true });
        await undo.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(
          await redo.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Toolbar ArrowRight did not move logical roving focus.',
        );
        await page.keyboard.press('End');
        assert.equal(
          await more.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Toolbar End did not reach caller-owned overflow action.',
        );
        await page.keyboard.press('Home');
        assert.equal(
          await undo.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Toolbar Home did not restore the first enabled command.',
        );
        for (const target of [undo, redo, save, more])
          await assertMinimumBlockSize(target, 44, 'Toolbar coarse-pointer action');

        workbench = await gotoCatalog(page, baseUrl, {
          entry: 'Toolbar',
          tab: 'examples',
          example: 'contract',
          dir: 'rtl',
        });
        const rtlToolbar = workbench.getByRole('toolbar', { name: 'Editor commands' });
        const rtlUndo = rtlToolbar.getByRole('button', { name: 'Undo', exact: true });
        const rtlMore = rtlToolbar.getByRole('button', { name: 'More commands', exact: true });
        await rtlUndo.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(
          await rtlMore.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'RTL Toolbar ArrowRight did not follow logical reverse traversal with looping.',
        );
        const axe = await runAxe(page, 'ActionGroup/Toolbar action contract');
        diagnostics.assertClean('ActionGroup/Toolbar action contract');
        return { groupCount: 3, roving: 'logical', overflow: 'reachable', axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['ActionGroup', 'Toolbar'] },
  ),

  scenario(
    'field-native-form-certification',
    [
      'fields',
      'field-group',
      'field-section',
      'text-field',
      'text-area',
      'native-form',
      'controlled',
      'uncontrolled',
      'autofill',
      'validation',
      'reset',
      'submission',
      'selection',
      'semantics',
      'description',
      'heading',
      'responsive',
      'rtl',
      'touch',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 900, height: 820 },
        hasTouch: true,
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        let example = await gotoCatalog(page, baseUrl, {
          entry: 'TextField',
          tab: 'examples',
          example: 'native-form',
          dir: 'rtl',
          pointer: 'coarse',
          viewport: 'phone',
          container: 'compact',
        });
        const workspace = example.getByRole('textbox', { name: 'Workspace name', exact: true });
        const alias = example.getByRole('textbox', { name: 'Alias', exact: true });
        const tenant = example.getByRole('textbox', { name: 'Tenant', exact: true });
        const ignored = example.getByRole('textbox', {
          name: 'Ignored disabled field',
          exact: true,
        });
        const recovery = example.getByRole('textbox', { name: 'Recovery code', exact: true });
        await workspace.waitFor({ state: 'visible' });
        assert.equal(
          await workspace.getAttribute('required'),
          '',
          'TextField lost native required semantics.',
        );
        assert.equal(
          await workspace.getAttribute('autocomplete'),
          'organization',
          'TextField did not forward native autocomplete semantics.',
        );
        assert.equal(
          await tenant.getAttribute('readonly'),
          '',
          'TextField lost native read-only semantics.',
        );
        assert.equal(await ignored.isDisabled(), true, 'TextField lost native disabled semantics.');
        const aliasDescription = await alias.getAttribute('aria-describedby');
        assert.ok(
          aliasDescription,
          'TextField prefix/suffix were not associated with the native control.',
        );
        const aliasDescriptions = await page.evaluate(
          (ids) => ids.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? ''),
          aliasDescription,
        );
        assert.ok(
          aliasDescriptions.includes('@') && aliasDescriptions.includes('.local'),
          'TextField logical affixes drifted from aria-describedby.',
        );
        assert.equal(
          await example.getByRole('button', { name: 'Request new code', exact: true }).isVisible(),
          true,
          'TextField supporting action did not remain independently interactive.',
        );
        assert.equal(
          await recovery.getAttribute('aria-invalid'),
          'true',
          'Explicit field error did not project aria-invalid.',
        );
        const errorId = await recovery.getAttribute('aria-errormessage');
        assert.ok(errorId, 'Explicit field error did not project aria-errormessage.');
        assert.equal(
          await page.evaluate(
            (id) => document.getElementById(id)?.getAttribute('role') ?? null,
            errorId,
          ),
          'alert',
          'aria-errormessage did not target the field error node.',
        );
        await assertMinimumBlockSize(
          workspace.locator('xpath=..'),
          44,
          'Coarse-pointer TextField control',
        );

        await workspace.fill('');
        assert.equal(
          await workspace.evaluate((element) => element.checkValidity()),
          false,
          'Required TextField remained valid when empty.',
        );
        const autofillReplacement = 'Autofilled workspace';
        await workspace.evaluate((element, replacement) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('TextField autofill fixture lost its Window realm.');
          const setter = Object.getOwnPropertyDescriptor(
            view.HTMLInputElement.prototype,
            'value',
          )?.set;
          if (!setter) throw new Error('Native HTMLInputElement value setter is unavailable.');
          setter.call(element, replacement);
          element.dispatchEvent(
            new view.InputEvent('input', {
              bubbles: true,
              composed: true,
              inputType: 'insertReplacementText',
              data: replacement,
            }),
          );
          element.dispatchEvent(new view.Event('change', { bubbles: true }));
        }, autofillReplacement);
        assert.equal(
          await workspace.inputValue(),
          autofillReplacement,
          'Native replacement/autofill-style input was intercepted or lost.',
        );
        assert.equal(
          await workspace.evaluate((element) => element.checkValidity()),
          true,
          'Native validation did not recover after replacement input.',
        );

        await alias.fill('controlled-updated');
        await example.getByRole('button', { name: 'Submit native form', exact: true }).click();
        const submitted = JSON.parse(
          await example.locator('[data-field-form-result]').textContent(),
        );
        assert.deepEqual(
          submitted,
          { workspace: autofillReplacement, alias: 'controlled-updated', tenant: 'local' },
          'Native FormData submission diverged across uncontrolled/controlled/read-only/disabled fields.',
        );
        assert.equal(
          Object.hasOwn(submitted, 'ignored'),
          false,
          'Disabled TextField leaked into FormData.',
        );

        await workspace.fill('changed');
        await alias.fill('changed-controlled');
        await example.getByRole('button', { name: 'Reset native form', exact: true }).click();
        await page.waitForFunction(() => {
          const fixture = document.querySelector('#example-native-form');
          if (!(fixture instanceof HTMLElement)) return false;
          const inputs = [...fixture.querySelectorAll('input')];
          return (
            inputs.some(
              (input) => input.getAttribute('name') === 'workspace' && input.value === 'OntologyX',
            ) &&
            inputs.some(
              (input) => input.getAttribute('name') === 'alias' && input.value === 'controlled',
            )
          );
        });
        assert.equal(
          await workspace.inputValue(),
          'OntologyX',
          'Uncontrolled TextField did not follow native form reset.',
        );
        assert.equal(
          await alias.inputValue(),
          'controlled',
          'Controlled TextField owner did not reconcile form reset.',
        );
        const textFieldAxe = await runAxe(page, 'TextField native form contract');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'TextArea',
          tab: 'examples',
          example: 'multiline-native',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const notes = example.getByRole('textbox', { name: 'Notes', exact: true });
        assert.equal(
          await notes.getAttribute('required'),
          '',
          'TextArea lost native required semantics.',
        );
        assert.equal(
          await notes.getAttribute('maxlength'),
          '160',
          'TextArea did not preserve native maxLength.',
        );
        await notes.evaluate((element) => {
          element.focus();
          element.setSelectionRange(2, 8, 'forward');
          element.dispatchEvent(new Event('select', { bubbles: true }));
        });
        const selection = await notes.evaluate((element) => ({
          start: element.selectionStart,
          end: element.selectionEnd,
        }));
        assert.deepEqual(
          selection,
          { start: 2, end: 8 },
          'TextArea native selection did not survive the field wrapper.',
        );
        await notes.fill('Updated multiline notes');
        await example.getByRole('button', { name: 'Submit notes', exact: true }).click();
        assert.equal(
          await example.locator('[data-textarea-form-result]').textContent(),
          'Updated multiline notes',
          'TextArea did not submit its native form value.',
        );
        await example.getByRole('button', { name: 'Reset notes', exact: true }).click();
        await page.waitForFunction(
          () =>
            document.querySelector('#example-multiline-native textarea')?.value ===
            'Touch-first, responsive and RTL-safe.',
        );
        const textAreaAxe = await runAxe(page, 'TextArea native form contract');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'FieldGroup',
          tab: 'examples',
          example: 'group-contract',
        });
        const group = example.getByRole('group', { name: 'Identity', exact: true });
        assert.equal(
          await group.evaluate((element) => element.tagName),
          'FIELDSET',
          'FieldGroup must render a native fieldset.',
        );
        assert.equal(
          await group.locator('legend').textContent(),
          'Identity',
          'FieldGroup must expose its label through a native legend.',
        );
        const groupDescriptionId = await group.getAttribute('aria-describedby');
        assert.ok(groupDescriptionId, 'FieldGroup lost its description relationship.');
        assert.equal(
          await page.evaluate(
            (id) => document.getElementById(id)?.textContent ?? null,
            groupDescriptionId,
          ),
          'Names used by workspace surfaces.',
          'FieldGroup description relationship drifted.',
        );
        const groupAxe = await runAxe(page, 'FieldGroup contract');

        example = await gotoCatalog(page, baseUrl, {
          entry: 'FieldSection',
          tab: 'examples',
          example: 'section-contract',
        });
        const section = example.getByRole('region', { name: 'Profile', exact: true });
        const sectionDescriptionId = await section.getAttribute('aria-describedby');
        assert.ok(sectionDescriptionId, 'FieldSection lost its description relationship.');
        assert.equal(
          await page.evaluate(
            (id) => document.getElementById(id)?.textContent ?? null,
            sectionDescriptionId,
          ),
          'Section ownership stops at structure and relationships.',
          'FieldSection description relationship drifted.',
        );
        const sectionAxe = await runAxe(page, 'FieldSection contract');
        diagnostics.assertClean('UIR07 native field/form journey');
        return { textFieldAxe, textAreaAxe, groupAxe, sectionAxe, autofillReplacement, selection };
      } finally {
        await context.close();
      }
    },
    { accepts: ['TextField', 'TextArea', 'FieldGroup', 'FieldSection'] },
  ),

  scenario(
    'search-field-composition-certification',
    [
      'fields',
      'search-field',
      'searchbox',
      'composition',
      'clear',
      'suggestions',
      'focus',
      'focus-restoration',
      'keyboard',
      'touch',
      'target-size',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({
        viewport: { width: 720, height: 640 },
        hasTouch: true,
      });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'SearchField',
          tab: 'examples',
          example: 'composition-safe-search',
          dir: 'rtl',
          pointer: 'coarse',
          viewport: 'phone',
          container: 'compact',
        });
        const search = example.getByRole('searchbox', { name: 'Search applications', exact: true });
        const clear = example.getByRole('button', { name: 'Clear search', exact: true });
        const suggestions = example.getByRole('button', { name: 'Show suggestions', exact: true });
        await search.waitFor({ state: 'visible' });
        await assertMinimumBlockSize(clear, 44, 'SearchField clear action');
        await assertMinimumBlockSize(suggestions, 44, 'SearchField suggestions action');
        await search.focus();
        await search.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('SearchField lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionstart', { bubbles: true, data: '候' }),
          );
          element.dispatchEvent(
            new view.CompositionEvent('compositionupdate', { bubbles: true, data: '候補' }),
          );
        });
        await page.waitForFunction(
          () =>
            document.querySelector('#example-composition-safe-search [data-search-composing]')
              ?.textContent === 'composing',
        );
        assert.equal(
          await clear.isDisabled(),
          true,
          'SearchField clear action remained active during composition.',
        );
        assert.equal(
          await suggestions.isDisabled(),
          true,
          'SearchField suggestions action remained active during composition.',
        );
        await page.keyboard.press('ArrowDown');
        assert.equal(
          await example.locator('[data-search-suggestions]').textContent(),
          '0',
          'SearchField requested suggestions while composition was active.',
        );
        assert.equal(
          await example.locator('[data-search-value]').textContent(),
          'Launcher',
          'SearchField mutated committed value during composition-only evidence.',
        );

        await search.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('SearchField lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionend', { bubbles: true, data: '候補' }),
          );
        });
        await page.waitForFunction(
          () =>
            document.querySelector('#example-composition-safe-search [data-search-composing]')
              ?.textContent === 'settled',
        );
        assert.equal(
          await clear.isEnabled(),
          true,
          'SearchField clear action did not recover after composition.',
        );
        await clear.click();
        assert.equal(
          await example.locator('[data-search-value]').textContent(),
          '∅',
          'SearchField clear did not publish an empty controlled value.',
        );
        assert.equal(
          await search.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'SearchField clear did not restore input focus without a global scheduler.',
        );
        await search.fill('settings');
        await suggestions.click();
        assert.equal(
          await example.locator('[data-search-suggestions]').textContent(),
          '1',
          'SearchField caller-owned suggestions seam did not resume after composition.',
        );
        const axe = await runAxe(page, 'SearchField composition contract');
        diagnostics.assertClean('SearchField composition contract');
        return { clear: 'composition-safe', suggestions: 'caller-owned', axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['SearchField'] },
  ),

  scenario(
    'editable-text-host-occlusion-certification',
    [
      'fields',
      'text-session',
      'ime',
      'composition',
      'selection',
      'secure-input',
      'clipboard',
      'host-adapter',
      'occlusion',
      'multiline',
      'realm',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 820, height: 760 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'TextField',
          tab: 'examples',
          example: 'host-session',
          viewport: 'phone',
          container: 'compact',
        });
        const sessionValue = (key) => example.locator(`[data-editable-session-${key}]`);
        const waitSession = async (key, expected, label, timeoutMs = 6000) => {
          const locator = sessionValue(key);
          const deadline = Date.now() + timeoutMs;
          let actual = null;
          while (Date.now() < deadline) {
            actual = (await locator.textContent())?.trim() ?? null;
            if (actual === expected) return;
            await page.waitForTimeout(50);
          }
          throw new Error(
            `${label}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(actual)}.`,
          );
        };
        const assertFocused = async (locator, label) => {
          const focused = await locator.evaluate(
            (element) => element.ownerDocument.activeElement === element,
          );
          assert.equal(focused, true, `${label}: browser focus did not settle on the target.`);
        };

        const ime = example.getByRole('textbox', { name: 'IME target', exact: true });
        const secure = example.getByLabel('Secure target', { exact: true });
        const multiline = example.getByRole('textbox', {
          name: 'Multiline host target',
          exact: true,
        });

        await ime.focus();
        await assertFocused(ime, 'IME session activation');
        await waitSession('active', 'active', 'IME session activation');
        assert.equal(
          await sessionValue('purpose').textContent(),
          'email',
          'UiRoot editing bridge lost content-purpose metadata.',
        );
        assert.equal(
          await sessionValue('inputmode').textContent(),
          'email',
          'UiRoot editing bridge lost input-mode metadata.',
        );
        assert.equal(
          await sessionValue('enterkey').textContent(),
          'next',
          'UiRoot editing bridge lost enter-key metadata.',
        );
        assert.equal(
          await sessionValue('multiline').textContent(),
          'false',
          'Single-line session was misclassified as multiline.',
        );

        const imeValueLength = await ime.evaluate((element) => element.value.length);
        const expectedImeSelection = `0:${imeValueLength}`;
        const selectAllShortcut = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';
        await ime.press(selectAllShortcut);
        const imeSelection = await ime.evaluate(
          (element) => `${element.selectionStart}:${element.selectionEnd}`,
        );
        assert.equal(
          imeSelection,
          expectedImeSelection,
          `IME select-all publication: browser selection did not settle (${imeSelection}; expected ${expectedImeSelection}).`,
        );
        await waitSession('selection', expectedImeSelection, 'IME select-all publication');

        await ime.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('Editable host target lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionstart', { bubbles: true, data: '候' }),
          );
          element.dispatchEvent(
            new view.CompositionEvent('compositionupdate', { bubbles: true, data: '候補' }),
          );
        });
        await waitSession('preedit', '候補', 'IME preedit publication');
        await waitSession('composing', 'true', 'IME composition publication');

        await ime.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('Editable host target lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionend', { bubbles: true, data: '候補' }),
          );
        });
        await waitSession('composing', 'false', 'IME composition settlement');
        await ime.blur();
        await waitSession('active', 'inactive', 'IME session end');

        assert.equal(
          await secure.getAttribute('type'),
          'password',
          'Secure TextField did not force password rendering.',
        );
        await secure.focus();
        await assertFocused(secure, 'secure session activation');
        await waitSession('active', 'active', 'secure session activation');
        await waitSession('purpose', 'password', 'secure content-purpose publication');
        await secure.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('Secure field lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionstart', { bubbles: true, data: '秘密' }),
          );
          element.dispatchEvent(
            new view.CompositionEvent('compositionupdate', {
              bubbles: true,
              data: '秘密候補',
            }),
          );
        });
        await waitSession('composing', 'true', 'secure composition publication');
        assert.equal(
          await sessionValue('preedit').textContent(),
          '∅',
          'Secure host session exposed composition preedit text.',
        );

        const exportGuards = await secure.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('Secure field lost its Window realm.');
          element.select();
          return {
            copyAllowed: element.dispatchEvent(
              new view.ClipboardEvent('copy', { bubbles: true, cancelable: true }),
            ),
            cutAllowed: element.dispatchEvent(
              new view.ClipboardEvent('cut', { bubbles: true, cancelable: true }),
            ),
            dragAllowed: element.dispatchEvent(
              new view.DragEvent('dragstart', { bubbles: true, cancelable: true }),
            ),
          };
        });
        assert.deepEqual(
          exportGuards,
          { copyAllowed: false, cutAllowed: false, dragAllowed: false },
          'Secure field allowed a UI-mediated text export path.',
        );

        await secure.evaluate((element) => {
          const view = element.ownerDocument.defaultView;
          if (!view) throw new Error('Secure field lost its Window realm.');
          element.dispatchEvent(
            new view.CompositionEvent('compositionend', {
              bubbles: true,
              data: '秘密候補',
            }),
          );
        });
        await waitSession('composing', 'false', 'secure composition settlement');
        await secure.blur();
        await waitSession('active', 'inactive', 'secure session end');

        await multiline.focus();
        await assertFocused(multiline, 'multiline browser focus');
        await waitSession('active', 'active', 'multiline session activation');
        await waitSession('multiline', 'true', 'multiline session classification');
        assert.equal(
          await sessionValue('enterkey').textContent(),
          'done',
          'Multiline host session lost enter-key hint metadata.',
        );

        const occlusion = await multiline.evaluate((element) => {
          const field = element.closest('.ui-field');
          const root = element.closest('.ui-root');
          if (!(field instanceof HTMLElement) || !(root instanceof HTMLElement)) {
            throw new Error('Host-session field lost its field/root boundary.');
          }
          const fieldStyle = getComputedStyle(field);
          const rootStyle = getComputedStyle(root);
          const probe = element.ownerDocument.createElement('div');
          probe.style.cssText =
            'position:absolute;visibility:hidden;padding-block-end:var(--oxs-environment-inset-block-end)';
          root.append(probe);
          const environmentInsetBlockEnd = getComputedStyle(probe).paddingBlockEnd;
          probe.remove();
          return {
            scrollMarginBlockEnd: Number.parseFloat(fieldStyle.scrollMarginBlockEnd),
            occlusionBlockEnd: rootStyle.getPropertyValue('--oxs-occlusion-block-end').trim(),
            environmentInsetBlockEnd,
          };
        });
        assert.equal(
          occlusion.occlusionBlockEnd,
          '280px',
          'Host keyboard occlusion did not remain a separate UiRoot input.',
        );
        assert.equal(
          occlusion.environmentInsetBlockEnd,
          '280px',
          'Combined environment inset did not include host keyboard occlusion.',
        );
        assert.ok(
          occlusion.scrollMarginBlockEnd >= 280,
          `Field did not respond to host occlusion through logical scroll margin (${occlusion.scrollMarginBlockEnd}px).`,
        );
        const axe = await runAxe(page, 'Editable text host/occlusion contract');
        diagnostics.assertClean('Editable text host/occlusion contract');
        return { exportGuards, occlusion, axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['TextField', 'TextArea'] },
  ),

  scenario(
    'selection-controls-certification',
    [
      'selection',
      'slider',
      'range',
      'native-form',
      'native-semantics',
      'uncontrolled',
      'reset',
      'mixed',
      'keyboard',
      'touch',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 760 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const native = await gotoCatalog(page, baseUrl, {
          entry: 'Checkbox',
          tab: 'examples',
          example: 'native-contract',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const preview = native.getByRole('checkbox', { name: 'Show previews', exact: true });
        const mixed = native.getByRole('checkbox', { name: 'Mixed import state', exact: true });
        const dark = native.getByRole('radio', { name: 'Dark', exact: true });
        const system = native.getByRole('radio', { name: 'System', exact: true });
        await preview.click();
        await dark.click();
        assert.equal(
          await preview.isChecked(),
          false,
          'Checkbox did not commit native activation.',
        );
        assert.equal(
          await dark.isChecked(),
          true,
          'RadioGroup did not commit mutually-exclusive selection.',
        );
        assert.equal(
          await mixed.getAttribute('aria-checked'),
          'mixed',
          'Indeterminate checkbox lost mixed semantics.',
        );
        await mixed.click();
        assert.equal(
          await mixed.getAttribute('aria-checked'),
          'mixed',
          'Read-only mixed checkbox mutated through click.',
        );
        await native.getByRole('button', { name: 'Reset choices', exact: true }).click();
        assert.equal(
          await preview.isChecked(),
          true,
          'Uncontrolled checkbox did not recover its default on form reset.',
        );
        assert.equal(
          await system.isChecked(),
          true,
          'Uncontrolled RadioGroup did not recover its default on form reset.',
        );
        const previewRow = native
          .locator('.ui-choice')
          .filter({ hasText: 'Show previews' })
          .first();
        await assertMinimumBlockSize(previewRow, 44, 'coarse-pointer Checkbox row');

        const state = await gotoCatalog(page, baseUrl, {
          entry: 'Switch',
          tab: 'examples',
          example: 'state-contract',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const toggle = state.getByRole('switch', { name: 'Live updates', exact: true });
        const before = await toggle.getAttribute('aria-checked');
        await toggle.press('Space');
        assert.notEqual(
          await toggle.getAttribute('aria-checked'),
          before,
          'Switch keyboard activation did not toggle state.',
        );
        await assertMinimumBlockSize(toggle, 44, 'coarse-pointer Switch');

        const groups = await gotoCatalog(page, baseUrl, {
          entry: 'SegmentedControl',
          tab: 'examples',
          example: 'group-contract',
          dir: 'rtl',
        });
        const compact = groups.getByRole('radio', { name: 'Compact', exact: true });
        const comfortable = groups.getByRole('radio', { name: 'Comfortable', exact: true });
        await compact.focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(
          await comfortable.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'RTL segmented roving focus did not move logically.',
        );
        assert.equal(
          await comfortable.getAttribute('aria-checked'),
          'true',
          'Segmented focus did not commit its radio selection.',
        );
        const grid = groups.getByRole('button', { name: 'Grid', exact: true });
        await grid.click();
        assert.equal(
          await grid.getAttribute('aria-pressed'),
          'true',
          'ToggleGroup did not expose pressed state.',
        );

        const sliderWorkbench = await gotoCatalog(page, baseUrl, {
          entry: 'Slider',
          tab: 'playground',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const slider = sliderWorkbench.getByRole('slider', { name: 'Volume', exact: true }).first();
        await slider.focus();
        const sliderBefore = Number(await slider.getAttribute('aria-valuenow'));
        await page.keyboard.press('ArrowLeft');
        const sliderAfter = Number(await slider.getAttribute('aria-valuenow'));
        assert.ok(
          sliderAfter > sliderBefore,
          'RTL Slider ArrowLeft did not increase the logical value.',
        );
        assert.equal(await slider.getAttribute('aria-valuemin'), '0');
        assert.equal(await slider.getAttribute('aria-valuemax'), '100');
        await assertMinimumBlockSize(slider, 44, 'coarse-pointer Slider');

        const buttonExample = await gotoCatalog(page, baseUrl, {
          entry: 'ToggleButton',
          tab: 'examples',
          example: 'toggle-contract',
        });
        const pin = buttonExample.getByRole('button', { name: 'Pin panel', exact: true });
        await pin.click();
        assert.equal(
          await pin.getAttribute('aria-pressed'),
          'true',
          'ToggleButton did not commit pressed state.',
        );
        const axe = await runAxe(page, 'UIR08 selection controls');
        diagnostics.assertClean('UIR08 selection controls');
        return { axe };
      } finally {
        await context.close();
      }
    },
    {
      accepts: [
        'Checkbox',
        'RadioGroup',
        'Radio',
        'Switch',
        'ToggleButton',
        'SegmentedControl',
        'ToggleGroup',
        'Slider',
      ],
    },
  ),
  scenario(
    'tabs-select-certification',
    [
      'selection',
      'tabs',
      'select',
      'manual-activation',
      'automatic-activation',
      'roving-focus',
      'relationships',
      'typeahead',
      'listbox',
      'form',
      'focus',
      'focus-restoration',
      'keyboard',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 780 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const tabsExample = await gotoCatalog(page, baseUrl, {
          entry: 'Tabs',
          tab: 'examples',
          example: 'tabs-contract',
          dir: 'rtl',
        });
        const manual = tabsExample.getByRole('tablist', { name: 'Manual sections', exact: true });
        const overview = manual.getByRole('tab', { name: 'Overview', exact: true });
        const activity = manual.getByRole('tab', { name: 'Activity', exact: true });
        await overview.focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(
          await activity.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Manual Tabs roving focus did not follow RTL logical direction.',
        );
        assert.equal(
          await overview.getAttribute('aria-selected'),
          'true',
          'Manual Tabs changed selection before activation.',
        );
        await page.keyboard.press('Enter');
        assert.equal(
          await activity.getAttribute('aria-selected'),
          'true',
          'Manual Tabs did not activate focused tab on Enter.',
        );
        assert.equal(
          await activity.getAttribute('aria-controls'),
          'manual-tabs-panel-activity',
          'Tabs lost deterministic panel relationship.',
        );
        const activePanel = tabsExample.locator('#manual-tabs-panel-activity');
        assert.equal(
          await activePanel.getAttribute('aria-labelledby'),
          'manual-tabs-tab-activity',
          'TabPanel lost owning-tab relationship.',
        );
        const automatic = tabsExample.getByRole('tablist', {
          name: 'Automatic sections',
          exact: true,
        });
        const automaticOverview = automatic.getByRole('tab', { name: 'Overview', exact: true });
        const automaticActivity = automatic.getByRole('tab', { name: 'Activity', exact: true });
        await automaticOverview.focus();
        await page.keyboard.press('ArrowLeft');
        assert.equal(
          await automaticActivity.getAttribute('aria-selected'),
          'true',
          'Automatic Tabs did not activate the logically roved tab.',
        );

        const selectExample = await gotoCatalog(page, baseUrl, {
          entry: 'Select',
          tab: 'examples',
          example: 'contract',
        });
        const trigger = selectExample.getByRole('combobox', { name: 'Density', exact: true });
        await trigger.focus();
        await page.keyboard.press('c');
        await page.keyboard.press('c');
        assert.match(
          await trigger.textContent(),
          /Compact/,
          'Repeated-key closed Select typeahead did not cycle to the matching option.',
        );
        await page.keyboard.press('ArrowDown');
        assert.equal(
          await trigger.getAttribute('aria-expanded'),
          'true',
          'Select did not open from ArrowDown.',
        );
        const cozy = page.getByRole('option', { name: /Cozy/ }).first();
        await cozy.click();
        assert.match(
          await trigger.textContent(),
          /Cozy/,
          'Pointer option activation did not commit Select value.',
        );
        assert.equal(
          await trigger.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Select option activation did not preserve visible-trigger focus.',
        );
        await selectExample.getByRole('button', { name: 'Reset density', exact: true }).click();
        assert.match(
          await trigger.textContent(),
          /Comfortable/,
          'Select form reset did not restore default value.',
        );
        const axe = await runAxe(page, 'UIR08 Tabs and Select');
        diagnostics.assertClean('UIR08 Tabs and Select');
        return { axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Tabs', 'TabPanel', 'Select'] },
  ),
  scenario(
    'disclosure-accordion-certification',
    ['disclosure', 'heading', 'region', 'controlled', 'keyboard', 'touch', 'rtl', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 920, height: 720 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const disclosure = await gotoCatalog(page, baseUrl, {
          entry: 'Disclosure',
          tab: 'examples',
          example: 'disclosure-contract',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const trigger = disclosure.getByRole('button', { name: 'Advanced options', exact: true });
        assert.equal(
          await trigger.evaluate((element) => element.parentElement?.tagName),
          'H3',
          'Disclosure trigger is not wrapped by its semantic heading.',
        );
        await trigger.click();
        const region = disclosure.getByRole('region', { name: 'Advanced options', exact: true });
        assert.equal(await region.isVisible(), true, 'Disclosure labelled region did not expand.');
        await assertMinimumBlockSize(trigger, 44, 'Disclosure coarse-pointer trigger');

        const accordion = await gotoCatalog(page, baseUrl, {
          entry: 'Accordion',
          tab: 'examples',
          example: 'accordion-contract',
          dir: 'rtl',
        });
        const appearance = accordion.getByRole('button', { name: 'Appearance', exact: true });
        const behavior = accordion.getByRole('button', { name: 'Behavior', exact: true });
        await appearance.focus();
        await page.keyboard.press('ArrowDown');
        assert.equal(
          await behavior.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Accordion header navigation did not skip the disabled peer.',
        );
        await page.keyboard.press('Enter');
        assert.equal(
          await behavior.getAttribute('aria-expanded'),
          'true',
          'Accordion keyboard activation did not expand focused header.',
        );
        assert.equal(
          await accordion.getByRole('region', { name: 'Behavior', exact: true }).isVisible(),
          true,
          'Accordion region relationship did not expose expanded content.',
        );
        const axe = await runAxe(page, 'UIR08 disclosure and accordion');
        diagnostics.assertClean('UIR08 disclosure and accordion');
        return { axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Disclosure', 'Accordion'] },
  ),
  scenario(
    'list-navigation-data-certification',
    [
      'navigation-data',
      'semantic-html',
      'list',
      'navigation',
      'states',
      'localization',
      'rtl',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 760 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const collection = await gotoCatalog(page, baseUrl, {
          entry: 'List',
          tab: 'examples',
          example: 'collection-contract',
          dir: 'rtl',
        });
        const list = collection.getByRole('list', { name: 'Recent locations', exact: true });
        assert.equal(
          await list.evaluate((element) => element.tagName),
          'UL',
          'List is not native ul semantics.',
        );
        const items = list.getByRole('listitem');
        assert.ok(
          (await items.count()) >= 3,
          'Semantic collection did not expose native list items.',
        );
        const filesAction = list.getByRole('button', { name: /Files/ }).first();
        assert.equal(
          await filesAction.evaluate((element) =>
            Boolean(element.querySelector('[aria-label="More file actions"]')),
          ),
          false,
          'Trailing ListItem action nested inside the primary row action.',
        );
        await collection.getByRole('button', { name: 'loading', exact: true }).click();
        assert.equal(
          await list.getAttribute('aria-busy'),
          'true',
          'List loading state did not expose aria-busy.',
        );
        assert.equal(
          await collection
            .getByRole('status', { name: 'Loading locations', exact: true })
            .isVisible(),
          true,
          'List loading state lost status semantics.',
        );
        await collection.getByRole('button', { name: 'error', exact: true }).click();
        assert.equal(
          await collection
            .getByRole('alert', { name: 'Locations unavailable', exact: true })
            .isVisible(),
          true,
          'List error state lost alert semantics.',
        );

        const navigation = await gotoCatalog(page, baseUrl, {
          entry: 'AdaptiveNavigation',
          tab: 'examples',
          example: 'navigation-contract',
          dir: 'rtl',
        });
        const home = navigation.getByRole('link', { name: 'Home', exact: true });
        assert.equal(
          await home.getAttribute('href'),
          '#home',
          'href destination did not preserve native anchor semantics.',
        );
        assert.equal(
          await home.getAttribute('aria-current'),
          'page',
          'Current destination lost aria-current.',
        );
        const settings = navigation.getByRole('button', { name: 'Settings', exact: true });
        await settings.click();
        assert.equal(
          await settings.getAttribute('aria-current'),
          'page',
          'Action destination did not become current after activation.',
        );
        await assertNoGlobalHorizontalOverflow(page, 'UIR09 semantic list/navigation');
        const axe = await runAxe(page, 'UIR09 semantic list/navigation');
        diagnostics.assertClean('UIR09 semantic list/navigation');
        return { axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['List', 'ListItem', 'ListSection', 'ListSeparator', 'AdaptiveNavigation'] },
  ),
  scenario(
    'tile-grid-spatial-navigation-certification',
    [
      'navigation-data',
      'tile-grid',
      'geometry',
      'roving-focus',
      'reorder',
      'focus-continuity',
      'rtl',
      'keyboard',
      'touch',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1040, height: 760 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const example = await gotoCatalog(page, baseUrl, {
          entry: 'TileGrid',
          tab: 'examples',
          example: 'spatial-grid',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const alpha = example.getByRole('button', { name: /Alpha/ }).first();
        const beta = example.getByRole('button', { name: /^Beta/ }).first();
        const gamma = example.getByRole('button', { name: /^Gamma/ }).first();
        await alpha.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(
          await beta.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'RTL TileGrid ArrowRight did not move to the logical next measured tile.',
        );
        await assertVisibleFocus(beta, 'TileGrid logical next tile');
        await beta.focus();
        await example.locator('[data-tile-reorder]').evaluate((element) => element.click());
        assert.equal(
          await beta.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'TileGrid reorder did not preserve focus identity.',
        );
        const enabled = [alpha, beta, gamma];
        const tabStops = await Promise.all(
          enabled.map((locator) => locator.getAttribute('tabindex')),
        );
        assert.equal(
          tabStops.filter((value) => value === '0').length,
          1,
          'TileGrid did not preserve exactly one roving tab stop after reorder.',
        );
        await assertMinimumBlockSize(beta, 44, 'coarse-pointer Tile action');
        await assertNoGlobalHorizontalOverflow(page, 'UIR09 TileGrid localized content');
        const axe = await runAxe(page, 'UIR09 TileGrid spatial navigation');
        diagnostics.assertClean('UIR09 TileGrid spatial navigation');
        return { tabStops, axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['TileGrid', 'Tile'] },
  ),

  scenario(
    'overlay-components-nested-dismissal-certification',
    [
      'overlay-components',
      'dialog',
      'sheet',
      'modal-isolation',
      'focus',
      'scroll-lock',
      'escape',
      'touch',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 900, height: 720 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const dialogExample = await gotoCatalog(page, baseUrl, {
          entry: 'Dialog',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
          pointer: 'coarse',
        });
        const opener = dialogExample.getByRole('button', { name: 'Open dialog', exact: true });
        await opener.click();
        const dialog = page.getByRole('dialog', { name: 'Example dialog', exact: true });
        assert.equal(
          await dialog.isVisible(),
          true,
          'Dialog did not enter the shared overlay layer.',
        );
        assert.equal(
          await dialog.getAttribute('aria-modal'),
          'true',
          'Dialog lost modal semantics.',
        );
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'detached' });
        assert.equal(
          await opener.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Dialog did not restore focus after Escape dismissal.',
        );

        const alertExample = await gotoCatalog(page, baseUrl, {
          entry: 'AlertDialog',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        await alertExample.getByRole('button', { name: 'Remove item', exact: true }).click();
        const alert = page.getByRole('alertdialog', { name: 'Remove item?', exact: true });
        assert.equal(await alert.isVisible(), true, 'AlertDialog lost alertdialog semantics.');
        await alert.getByRole('button', { name: 'Cancel', exact: true }).click();

        const sheetExample = await gotoCatalog(page, baseUrl, {
          entry: 'Sheet',
          tab: 'examples',
          example: 'preview',
          motion: 'reduced',
        });
        await sheetExample.getByRole('button', { name: 'Open sheet', exact: true }).click();
        assert.equal(
          await page.getByRole('dialog', { name: 'Preview sheet', exact: true }).isVisible(),
          true,
        );
        await page.keyboard.press('Escape');

        const bottomExample = await gotoCatalog(page, baseUrl, {
          entry: 'BottomSheet',
          tab: 'examples',
          example: 'preview',
          pointer: 'coarse',
          motion: 'reduced',
        });
        await bottomExample.getByRole('button', { name: 'Open bottom sheet', exact: true }).click();
        const bottom = page.getByRole('dialog', { name: 'Preview bottom sheet', exact: true });
        assert.equal(await bottom.isVisible(), true, 'BottomSheet did not share dialog semantics.');
        assert.equal(
          await bottom.locator('button[aria-label="Drag sheet"]').count(),
          1,
          'BottomSheet lost its touch drag affordance.',
        );

        const scrimExample = await gotoCatalog(page, baseUrl, {
          entry: 'Scrim',
          tab: 'examples',
          example: 'ownership',
        });
        const scrim = scrimExample.getByRole('button', {
          name: 'Dismiss preview overlay',
          exact: true,
        });
        assert.equal(
          await scrim.getAttribute('tabindex'),
          '-1',
          'Scrim entered sequential focus order.',
        );
        // The Studio preview stage intentionally clips the backdrop with a large rounded
        // corner. Click the scrim's stable interior instead of a clipped corner so this
        // certification measures caller-owned dismissal rather than preview-stage geometry.
        await scrim.click();
        assert.equal(
          await scrimExample.locator('.ui-scrim').isDisabled(),
          true,
          'Scrim dismissal did not return ownership to its caller.',
        );

        const axe = await runAxe(page, 'UIR10 overlay components');
        diagnostics.assertClean('UIR10 overlay components');
        return { axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Dialog', 'AlertDialog', 'Sheet', 'BottomSheet', 'Scrim'] },
  ),
  scenario(
    'floating-menu-tooltip-certification',
    ['floating', 'collision', 'menu', 'typeahead', 'tooltip', 'keyboard', 'rtl', 'touch', 'a11y'],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 720, height: 560 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const menuExample = await gotoCatalog(page, baseUrl, {
          entry: 'Menu',
          tab: 'examples',
          example: 'preview',
          dir: 'rtl',
        });
        const menuTrigger = menuExample.getByRole('button', { name: 'Open menu', exact: true });
        await menuTrigger.click();
        const menu = page.getByRole('menu', { name: 'Preview menu', exact: true });
        assert.equal(await menu.isVisible(), true, 'Menu did not open through shared Popover.');
        const openItem = menu.getByRole('menuitem', { name: 'Open', exact: true });
        const duplicateItem = menu.getByRole('menuitem', { name: 'Duplicate', exact: true });
        const removeItem = menu.getByRole('menuitem', { name: 'Remove', exact: true });
        assert.equal(await openItem.isVisible(), true, 'Menu lost its Open command.');
        assert.equal(await duplicateItem.isVisible(), true, 'Menu lost its Duplicate command.');
        assert.equal(await removeItem.isVisible(), true, 'Menu lost its Remove command.');
        assert.equal(
          await menu.getByRole('separator').count(),
          1,
          'Menu command grouping lost its separator semantics.',
        );
        await page.keyboard.type('r');
        assert.equal(
          await removeItem.evaluate((element) => element.ownerDocument.activeElement === element),
          true,
          'Menu typeahead did not move focus to the matching Remove command.',
        );
        await page.keyboard.press('Escape');

        const popoverExample = await gotoCatalog(page, baseUrl, {
          entry: 'Popover',
          tab: 'examples',
          example: 'preview',
          dir: 'rtl',
        });
        await popoverExample.getByRole('button', { name: 'Toggle popover', exact: true }).click();
        const popover = page.getByRole('dialog', { name: 'Preview popover', exact: true });
        assert.equal(
          await popover.getAttribute('data-ready'),
          'true',
          'Popover floating geometry did not settle.',
        );
        await assertWithinViewport(popover, 'UIR10 collision-aware Popover');
        const popoverMotion = await popover.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            translate: style.translate,
            transitionProperty: style.transitionProperty,
          };
        });
        assert.notEqual(
          popoverMotion.translate,
          'none',
          'Popover did not publish settled floating coordinates through CSS translate.',
        );
        assert.equal(
          popoverMotion.transitionProperty
            .split(',')
            .map((property) => property.trim())
            .includes('translate'),
          false,
          'Popover floating coordinates must not animate from the portal origin to the anchor.',
        );

        const tooltipExample = await gotoCatalog(page, baseUrl, {
          entry: 'Tooltip',
          tab: 'examples',
          example: 'preview',
          dir: 'rtl',
          pointer: 'fine',
        });
        const tooltipTrigger = tooltipExample.getByRole('button', {
          name: 'Hover or focus me',
          exact: true,
        });
        await tooltipTrigger.focus();
        const tooltip = page.getByRole('tooltip');
        await tooltip.waitFor({ state: 'visible' });
        assert.ok(
          (await tooltipTrigger.getAttribute('aria-describedby'))?.includes(
            await tooltip.getAttribute('id'),
          ),
          'Tooltip did not wire its supplemental description to the trigger.',
        );

        const contextExample = await gotoCatalog(page, baseUrl, {
          entry: 'ContextMenu',
          tab: 'examples',
          example: 'preview',
          pointer: 'coarse',
        });
        const contextTrigger = contextExample.getByRole('button', {
          name: 'Right-click or long-press',
          exact: true,
        });
        await contextTrigger.focus();
        await page.keyboard.press('Shift+F10');
        const contextMenu = page.getByRole('menu', { name: 'File actions', exact: true });
        assert.equal(await contextMenu.isVisible(), true);
        await contextMenu.waitFor({ state: 'visible' });
        // Playwright visibility does not mean the full-motion Popover opacity transition has
        // settled. Audit the stable accessible state instead of racing axe against a 150ms fade.
        await page.waitForFunction(() => {
          const surface = document.querySelector('[role="menu"][aria-label="File actions"]');
          if (!(surface instanceof HTMLElement)) return false;
          const style = getComputedStyle(surface);
          return (
            surface.getAttribute('data-ready') === 'true' &&
            Number.parseFloat(style.opacity) >= 0.999
          );
        });

        const axe = await runAxe(page, 'UIR10 floating menu tooltip');
        diagnostics.assertClean('UIR10 floating menu tooltip');
        return { axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Popover', 'Menu', 'MenuItem', 'MenuSeparator', 'ContextMenu', 'Tooltip'] },
  ),
  scenario(
    'feedback-lifecycle-certification',
    [
      'feedback',
      'live-region',
      'timing',
      'upsert',
      'progress',
      'loading',
      'reduced-motion',
      'responsive',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 760, height: 620 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const feedback = await gotoCatalog(page, baseUrl, {
          entry: 'Badge',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        assert.equal(await feedback.getByText('12', { exact: true }).isVisible(), true);
        assert.equal(await feedback.getByText('Connected', { exact: true }).isVisible(), true);
        const progress = feedback.getByRole('progressbar', { name: 'Sync', exact: true });
        assert.equal(
          await progress.getAttribute('value'),
          '64',
          'Progress lost its native determinate value.',
        );
        assert.equal(await feedback.locator('.ui-skeleton[aria-hidden="true"]').count(), 1);
        assert.equal(
          await feedback
            .getByRole('heading', { name: 'Nothing here yet', exact: true })
            .isVisible(),
          true,
        );

        const toast = await gotoCatalog(page, baseUrl, {
          entry: 'ToastHost',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        const host = toast.getByRole('region', { name: 'Notifications', exact: true });
        assert.equal(await host.getAttribute('aria-live'), 'polite');
        assert.equal(await host.getAttribute('aria-relevant'), 'additions text');
        await toast.getByRole('button', { name: 'Push toast', exact: true }).click();
        const queued = host
          .locator('[data-toast-id]')
          .filter({ hasText: 'Background sync completed' });
        assert.equal(
          await queued.count(),
          1,
          'Toast queue did not render one stable feedback item.',
        );

        const snackbar = await gotoCatalog(page, baseUrl, {
          entry: 'Snackbar',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        assert.equal(
          await snackbar.getByRole('status').isVisible(),
          true,
          'Snackbar lost status semantics.',
        );
        const banner = await gotoCatalog(page, baseUrl, {
          entry: 'Banner',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        assert.equal(
          await banner.getByRole('status').isVisible(),
          true,
          'Banner lost persistent status semantics.',
        );

        const axe = await runAxe(page, 'UIR10 feedback lifecycle');
        diagnostics.assertClean('UIR10 feedback lifecycle');
        return { axe };
      } finally {
        await context.close();
      }
    },
    {
      accepts: [
        'Badge',
        'StatusIndicator',
        'Progress',
        'Spinner',
        'Skeleton',
        'EmptyState',
        'Snackbar',
        'ToastHost',
        'Banner',
      ],
    },
  ),

  scenario(
    'developer-compositions-adaptive-certification',
    [
      'compositions',
      'adaptive',
      'container',
      'min-size',
      'nested-scroll',
      'rtl',
      'touch',
      'keyboard',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 760 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const cards = await gotoCatalog(page, baseUrl, {
          entry: 'Card',
          tab: 'examples',
          example: 'overview',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const project = cards.getByRole('group', { name: 'Project summary', exact: true });
        assert.equal(await project.isVisible(), true, 'Card lost its labelled group contract.');
        assert.equal(
          (await project.getAttribute('aria-describedby')) !== null,
          true,
          'Card lost its description relationship.',
        );

        const scaffold = await gotoCatalog(page, baseUrl, {
          entry: 'PageScaffold',
          tab: 'examples',
          example: 'overview',
          dir: 'rtl',
        });
        const main = scaffold.getByRole('main', { name: 'Scaffold example content', exact: true });
        assert.equal(await main.isVisible(), true, 'PageScaffold lost its primary landmark.');
        const geometry = await scaffold.locator('.ui-page-scaffold').evaluate((element) => {
          const content = element.querySelector('.ui-page-scaffold__content');
          const sidebar = element.querySelector('.ui-page-scaffold__sidebar');
          return {
            rootWidth: element.getBoundingClientRect().width,
            rootScrollWidth: element.scrollWidth,
            contentMinInline: content ? getComputedStyle(content).minInlineSize : null,
            sidebarMinInline: sidebar ? getComputedStyle(sidebar).minInlineSize : null,
          };
        });
        assert.ok(
          geometry.rootScrollWidth <= Math.ceil(geometry.rootWidth) + 1,
          'PageScaffold leaked horizontal overflow from nested content.',
        );
        assert.equal(
          geometry.contentMinInline,
          '0px',
          'PageScaffold content lost min-inline-size:0.',
        );
        assert.equal(
          geometry.sidebarMinInline,
          '0px',
          'PageScaffold sidebar lost min-inline-size:0.',
        );
        assert.equal(
          await scaffold.locator('.ui-scroll-view__viewport').count(),
          1,
          'PageScaffold realistic example lost nested ScrollView ownership.',
        );
        const nestedScroll = scaffold.getByLabel('Scaffold scroll preview', { exact: true });
        const nestedGeometry = await nestedScroll.evaluate((element) => ({
          clientHeight: element.clientHeight,
          scrollHeight: element.scrollHeight,
          scrollTop: element.scrollTop,
        }));
        assert.ok(
          nestedGeometry.scrollHeight > nestedGeometry.clientHeight + 1,
          'PageScaffold realistic example did not create a genuinely scrollable nested region.',
        );
        await nestedScroll.evaluate((element) => {
          element.scrollTop = 0;
        });
        await nestedScroll.hover();
        await page.mouse.wheel(0, 220);
        await page.waitForTimeout(100);
        assert.ok(
          (await nestedScroll.evaluate((element) => element.scrollTop)) > 0,
          'Nested ScrollView did not retain scroll ownership inside PageScaffold.',
        );

        const apps = await gotoCatalog(page, baseUrl, {
          entry: 'ApplicationItem',
          tab: 'examples',
          example: 'overview',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const browserItem = apps.getByRole('button', { name: 'Browser', exact: true });
        await assertMinimumBlockSize(browserItem, 44, 'ApplicationItem coarse-pointer action');
        await apps.getByRole('button', { name: 'Files', exact: true }).click();
        assert.equal(
          await apps
            .getByRole('button', { name: 'Files', exact: true })
            .locator('..')
            .locator('..')
            .getAttribute('data-selected'),
          'true',
          'ApplicationItem did not preserve caller-owned selection after activation.',
        );

        const states = await gotoCatalog(page, baseUrl, {
          entry: 'ContentState',
          tab: 'examples',
          example: 'overview',
          motion: 'reduced',
        });
        assert.equal(
          await states.getByRole('alert').isVisible(),
          true,
          'ContentState error lost alert semantics.',
        );
        assert.equal(
          await states.getByRole('status').isVisible(),
          true,
          'ContentState loading lost status semantics.',
        );

        const appBar = await gotoCatalog(page, baseUrl, {
          entry: 'AppBar',
          tab: 'examples',
          example: 'application-header',
          dir: 'rtl',
          viewport: 'phone',
          pointer: 'coarse',
        });
        assert.equal(
          await appBar
            .getByRole('heading', { name: 'Application header', exact: true })
            .first()
            .isVisible(),
          true,
          'AppBar realistic example did not render the real public export.',
        );
        const appBarGeometry = await appBar
          .locator('.ui-app-bar')
          .first()
          .evaluate((element) => {
            const ownerWindow = element.ownerDocument.defaultView;
            const copy = element.querySelector('.ui-app-bar__copy');
            const title = element.querySelector('.ui-app-bar__title');
            return {
              direction: ownerWindow?.getComputedStyle(element).direction ?? null,
              clientWidth: element.clientWidth,
              scrollWidth: element.scrollWidth,
              copyFlexBasis: copy ? (ownerWindow?.getComputedStyle(copy).flexBasis ?? null) : null,
              titleWhiteSpace: title
                ? (ownerWindow?.getComputedStyle(title).whiteSpace ?? null)
                : null,
            };
          });
        assert.equal(
          appBarGeometry.direction,
          'rtl',
          'AppBar did not inherit logical RTL direction.',
        );
        assert.ok(
          appBarGeometry.scrollWidth <= appBarGeometry.clientWidth + 1,
          'AppBar leaked horizontal overflow in its phone/container fixture.',
        );
        assert.equal(
          appBarGeometry.copyFlexBasis,
          '100%',
          'AppBar copy did not adapt from its measured narrow container.',
        );
        assert.equal(
          appBarGeometry.titleWhiteSpace,
          'normal',
          'AppBar narrow-container copy remained viewport-style truncated instead of wrapping.',
        );

        const axe = await runAxe(page, 'UIR13 developer compositions');
        diagnostics.assertClean('UIR13 developer compositions');
        return { geometry, axe };
      } finally {
        await context.close();
      }
    },
    { accepts: ['Card', 'PageScaffold', 'ApplicationItem', 'ContentState', 'AppBar'] },
  ),
  scenario(
    'semantic-adaptive-runtime-certification',
    [
      'semantic-ir',
      'adaptive',
      'container',
      'commands',
      'overflow',
      'forms',
      'touch',
      'keyboard',
      'rtl',
      'a11y',
      'studio',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1100, height: 820 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const regular = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'content',
          modality: 'mouse',
          pointer: 'fine',
          density: 'comfortable',
          dir: 'ltr',
          viewport: 'desktop',
        });
        const regularGroup = regular.locator('[data-ui-ir-kind="command-group"]');
        assert.equal(
          await regularGroup.getAttribute('data-ui-ir-presentation'),
          'inline-overflow',
          'Regular semantic command policy did not keep bounded inline actions plus overflow.',
        );
        assert.deepEqual(
          await regularGroup
            .locator('[data-ui-command-placement="inline"]')
            .evaluateAll((items) => items.map((item) => item.getAttribute('data-ui-command'))),
          ['settings.save', 'settings.preview', 'settings.copy-link'],
          'Regular semantic command placement drifted from deterministic author order.',
        );
        const regularOverflow = regularGroup.getByRole('button', {
          name: 'Settings actions: More actions',
          exact: true,
        });
        await regularOverflow.click();
        const exportItem = page.getByRole('menuitem', { name: 'Export', exact: true });
        const helpItem = page.getByRole('menuitem', { name: 'Help', exact: true });
        assert.equal(await exportItem.isVisible(), true, 'Regular semantic overflow lost Export.');
        assert.equal(await helpItem.isVisible(), true, 'Regular semantic overflow lost Help.');
        await helpItem.click();
        await regular.getByText('settings.help', { exact: true }).waitFor({ state: 'visible' });
        assert.match(
          await regular.innerText(),
          /Last command:\s*settings\.help/u,
          'Semantic overflow command did not execute through the host registry.',
        );

        const compact = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'compact',
          modality: 'touch',
          pointer: 'coarse',
          density: 'comfortable',
          dir: 'ltr',
          viewport: 'phone',
        });
        const compactGroup = compact.locator('[data-ui-ir-kind="command-group"]');
        assert.equal(
          await compactGroup.getAttribute('data-ui-ir-presentation'),
          'menu',
          'Compact/touch semantic command policy did not collapse to a canonical menu.',
        );
        assert.equal(
          await compact.locator('[data-ui-choice-presentation="select"]').count(),
          1,
          'Compact/touch semantic choice did not resolve to Select.',
        );
        const compactTrigger = compactGroup.getByRole('button', {
          name: 'Settings actions',
          exact: true,
        });
        await assertMinimumBlockSize(compactTrigger, 44, 'Semantic compact command trigger');
        await compactTrigger.click();
        const compactCopy = page.getByRole('menuitem', { name: 'Copy link', exact: true });
        assert.equal(
          await compactCopy.getAttribute('aria-keyshortcuts'),
          'Control+Shift+C',
          'Semantic compact menu lost command shortcut metadata.',
        );
        await page.keyboard.press('Escape');
        const compactAxe = await runAxe(page, 'V2 semantic adaptive runtime compact');

        const wide = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'wide',
          modality: 'keyboard',
          pointer: 'fine',
          density: 'compact',
          dir: 'rtl',
          viewport: 'ultrawide',
        });
        const wideGroup = wide.locator('[data-ui-ir-kind="command-group"]');
        assert.equal(
          await wideGroup.getAttribute('data-ui-ir-presentation'),
          'inline',
          'Wide semantic command policy did not preserve the full inline command set.',
        );
        assert.equal(
          await wideGroup.locator('[data-ui-command-placement="inline"]').count(),
          5,
          'Wide semantic command policy did not keep all five commands inline.',
        );
        assert.equal(
          await wideGroup.locator('[data-ui-command-overflow-trigger]').count(),
          0,
          'Wide semantic command policy rendered an unnecessary overflow trigger.',
        );
        assert.equal(
          await wide.locator('[data-ui-choice-presentation="segmented"]').count(),
          1,
          'Wide semantic choice did not preserve the segmented author preference.',
        );
        assert.equal(
          await page.locator('.ui-studio-root').getAttribute('data-oxs-direction'),
          'rtl',
          'Semantic Studio did not resolve RTL through the owning UiRoot environment.',
        );
        const runtimeJson = wide.locator('[data-studio-semantic-json-panel="runtime"]');
        assert.equal(
          await runtimeJson.count(),
          1,
          'Semantic Runtime IR panel hook is missing or ambiguous.',
        );
        const runtimeText = await runtimeJson.innerText();
        assert.match(runtimeText, /"container": "wide"/u, 'Runtime IR omitted resolved container.');
        assert.match(
          runtimeText,
          /"modality": "keyboard"/u,
          'Runtime IR omitted resolved modality.',
        );
        assert.match(runtimeText, /"direction": "rtl"/u, 'Runtime IR omitted resolved direction.');
        assert.doesNotMatch(
          runtimeText,
          /"modality": "auto"/u,
          'Runtime IR leaked preference state.',
        );

        const wideAxe = await runAxe(page, 'V2 semantic adaptive runtime wide');
        diagnostics.assertClean('V2 semantic adaptive runtime');
        return { compactAxe, wideAxe };
      } finally {
        await context.close();
      }
    },
  ),
  scenario(
    'semantic-collection-workspace-certification',
    [
      'semantic-ir',
      'collection',
      'workspace',
      'selection',
      'activation',
      'bounded-source',
      'spatial-navigation',
      'adaptive',
      'keyboard',
      'a11y',
      'studio',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1180, height: 860 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const wide = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'wide',
          modality: 'keyboard',
          pointer: 'fine',
          density: 'comfortable',
          dir: 'ltr',
          viewport: 'desktop',
        });
        const workspace = wide.locator('[data-ui-ir-kind="workspace"]');
        assert.equal(
          await workspace.count(),
          1,
          'Semantic workspace root is missing or ambiguous.',
        );
        for (const role of ['sidebar', 'pane', 'inspector']) {
          assert.equal(
            await workspace.locator(`[data-ui-workspace-region="${role}"]`).count(),
            1,
            `Semantic workspace lost its ${role} region.`,
          );
        }

        const sidebar = workspace.locator('[data-ui-workspace-region="sidebar"]');
        const pane = workspace.locator('[data-ui-workspace-region="pane"]');
        const inspector = workspace.locator('[data-ui-workspace-region="inspector"]');
        assert.equal(
          await sidebar.locator('[data-ui-ir-kind="collection"]').getAttribute('data-ui-ir-id'),
          'studio.file-places',
          'Semantic workspace sidebar did not render its distinct Places collection.',
        );
        assert.equal(
          await inspector.locator('[data-ui-ir-kind="form"]').getAttribute('data-ui-ir-id'),
          'studio.file-inspector',
          'Semantic workspace inspector did not render its distinct host-derived details surface.',
        );
        const collection = pane.locator('[data-ui-ir-kind="collection"]');
        assert.equal(
          await collection.getAttribute('data-ui-collection-presentation'),
          'grid',
          'Wide semantic file collection did not preserve its grid preference.',
        );
        assert.equal(
          await collection.getAttribute('data-ui-collection-total'),
          '12',
          'Bounded collection snapshot lost host-reported totalCount.',
        );
        assert.equal(
          await collection.getAttribute('data-ui-collection-has-more'),
          'true',
          'Bounded collection snapshot lost hasMore metadata.',
        );
        assert.equal(
          await collection.locator('[data-ui-collection-item]').count(),
          3,
          'Semantic collection rendered outside its bounded visible source window.',
        );

        const readme = collection.locator('[data-ui-collection-item="readme"]');
        const roadmap = collection.locator('[data-ui-collection-item="roadmap"]');
        const readmeAction = readme.locator('[data-ui-tile-action]');
        const roadmapAction = roadmap.locator('[data-ui-tile-action]');
        await readmeAction.focus();
        await page.keyboard.press('ArrowRight');
        assert.equal(
          await roadmapAction.evaluate(
            (element) => element === element.ownerDocument.activeElement,
          ),
          true,
          'Semantic grid did not reuse certified spatial keyboard navigation.',
        );

        await readmeAction.click();
        await wide.getByText('selected: 1', { exact: true }).waitFor({ state: 'visible' });
        assert.equal(
          await readme.getAttribute('data-ui-collection-selected'),
          'true',
          'Semantic collection selection did not round-trip through the host binding.',
        );
        assert.equal(
          await inspector.locator('[data-ui-binding="files.selected-label"]').inputValue(),
          'readme',
          'Semantic inspector did not derive its value from host-owned collection selection.',
        );

        await roadmapAction.dblclick();
        await wide.getByText('target: roadmap', { exact: true }).waitFor({ state: 'visible' });
        assert.match(
          await wide.innerText(),
          /Last command:\s*file\.open/u,
          'Semantic item activation did not execute through the host command registry.',
        );

        const compact = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'compact',
          modality: 'touch',
          pointer: 'coarse',
          density: 'comfortable',
          dir: 'ltr',
          viewport: 'phone',
        });
        const compactPane = compact.locator('[data-ui-workspace-region="pane"]');
        assert.equal(
          await compactPane
            .locator('[data-ui-ir-kind="collection"]')
            .getAttribute('data-ui-collection-presentation'),
          'list',
          'Compact semantic collection did not adapt grid preference to canonical list presentation.',
        );

        const axe = await runAxe(page, 'V2 semantic collection workspace');
        diagnostics.assertClean('V2 semantic collection workspace');
        return { axe };
      } finally {
        await context.close();
      }
    },
  ),
  scenario(
    'semantic-inspection-actionability-certification',
    [
      'semantic-ir',
      'inspection',
      'ai-actionability',
      'focus',
      'selection',
      'commands',
      'host-authority',
      'keyboard',
      'a11y',
      'studio',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1180, height: 860 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const workbench = await gotoSemanticWorkbench(page, baseUrl, {
          container: 'wide',
          modality: 'keyboard',
          pointer: 'fine',
          density: 'comfortable',
          dir: 'ltr',
          viewport: 'desktop',
        });
        const pane = workbench.locator('[data-ui-workspace-region="pane"]');
        const collection = pane.locator('[data-ui-ir-id="studio.recent-files"]');
        const readme = collection.locator('[data-ui-collection-item="readme"]');
        const roadmap = collection.locator('[data-ui-collection-item="roadmap"]');
        const readmeAction = readme.locator('[data-ui-tile-action]');
        const roadmapAction = roadmap.locator('[data-ui-tile-action]');

        await readmeAction.click();
        await workbench.getByText('selected: 1', { exact: true }).waitFor({ state: 'visible' });
        await roadmapAction.focus();
        await workbench.getByText('focus: roadmap', { exact: true }).waitFor({ state: 'visible' });

        const inspectionPanel = workbench.locator('[data-studio-semantic-json-panel="inspection"]');
        assert.equal(await inspectionPanel.count(), 1, 'Semantic inspection panel is missing.');
        const inspectionText = await inspectionPanel.innerText();
        assert.match(inspectionText, /"surface": "studio\.semantic-v2"/u);
        assert.match(inspectionText, /"node": "studio\.recent-files"/u);
        assert.match(inspectionText, /"item": "roadmap"/u);
        assert.match(inspectionText, /"ids": \[\s*"readme"/u);
        assert.match(inspectionText, /"command": "file\.open"/u);
        assert.match(inspectionText, /"scope": "focused-item"/u);
        assert.match(inspectionText, /"target": "roadmap"/u);
        assert.doesNotMatch(inspectionText, /setSelectedFiles|setLastCommand|function/u);

        const invoke = workbench.locator('[data-studio-semantic-ai-invoke="file.open"]');
        assert.equal(
          await invoke.isEnabled(),
          true,
          'Focused semantic Open action is not invocable.',
        );
        await invoke.click();
        const invocationStatus = workbench.locator('[data-studio-semantic-ai-status]');
        await invocationStatus.filter({ hasText: 'executed' }).waitFor({ state: 'visible' });
        assert.equal((await invocationStatus.innerText()).trim(), 'executed');
        await workbench.getByText('target: roadmap', { exact: true }).waitFor({ state: 'visible' });
        assert.match(
          await workbench.innerText(),
          /Last command:\s*file\.open/u,
          'Inspection-driven command did not execute through the host registry.',
        );

        const axe = await runAxe(page, 'V2 semantic inspection actionability');
        diagnostics.assertClean('V2 semantic inspection actionability');
        return { axe };
      } finally {
        await context.close();
      }
    },
  ),
  scenario(
    'system-ui-core-certification',
    [
      'system-ui',
      'components-only',
      'workspace',
      'chrome',
      'launcher',
      'settings',
      'adaptive',
      'rtl',
      'touch',
      'keyboard',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 1100, height: 820 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const boundary = await gotoCatalog(page, baseUrl, {
          entry: 'SystemScaffold',
          tab: 'examples',
          example: 'boundary',
          dir: 'rtl',
        });
        const scaffold = boundary.locator('[data-oxs-system-scaffold]');
        assert.equal(await scaffold.count(), 1, 'SystemScaffold boundary example lost its root.');
        assert.equal(
          await boundary.locator('[data-oxs-system-surface="chrome"]').count(),
          1,
          'SystemSurface chrome classification is missing.',
        );
        assert.equal(
          await boundary.locator('[data-oxs-privileged-surface-host]').count(),
          1,
          'SystemScaffold lost the privileged host boundary.',
        );
        assert.equal(
          await boundary
            .getByRole('region', { name: 'Privileged host preview', exact: true })
            .isVisible(),
          true,
          'UIR14 core fixture did not expose its structural privileged host slot.',
        );
        assert.equal(
          await boundary.locator('[data-oxs-system-keyboard]').count(),
          0,
          'UIR14 core certification must not depend on UIR15 privileged keyboard behavior.',
        );
        await runAxe(page, 'UIR14 System scaffold boundary');

        const layout = await gotoCatalog(page, baseUrl, {
          entry: 'DesktopShellLayout',
          tab: 'examples',
          example: 'layout-library',
          dir: 'rtl',
          pointer: 'coarse',
        });
        assert.equal(
          await layout.getByRole('region', { name: 'Desktop workspace', exact: true }).isVisible(),
          true,
        );
        assert.equal(
          await layout.getByRole('toolbar', { name: 'Top system bar', exact: true }).isVisible(),
          true,
        );
        assert.equal(
          await layout.getByRole('toolbar', { name: 'System dock', exact: true }).isVisible(),
          true,
        );
        assert.equal(
          await layout.getByRole('group', { name: 'Connectivity', exact: true }).isVisible(),
          true,
          'SystemChromeGroup is not represented by the UIR14 layout evidence.',
        );
        assert.equal(
          await layout.getByText('Native scene slot', { exact: true }).isVisible(),
          true,
          'SystemWorkspace lost the caller-owned native scene slot.',
        );
        assert.equal(
          await layout.getByText('All services ready', { exact: true }).isVisible(),
          true,
        );
        const logicalDock = layout.locator('.ui-system-dock[data-oxs-system-edge="inline-start"]');
        const logicalPanel = layout.locator('.ui-system-panel[data-oxs-system-edge="inline-end"]');
        const [dockBox, panelBox] = await Promise.all([
          logicalDock.boundingBox(),
          logicalPanel.boundingBox(),
        ]);
        assert.ok(dockBox && panelBox, 'System logical dock/panel geometry is unavailable.');
        assert.ok(
          dockBox.x + dockBox.width / 2 > panelBox.x + panelBox.width / 2,
          'RTL inline-start dock and inline-end panel did not resolve to opposite logical edges.',
        );
        await runAxe(page, 'UIR14 desktop System layout');

        const applicationBrowser = await gotoCatalog(page, baseUrl, {
          entry: 'SystemApplicationBrowser',
          tab: 'examples',
          example: 'application-browser',
          dir: 'rtl',
          pointer: 'coarse',
          viewport: 'phone',
        });
        const browserSearch = applicationBrowser.getByRole('searchbox', {
          name: 'Search applications',
          exact: true,
        });
        await browserSearch.fill('Files');
        const directFiles = applicationBrowser.getByRole('button', {
          name: /Files/,
        });
        assert.equal(await directFiles.isVisible(), true);
        assert.equal(
          await applicationBrowser.getByRole('button', { name: /Browser/ }).count(),
          0,
          'Caller-owned application projection did not update after the controlled query.',
        );
        await assertMinimumBlockSize(
          directFiles,
          44,
          'SystemApplicationBrowser coarse-pointer application action',
        );
        await directFiles.focus();
        await page.keyboard.press('Enter');
        assert.equal(
          await applicationBrowser
            .getByText('Requested application id: files', { exact: true })
            .isVisible(),
          true,
          'SystemApplicationBrowser did not report activation by stable identity.',
        );
        const browserOverflow = await applicationBrowser.evaluate(
          (element) => element.scrollWidth - element.clientWidth,
        );
        assert.ok(
          browserOverflow <= 1,
          `SystemApplicationBrowser overflowed its phone container by ${browserOverflow}px.`,
        );
        await runAxe(page, 'UIR14 application browser');

        const launcher = await gotoCatalog(page, baseUrl, {
          entry: 'SystemLauncher',
          tab: 'examples',
          example: 'launcher',
          dir: 'rtl',
          pointer: 'coarse',
          viewport: 'phone',
        });
        const launcherOwnerRoot = launcher.locator('xpath=ancestor::*[@data-oxs-scope][1]');
        const launcherPortal = launcherOwnerRoot.locator(':scope > [data-oxs-portal-root]');
        const launcherLayer = launcherPortal.locator(':scope > .ui-system-launcher-layer');
        await launcher.getByRole('button', { name: 'Open System Launcher', exact: true }).click();
        assert.equal(
          await launcherLayer.count(),
          1,
          'SystemLauncher example did not resolve to exactly one owner-realm portal layer.',
        );
        const launcherDialog = launcherLayer.getByRole('dialog', {
          name: 'Application launcher',
          exact: true,
        });
        assert.equal(
          await launcherDialog.isVisible(),
          true,
          'SystemLauncher did not open through Component overlay authority.',
        );
        const search = launcherDialog.getByRole('searchbox', {
          name: 'Search applications',
          exact: true,
        });
        await search.fill('Files');
        const launcherFiles = launcherDialog.getByRole('button', {
          name: 'Files',
          exact: true,
        });
        assert.equal(await launcherFiles.isVisible(), true);
        assert.equal(
          await launcherDialog.getByRole('button', { name: 'Browser', exact: true }).count(),
          0,
        );
        await assertMinimumBlockSize(
          launcherFiles,
          44,
          'SystemLauncher coarse-pointer application action',
        );
        await runAxe(page, 'UIR14 System launcher');
        const launcherLayerHandle = await launcherLayer.elementHandle();
        assert.ok(launcherLayerHandle, 'SystemLauncher owner layer disappeared before dismissal.');
        await page.keyboard.press('Escape');
        await page.waitForFunction(
          (element) =>
            element instanceof HTMLElement &&
            element.dataset.open === 'false' &&
            element.getAttribute('aria-hidden') === 'true',
          launcherLayerHandle,
        );

        const narrowSettings = await gotoCatalog(page, baseUrl, {
          entry: 'SystemSettingsLayout',
          tab: 'examples',
          example: 'settings',
          dir: 'rtl',
          pointer: 'coarse',
          viewport: 'phone',
        });
        const inputSection = narrowSettings.getByRole('button', { name: 'Input', exact: true });
        await assertMinimumBlockSize(inputSection, 44, 'SystemSettingsLayout coarse navigation');
        await inputSection.click();
        assert.equal(
          await narrowSettings.getByText('Current section: input', { exact: false }).isVisible(),
          true,
          'SystemSettingsLayout did not keep section state caller-owned.',
        );
        const narrowMain = narrowSettings.getByRole('main', {
          name: 'System settings content',
          exact: true,
        });
        assert.equal(await narrowMain.isVisible(), true);
        const narrowSidebar = narrowSettings.locator('.ui-page-scaffold__sidebar');
        const [narrowSidebarBox, narrowMainBox] = await Promise.all([
          narrowSidebar.boundingBox(),
          narrowMain.boundingBox(),
        ]);
        assert.ok(
          narrowSidebarBox && narrowMainBox,
          'Narrow SystemSettingsLayout geometry is unavailable.',
        );
        assert.ok(
          narrowSidebarBox.y + narrowSidebarBox.height <= narrowMainBox.y + 2,
          'Narrow SystemSettingsLayout did not collapse navigation above content.',
        );
        await runAxe(page, 'UIR14 narrow System settings');

        const wideSettings = await gotoCatalog(page, baseUrl, {
          entry: 'SystemSettingsLayout',
          tab: 'examples',
          example: 'settings',
          dir: 'rtl',
          pointer: 'fine',
          viewport: 'desktop',
        });
        const wideLayout = wideSettings.locator('.ui-system-settings-layout');
        const wideSidebar = wideSettings.locator('.ui-page-scaffold__sidebar');
        const wideMain = wideSettings.getByRole('main', {
          name: 'System settings content',
          exact: true,
        });
        const [wideLayoutBox, wideSidebarBox, wideMainBox] = await Promise.all([
          wideLayout.boundingBox(),
          wideSidebar.boundingBox(),
          wideMain.boundingBox(),
        ]);
        assert.ok(
          wideLayoutBox && wideSidebarBox && wideMainBox,
          'Wide SystemSettingsLayout geometry is unavailable.',
        );
        const rootFontSize = await page.evaluate(() =>
          Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
        );
        assert.ok(
          wideLayoutBox.width >= rootFontSize * 44,
          `Wide SystemSettingsLayout fixture did not provide the 44rem container required by its split query (actual ${wideLayoutBox.width}px).`,
        );
        assert.ok(
          Math.abs(wideSidebarBox.x - wideMainBox.x) > 80,
          'Wide SystemSettingsLayout did not adapt into a split navigation/content composition.',
        );
        const wideNavigation = wideSettings.getByRole('navigation', {
          name: 'Settings sections',
          exact: true,
        });
        const wideNavigationItems = wideNavigation.getByRole('button');
        assert.ok(
          (await wideNavigationItems.count()) >= 2,
          'Wide SystemSettingsLayout did not expose enough navigation items to certify its sidebar axis.',
        );
        const wideNavigationList = wideNavigation.locator('.ui-navigation__items');
        const [wideFirstNavigationBox, wideSecondNavigationBox, wideNavigationLayout] =
          await Promise.all([
            wideNavigationItems.nth(0).boundingBox(),
            wideNavigationItems.nth(1).boundingBox(),
            wideNavigationList.evaluate((element) => {
              const style = getComputedStyle(element);
              return {
                display: style.display,
                flexDirection: style.flexDirection,
                gridTemplateColumns: style.gridTemplateColumns,
                width: element.getBoundingClientRect().width,
              };
            }),
          ]);
        assert.ok(
          wideFirstNavigationBox && wideSecondNavigationBox,
          'Wide SystemSettingsLayout navigation item geometry is unavailable.',
        );
        assert.ok(
          wideSecondNavigationBox.y >
            wideFirstNavigationBox.y + wideFirstNavigationBox.height * 0.55 &&
            Math.abs(wideSecondNavigationBox.x - wideFirstNavigationBox.x) < 4,
          `Wide SystemSettingsLayout navigation did not remain vertically stacked inside the split sidebar. Diagnostics: ${JSON.stringify(
            {
              first: wideFirstNavigationBox,
              second: wideSecondNavigationBox,
              layout: wideNavigationLayout,
            },
          )}`,
        );

        await assertNoGlobalHorizontalOverflow(page, 'UIR14 System UI core');
        const axe = await runAxe(page, 'UIR14 System UI core');
        diagnostics.assertClean('UIR14 System UI core');
        return { axe };
      } finally {
        await context.close();
      }
    },
    {
      accepts: [
        'SystemScaffold',
        'SystemSurface',
        'SystemLauncher',
        'SystemWorkspace',
        'DesktopShellLayout',
        'SystemApplicationBrowser',
        'SystemBar',
        'SystemDock',
        'SystemPanel',
        'SystemChromeGroup',
        'SystemSettingsLayout',
      ],
    },
  ),
  scenario(
    'privileged-system-surfaces-certification',
    [
      'system-ui',
      'privileged',
      'host-boundary',
      'occlusion',
      'transient',
      'keyboard',
      'touch',
      'rtl',
      'reduced-motion',
      'a11y',
    ],
    async ({ browser, baseUrl }) => {
      const context = await browser.newContext({ viewport: { width: 980, height: 800 } });
      const page = await context.newPage();
      const diagnostics = attachRuntimeDiagnostics(page);
      try {
        const transient = await gotoCatalog(page, baseUrl, {
          entry: 'SystemOsd',
          tab: 'examples',
          example: 'transient',
          dir: 'rtl',
          pointer: 'coarse',
          motion: 'reduced',
          insets: 'keyboard',
        });
        const volume = transient.getByRole('progressbar', { name: 'Volume', exact: true }).first();
        assert.equal(
          await volume.getAttribute('value'),
          '64',
          'SystemOsd lost semantic progress value.',
        );
        const osdContract = await transient
          .locator('.ui-system-osd')
          .first()
          .evaluate((element) => {
            const root = element.closest('.ui-root');
            const style = getComputedStyle(element);
            const rootStyle = root ? getComputedStyle(root) : null;
            return {
              edge: element.getAttribute('data-oxs-system-edge'),
              insetBlockEnd: Number.parseFloat(style.insetBlockEnd),
              occlusionBlockEnd: Number.parseFloat(
                rootStyle?.getPropertyValue('--oxs-occlusion-block-end') || '0',
              ),
              pointerEvents: style.pointerEvents,
              animations: element.getAnimations({ subtree: true }).length,
            };
          });
        assert.equal(osdContract.edge, 'block-end', 'SystemOsd lost logical block-end placement.');
        assert.ok(
          osdContract.insetBlockEnd >= osdContract.occlusionBlockEnd,
          'SystemOsd did not stay clear of transient keyboard occlusion.',
        );
        assert.equal(
          osdContract.pointerEvents,
          'none',
          'Informational SystemOsd captured pointer input.',
        );
        assert.equal(
          osdContract.animations,
          0,
          'Reduced-motion SystemOsd retained autonomous animation.',
        );
        assert.equal(
          await transient.locator('.ui-system-osd [role="status"]').count(),
          1,
          'SystemOsd lost its polite live status semantics.',
        );
        assert.equal(
          await transient.getByRole('switch', { name: 'Wi-Fi', exact: true }).isVisible(),
          true,
          'SystemQuickSettings lost Component controls.',
        );
        assert.equal(
          await transient.locator('[data-system-quick-setting-id="wireless"]').count(),
          1,
          'SystemQuickSettings lost stable caller-owned section identity.',
        );
        const lock = transient.getByRole('region', { name: 'Lock screen', exact: true });
        assert.equal(await lock.isVisible(), true, 'SystemLockLayout lost its landmark.');
        const lockContract = await lock.evaluate((element) => {
          const root = element.closest('.ui-root');
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            paddingBlockEnd: Number.parseFloat(getComputedStyle(element).paddingBlockEnd),
            occlusionBlockEnd: Number.parseFloat(
              rootStyle?.getPropertyValue('--oxs-occlusion-block-end') || '0',
            ),
          };
        });
        assert.ok(
          lockContract.paddingBlockEnd >= lockContract.occlusionBlockEnd,
          'SystemLockLayout did not keep authentication content clear of transient occlusion.',
        );
        await transient.getByRole('button', { name: 'Open commands', exact: true }).click();
        const commands = page.getByRole('dialog', { name: 'Commands', exact: true });
        assert.equal(
          await commands.isVisible(),
          true,
          'SystemCommandSurface did not open through shared Dialog authority.',
        );
        const commandSearch = commands.getByRole('searchbox', {
          name: 'Search commands',
          exact: true,
        });
        await commandSearch.fill('lock');
        assert.equal(
          await commands.getByRole('button', { name: /Lock session/ }).isVisible(),
          true,
        );
        await page.keyboard.press('Escape');
        const transientAxe = await runAxe(page, 'UIR15 transient/privileged System surfaces');

        const notifications = await gotoCatalog(page, baseUrl, {
          entry: 'SystemNotificationCenter',
          tab: 'examples',
          example: 'notifications',
          dir: 'rtl',
          pointer: 'coarse',
        });
        const syncNotification = notifications.getByRole('button', { name: /Sync complete/ });
        await assertMinimumBlockSize(
          syncNotification,
          44,
          'SystemNotificationCenter coarse-pointer notification action',
        );
        await syncNotification.click();
        assert.equal(
          await notifications
            .getByText('Requested notification id: sync-complete', { exact: true })
            .isVisible(),
          true,
          'SystemNotificationCenter did not report activation by stable identity.',
        );
        const notificationsAxe = await runAxe(page, 'UIR15 notification center');

        let keyboard = await gotoCatalog(page, baseUrl, {
          entry: 'SystemKeyboardHost',
          tab: 'examples',
          example: 'keyboard',
          dir: 'rtl',
          pointer: 'coarse',
          motion: 'reduced',
          viewport: 'phone',
          insets: 'gesture',
        });
        let host = keyboard.getByRole('group', { name: 'System touch keyboard', exact: true });
        assert.equal(
          await host.locator('xpath=ancestor::*[@data-oxs-privileged-surface-host][1]').count(),
          1,
          'SystemKeyboardHost was not mounted through the owning SystemScaffold privileged slot.',
        );
        assert.equal(
          await host.locator('xpath=ancestor::*[@data-oxs-system-surface="privileged"][1]').count(),
          1,
          'SystemKeyboardHost escaped the privileged SystemSurface boundary.',
        );
        const safeAreaContract = await host.evaluate((element) => {
          const root = element.closest('.ui-root');
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            paddingBlockEnd: Number.parseFloat(getComputedStyle(element).paddingBlockEnd),
            safeBlockEnd: Number.parseFloat(
              rootStyle?.getPropertyValue('--oxs-safe-block-end') || '0',
            ),
            animations: element.getAnimations({ subtree: true }).length,
          };
        });
        assert.ok(
          safeAreaContract.paddingBlockEnd >= safeAreaContract.safeBlockEnd,
          'SystemKeyboardHost did not consume persistent logical safe-area padding.',
        );
        assert.equal(
          safeAreaContract.animations,
          0,
          'Reduced-motion SystemKeyboardHost retained autonomous animation.',
        );
        const key = host.getByRole('button').first();
        await assertMinimumBlockSize(key, 44, 'SystemKeyboardHost coarse-pointer key');
        await key.click();
        assert.equal(
          await keyboard.getByText(/Last command:/).isVisible(),
          true,
          'SystemKeyboardHost did not emit a typed host command.',
        );
        await host.getByRole('button', { name: 'Switch language', exact: true }).click();
        assert.equal(
          await host.getAttribute('dir'),
          'rtl',
          'Persian key plane did not switch to RTL.',
        );
        assert.equal(
          await host.getByRole('button', { name: 'ض', exact: true }).isVisible(),
          true,
          'Persian key plane did not render after host-owned language request settlement.',
        );

        keyboard = await gotoCatalog(page, baseUrl, {
          entry: 'SystemKeyboardHost',
          tab: 'examples',
          example: 'keyboard',
          dir: 'rtl',
          pointer: 'coarse',
          motion: 'reduced',
          viewport: 'phone',
          insets: 'keyboard',
        });
        host = keyboard.getByRole('group', { name: 'System touch keyboard', exact: true });
        const hostContract = await host.evaluate((element) => {
          const surface = element.closest('[data-oxs-system-surface="privileged"]');
          const root = element.closest('.ui-root');
          const rootStyle = root ? getComputedStyle(root) : null;
          return {
            edge: surface?.getAttribute('data-oxs-system-edge'),
            occludes: surface?.getAttribute('data-oxs-occludes-content'),
            paddingBlockEnd: Number.parseFloat(getComputedStyle(element).paddingBlockEnd),
            occlusionBlockEnd: Number.parseFloat(
              rootStyle?.getPropertyValue('--oxs-occlusion-block-end') || '0',
            ),
          };
        });
        assert.equal(
          hostContract.edge,
          'block-end',
          'SystemKeyboardHost lost logical block-end placement.',
        );
        assert.equal(
          hostContract.occludes,
          'true',
          'SystemKeyboardHost lost explicit occlusion metadata.',
        );
        assert.equal(
          hostContract.occlusionBlockEnd,
          280,
          'Studio keyboard-occlusion preset did not project the host-owned transient inset.',
        );
        assert.ok(
          hostContract.paddingBlockEnd < hostContract.occlusionBlockEnd,
          'SystemKeyboardHost consumed the occlusion that it is responsible for producing.',
        );

        await assertNoGlobalHorizontalOverflow(page, 'UIR15 privileged System surfaces');
        const axe = await runAxe(page, 'UIR15 privileged System surfaces');
        diagnostics.assertClean('UIR15 privileged System surfaces');
        return {
          osdContract,
          lockContract,
          safeAreaContract,
          hostContract,
          axe: [transientAxe, notificationsAxe, axe],
        };
      } finally {
        await context.close();
      }
    },
    {
      accepts: [
        'SystemNotificationCenter',
        'SystemQuickSettings',
        'SystemOsd',
        'SystemCommandSurface',
        'SystemLockLayout',
        'SystemKeyboardHost',
      ],
    },
  ),
];
