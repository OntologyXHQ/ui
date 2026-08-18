import { describe, expect, it } from 'vitest';
import {
  applyEdgeResistance,
  computeIndicatorMetrics,
  consumeScrollDelta,
  DEFAULT_SCROLL_PHYSICS,
  decayScrollVelocity,
  nearestSnapOffset,
} from '../physics';

function decayFor(frameRate: 60 | 90 | 120, durationMs = 500) {
  let velocity = 8;
  const deltaMs = 1000 / frameRate;

  let elapsed = 0;
  while (elapsed < durationMs) {
    const stepMs = Math.min(deltaMs, durationMs - elapsed);
    velocity = decayScrollVelocity(velocity, stepMs, DEFAULT_SCROLL_PHYSICS);
    elapsed += stepMs;
  }

  return velocity;
}

describe('scroll physics', () => {
  it('propagates unconsumed delta for nested scrolling', () => {
    const child = consumeScrollDelta({ position: 100, max: 100 }, 48);
    const parent = consumeScrollDelta({ position: 12, max: 200 }, child.overflow);

    expect(child.consumed).toBe(0);
    expect(child.overflow).toBe(48);
    expect(parent.position).toBe(60);
    expect(parent.overflow).toBe(0);
  });

  it('keeps inertia decay approximately independent of display cadence', () => {
    const at60 = decayFor(60);
    const at90 = decayFor(90);
    const at120 = decayFor(120);

    expect(at90).toBeCloseTo(at60, 2);
    expect(at120).toBeCloseTo(at60, 2);
  });

  it('resists and caps elastic overscroll', () => {
    const first = applyEdgeResistance(0, 300, 600, DEFAULT_SCROLL_PHYSICS);
    const second = applyEdgeResistance(first, 300, 600, DEFAULT_SCROLL_PHYSICS);
    const maximum = 600 * DEFAULT_SCROLL_PHYSICS.maxOverscrollRatio;

    expect(Math.abs(second)).toBeGreaterThan(Math.abs(first));
    expect(Math.abs(second)).toBeLessThanOrEqual(maximum);
  });

  it('computes snap and indicator geometry deterministically', () => {
    expect(nearestSnapOffset([0, 100, 200], 144, 220)).toBe(100);
    expect(computeIndicatorMetrics(100, 400, 150)).toEqual({
      visible: true,
      size: 25,
      offset: 37.5,
    });
  });
});
