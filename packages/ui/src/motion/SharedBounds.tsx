import type { HTMLAttributes, PropsWithChildren } from 'react';
import { useLayoutEffect, useRef } from 'react';
import { useMotionRuntime } from './runtime';
import type { SpringPreset } from './spring';
import { readSpringSpec, SpringValue } from './spring';

export type SharedBoundsProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, 'style'> & {
    transitionId: string;
    spring?: SpringPreset;
    /** Explicitly restarts bounds measurement when an already-mounted element changes layout. */
    layoutKey?: string | number;
  }
>;


export function SharedBounds({
  transitionId,
  spring = 'standard',
  layoutKey,
  children,
  ...props
}: SharedBoundsProps) {
  const runtime = useMotionRuntime();
  const nodeRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const lastBoundsRef = useRef<DOMRect | null>(null);

  useLayoutEffect(() => {
    const node = nodeRef.current;

    if (!node) {
      return;
    }

    const wasAnimating = unsubscribeRef.current !== null;
    const visualBounds = node.getBoundingClientRect();

    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    node.style.transform = '';
    node.style.transformOrigin = 'top left';

    const destinationBounds = node.getBoundingClientRect();
    const sourceBounds = wasAnimating
      ? visualBounds
      : (runtime.sharedBounds.get(transitionId) ?? lastBoundsRef.current ?? visualBounds);

    runtime.sharedBounds.delete(transitionId);
    lastBoundsRef.current = destinationBounds;

    if (runtime.preference === 'reduced' || nearlyEqualBounds(sourceBounds, destinationBounds)) {
      return () => {
        stashSharedBounds(runtime.sharedBounds, transitionId, node.getBoundingClientRect());
      };
    }

    const springValue = new SpringValue(0, readSpringSpec(node, spring));
    springValue.setTarget(1);

    applySharedBoundsFrame(node, sourceBounds, destinationBounds, 0);

    unsubscribeRef.current = runtime.clock.subscribe((frame) => {
      const state = springValue.step(frame.deltaMs);
      applySharedBoundsFrame(node, sourceBounds, destinationBounds, state.value);

      if (springValue.isSettled()) {
        unsubscribeRef.current?.();
        unsubscribeRef.current = null;
        node.style.transform = '';
      }
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      stashSharedBounds(runtime.sharedBounds, transitionId, node.getBoundingClientRect());
    };
  }, [layoutKey, runtime, spring, transitionId]);

  return (
    <div
      {...props}
      ref={nodeRef}
      className={['ui-shared-bounds', props.className].filter(Boolean).join(' ')}
      data-shared-bounds={transitionId}
    >
      {children}
    </div>
  );
}

function stashSharedBounds(store: Map<string, DOMRect>, transitionId: string, bounds: DOMRect) {
  store.set(transitionId, bounds);
  setTimeout(() => {
    if (store.get(transitionId) === bounds) store.delete(transitionId);
  }, 5000);
}

function applySharedBoundsFrame(
  node: HTMLDivElement,
  source: DOMRect,
  destination: DOMRect,
  rawProgress: number,
) {
  const progress = Math.min(1, Math.max(0, rawProgress));
  const inverse = 1 - progress;
  const sourceWidth = Math.max(source.width, 0.001);
  const sourceHeight = Math.max(source.height, 0.001);
  const destinationWidth = Math.max(destination.width, 0.001);
  const destinationHeight = Math.max(destination.height, 0.001);

  const translateX = (source.left - destination.left) * inverse;
  const translateY = (source.top - destination.top) * inverse;
  const scaleX = 1 + (sourceWidth / destinationWidth - 1) * inverse;
  const scaleY = 1 + (sourceHeight / destinationHeight - 1) * inverse;

  node.style.transform =
    `translate3d(${translateX}px, ${translateY}px, 0) ` + `scale(${scaleX}, ${scaleY})`;
}

function nearlyEqualBounds(a: DOMRect, b: DOMRect) {
  const epsilon = 0.5;

  return (
    Math.abs(a.left - b.left) <= epsilon &&
    Math.abs(a.top - b.top) <= epsilon &&
    Math.abs(a.width - b.width) <= epsilon &&
    Math.abs(a.height - b.height) <= epsilon
  );
}
