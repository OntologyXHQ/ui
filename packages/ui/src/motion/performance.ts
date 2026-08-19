import type { FrameRateTarget, MotionClock, MotionFrame } from './clock';

export type FramePerformanceSnapshot = {
  targetFrameRate: FrameRateTarget;
  frameBudgetMs: number;
  sampledFrames: number;
  averageFrameIntervalMs: number;
  maximumFrameIntervalMs: number;
  observedRefreshRateHz: number;
  budgetMisses: number;
  longFrames: number;
  reactCommits: number;
  longTasks: number;
  layoutShifts: number;
  paintEntries: number;
};

export type FramePerformanceListener = (snapshot: FramePerformanceSnapshot) => void;

export class FramePerformanceMonitor {
  private readonly listeners = new Set<FramePerformanceListener>();
  private readonly frameIntervals: number[] = [];
  private unsubscribeClock: (() => void) | null = null;
  private observers: PerformanceObserver[] = [];
  private budgetMisses = 0;
  private longFrames = 0;
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

    return {
      targetFrameRate: this.targetFrameRate,
      frameBudgetMs: 1000 / this.targetFrameRate,
      sampledFrames: this.frameIntervals.length,
      averageFrameIntervalMs: average,
      maximumFrameIntervalMs: maximum,
      observedRefreshRateHz: average > 0 ? 1000 / average : 0,
      budgetMisses: this.budgetMisses,
      longFrames: this.longFrames,
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

    const frameBudget = 1000 / this.targetFrameRate;
    if (frame.deltaMs > frameBudget * 1.25) this.budgetMisses += 1;
    if (frame.deltaMs > Math.max(frameBudget * 2, 50)) this.longFrames += 1;

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
