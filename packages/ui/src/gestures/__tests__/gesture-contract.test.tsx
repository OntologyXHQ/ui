import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GestureRuntimeProvider } from '../runtime';
import { useEdgePanGesture } from '../useEdgePanGesture';
import { usePanGesture } from '../usePanGesture';

function pointerEvent(
  type: string,
  { pointerId = 1, pointerType = 'mouse', clientX = 0, clientY = 0 }: Partial<PointerEvent> = {},
) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: pointerId },
    pointerType: { configurable: true, value: pointerType },
    isPrimary: { configurable: true, value: true },
  });
  return event;
}

describe('UIR12 gesture competition contract', () => {
  it('leaves native scroll/text-selection ownership untouched before threshold and cancels it only after arena claim', () => {
    const onBegin = vi.fn();
    const onUpdate = vi.fn();
    const onEnd = vi.fn();

    function Fixture() {
      const pan = usePanGesture({ axis: 'x', threshold: 8, onBegin, onUpdate, onEnd });
      return (
        <div data-testid="pan" {...pan.gestureProps}>
          selectable text
        </div>
      );
    }

    render(
      <GestureRuntimeProvider>
        <Fixture />
      </GestureRuntimeProvider>,
    );
    const target = screen.getByTestId('pan');

    expect(fireEvent(target, pointerEvent('pointerdown', { clientX: 10, clientY: 10 }))).toBe(true);
    expect(fireEvent(target, pointerEvent('pointermove', { clientX: 14, clientY: 10 }))).toBe(true);
    expect(onBegin).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();

    expect(fireEvent(target, pointerEvent('pointermove', { clientX: 24, clientY: 10 }))).toBe(
      false,
    );
    expect(onBegin).toHaveBeenCalledTimes(1);
    expect(onUpdate).toHaveBeenCalledTimes(1);
    fireEvent(target, pointerEvent('pointerup', { clientX: 24, clientY: 10 }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps physical edge-pan eligibility separate from threshold-based arena ownership', () => {
    const onBegin = vi.fn();

    function Fixture() {
      const edgePan = useEdgePanGesture({
        edge: 'left',
        threshold: 6,
        onBegin,
      });
      return <div data-testid="edge-pan" {...edgePan.gestureProps} />;
    }

    render(
      <GestureRuntimeProvider>
        <Fixture />
      </GestureRuntimeProvider>,
    );
    const target = screen.getByTestId('edge-pan');

    fireEvent(target, pointerEvent('pointerdown', { pointerId: 41, clientX: 80, clientY: 20 }));
    fireEvent(target, pointerEvent('pointermove', { pointerId: 41, clientX: 110, clientY: 20 }));
    fireEvent(target, pointerEvent('pointerup', { pointerId: 41, clientX: 110, clientY: 20 }));
    expect(onBegin).not.toHaveBeenCalled();

    fireEvent(target, pointerEvent('pointerdown', { pointerId: 42, clientX: 1, clientY: 20 }));
    expect(
      fireEvent(target, pointerEvent('pointermove', { pointerId: 42, clientX: 12, clientY: 20 })),
    ).toBe(false);
    expect(onBegin).toHaveBeenCalledTimes(1);
    fireEvent(target, pointerEvent('pointerup', { pointerId: 42, clientX: 12, clientY: 20 }));
  });

  it('continues an owned pan through the owner Window when pointer capture is unavailable', () => {
    const onEnd = vi.fn();
    function Fixture() {
      const pan = usePanGesture({ threshold: 2, onEnd });
      return <div data-testid="continuation-pan" {...pan.gestureProps} />;
    }
    render(
      <GestureRuntimeProvider>
        <Fixture />
      </GestureRuntimeProvider>,
    );
    const target = screen.getByTestId('continuation-pan');
    Object.defineProperties(target, {
      setPointerCapture: { configurable: true, value: undefined },
      hasPointerCapture: { configurable: true, value: undefined },
      releasePointerCapture: { configurable: true, value: undefined },
    });
    fireEvent(target, pointerEvent('pointerdown', { pointerId: 19, clientX: 0, clientY: 0 }));
    window.dispatchEvent(pointerEvent('pointermove', { pointerId: 19, clientX: 12, clientY: 0 }));
    window.dispatchEvent(pointerEvent('pointerup', { pointerId: 19, clientX: 12, clientY: 0 }));
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
