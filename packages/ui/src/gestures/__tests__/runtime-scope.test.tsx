import { render } from '@testing-library/react';
import { useLayoutEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GestureArena } from '../arena';
import { GestureRuntimeProvider, useGestureArena } from '../runtime';

function Probe({ capture }: { capture: (arena: GestureArena) => void }) {
  const arena = useGestureArena();
  useLayoutEffect(() => {
    capture(arena);
  }, [arena, capture]);
  return null;
}

describe('gesture runtime scope', () => {
  it('isolates pointer ownership between nested runtime scopes even when pointer ids collide', () => {
    const arenas: GestureArena[] = [];
    render(
      <GestureRuntimeProvider>
        <Probe capture={(arena) => arenas.push(arena)} />
        <GestureRuntimeProvider>
          <Probe capture={(arena) => arenas.push(arena)} />
        </GestureRuntimeProvider>
      </GestureRuntimeProvider>,
    );

    expect(arenas).toHaveLength(2);
    expect(arenas[0]).not.toBe(arenas[1]);
    const outerCancel = vi.fn();
    const innerCancel = vi.fn();
    arenas[0].register(7, { owner: 'outer', priority: 'content', onCancel: outerCancel });
    arenas[1].register(7, { owner: 'inner', priority: 'system', onCancel: innerCancel });

    expect(arenas[0].claim(7, 'outer')).toBe(true);
    expect(arenas[1].claim(7, 'inner')).toBe(true);
    expect(outerCancel).not.toHaveBeenCalled();
    expect(innerCancel).not.toHaveBeenCalled();
  });

  it('cancels live candidates when a runtime scope is disposed', () => {
    const arena = new GestureArena();
    const onCancel = vi.fn();
    arena.register(11, { owner: 'content', priority: 'content', onCancel });
    arena.dispose();
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(arena.claim(11, 'content')).toBe(false);
  });
});
