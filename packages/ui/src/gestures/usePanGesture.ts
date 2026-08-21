import type { HTMLAttributes, PointerEvent as ReactPointerEvent } from 'react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { releasePointerCaptureIfSupported, setPointerCaptureIfSupported } from './pointerCapture';
import { useGestureArena } from './runtime';
import type {
  GestureAxis,
  GesturePoint,
  GesturePriority,
  GestureVector,
  PanGestureSample,
} from './types';

export type PanGestureOptions = {
  axis?: GestureAxis;
  disabled?: boolean;
  priority?: GesturePriority;
  threshold?: number;
  onBegin?: (sample: PanGestureSample) => void;
  onUpdate?: (sample: PanGestureSample) => void;
  onEnd?: (sample: PanGestureSample) => void;
  onCancel?: (sample: PanGestureSample | null) => void;
};

type PanSession = {
  pointerId: number;
  pointerType: string;
  target: HTMLElement;
  origin: GesturePoint;
  previous: GesturePoint;
  position: GesturePoint;
  startedAtMs: number;
  previousTimeMs: number;
  velocity: GestureVector;
  claimed: boolean;
  unregister: () => void;
  removeWindowContinuation: () => void;
};

type PanPointerEvent = {
  pointerId: number;
  clientX: number;
  clientY: number;
  timeStamp: number;
  target: EventTarget | null;
  preventDefault: () => void;
};

