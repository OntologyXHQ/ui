import { describe, expect, it } from 'vitest';
import { resolveInteractiveSettleTarget } from '../interactive';
import { readSpringSpec, SpringValue, stepSpring } from '../spring';

function simulateSpring(frameRate: 60 | 90 | 120, durationMs = 900) {
  const spec = readSpringSpec(null, 'standard');
  let state = { value: 0, velocity: 0 };
  const deltaMs = 1000 / frameRate;

  for (let elapsed = 0; elapsed < durationMs; elapsed += deltaMs) {
    state = stepSpring(state, 1, deltaMs, spec);
  }

  return state;
}

describe('motion physics', () => {
  it('stays frame-rate independent across 60/90/120 Hz stepping', () => {
    const at60 = simulateSpring(60);
    const at90 = simulateSpring(90);
    const at120 = simulateSpring(120);

    expect(at90.value).toBeCloseTo(at60.value, 2);
    expect(at120.value).toBeCloseTo(at60.value, 2);
    expect(at90.velocity).toBeCloseTo(at60.velocity, 1);
    expect(at120.velocity).toBeCloseTo(at60.velocity, 1);
  });

  it('reverses without jumping the current visual value', () => {
    const spring = new SpringValue(0, readSpringSpec(null, 'expressive'));
    spring.setTarget(1);

    for (let index = 0; index < 12; index += 1) {
      spring.step(1000 / 120);
    }

    const valueBeforeReverse = spring.value;
    const inheritedVelocity = spring.velocity;
    spring.setTarget(0, inheritedVelocity);

    expect(spring.value).toBe(valueBeforeReverse);

    for (let index = 0; index < 300 && !spring.isSettled(); index += 1) {
      spring.step(1000 / 120);
    }

    expect(spring.value).toBe(0);
    expect(spring.velocity).toBe(0);
  });

  it('uses release velocity before positional threshold when settling', () => {
    expect(resolveInteractiveSettleTarget(0.2, 0.9, 0.5, 0.65)).toBe(1);
    expect(resolveInteractiveSettleTarget(0.8, -0.9, 0.5, 0.65)).toBe(0);
    expect(resolveInteractiveSettleTarget(0.51, 0.1, 0.5, 0.65)).toBe(1);
    expect(resolveInteractiveSettleTarget(0.49, 0.1, 0.5, 0.65)).toBe(0);
  });
});
