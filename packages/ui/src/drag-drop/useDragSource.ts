import type {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { useGestureArena } from '../gestures/runtime';
import {
  releasePointerCaptureIfSupported,
  setPointerCaptureIfSupported,
} from '../gestures/pointerCapture';
import { useDragDropRuntime } from './runtime';
import type { DragItem, DragPoint, DragPreview } from './types';

export type DragSourceOptions = {
  id: string;
  item: DragItem;
  preview?: DragPreview;
  disabled?: boolean;
  threshold?: number;
  touchLongPressMs?: number;
};

export type DragSourceAttributes = HTMLAttributes<HTMLElement> & {
  'data-oxs-drag-source': string;
  'data-oxs-drag-active'?: 'true' | 'false';
};

type PendingPointer = {
  pointerId: number;
  pointerType: string;
  target: HTMLElement;
  ownerWindow: Window | null;
  origin: DragPoint;
  latest: DragPoint;
  active: boolean;
  timer: number | null;
  unregister: () => void;
  removeWindowContinuation: () => void;
};

type DragPointerEvent = {
  pointerId: number;
  clientX: number;
  clientY: number;
  target: EventTarget | null;
  preventDefault: () => void;
};

type ClickSuppressionTimer = {
  ownerWindow: Window;
  id: number;
};

export function useDragSource({
  id,
  item,
  preview,
  disabled = false,
  threshold = 6,
  touchLongPressMs = 360,
}: DragSourceOptions): DragSourceAttributes {
  const { begin, update, stepTarget, finish, cancel, session } = useDragDropRuntime();
  const pendingRef = useRef<PendingPointer | null>(null);
  const suppressNextClickRef = useRef(false);
  const suppressClickTimerRef = useRef<ClickSuppressionTimer | null>(null);
  const gestureOwner = useId();
  const gestureArena = useGestureArena();
  const keyboardActive = session?.sourceId === id && session.modality === 'keyboard';

  const clearClickSuppressionTimer = useCallback(() => {
    const timer = suppressClickTimerRef.current;
    if (!timer) return;
    timer.ownerWindow.clearTimeout(timer.id);
    suppressClickTimerRef.current = null;
  }, []);

  const armClickSuppression = useCallback(
    (ownerWindow: Window | null) => {
      suppressNextClickRef.current = true;
      clearClickSuppressionTimer();
      if (!ownerWindow) return;
      const timer: ClickSuppressionTimer = {
        ownerWindow,
        id: ownerWindow.setTimeout(() => {
          suppressNextClickRef.current = false;
          if (suppressClickTimerRef.current === timer) suppressClickTimerRef.current = null;
        }, 0),
      };
      suppressClickTimerRef.current = timer;
    },
    [clearClickSuppressionTimer],
  );

  const clearPending = useCallback(
    (releaseArena = true) => {
      const pending = pendingRef.current;
      if (!pending) return;
      if (pending.timer !== null && pending.ownerWindow)
        pending.ownerWindow.clearTimeout(pending.timer);
      pending.timer = null;
      pending.removeWindowContinuation();
      if (releaseArena) gestureArena.release(pending.pointerId, gestureOwner);
      pending.unregister();
      releasePointerCaptureIfSupported(pending.target, pending.pointerId);
      pendingRef.current = null;
    },
    [gestureArena, gestureOwner],
  );

  const start = useCallback(
    (pending: PendingPointer) => {
      if (pending.active || !gestureArena.claim(pending.pointerId, gestureOwner)) return false;
      const began = begin({
        sourceId: id,
        pointerId: pending.pointerId,
        pointerType: pending.pointerType,
        modality:
          pending.pointerType === 'touch'
            ? 'touch'
            : pending.pointerType === 'pen'
              ? 'pen'
              : 'pointer',
        item,
        point: pending.latest,
        preview,
      });
      if (!began) {
        gestureArena.release(pending.pointerId, gestureOwner);
        return false;
      }
      pending.active = true;
      setPointerCaptureIfSupported(pending.target, pending.pointerId);
      update(pending.latest);
      return true;
    },
    [begin, gestureArena, gestureOwner, id, item, preview, update],
  );

  const updatePointer = useCallback(
    (event: DragPointerEvent) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      pending.latest = { x: event.clientX, y: event.clientY };
      const distance = Math.hypot(
        pending.latest.x - pending.origin.x,
        pending.latest.y - pending.origin.y,
      );
      if (!pending.active) {
        if (pending.pointerType === 'touch') {
          // Direct-manipulation movement before the long-press threshold belongs to native scroll.
          if (distance >= threshold) clearPending();
          return;
        }
        if (distance < threshold || !start(pending)) return;
      }
      if (!gestureArena.owns(event.pointerId, gestureOwner)) return;
      event.preventDefault();
      update(pending.latest);
    },
    [clearPending, gestureArena, gestureOwner, start, threshold, update],
  );

  const finishPointer = useCallback(
    (event: Pick<DragPointerEvent, 'pointerId'>) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      const owned = pending.active && gestureArena.owns(event.pointerId, gestureOwner);
      if (owned) {
        armClickSuppression(pending.ownerWindow);
        finish();
      }
      clearPending();
    },
    [armClickSuppression, clearPending, finish, gestureArena, gestureOwner],
  );

  const cancelPointer = useCallback(
    (event: Pick<DragPointerEvent, 'pointerId'>) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      if (pending.active) cancel();
      clearPending();
    },
    [cancel, clearPending],
  );

  const installWindowContinuation = useCallback(
    (pending: PendingPointer) => {
      const ownerWindow = pending.ownerWindow;
      if (!ownerWindow) return () => {};

      const onWindowPointerMove = (event: PointerEvent) => {
        if (
          event.pointerId !== pending.pointerId ||
          eventTargetsSessionElement(event.target, pending.target)
        )
          return;
        updatePointer(event);
      };
      const onWindowPointerUp = (event: PointerEvent) => {
        if (
          event.pointerId !== pending.pointerId ||
          eventTargetsSessionElement(event.target, pending.target)
        )
          return;
        finishPointer(event);
      };
      const onWindowPointerCancel = (event: PointerEvent) => {
        if (event.pointerId !== pending.pointerId) return;
        cancelPointer(event);
      };

      ownerWindow.addEventListener('pointermove', onWindowPointerMove);
      ownerWindow.addEventListener('pointerup', onWindowPointerUp);
      ownerWindow.addEventListener('pointercancel', onWindowPointerCancel);
      return () => {
        ownerWindow.removeEventListener('pointermove', onWindowPointerMove);
        ownerWindow.removeEventListener('pointerup', onWindowPointerUp);
        ownerWindow.removeEventListener('pointercancel', onWindowPointerCancel);
      };
    },
    [cancelPointer, finishPointer, updatePointer],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.isPrimary === false || event.button > 0 || pendingRef.current) return;
      const ownerWindow = event.currentTarget.ownerDocument.defaultView;
      const pending: PendingPointer = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target: event.currentTarget,
        ownerWindow,
        origin: { x: event.clientX, y: event.clientY },
        latest: { x: event.clientX, y: event.clientY },
        active: false,
        timer: null,
        unregister: () => {},
        removeWindowContinuation: () => {},
      };
      pending.unregister = gestureArena.register(event.pointerId, {
        owner: gestureOwner,
        priority: 'content',
        onCancel: () => {
          if (pendingRef.current !== pending) return;
          if (pending.active) cancel();
          clearPending(false);
        },
      });
      pending.removeWindowContinuation = installWindowContinuation(pending);
      pendingRef.current = pending;

      if (event.pointerType === 'touch' && ownerWindow) {
        pending.timer = ownerWindow.setTimeout(() => {
          pending.timer = null;
          if (pendingRef.current === pending) start(pending);
        }, touchLongPressMs);
      }
    },
    [
      cancel,
      clearPending,
      disabled,
      gestureArena,
      gestureOwner,
      installWindowContinuation,
      start,
      touchLongPressMs,
    ],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => updatePointer(event),
    [updatePointer],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => finishPointer(event),
    [finishPointer],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => cancelPointer(event),
    [cancelPointer],
  );

  const onClickCapture = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!suppressNextClickRef.current) return;
      suppressNextClickRef.current = false;
      clearClickSuppressionTimer();
      event.preventDefault();
      event.stopPropagation();
    },
    [clearClickSuppressionTimer],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled || keyboardActive || (event.key !== ' ' && event.key !== 'Enter')) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.preventDefault();
      const began = begin({
        sourceId: id,
        pointerId: -1,
        pointerType: 'keyboard',
        modality: 'keyboard',
        item,
        point: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
        preview,
      });
      if (began) queueMicrotask(() => stepTarget('next'));
    },
    [begin, disabled, id, item, keyboardActive, preview, stepTarget],
  );

  useEffect(
    () => () => {
      if (pendingRef.current?.active) cancel();
      clearPending();
      clearClickSuppressionTimer();
    },
    [cancel, clearClickSuppressionTimer, clearPending],
  );

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
    onClickCapture,
    onKeyDown,
    tabIndex: disabled ? undefined : 0,
    'aria-keyshortcuts': disabled
      ? undefined
      : 'Space Enter ArrowUp ArrowDown ArrowLeft ArrowRight Escape',
    'data-oxs-drag-source': id,
    'data-oxs-drag-active': keyboardActive ? 'true' : 'false',
  };
}

function eventTargetsSessionElement(target: EventTarget | null, sessionTarget: HTMLElement) {
  const NodeCtor = sessionTarget.ownerDocument.defaultView?.Node;
  return Boolean(NodeCtor && target instanceof NodeCtor && sessionTarget.contains(target));
}