export function usePanGesture({
  axis = 'free',
  disabled = false,
  priority = 'default',
  threshold = 6,
  onBegin,
  onUpdate,
  onEnd,
  onCancel,
}: PanGestureOptions = {}) {
  const owner = useId();
  const gestureArena = useGestureArena();
  const sessionRef = useRef<PanSession | null>(null);
  const callbacksRef = useRef({ onBegin, onUpdate, onEnd, onCancel });
  callbacksRef.current = { onBegin, onUpdate, onEnd, onCancel };

  const releaseSessionResources = useCallback(
    (session: PanSession) => {
      session.removeWindowContinuation();
      session.unregister();
      gestureArena.release(session.pointerId, owner);
      releasePointerCaptureIfSupported(session.target, session.pointerId);
    },
    [gestureArena, owner],
  );

  const cancelSession = useCallback(
    (event?: Pick<PanPointerEvent, 'pointerId'>) => {
      const session = sessionRef.current;
      if (!session || (event && session.pointerId !== event.pointerId)) {
        return;
      }

      const sample = sampleFromSession(session, 'cancelled');
      sessionRef.current = null;
      releaseSessionResources(session);
      callbacksRef.current.onCancel?.(sample);
    },
    [releaseSessionResources],
  );

  const updateSession = useCallback(
    (event: PanPointerEvent) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      const next = { x: event.clientX, y: event.clientY };
      const delta = { x: next.x - session.previous.x, y: next.y - session.previous.y };
      const elapsedMs = Math.max(1, event.timeStamp - session.previousTimeMs);
      const instantaneous = {
        x: (delta.x * 1000) / elapsedMs,
        y: (delta.y * 1000) / elapsedMs,
      };

      session.position = next;
      session.velocity = {
        x: session.velocity.x * 0.68 + instantaneous.x * 0.32,
        y: session.velocity.y * 0.68 + instantaneous.y * 0.32,
      };
      session.previous = next;
      session.previousTimeMs = event.timeStamp;

      const translation = translationFor(session);
      const primaryDistance = distanceForAxis(axis, translation);

      if (!session.claimed && primaryDistance >= threshold) {
        if (!gestureArena.claim(event.pointerId, owner)) {
          return;
        }

        session.claimed = true;
        setPointerCaptureIfSupported(session.target, event.pointerId);
        callbacksRef.current.onBegin?.(sampleFromSession(session, 'began', delta));
      }

      if (!session.claimed || !gestureArena.owns(event.pointerId, owner)) {
        return;
      }

      event.preventDefault();
      callbacksRef.current.onUpdate?.(sampleFromSession(session, 'changed', delta));
    },
    [axis, gestureArena, owner, threshold],
  );

  const finishSession = useCallback(
    (event: Pick<PanPointerEvent, 'pointerId'>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) {
        return;
      }

      const owned = session.claimed && gestureArena.owns(event.pointerId, owner);
      sessionRef.current = null;
      releaseSessionResources(session);

      if (owned) {
        callbacksRef.current.onEnd?.(sampleFromSession(session, 'ended'));
      }
    },
    [gestureArena, owner, releaseSessionResources],
  );

  const installWindowContinuation = useCallback(
    (session: PanSession) => {
      const onWindowPointerMove = (event: PointerEvent) => {
        if (
          event.pointerId !== session.pointerId ||
          eventTargetsSessionElement(event.target, session.target)
        ) {
          return;
        }

        updateSession(event);
      };
      const onWindowPointerUp = (event: PointerEvent) => {
        if (
          event.pointerId !== session.pointerId ||
          eventTargetsSessionElement(event.target, session.target)
        ) {
          return;
        }

        finishSession(event);
      };
      const onWindowPointerCancel = (event: PointerEvent) => {
        if (event.pointerId !== session.pointerId) {
          return;
        }

        cancelSession(event);
      };

      const ownerWindow = session.target.ownerDocument.defaultView;
      if (!ownerWindow) return () => {};

      ownerWindow.addEventListener('pointermove', onWindowPointerMove);
      ownerWindow.addEventListener('pointerup', onWindowPointerUp);
      ownerWindow.addEventListener('pointercancel', onWindowPointerCancel);

      return () => {
        ownerWindow.removeEventListener('pointermove', onWindowPointerMove);
        ownerWindow.removeEventListener('pointerup', onWindowPointerUp);
        ownerWindow.removeEventListener('pointercancel', onWindowPointerCancel);
      };
    },
    [cancelSession, finishSession, updateSession],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.isPrimary === false || event.button > 0 || sessionRef.current) {
        return;
      }

      const point = { x: event.clientX, y: event.clientY };
      const session: PanSession = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target: event.currentTarget,
        origin: point,
        previous: point,
        position: point,
        startedAtMs: event.timeStamp,
        previousTimeMs: event.timeStamp,
        velocity: { x: 0, y: 0 },
        claimed: false,
        unregister: () => {},
        removeWindowContinuation: () => {},
      };

      session.unregister = gestureArena.register(event.pointerId, {
        owner,
        priority,
        onCancel: () => {
          if (sessionRef.current?.pointerId !== event.pointerId) {
            return;
          }

          sessionRef.current = null;
          releaseSessionResources(session);
          callbacksRef.current.onCancel?.(sampleFromSession(session, 'cancelled'));
        },
      });
      session.removeWindowContinuation = installWindowContinuation(session);
      sessionRef.current = session;
    },
    [disabled, gestureArena, installWindowContinuation, owner, priority, releaseSessionResources],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      updateSession(event);
    },
    [updateSession],
  );

  const finish = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      finishSession(event);
    },
    [finishSession],
  );

  const onLostPointerCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (session?.pointerId === event.pointerId) {
        cancelSession();
      }
    },
    [cancelSession],
  );

  useEffect(() => {
    if (disabled && sessionRef.current) cancelSession();
  }, [cancelSession, disabled]);

  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (!session) {
        return;
      }

      sessionRef.current = null;
      releaseSessionResources(session);
    },
    [releaseSessionResources],
  );

  const gestureProps: HTMLAttributes<HTMLElement> = {
    onPointerDown,
    onPointerMove,
    onPointerUp: finish,
    onPointerCancel: cancelSession,
    onLostPointerCapture,
  };

  return {
    gestureProps,
    cancel: cancelSession,
    isActive: () => sessionRef.current?.claimed ?? false,
  };
}

function eventTargetsSessionElement(target: EventTarget | null, sessionTarget: HTMLElement) {
  const NodeCtor = sessionTarget.ownerDocument.defaultView?.Node;
  return Boolean(NodeCtor && target instanceof NodeCtor && sessionTarget.contains(target));
}

function sampleFromSession(
  session: PanSession,
  phase: PanGestureSample['phase'],
  delta: GestureVector = { x: 0, y: 0 },
): PanGestureSample {
  return {
    pointerId: session.pointerId,
    pointerType: session.pointerType,
    phase,
    origin: session.origin,
    position: session.position,
    translation: translationFor(session),
    delta,
    velocity: session.velocity,
    elapsedMs: Math.max(0, session.previousTimeMs - session.startedAtMs),
  };
}

function translationFor(session: PanSession) {
  return {
    x: session.position.x - session.origin.x,
    y: session.position.y - session.origin.y,
  };
}

function distanceForAxis(axis: GestureAxis, vector: GestureVector) {
  if (axis === 'x') {
    return Math.abs(vector.x);
  }

  if (axis === 'y') {
    return Math.abs(vector.y);
  }

  return Math.hypot(vector.x, vector.y);
}
