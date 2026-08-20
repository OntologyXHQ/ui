import { describe, expect, it } from 'vitest';
import { UI_CUSTOMIZABLE_TOKENS, UI_TOKEN_GROUPS, uiTokenStyle } from '../tokens';

describe('semantic token contract', () => {
  it('derives one unique public override surface from semantic groups', () => {
    const grouped = Object.values(UI_TOKEN_GROUPS).flat();
    expect(UI_CUSTOMIZABLE_TOKENS).toEqual(grouped);
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it('keeps semantic emphasis roles separate for fill, text, on-fill, soft surface and border', () => {
    const colors = new Set(UI_TOKEN_GROUPS.color);
    for (const tone of ['accent', 'danger', 'success', 'warning'] as const) {
      expect(colors.has(`color-${tone}`)).toBe(true);
      expect(colors.has(`color-${tone}-text`)).toBe(true);
      expect(colors.has(`color-on-${tone}`)).toBe(true);
      expect(colors.has(`color-${tone}-soft`)).toBe(true);
      expect(colors.has(`color-${tone}-border`)).toBe(true);
    }
  });

  it('maps only declared semantic overrides to scoped CSS custom properties', () => {
    expect(
      uiTokenStyle({
        'color-accent': '#123456',
        'space-md': '1.125rem',
        'layout-readable': '46rem',
        'weight-strong': '700',
      }),
    ).toEqual({
      '--oxs-color-accent': '#123456',
      '--oxs-space-md': '1.125rem',
      '--oxs-layout-readable': '46rem',
      '--oxs-weight-strong': '700',
    });
  });
});
