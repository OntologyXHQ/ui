import type { PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useRef } from 'react';
import { type PanGestureOptions, usePanGesture } from './usePanGesture';

export type ScreenEdge = 'top' | 'right' | 'bottom' | 'left';

export type EdgePanGestureOptions = PanGestureOptions & {
  edge: ScreenEdge;
  edgeInset?: number;
};

export function useEdgePanGesture({
  edge,
  edgeInset = 28,
  disabled,
  ...options
}: EdgePanGestureOptions) {
  const eligiblePointerRef = useRef<number | null>(null);
  const pan = usePanGesture({
    ...options,
    disabled,
    priority: options.priority ?? 'system',
  });

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || !isWithinEdge(event, edge, edgeInset)) {
        eligiblePointerRef.current = null;
        return;
      }

      eligiblePointerRef.current = event.pointerId;
      pan.gestureProps.onPointerDown?.(event);
    },
    [disabled, edge, edgeInset, pan.gestureProps],
  );

  const guard =
    <K extends 'onPointerMove' | 'onPointerUp' | 'onPointerCancel' | 'onLostPointerCapture'>(
      key: K,
    ) =>
    (event: ReactPointerEvent<HTMLElement>) => {
      if (eligiblePointerRef.current !== event.pointerId) {
        return;
      }

      const handler = pan.gestureProps[key] as
        | ((event: ReactPointerEvent<HTMLElement>) => void)
        | undefined;
      handler?.(event);

      if (key === 'onPointerUp' || key === 'onPointerCancel' || key === 'onLostPointerCapture') {
        eligiblePointerRef.current = null;
      }
    };

  return {
    ...pan,
    gestureProps: {
      ...pan.gestureProps,
      onPointerDown,
      onPointerMove: guard('onPointerMove'),
      onPointerUp: guard('onPointerUp'),
      onPointerCancel: guard('onPointerCancel'),
      onLostPointerCapture: guard('onLostPointerCapture'),
    },
  };
}

function isWithinEdge(event: ReactPointerEvent<HTMLElement>, edge: ScreenEdge, edgeInset: number) {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (edge === 'top') return event.clientY <= edgeInset;
  if (edge === 'bottom') return event.clientY >= height - edgeInset;
  if (edge === 'left') return event.clientX <= edgeInset;
  return event.clientX >= width - edgeInset;
}
