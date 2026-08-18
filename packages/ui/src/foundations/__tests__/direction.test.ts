import { describe, expect, it } from 'vitest';
import { resolveUiDirection } from '../environment';

describe('resolveUiDirection', () => {
  it('preserves explicit directions', () => {
    expect(resolveUiDirection('ltr')).toBe('ltr');
    expect(resolveUiDirection('rtl')).toBe('rtl');
  });

  it('resolves auto from the concrete subtree direction', () => {
    const element = document.createElement('div');
    element.style.direction = 'rtl';
    document.body.appendChild(element);

    expect(resolveUiDirection('auto', element)).toBe('rtl');

    element.remove();
  });
});
