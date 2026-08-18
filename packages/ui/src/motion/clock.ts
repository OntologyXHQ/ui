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

export class MotionClock {
  readonly targetFrameRate: FrameRateTarget;

  private readonly listeners = new Set<MotionFrameListener>();
  private rafId: number | null = null;
  private startedAtMs: number | null = null;
  private previousFrameMs: number | null = null;
  private frameIndex = 0;

  constructor(targetFrameRate: FrameRateTarget = 60) {
    this.targetFrameRate = targetFrameRate;
  }

  get frameBudgetMs() {
    return 1000 / this.targetFrameRate;
  }

  subscribe(listener: MotionFrameListener) {
    this.listeners.add(listener);
    this.ensureRunning();

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  dispose() {
    this.listeners.clear();
    this.stop();
  }

  private ensureRunning() {
    if (this.rafId !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }

    this.rafId = requestAnimationFrame(this.tick);
  }

  private stop() {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = null;
    this.startedAtMs = null;
    this.previousFrameMs = null;
    this.frameIndex = 0;
  }

  private readonly tick = (nowMs: number) => {
    this.rafId = null;

    if (this.listeners.size === 0) {
      this.stop();
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

    for (const listener of this.listeners) {
      listener(frame);
    }

    this.ensureRunning();
  };
}
