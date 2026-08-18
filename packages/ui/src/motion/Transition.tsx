import type { HTMLAttributes, PropsWithChildren } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useMotionRuntime } from './runtime';
import type { SpringPreset } from './spring';
import { readSpringSpec, SpringValue } from './spring';

export type TransitionKind =
  | 'fade'
  | 'scale'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'reveal'
  | 'collapse'
  | 'replace';

export type MotionTransitionProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, 'onTransitionEnd' | 'style'> & {
    present: boolean;
    kind?: TransitionKind;
    spring?: SpringPreset;
    distance?: number;
    onRest?: (present: boolean) => void;
  }
>;

export function MotionTransition({
  present,
  kind = 'fade',
  spring = 'standard',
  distance = 24,
  onRest,
  children,
  ...props
}: MotionTransitionProps) {
  const runtime = useMotionRuntime();
  const nodeRef = useRef<HTMLDivElement>(null);
  const springValueRef = useRef<SpringValue | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const onRestRef = useRef(onRest);
  const [hidden, setHidden] = useState(!present);

  onRestRef.current = onRest;

  useLayoutEffect(() => {
    const node = nodeRef.current;

    if (!node) {
      return;
    }

    unsubscribeRef.current?.();
    unsubscribeRef.current = null;

    if (present) {
      setHidden(false);
    }

    const target = present ? 1 : 0;
    const spec = readSpringSpec(node, spring);
    const springValue = springValueRef.current ?? new SpringValue(present ? 0 : 1, spec);

    springValueRef.current = springValue;
    springValue.setSpec(spec);

    if (runtime.preference === 'reduced') {
      springValue.jump(target);
      applyTransitionFrame(node, kind, target, distance);

      if (!present) {
        setHidden(true);
      }

      onRestRef.current?.(present);
      return;
    }

    springValue.setTarget(target);

    const settle = () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;

      if (!present) {
        setHidden(true);
      }

      onRestRef.current?.(present);
    };

    applyTransitionFrame(node, kind, springValue.value, distance);

    if (springValue.isSettled()) {
      settle();
      return;
    }

    unsubscribeRef.current = runtime.clock.subscribe((frame) => {
      const state = springValue.step(frame.deltaMs);
      applyTransitionFrame(node, kind, state.value, distance);

      if (springValue.isSettled()) {
        settle();
      }
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, [distance, kind, present, runtime, spring]);

  return (
    <div
      {...props}
      ref={nodeRef}
      className={['ui-motion-transition', props.className].filter(Boolean).join(' ')}
      data-motion-kind={kind}
      data-present={present}
      data-hidden={hidden}
      aria-hidden={!present || undefined}
      inert={!present || undefined}
    >
      {children}
    </div>
  );
}

export type TransitionAliasProps = Omit<MotionTransitionProps, 'kind'>;

export function FadeTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="fade" />;
}

export function ScaleTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="scale" />;
}

export function SlideTransition({
  direction = 'up',
  ...props
}: TransitionAliasProps & {
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  return <MotionTransition {...props} kind={`slide-${direction}`} />;
}

export function RevealTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="reveal" />;
}

export function CollapseTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="collapse" />;
}

export function ReplaceTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="replace" />;
}

function applyTransitionFrame(
  node: HTMLDivElement,
  kind: TransitionKind,
  rawProgress: number,
  distance: number,
) {
  const progress = clamp(rawProgress, 0, 1);
  const inverse = 1 - progress;

  node.style.opacity = String(resolveOpacity(kind, progress));
  node.style.transformOrigin = 'center';
  node.style.clipPath = '';

  switch (kind) {
    case 'fade':
      node.style.transform = '';
      break;
    case 'scale':
      node.style.transform = `scale(${0.94 + 0.06 * progress})`;
      break;
    case 'slide-up':
      node.style.transform = `translate3d(0, ${inverse * distance}px, 0)`;
      break;
    case 'slide-down':
      node.style.transform = `translate3d(0, ${-inverse * distance}px, 0)`;
      break;
    case 'slide-left':
      node.style.transform = `translate3d(${inverse * distance}px, 0, 0)`;
      break;
    case 'slide-right':
      node.style.transform = `translate3d(${-inverse * distance}px, 0, 0)`;
      break;
    case 'reveal':
      node.style.transform = `translate3d(0, ${inverse * distance * 0.35}px, 0)`;
      node.style.clipPath = `inset(${inverse * 18}% 0 0 0 round var(--oxs-radius-md))`;
      break;
    case 'collapse':
      node.style.transformOrigin = 'top';
      node.style.transform = `scaleY(${progress})`;
      break;
    case 'replace':
      node.style.transform = `scale(${0.985 + 0.015 * progress})`;
      break;
  }
}

function resolveOpacity(kind: TransitionKind, progress: number) {
  if (kind === 'collapse') {
    return 0.4 + 0.6 * progress;
  }

  return progress;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
