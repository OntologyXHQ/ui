import { describe, expect, it, vi } from 'vitest';
import { GestureArena } from '../arena';
import type { PanGestureSample } from '../types';
import { classifySwipe } from '../useSwipeGesture';

function sample(overrides: Partial<PanGestureSample> = {}): PanGestureSample {
  return {
    pointerId: 1,
    pointerType: 'touch',
    phase: 'ended',
    origin: { x: 0, y: 0 },
    position: { x: 0, y: -90 },
    translation: { x: 0, y: -90 },
    delta: { x: 0, y: -12 },
    velocity: { x: 0, y: -850 },
    elapsedMs: 120,
    ...overrides,
  };
}

describe('gesture arbitration', () => {
  it('lets a higher-priority system gesture take ownership and cancel content', () => {
    const arena = new GestureArena();
    const cancelContent = vi.fn();
    const cancelSystem = vi.fn();

    arena.register(1, { owner: 'content', priority: 'content', onCancel: cancelContent });
    arena.register(1, { owner: 'system', priority: 'system', onCancel: cancelSystem });

    expect(arena.claim(1, 'content')).toBe(true);
    expect(arena.claim(1, 'system')).toBe(true);
    expect(arena.owns(1, 'system')).toBe(true);
    expect(cancelContent).toHaveBeenCalledTimes(1);
    expect(cancelSystem).not.toHaveBeenCalled();

    arena.release(1, 'system');
    expect(arena.claim(1, 'content')).toBe(false);
  });

  it('classifies swipe direction from distance and release velocity', () => {
    expect(classifySwipe(sample())?.direction).toBe('up');
    expect(
      classifySwipe(sample({ translation: { x: 6, y: 8 }, velocity: { x: 10, y: 20 } }), 36, 420),
    ).toBeNull();
    expect(
      classifySwipe(sample({ translation: { x: 18, y: 2 }, velocity: { x: 700, y: 5 } }))
        ?.direction,
    ).toBe('right');
  });
});
