import type { PanGestureSample, SwipeDirection, SwipeGestureResult } from './types';
import { type PanGestureOptions, usePanGesture } from './usePanGesture';

export type SwipeGestureOptions = Omit<PanGestureOptions, 'onEnd'> & {
  minimumDistance?: number;
  minimumVelocity?: number;
  onSwipe: (result: SwipeGestureResult, sample: PanGestureSample) => void;
  onEnd?: (sample: PanGestureSample) => void;
};

export function useSwipeGesture({
  minimumDistance = 36,
  minimumVelocity = 420,
  onSwipe,
  onEnd,
  ...options
}: SwipeGestureOptions) {
  return usePanGesture({
    ...options,
    onEnd: (sample) => {
      const result = classifySwipe(sample, minimumDistance, minimumVelocity);
      if (result) {
        onSwipe(result, sample);
      }
      onEnd?.(sample);
    },
  });
}

export function classifySwipe(
  sample: PanGestureSample,
  minimumDistance = 36,
  minimumVelocity = 420,
): SwipeGestureResult | null {
  const horizontal = Math.abs(sample.translation.x) >= Math.abs(sample.translation.y);
  const distance = horizontal ? sample.translation.x : sample.translation.y;
  const velocity = horizontal ? sample.velocity.x : sample.velocity.y;

  if (Math.abs(distance) < minimumDistance && Math.abs(velocity) < minimumVelocity) {
    return null;
  }

  return {
    direction: resolveDirection(horizontal, distance, velocity),
    distance: Math.abs(distance),
    velocity: Math.abs(velocity),
  };
}

function resolveDirection(horizontal: boolean, distance: number, velocity: number): SwipeDirection {
  const signed = Math.abs(velocity) >= 1 ? velocity : distance;

  if (horizontal) {
    return signed < 0 ? 'left' : 'right';
  }

  return signed < 0 ? 'up' : 'down';
}
