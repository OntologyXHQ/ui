import type { ButtonHTMLAttributes } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useInteractiveTransition } from '../motion';
import { usePanGesture } from './usePanGesture';

export type DragRevealOptions = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  distance?: number;
};

export function useDragReveal({ open, onOpen, onClose, distance = 240 }: DragRevealOptions) {
  const openRef = useRef(open);
  const callbacksRef = useRef({ onOpen, onClose });
  const startProgressRef = useRef(open ? 1 : 0);
  const suppressActivateRef = useRef(false);
  const suppressActivateTimerRef = useRef<number | null>(null);
  const requestedTargetRef = useRef<0 | 1 | null>(null);

  openRef.current = open;
  callbacksRef.current = { onOpen, onClose };

  const safeDistance = Math.max(1, Math.abs(distance));
  const transition = useInteractiveTransition({
    initialProgress: open ? 1 : 0,
    spring: 'snappy',
  });

  const commitTarget = useCallback((target: 0 | 1) => {
    const authoritativeTarget = openRef.current ? 1 : 0;
    if (requestedTargetRef.current === target) {
      return;
    }
    if (requestedTargetRef.current === null && target === authoritativeTarget) {
      return;
    }

    requestedTargetRef.current = target;
    if (target === 1) {
      callbacksRef.current.onOpen();
    } else {
      callbacksRef.current.onClose();
    }
  }, []);

  useEffect(
    () => () => {
      if (suppressActivateTimerRef.current !== null) {
        window.clearTimeout(suppressActivateTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    const authoritativeTarget = open ? 1 : 0;
    if (requestedTargetRef.current === authoritativeTarget) {
      requestedTargetRef.current = null;
    }
    transition.animateTo(authoritativeTarget);
  }, [open, transition]);

  const pan = usePanGesture({
    axis: 'y',
    priority: 'system',
    threshold: 5,
    onBegin: () => {
      suppressActivateRef.current = false;
      startProgressRef.current = transition.snapshot.progress;
      transition.begin();
    },
    onUpdate: (sample) => {
      const progress = startProgressRef.current - sample.translation.y / safeDistance;
      const velocity = -sample.velocity.y / safeDistance;
      transition.setInteractiveProgress(progress, velocity);
    },
    onEnd: () => {
      suppressActivateRef.current = true;
      if (suppressActivateTimerRef.current !== null) {
        window.clearTimeout(suppressActivateTimerRef.current);
      }
      suppressActivateTimerRef.current = window.setTimeout(() => {
        suppressActivateRef.current = false;
        suppressActivateTimerRef.current = null;
      }, 0);
      const target = transition.settle({
        threshold: 0.42,
        velocityThreshold: 0.72,
      });
      commitTarget(target);
    },
    onCancel: () => {
      transition.animateTo(openRef.current ? 1 : 0);
    },
  });

  const activate = useCallback(() => {
    if (suppressActivateRef.current) {
      suppressActivateRef.current = false;
      return;
    }

    const currentTarget = requestedTargetRef.current ?? (openRef.current ? 1 : 0);
    const target = currentTarget === 1 ? 0 : 1;
    transition.animateTo(target);
    commitTarget(target);
  }, [commitTarget, transition]);

  return {
    transition,
    activate,
    gestureProps: pan.gestureProps as ButtonHTMLAttributes<HTMLButtonElement>,
  };
}
