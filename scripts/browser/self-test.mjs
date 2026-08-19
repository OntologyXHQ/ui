import assert from 'node:assert/strict';
import {
  assertEnvironment,
  assertNoFocusedIsolationConflict,
  assertMinimumBlockSize,
  assertPublicUiStylesLoaded,
  assertNoGlobalHorizontalOverflow,
  assertVisibleFocus,
  focusByTab,
  performTouchLongPress,
  runAxe,
} from './harness.mjs';

async function expectFailure(name, operation, match) {
  try {
    await operation();
  } catch (error) {
    if (match && !match.test(String(error.message))) {
      throw new Error(`Harness self-test "${name}" failed for the wrong reason: ${error.message}`);
    }
    return { id: name, observedFailure: String(error.message).split('\n')[0] };
  }
  throw new Error(`Harness self-test "${name}" did not reject its intentionally broken browser fixture.`);
}

export async function runHarnessSelfTests(browser) {
  const results = [];

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<main><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" ><button></button></main>');
      results.push(await expectFailure('axe-serious-critical-blocker', () => runAxe(page, 'broken accessibility fixture'), /axe violation/));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<main style="background:#fff;color:#aaa;font:16px/1.5 sans-serif;padding:24px">Intentionally low contrast readable text</main>');
      results.push(await expectFailure(
        'axe-color-contrast-blocker',
        () => runAxe(page, 'broken color contrast fixture'),
        /color-contrast/,
      ));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<div id="background"><button id="focused">Focused background</button></div><div role="dialog">Modal</div>');
      await page.locator('#focused').focus();
      await page.locator('#background').evaluate((element) => element.setAttribute('aria-hidden', 'true'));
      results.push(await expectFailure(
        'focused-isolation-invariant-detector',
        () => assertNoFocusedIsolationConflict(page, 'broken focused isolation fixture'),
        /retained focus inside an aria-hidden\/inert ancestor/i,
      ));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<button id="focus" style="outline:none;box-shadow:none">No focus ring</button>');
      const button = page.locator('#focus');
      await focusByTab(page, button, { maxSteps: 4 });
      results.push(await expectFailure('visible-focus-detector', () => assertVisibleFocus(button, 'broken focus fixture'), /focus indicator/));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 320, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<div style="width:900px;height:10px">overflow</div>');
      results.push(await expectFailure('reflow-overflow-detector', () => assertNoGlobalHorizontalOverflow(page, 'broken reflow fixture'), /horizontal overflow/));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<div class="ui-studio-viewport" data-viewport="phone" style="--ui-studio-viewport-width:390px;--ui-studio-content-width:48rem"><div class="ui-root" dir="ltr" data-oxs-theme="dark" data-oxs-density="comfortable" data-oxs-motion="full" data-oxs-modality="mouse" data-oxs-pointer-precision="fine"></div></div>');
      results.push(await expectFailure('environment-projection-detector', () => assertEnvironment(page, { dir: 'rtl' }), /Environment mismatch/));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<main data-studio-entry="Button" data-studio-tab="overview"></main>');
      const missing = page.locator('[data-studio-entry="Dialog"][data-studio-tab="examples"]');
      results.push(await expectFailure('deterministic-route-detector', async () => {
        await missing.waitFor({ state: 'visible', timeout: 150 });
      }, /Timeout/));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
    const page = await context.newPage();
    try {
      await page.setContent('<div class="ui-root"></div>');
      results.push(await expectFailure(
        'public-stylesheet-detector',
        () => assertPublicUiStylesLoaded(page),
        /stylesheet is not active/,
      ));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    try {
      await page.setContent('<section id="collapsed" style="height:24px"></section>');
      results.push(await expectFailure(
        'mobile-documentation-viewport-collapse-detector',
        () => assertMinimumBlockSize(page.locator('#collapsed'), 176, 'Broken mobile documentation viewport'),
        /collapsed below its 176px minimum browser block-size budget/,
      ));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.setContent(`
        <button id="hold" style="width:120px;height:48px;touch-action:manipulation">Hold</button>
        <div id="activation" role="menu" hidden>Activated</div>
        <script>
          let timer = null;
          hold.addEventListener('pointerdown', () => {
            timer = setTimeout(() => { activation.hidden = false; }, 80);
          });
          hold.addEventListener('pointerup', () => clearTimeout(timer));
          hold.addEventListener('pointercancel', () => clearTimeout(timer));
        <\/script>
      `);
      const activationMs = await performTouchLongPress(
        page,
        page.locator('#hold'),
        page.locator('#activation'),
        { activationBudgetMs: 300, releaseSettleMs: 20 },
      );
      assert.ok(activationMs <= 300, 'Long-press hold observer exceeded its self-test budget.');
      results.push({ id: 'long-press-hold-observer', activationMs });
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.setContent(`
        <button id="release" style="width:120px;height:48px;touch-action:manipulation">Release only</button>
        <div id="activation" role="menu" hidden>Too late</div>
        <script>release.addEventListener('pointerup', () => { activation.hidden = false; });<\/script>
      `);
      results.push(await expectFailure(
        'long-press-release-only-detector',
        () => performTouchLongPress(
          page,
          page.locator('#release'),
          page.locator('#activation'),
          { activationBudgetMs: 150, releaseSettleMs: 20 },
        ),
        /Timeout/,
      ));
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.setContent(`
        <div id="scroll" style="height:120px;overflow:auto;border:1px solid transparent">
          <div style="height:420px"></div>
          <button id="clipped-hold" style="width:120px;height:48px;touch-action:manipulation">Clipped hold</button>
        </div>
        <div id="activation" role="menu" hidden>Activated after scroll</div>
        <script>
          let timer = null;
          const target = document.getElementById('clipped-hold');
          const activation = document.getElementById('activation');
          target.addEventListener('pointerdown', () => {
            timer = setTimeout(() => { activation.hidden = false; }, 80);
          });
          target.addEventListener('pointerup', () => clearTimeout(timer));
          target.addEventListener('pointercancel', () => clearTimeout(timer));
        <\/script>
      `);
      const target = page.locator('#clipped-hold');
      const before = await target.boundingBox();
      assert.ok(before && before.y > 120, 'Nested-scroll self-test fixture did not begin clipped below its scroll viewport.');
      const activationMs = await performTouchLongPress(
        page,
        target,
        page.locator('#activation'),
        { activationBudgetMs: 300, releaseSettleMs: 20 },
      );
      assert.ok(activationMs <= 300, 'Nested-scroll long-press observer exceeded its self-test budget.');
      results.push({ id: 'long-press-scroll-and-hit-test-owner', activationMs });
    } finally {
      await context.close();
    }
  }

  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await page.setContent(`
        <div id="cover" style="position:fixed;inset:0 0 auto 0;height:56px;z-index:10;background:white">Occluder</div>
        <div id="scroll" style="height:160px;overflow:auto;border:1px solid transparent">
          <div style="height:300px"></div>
          <button id="covered-hold" style="width:120px;height:48px;touch-action:manipulation">Covered hold</button>
          <div style="height:300px"></div>
        </div>
        <div id="activation" role="menu" hidden>Activated after centering</div>
        <script>
          const scroll = document.getElementById('scroll');
          const target = document.getElementById('covered-hold');
          const activation = document.getElementById('activation');
          scroll.scrollTop = target.offsetTop;
          let timer = null;
          target.addEventListener('pointerdown', () => {
            timer = setTimeout(() => { activation.hidden = false; }, 80);
          });
          target.addEventListener('pointerup', () => clearTimeout(timer));
          target.addEventListener('pointercancel', () => clearTimeout(timer));
        <\/script>
      `);
      const target = page.locator('#covered-hold');
      const initialHit = await target.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)?.id;
      });
      assert.equal(initialHit, 'cover', 'Occlusion self-test fixture did not begin covered at the target center.');
      const activationMs = await performTouchLongPress(
        page,
        target,
        page.locator('#activation'),
        { activationBudgetMs: 300, releaseSettleMs: 20 },
      );
      assert.ok(activationMs <= 300, 'Occlusion-centering long-press observer exceeded its self-test budget.');
      results.push({ id: 'long-press-center-away-from-occluder', activationMs });
    } finally {
      await context.close();
    }
  }

  assert.equal(results.length, 13, 'Browser harness self-test matrix is incomplete.');
  return results;
}
