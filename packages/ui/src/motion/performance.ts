import type { FrameRateTarget, MotionClock, MotionFrame } from './clock';

export type FramePerformanceSnapshot = {
  targetFrameRate: FrameRateTarget;
  frameBudgetMs: number;
  sampledFrames: number;
  averageFrameIntervalMs: number;
  maximumFrameIntervalMs: number;
  observedRefreshRateHz: number;
  budgetMisses: number;
  budgetMissRatio: number;
  longFrames: number;
  longFrameRatio: number;
  reactCommits: number;
  longTasks: number;
  layoutShifts: number;
  paintEntries: number;
};

export type FramePerformanceBudget = {
  /** Minimum frame sample count before a pass/fail assessment is meaningful. */
  minimumSampledFrames: number;
  /** Maximum allowed share of frames exceeding 125% of the target frame budget. */
  maximumBudgetMissRatio: number;
  /** Maximum allowed share of frames exceeding max(2x budget, 50ms). */
  maximumLongFrameRatio: number;
};

export type FramePerformanceAssessment = {
  measurable: boolean;
  passed: boolean;
  reasons: string[];
};

/** Stable UIR11 hot-path budget; callers may use stricter product-specific thresholds. */
export const DEFAULT_FRAME_PERFORMANCE_BUDGET: Readonly<FramePerformanceBudget> = Object.freeze({
  minimumSampledFrames: 30,
  maximumBudgetMissRatio: 0.1,
  maximumLongFrameRatio: 0.02,
});

export function assessFramePerformance(
  snapshot: FramePerformanceSnapshot,
  budget: Readonly<FramePerformanceBudget> = DEFAULT_FRAME_PERFORMANCE_BUDGET,
): FramePerformanceAssessment {
  if (snapshot.sampledFrames < budget.minimumSampledFrames) {
    return {
      measurable: false,
      passed: false,
      reasons: [
        `needs ${budget.minimumSampledFrames} sampled frames; observed ${snapshot.sampledFrames}`,
      ],
    };
  }

  const reasons: string[] = [];
  if (snapshot.budgetMissRatio > budget.maximumBudgetMissRatio) {
    reasons.push(
      `budget miss ratio ${snapshot.budgetMissRatio.toFixed(3)} exceeds ${budget.maximumBudgetMissRatio.toFixed(3)}`,
    );
  }
  if (snapshot.longFrameRatio > budget.maximumLongFrameRatio) {
    reasons.push(
      `long frame ratio ${snapshot.longFrameRatio.toFixed(3)} exceeds ${budget.maximumLongFrameRatio.toFixed(3)}`,
    );
  }

  return { measurable: true, passed: reasons.length === 0, reasons };
}

export type FramePerformanceListener = (snapshot: FramePerformanceSnapshot) => void;

export class FramePerformanceMonitor {
  private readonly listeners = new Set<FramePerformanceListener>();
  private readonly frameIntervals: number[] = [];
  private unsubscribeClock: (() => void) | null = null;
  private observers: PerformanceObserver[] = [];
  private reactCommits = 0;
  private longTasks = 0;
  private layoutShifts = 0;
  private paintEntries = 0;
  private lastReportMs = 0;

  constructor(
    private readonly clock: MotionClock,
    readonly targetFrameRate: FrameRateTarget,
    private readonly realmWindow: Window | null = null,
  ) {}

  start() {
    if (this.unsubscribeClock) return;
    this.unsubscribeClock = this.clock.subscribe(this.onFrame);
    this.installPerformanceObservers();
  }

  stop() {
    this.unsubscribeClock?.();
    this.unsubscribeClock = null;
    for (const observer of this.observers) observer.disconnect();
    this.observers = [];
  }

  subscribe(listener: FramePerformanceListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  markReactCommit() {
    this.reactCommits += 1;
  }

  snapshot(): FramePerformanceSnapshot {
    const total = this.frameIntervals.reduce((sum, value) => sum + value, 0);
    const average = this.frameIntervals.length > 0 ? total / this.frameIntervals.length : 0;
    const maximum = this.frameIntervals.length > 0 ? Math.max(...this.frameIntervals) : 0;
    const sampledFrames = this.frameIntervals.length;
    const frameBudgetMs = 1000 / this.targetFrameRate;
    const budgetMisses = this.frameIntervals.filter((value) => value > frameBudgetMs * 1.25).length;
    const longFrames = this.frameIntervals.filter(
      (value) => value > Math.max(frameBudgetMs * 2, 50),
    ).length;

    return {
      targetFrameRate: this.targetFrameRate,
      frameBudgetMs,
      sampledFrames,
      averageFrameIntervalMs: average,
      maximumFrameIntervalMs: maximum,
      observedRefreshRateHz: average > 0 ? 1000 / average : 0,
      budgetMisses,
      budgetMissRatio: sampledFrames > 0 ? budgetMisses / sampledFrames : 0,
      longFrames,
      longFrameRatio: sampledFrames > 0 ? longFrames / sampledFrames : 0,
      reactCommits: this.reactCommits,
      longTasks: this.longTasks,
      layoutShifts: this.layoutShifts,
      paintEntries: this.paintEntries,
    };
  }

  private readonly onFrame = (frame: MotionFrame) => {
    if (frame.deltaMs <= 0) return;
    this.frameIntervals.push(frame.deltaMs);
    if (this.frameIntervals.length > 240) this.frameIntervals.shift();

    if (frame.nowMs - this.lastReportMs >= 500) {
      this.lastReportMs = frame.nowMs;
      this.emit();
    }
  };

  private emit() {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private installPerformanceObservers() {
    const realmGlobal = this.realmWindow as (Window & typeof globalThis) | null;
    const Observer = realmGlobal?.PerformanceObserver;
    if (!Observer) return;
    const supported = new Set(Observer.supportedEntryTypes ?? []);
    this.observeType(Observer, supported, 'longtask', (entries) => {
      this.longTasks += entries.length;
    });
    this.observeType(Observer, supported, 'layout-shift', (entries) => {
      this.layoutShifts += entries.length;
    });
    this.observeType(Observer, supported, 'paint', (entries) => {
      this.paintEntries += entries.length;
    });
  }

  private observeType(
    Observer: typeof PerformanceObserver,
    supported: Set<string>,
    type: string,
    onEntries: (entries: PerformanceEntry[]) => void,
  ) {
    if (!supported.has(type)) return;
    const observer = new Observer((list) => onEntries(list.getEntries()));
    observer.observe({ type, buffered: true });
    this.observers.push(observer);
  }
}
