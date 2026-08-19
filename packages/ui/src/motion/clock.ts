export type FrameRateTarget = 60 | 90 | 120;

export type MotionFrame = {
  nowMs: number;
  deltaMs: number;
  elapsedMs: number;
  frameIndex: number;
  targetFrameRate: FrameRateTarget;
  frameBudgetMs: number;
};

export type MotionFrameListener = (frame: MotionFrame) => void;

export type MotionFrameHost = {
  requestAnimationFrame(callback: FrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  setTimeout(handler: () => void, timeout?: number): number;
  clearTimeout(handle: number): void;
};

/** Root/realm-owned animation clock. It never falls back to another Window realm. */
export class MotionClock {
  readonly targetFrameRate: FrameRateTarget;

  private readonly listeners = new Set<MotionFrameListener>();
  private readonly timeoutIds = new Set<number>();
  private rafId: number | null = null;
  private startedAtMs: number | null = null;
  private previousFrameMs: number | null = null;
  private frameIndex = 0;

  constructor(
    targetFrameRate: FrameRateTarget = 60,
    private readonly host: MotionFrameHost | null = null,
  ) {
    this.targetFrameRate = targetFrameRate;
  }

  get frameBudgetMs() {
    return 1000 / this.targetFrameRate;
  }

  get hasFrameHost() {
    return this.host !== null;
  }

  subscribe(listener: MotionFrameListener) {
    this.listeners.add(listener);
    this.ensureRunning();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopFrameLoop();
    };
  }

  scheduleTimeout(callback: () => void, delayMs: number) {
    if (!this.host) return null;
    const id = this.host.setTimeout(() => {
      this.timeoutIds.delete(id);
      callback();
    }, delayMs);
    this.timeoutIds.add(id);
    return id;
  }

  cancelTimeout(id: number | null) {
    if (id === null || !this.host) return;
    this.timeoutIds.delete(id);
    this.host.clearTimeout(id);
  }

  dispose() {
    this.listeners.clear();
    this.stopFrameLoop();
    if (this.host) {
      for (const id of this.timeoutIds) this.host.clearTimeout(id);
    }
    this.timeoutIds.clear();
  }

  private ensureRunning() {
    if (this.rafId !== null || !this.host) return;
    this.rafId = this.host.requestAnimationFrame(this.tick);
  }

  private stopFrameLoop() {
    if (this.rafId !== null && this.host) this.host.cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.startedAtMs = null;
    this.previousFrameMs = null;
    this.frameIndex = 0;
  }

  private readonly tick = (nowMs: number) => {
    this.rafId = null;

    if (this.listeners.size === 0) {
      this.stopFrameLoop();
      return;
    }

    const startedAtMs = this.startedAtMs ?? nowMs;
    const previousFrameMs = this.previousFrameMs ?? nowMs;
    this.startedAtMs = startedAtMs;
    this.previousFrameMs = nowMs;
    this.frameIndex += 1;

    const frame: MotionFrame = {
      nowMs,
      deltaMs: Math.max(0, nowMs - previousFrameMs),
      elapsedMs: Math.max(0, nowMs - startedAtMs),
      frameIndex: this.frameIndex,
      targetFrameRate: this.targetFrameRate,
      frameBudgetMs: this.frameBudgetMs,
    };

    for (const listener of this.listeners) listener(frame);
    this.ensureRunning();
  };
}

export function motionFrameHost(ownerWindow: Window | null | undefined): MotionFrameHost | null {
  if (!ownerWindow?.requestAnimationFrame || !ownerWindow.cancelAnimationFrame) return null;
  return {
    requestAnimationFrame: (callback) => ownerWindow.requestAnimationFrame(callback),
    cancelAnimationFrame: (handle) => ownerWindow.cancelAnimationFrame(handle),
    setTimeout: (handler, timeout) => ownerWindow.setTimeout(handler, timeout),
    clearTimeout: (handle) => ownerWindow.clearTimeout(handle),
  };
}
