import type {
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useCallback, useEffect, useId, useRef } from 'react';
import { useGestureArena } from '../gestures/runtime';
import { releasePointerCaptureIfSupported, setPointerCaptureIfSupported } from '../gestures/pointerCapture';
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
  origin: DragPoint;
  latest: DragPoint;
  active: boolean;
  timer: number | null;
  unregister: () => void;
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
  const suppressClickTimerRef = useRef<number | null>(null);
  const gestureOwner = useId();
  const gestureArena = useGestureArena();
  const keyboardActive = session?.sourceId === id && session.modality === 'keyboard';

  const clearPending = useCallback((releaseArena = true) => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.timer !== null) window.clearTimeout(pending.timer);
    if (releaseArena) gestureArena.release(pending.pointerId, gestureOwner);
    pending.unregister();
    releasePointerCaptureIfSupported(pending.target, pending.pointerId);
    pendingRef.current = null;
  }, [gestureArena, gestureOwner]);

  const start = useCallback(
    (pending: PendingPointer) => {
      if (pending.active || !gestureArena.claim(pending.pointerId, gestureOwner)) return false;
      const began = begin({
        sourceId: id,
        pointerId: pending.pointerId,
        pointerType: pending.pointerType,
        modality: pending.pointerType === 'touch' ? 'touch' : pending.pointerType === 'pen' ? 'pen' : 'pointer',
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

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.isPrimary === false || event.button > 0 || pendingRef.current) return;
      const pending: PendingPointer = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target: event.currentTarget,
        origin: { x: event.clientX, y: event.clientY },
        latest: { x: event.clientX, y: event.clientY },
        active: false,
        timer: null,
        unregister: () => {},
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
      pendingRef.current = pending;

      if (event.pointerType === 'touch') {
        pending.timer = window.setTimeout(() => {
          pending.timer = null;
          if (pendingRef.current === pending) start(pending);
        }, touchLongPressMs);
      }
    },
    [cancel, clearPending, disabled, gestureArena, gestureOwner, start, touchLongPressMs],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      pending.latest = { x: event.clientX, y: event.clientY };
      const distance = Math.hypot(pending.latest.x - pending.origin.x, pending.latest.y - pending.origin.y);
      if (!pending.active) {
        if (pending.pointerType === 'touch') {
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

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      const owned = pending.active && gestureArena.owns(event.pointerId, gestureOwner);
      if (owned) {
        suppressNextClickRef.current = true;
        if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = window.setTimeout(() => {
          suppressNextClickRef.current = false;
          suppressClickTimerRef.current = null;
        }, 0);
        finish();
      }
      clearPending();
    },
    [clearPending, finish, gestureArena, gestureOwner],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const pending = pendingRef.current;
      if (!pending || event.pointerId !== pending.pointerId) return;
      if (pending.active) cancel();
      clearPending();
    },
    [cancel, clearPending],
  );

  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = null;
    }
    event.preventDefault();
    event.stopPropagation();
  }, []);


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
      if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    },
    [cancel, clearPending],
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
    'aria-keyshortcuts': disabled ? undefined : 'Space Enter ArrowUp ArrowDown ArrowLeft ArrowRight Escape',
    'data-oxs-drag-source': id,
    'data-oxs-drag-active': keyboardActive ? 'true' : 'false',
  };
}
