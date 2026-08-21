import type { HTMLAttributes, PropsWithChildren } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useUiEnvironment } from '../foundations';
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

export type TransitionAliasProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, 'onTransitionEnd' | 'style'> & {
    /** Logical visibility state that owns accessibility and interaction semantics. */
    present: boolean;
    /** Semantic spring preset read from the owning element realm. @default standard */
    spring?: SpringPreset;
    /** Maximum spatial travel in CSS pixels for slide/reveal treatments. @default 24 */
    distance?: number;
    /** Called after the requested present/absent state has settled, including immediate reduced-motion settlement. */
    onRest?: (present: boolean) => void;
  }
>;

export type MotionTransitionProps = TransitionAliasProps & {
  /** Visual transition treatment. @default fade */
  kind?: TransitionKind;
};

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
    if (!node) return;

    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    delete node.dataset.motionActive;

    if (present) setHidden(false);

    const target = present ? 1 : 0;
    const spec = readSpringSpec(node, spring);
    const springValue = springValueRef.current ?? new SpringValue(present ? 0 : 1, spec);
    springValueRef.current = springValue;
    springValue.setSpec(spec);

    if (runtime.preference === 'reduced') {
      springValue.jump(target);
      applyReducedTransitionFrame(node, target);
      if (!present) setHidden(true);
      onRestRef.current?.(present);
      return;
    }

    springValue.setTarget(target, springValue.velocity);

    const settle = () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      delete node.dataset.motionActive;
      applySettledTransitionFrame(node, target);
      if (!present) setHidden(true);
      onRestRef.current?.(present);
    };

    applyTransitionFrame(node, kind, springValue.value, distance);
    if (springValue.isSettled()) {
      settle();
      return;
    }

    node.dataset.motionActive = 'true';
    unsubscribeRef.current = runtime.clock.subscribe((frame) => {
      const state = springValue.step(frame.deltaMs);
      applyTransitionFrame(node, kind, state.value, distance);
      if (springValue.isSettled()) settle();
    });

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      delete node.dataset.motionActive;
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
      data-motion-preference={runtime.preference}
      aria-hidden={!present || undefined}
      inert={!present || undefined}
    >
      {children}
    </div>
  );
}

export function FadeTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="fade" />;
}

export function ScaleTransition(props: TransitionAliasProps) {
  return <MotionTransition {...props} kind="scale" />;
}

export type SlideDirection =
  | 'block-start'
  | 'block-end'
  | 'inline-start'
  | 'inline-end'
  | 'up'
  | 'down'
  | 'left'
  | 'right';

export function SlideTransition({
  direction = 'block-start',
  ...props
}: TransitionAliasProps & {
  /** Logical slide direction. Physical up/down/left/right remain as compatibility values. @default block-start */
  direction?: SlideDirection;
}) {
  const environment = useUiEnvironment();
  const resolved = resolveSlideKind(direction, environment.direction);
  return <MotionTransition {...props} kind={resolved} />;
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

function resolveSlideKind(direction: SlideDirection, uiDirection: 'ltr' | 'rtl'): TransitionKind {
  if (direction === 'block-start') return 'slide-up';
  if (direction === 'block-end') return 'slide-down';
  if (direction === 'inline-start') return uiDirection === 'rtl' ? 'slide-right' : 'slide-left';
  if (direction === 'inline-end') return uiDirection === 'rtl' ? 'slide-left' : 'slide-right';
  return `slide-${direction}` as TransitionKind;
}

function applySettledTransitionFrame(node: HTMLDivElement, progress: number) {
  node.style.opacity = String(clamp(progress, 0, 1));
  node.style.transform = '';
  node.style.transformOrigin = '';
  node.style.clipPath = '';
}

function applyReducedTransitionFrame(node: HTMLDivElement, progress: number) {
  node.style.opacity = String(clamp(progress, 0, 1));
  node.style.transform = '';
  node.style.transformOrigin = '';
  node.style.clipPath = '';
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
  if (kind === 'collapse') return 0.4 + 0.6 * progress;
  return progress;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
