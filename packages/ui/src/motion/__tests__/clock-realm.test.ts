import { describe, expect, it } from 'vitest';
import { MotionClock, type MotionFrameHost } from '../clock';

class FakeFrameHost implements MotionFrameHost {
  private nextId = 1;
  readonly frames = new Map<number, FrameRequestCallback>();
  readonly timers = new Map<number, () => void>();
  cancelledFrames: number[] = [];
  clearedTimers: number[] = [];

  requestAnimationFrame(callback: FrameRequestCallback) {
    const id = this.nextId++;
    this.frames.set(id, callback);
    return id;
  }

  cancelAnimationFrame(handle: number) {
    this.cancelledFrames.push(handle);
    this.frames.delete(handle);
  }

  setTimeout(handler: () => void) {
    const id = this.nextId++;
    this.timers.set(id, handler);
    return id;
  }

  clearTimeout(handle: number) {
    this.clearedTimers.push(handle);
    this.timers.delete(handle);
  }

  flushFrame(nowMs: number) {
    const next = this.frames.entries().next();
    if (next.done) return;
    const [id, callback] = next.value;
    this.frames.delete(id);
    callback(nowMs);
  }
}

describe('MotionClock realm scheduling', () => {
  it('uses only its injected frame host and cancels that host when the last listener leaves', () => {
    const host = new FakeFrameHost();
    const clock = new MotionClock(120, host);
    const frames: number[] = [];
    const unsubscribe = clock.subscribe((frame) => frames.push(frame.frameIndex));
    expect(clock.hasFrameHost).toBe(true);
    expect(host.frames.size).toBe(1);

    host.flushFrame(100);
    host.flushFrame(108.33);
    expect(frames).toEqual([1, 2]);
    expect(host.frames.size).toBe(1);

    unsubscribe();
    expect(host.frames.size).toBe(0);
    expect(host.cancelledFrames.length).toBeGreaterThan(0);
  });

  it('owns delayed cleanup timers and clears them on dispose', () => {
    const host = new FakeFrameHost();
    const clock = new MotionClock(60, host);
    const timeout = clock.scheduleTimeout(() => {}, 5000);
    expect(timeout).not.toBeNull();
    expect(host.timers.size).toBe(1);
    clock.dispose();
    expect(host.timers.size).toBe(0);
    expect(host.clearedTimers).toContain(timeout);
  });

  it('does not borrow a global requestAnimationFrame when no realm host is available', () => {
    const clock = new MotionClock(60, null);
    clock.subscribe(() => {});
    expect(clock.hasFrameHost).toBe(false);
  });
});
