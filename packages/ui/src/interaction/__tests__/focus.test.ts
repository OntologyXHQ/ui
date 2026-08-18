import { afterEach, describe, expect, it } from 'vitest';
import { focusFirstInteractive, keepFocusInside } from '../focus';

afterEach(() => {
  document.body.replaceChildren();
});

describe('shared focus ownership', () => {
  it('includes textarea and native select in initial and trapped focus order', () => {
    const surface = document.createElement('div');
    surface.tabIndex = -1;
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const option = document.createElement('option');
    option.value = 'one';
    option.textContent = 'One';
    select.append(option);
    surface.append(textarea, select);
    document.body.append(surface);

    focusFirstInteractive(surface);
    expect(document.activeElement).toBe(textarea);

    select.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    keepFocusInside(tab, surface);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(textarea);
  });

  it('falls back to the focusable surface when no interactive descendant exists', () => {
    const surface = document.createElement('div');
    surface.tabIndex = -1;
    document.body.append(surface);

    focusFirstInteractive(surface);
    expect(document.activeElement).toBe(surface);
  });
});
