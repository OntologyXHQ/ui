import { render } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { describe, expect, it } from 'vitest';
import type { MotionRuntime } from '../runtime';
import { MotionRuntimeProvider, useMotionRuntime } from '../runtime';

function Probe({ capture }: { capture: (runtime: MotionRuntime) => void }) {
  const runtime = useMotionRuntime();
  useLayoutEffect(() => {
    capture(runtime);
  }, [capture, runtime]);
  return null;
}

describe('motion runtime scope', () => {
  it('owns shared transition bounds per provider instead of through module-global state', () => {
    const runtimes: MotionRuntime[] = [];
    const capture = (runtime: MotionRuntime) => {
      if (!runtimes.includes(runtime)) runtimes.push(runtime);
    };

    render(
      <>
        <MotionRuntimeProvider preference="full" realmWindow={window}>
          <Probe capture={capture} />
        </MotionRuntimeProvider>
        <MotionRuntimeProvider preference="full" realmWindow={window}>
          <Probe capture={capture} />
        </MotionRuntimeProvider>
      </>,
    );

    expect(runtimes).toHaveLength(2);
    expect(runtimes[0].sharedBounds).not.toBe(runtimes[1].sharedBounds);
    expect(runtimes[0].clock).not.toBe(runtimes[1].clock);

    runtimes[0].sharedBounds.set('shared-id', new DOMRect(0, 0, 10, 10));
    expect(runtimes[1].sharedBounds.has('shared-id')).toBe(false);
  });

  it('replaces the runtime and scheduler when the owning Window realm changes', () => {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const frameWindow = iframe.contentWindow;
    expect(frameWindow).not.toBeNull();
    if (!frameWindow) return;

    const captures: MotionRuntime[] = [];
    const capture = (runtime: MotionRuntime) => {
      if (captures.at(-1) !== runtime) captures.push(runtime);
    };

    const view = render(
      <MotionRuntimeProvider preference="full" realmWindow={window}>
        <Probe capture={capture} />
      </MotionRuntimeProvider>,
    );
    const first = captures.at(-1);
    expect(first?.realmWindow).toBe(window);
    expect(first?.clock.hasFrameHost).toBe(true);

    view.rerender(
      <MotionRuntimeProvider preference="full" realmWindow={frameWindow}>
        <Probe capture={capture} />
      </MotionRuntimeProvider>,
    );
    const second = captures.at(-1);
    expect(second?.realmWindow).toBe(frameWindow);
    expect(second).not.toBe(first);
    expect(second?.clock).not.toBe(first?.clock);
    iframe.remove();
  });
});
