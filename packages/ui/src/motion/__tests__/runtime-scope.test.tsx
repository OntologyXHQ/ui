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
    const capture = (runtime: MotionRuntime) => runtimes.push(runtime);

    render(
      <>
        <MotionRuntimeProvider preference="full">
          <Probe capture={capture} />
        </MotionRuntimeProvider>
        <MotionRuntimeProvider preference="full">
          <Probe capture={capture} />
        </MotionRuntimeProvider>
      </>,
    );

    expect(runtimes).toHaveLength(2);
    expect(runtimes[0].sharedBounds).not.toBe(runtimes[1].sharedBounds);

    runtimes[0].sharedBounds.set('shared-id', new DOMRect(0, 0, 10, 10));
    expect(runtimes[1].sharedBounds.has('shared-id')).toBe(false);
  });
});
