import { describe, expect, it } from 'vitest';
import { normalizeSingleSelection } from '../selection';
import { TypeaheadController, isTypeaheadCharacter, normalizeTypeaheadText } from '../typeahead';

describe('shared typeahead and selection normalization', () => {
  it('normalizes Unicode labels and cycles repeated single-key matches deterministically', () => {
    const controller = new TypeaheadController(700);
    const labels = ['Comfortable', 'Compact', 'Contrast'];

    expect(controller.search({ key: 'c', labels, currentIndex: 0, nowMs: 100 })?.index).toBe(0);
    expect(controller.search({ key: 'c', labels, currentIndex: 0, nowMs: 200 })?.index).toBe(1);
    expect(controller.search({ key: 'c', labels, currentIndex: 1, nowMs: 300 })?.index).toBe(2);
    expect(controller.search({ key: 'c', labels, currentIndex: 2, nowMs: 1200 })?.index).toBe(0);

    expect(normalizeTypeaheadText('  ＡBC  ')).toBe('abc');
    expect(normalizeTypeaheadText(' فارسی ')).toBe('فارسی');
    expect(isTypeaheadCharacter(' ')).toBe(false);
  });

  it('supports menu-style search after the active item without a private timer', () => {
    const controller = new TypeaheadController();
    const labels = ['Open', 'Duplicate', 'Delete', 'Download'];
    const match = controller.search({
      key: 'd',
      labels,
      currentIndex: 1,
      nowMs: 40,
      preferNextMatch: true,
    });
    expect(match?.index).toBe(2);
  });

  it('normalizes invalid and disabled single selections through one shared rule', () => {
    const items = [{ value: 'one' }, { value: 'two', disabled: true }, { value: 'three' }] as const;

    expect(normalizeSingleSelection(items, 'three')).toBe('three');
    expect(normalizeSingleSelection(items, 'two')).toBe('one');
    expect(normalizeSingleSelection(items, 'missing' as 'one', 'none')).toBeUndefined();
  });
});
