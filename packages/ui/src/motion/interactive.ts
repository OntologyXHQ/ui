import { useEffect, useState } from 'react';
import type { MotionRuntime } from './runtime';
import { useMotionRuntime } from './runtime';
import type { SpringPreset } from './spring';
import { readSpringSpec, SpringValue } from './spring';

export type InteractiveTransitionPhase = 'idle' | 'interactive' | 'settling';

export type InteractiveTransitionSnapshot = {
  progress: number;
  velocity: number;
  phase: InteractiveTransitionPhase;
  target: 0 | 1;
};

export type InteractiveSettleOptions = {
  threshold?: number;
  velocityThreshold?: number;
  target?: 0 | 1;
};

export type InteractiveTransitionOptions = {
  initialProgress?: number;
  spring?: SpringPreset;
  onRest?: (target: 0 | 1) => void;
};

export type InteractiveTransitionListener = (snapshot: InteractiveTransitionSnapshot) => void;

export class InteractiveTransitionController {
  private runtime: MotionRuntime;
  private readonly springPreset: SpringPreset;
  private readonly listeners = new Set<InteractiveTransitionListener>();
  private readonly restListeners = new Set<(target: 0 | 1) => void>();
  private springValue: SpringValue;
  private element: Element | null = null;
  private unsubscribeClock: (() => void) | null = null;
  private snapshotValue: InteractiveTransitionSnapshot;

  constructor(
    runtime: MotionRuntime,
    initialProgress = 0,
    springPreset: SpringPreset = 'standard',
  ) {
    const progress = clamp01(initialProgress);
    this.runtime = runtime;
    this.springPreset = springPreset;
    this.springValue = new SpringValue(progress, readSpringSpec(null, springPreset));
    this.snapshotValue = {
      progress,
      velocity: 0,
      phase: 'idle',
      target: progress >= 0.5 ? 1 : 0,
    };
  }

  get snapshot() {
    return this.snapshotValue;
  }

  attachElement(element: Element | null) {
    this.element = element;
    this.springValue.setSpec(readSpringSpec(element, this.springPreset));
  }

  updateRuntime(runtime: MotionRuntime) {
    if (this.runtime === runtime) {
      return;
    }

    const wasSettling = this.snapshotValue.phase === 'settling';
    const target = this.snapshotValue.target;
    const velocity = this.snapshotValue.velocity;

    this.stopClock();
    this.runtime = runtime;
    this.springValue.setSpec(readSpringSpec(this.element, this.springPreset));

    if (wasSettling) {
      this.animateTo(target, velocity);
    }
  }

  subscribe(listener: InteractiveTransitionListener) {
    this.listeners.add(listener);
    listener(this.snapshotValue);

    return () => {
      this.listeners.delete(listener);
    };
  }

  subscribeRest(listener: (target: 0 | 1) => void) {
    this.restListeners.add(listener);

    return () => {
      this.restListeners.delete(listener);
    };
  }

  begin() {
    this.stopClock();
    this.snapshotValue = {
      ...this.snapshotValue,
      phase: 'interactive',
      velocity: 0,
    };
    this.emit();
  }

  setInteractiveProgress(progress: number, velocity = 0) {
    this.stopClock();
    const next = clamp01(progress);
    this.springValue.setState(next, velocity);
    this.snapshotValue = {
      progress: next,
      velocity,
      phase: 'interactive',
      target: this.snapshotValue.target,
    };
    this.emit();
  }

  settle({ threshold = 0.5, velocityThreshold = 0.65, target }: InteractiveSettleOptions = {}) {
    const nextTarget =
      target ??
      resolveInteractiveSettleTarget(
        this.snapshotValue.progress,
        this.snapshotValue.velocity,
        threshold,
        velocityThreshold,
      );

    this.animateTo(nextTarget, this.snapshotValue.velocity);
    return nextTarget;
  }

  animateTo(target: 0 | 1, inheritedVelocity = 0) {
    this.stopClock();
    this.springValue.setSpec(readSpringSpec(this.element, this.springPreset));

    if (this.runtime.preference === 'reduced') {
      this.springValue.jump(target);
      this.snapshotValue = {
        progress: target,
        velocity: 0,
        phase: 'idle',
        target,
      };
      this.emit();
      this.emitRest(target);
      return;
    }

    if (
      this.snapshotValue.phase === 'idle' &&
      this.snapshotValue.progress === target &&
      this.snapshotValue.target === target
    ) {
      return;
    }

    this.springValue.setState(this.snapshotValue.progress, inheritedVelocity);
    this.springValue.setTarget(target, inheritedVelocity);
    this.snapshotValue = {
      ...this.snapshotValue,
      velocity: inheritedVelocity,
      phase: 'settling',
      target,
    };
    this.emit();

    this.unsubscribeClock = this.runtime.clock.subscribe((frame) => {
      const state = this.springValue.step(frame.deltaMs);
      this.snapshotValue = {
        progress: clamp01(state.value),
        velocity: state.velocity,
        phase: 'settling',
        target,
      };
      this.emit();

      if (this.springValue.isSettled()) {
        this.stopClock();
        this.snapshotValue = {
          progress: target,
          velocity: 0,
          phase: 'idle',
          target,
        };
        this.emit();
        this.emitRest(target);
      }
    });
  }

  dispose() {
    this.stopClock();
    this.listeners.clear();
    this.restListeners.clear();
  }

  private emit() {
    for (const listener of this.listeners) {
      listener(this.snapshotValue);
    }
  }

  private emitRest(target: 0 | 1) {
    for (const listener of this.restListeners) {
      listener(target);
    }
  }

  private stopClock() {
    this.unsubscribeClock?.();
    this.unsubscribeClock = null;
  }
}

export function useInteractiveTransition({
  initialProgress = 0,
  spring = 'standard',
  onRest,
}: InteractiveTransitionOptions = {}) {
  const runtime = useMotionRuntime();
  const [controller] = useState(
    () => new InteractiveTransitionController(runtime, initialProgress, spring),
  );

  useEffect(() => {
    controller.updateRuntime(runtime);
  }, [controller, runtime]);

  useEffect(() => {
    if (!onRest) {
      return;
    }

    return controller.subscribeRest(onRest);
  }, [controller, onRest]);

  useEffect(() => () => controller.dispose(), [controller]);

  return controller;
}

export function resolveInteractiveSettleTarget(
  progress: number,
  velocity: number,
  threshold: number,
  velocityThreshold: number,
): 0 | 1 {
  if (Math.abs(velocity) >= velocityThreshold) {
    return velocity > 0 ? 1 : 0;
  }

  return progress >= threshold ? 1 : 0;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}
