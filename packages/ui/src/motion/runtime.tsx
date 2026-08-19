import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useMediaQuery } from '../foundations/observation';
import { type FrameRateTarget, MotionClock } from './clock';
import type { FramePerformanceSnapshot } from './performance';
import { FramePerformanceMonitor } from './performance';

export type MotionPreference = 'system' | 'full' | 'reduced';

export type MotionRuntime = {
  clock: MotionClock;
  performance: FramePerformanceMonitor;
  preference: Exclude<MotionPreference, 'system'>;
  targetFrameRate: FrameRateTarget;
  sharedBounds: Map<string, DOMRect>;
};

export type MotionRuntimeProviderProps = PropsWithChildren<{
  preference?: MotionPreference;
  targetFrameRate?: FrameRateTarget;
  instrumentPerformance?: boolean;
  /** Internal owner Window used for system motion preference resolution. */
  realmWindow?: Window | null;
}>;

const MotionRuntimeContext = createContext<MotionRuntime | null>(null);

export function MotionRuntimeProvider({
  children,
  preference = 'system',
  targetFrameRate = 60,
  instrumentPerformance = false,
  realmWindow,
}: MotionRuntimeProviderProps) {
  const resolvedPreference = useResolvedMotionPreference(preference, realmWindow);

  const runtime = useMemo<MotionRuntime>(() => {
    const clock = new MotionClock(targetFrameRate);

    return {
      clock,
      performance: new FramePerformanceMonitor(clock, targetFrameRate),
      preference: resolvedPreference,
      targetFrameRate,
      sharedBounds: new Map<string, DOMRect>(),
    };
  }, [resolvedPreference, targetFrameRate]);

  useEffect(() => {
    if (instrumentPerformance) {
      runtime.performance.start();
    }

    return () => {
      runtime.performance.stop();
      runtime.clock.dispose();
    };
  }, [instrumentPerformance, runtime]);

  return <MotionRuntimeContext.Provider value={runtime}>{children}</MotionRuntimeContext.Provider>;
}

export function useMotionRuntime() {
  const runtime = useContext(MotionRuntimeContext);

  if (!runtime) {
    throw new Error('OXS motion primitives must render inside UiRoot.');
  }

  return runtime;
}

export function useReducedMotion() {
  return useMotionRuntime().preference === 'reduced';
}

export function useReactCommitProbe() {
  const runtime = useMotionRuntime();

  useLayoutEffect(() => {
    runtime.performance.markReactCommit();
  });
}

export function useFramePerformanceSnapshot() {
  const runtime = useMotionRuntime();
  const [snapshot, setSnapshot] = useState<FramePerformanceSnapshot>(() =>
    runtime.performance.snapshot(),
  );

  useEffect(() => {
    setSnapshot(runtime.performance.snapshot());
    return runtime.performance.subscribe(setSnapshot);
  }, [runtime]);

  return snapshot;
}

function useResolvedMotionPreference(
  preference: MotionPreference,
  realmWindow: Window | null | undefined,
): Exclude<MotionPreference, 'system'> {
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)', false, realmWindow);

  if (preference === 'reduced') return 'reduced';
  if (preference === 'full') return 'full';
  return systemReduced ? 'reduced' : 'full';
}
