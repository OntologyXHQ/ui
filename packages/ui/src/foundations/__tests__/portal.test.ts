import { describe, expect, it, vi } from 'vitest';
import { viewportLengthToPortalHost, viewportPointToPortalHost } from '../portal';

describe('UiRoot portal coordinate plane', () => {
  it('converts viewport coordinates and lengths into a scaled portal host plane', () => {
    const host = document.createElement('div');
    Object.defineProperties(host, {
      offsetWidth: { configurable: true, value: 100 },
      offsetHeight: { configurable: true, value: 50 },
    });
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 50,
      left: 100,
      top: 50,
      right: 300,
      bottom: 150,
      width: 200,
      height: 100,
      toJSON: () => ({}),
    });

    expect(viewportPointToPortalHost(host, { x: 140, y: 90 })).toEqual({ x: 20, y: 20 });
    expect(viewportLengthToPortalHost(host, 40, 'inline')).toBe(20);
    expect(viewportLengthToPortalHost(host, 30, 'block')).toBe(15);
  });
});
