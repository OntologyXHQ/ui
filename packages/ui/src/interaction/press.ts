import type {
  FocusEvent as ReactFocusEvent,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { gestureArena } from '../gestures/arena';
import { releasePointerCaptureIfSupported, setPointerCaptureIfSupported } from '../gestures/pointerCapture';

export type PressSource = 'keyboard' | 'mouse' | 'pen' | 'touch';

export type PressActivation = {
  source: PressSource;
  pointerType?: string;
  clientX?: number;
  clientY?: number;
};

export type PressOptions = {
  disabled?: boolean;
  priority?: 'passive' | 'default' | 'content' | 'system';
  onPress?: (activation: PressActivation) => void;
  onLongPress?: (activation: PressActivation) => void;
  longPressDelay?: number;
  onPressChange?: (pressed: boolean) => void;
  keyboardActivation?: 'managed' | 'native';
};

type PressElementAttributes = HTMLAttributes<HTMLElement> & {
  'data-pressed'?: boolean;
};

type PointerSession = {
  pointerId: number;
  pointerType: string;
  target: HTMLElement;
  clientX: number;
  clientY: number;
  unregister: () => void;
};

export function usePress({
  disabled = false,
  priority = 'default',
  onPress,
  onLongPress,
  longPressDelay = 520,
  onPressChange,
  keyboardActivation = 'managed',
}: PressOptions = {}) {
  const owner = useId();
  const sessionRef = useRef<PointerSession | null>(null);
  const keyboardKeyRef = useRef<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const suppressNextClickRef = useRef(false);
  const suppressionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef({ onPress, onLongPress, onPressChange });
  const pressedRef = useRef(false);
  const [pressed, setPressedState] = useState(false);
  callbacksRef.current = { onPress, onLongPress, onPressChange };

  const setPressed = useCallback((next: boolean) => {
    if (pressedRef.current === next) return;
    pressedRef.current = next;
    callbacksRef.current.onPressChange?.(next);
    setPressedState(next);
  }, []);

  const clearSuppressionTimer = useCallback(() => {
    if (suppressionTimerRef.current !== null) clearTimeout(suppressionTimerRef.current);
    suppressionTimerRef.current = null;
  }, []);

  const suppressNextClick = useCallback(() => {
    clearSuppressionTimer();
    suppressNextClickRef.current = true;
    suppressionTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = false;
      suppressionTimerRef.current = null;
    }, 0);
  }, [clearSuppressionTimer]);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  const clearPointerSession = useCallback(
    (releaseArena = true) => {
      const session = sessionRef.current;
      if (!session) return;
      sessionRef.current = null;
      clearLongPressTimer();
      session.unregister();
      if (releaseArena) gestureArena.release(session.pointerId, owner);
      releasePointerCaptureIfSupported(session.target, session.pointerId);
      setPressed(false);
    },
    [clearLongPressTimer, owner, setPressed],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button > 0 || !event.isPrimary || sessionRef.current) return;
      clearSuppressionTimer();
      suppressNextClickRef.current = false;

      const target = event.currentTarget;
      const session: PointerSession = {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target,
        clientX: event.clientX,
        clientY: event.clientY,
        unregister: () => {},
      };

      session.unregister = gestureArena.register(event.pointerId, {
        owner,
        priority,
        onCancel: () => {
          if (sessionRef.current?.pointerId !== event.pointerId) return;
          sessionRef.current = null;
          releasePointerCaptureIfSupported(target, event.pointerId);
          suppressNextClick();
          setPressed(false);
        },
      });

      sessionRef.current = session;
      longPressFiredRef.current = false;
      setPointerCaptureIfSupported(target, event.pointerId);
      setPressed(true);
      if (callbacksRef.current.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          if (sessionRef.current?.pointerId !== event.pointerId) return;
          if (!gestureArena.claim(event.pointerId, owner)) return;
          longPressFiredRef.current = true;
          suppressNextClick();
          callbacksRef.current.onLongPress?.({
            source: normalizePointerSource(event.pointerType),
            pointerType: event.pointerType,
            clientX: session.clientX,
            clientY: session.clientY,
          });
        }, longPressDelay);
      }
    },
    [clearSuppressionTimer, disabled, longPressDelay, owner, priority, setPressed, suppressNextClick],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;
      session.clientX = event.clientX;
      session.clientY = event.clientY;
      const rect = session.target.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      setPressed(inside);
      if (!inside) clearLongPressTimer();
    },
    [clearLongPressTimer, setPressed],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const session = sessionRef.current;
      if (!session || session.pointerId !== event.pointerId) return;

      clearLongPressTimer();
      const shouldActivate =
        !longPressFiredRef.current && pressedRef.current && gestureArena.claim(event.pointerId, owner);
      const pointerType = session.pointerType;
      if (!shouldActivate) suppressNextClick();
      clearPointerSession();

      if (shouldActivate && !disabled) {
        callbacksRef.current.onPress?.({
          source: normalizePointerSource(pointerType),
          pointerType,
          clientX: event.clientX,
          clientY: event.clientY,
        });
      }
    },
    [clearLongPressTimer, clearPointerSession, disabled, owner, suppressNextClick],
  );

  const onPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (sessionRef.current?.pointerId === event.pointerId) {
        suppressNextClick();
        clearPointerSession();
      }
    },
    [clearPointerSession, suppressNextClick],
  );

  const onKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled || event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
      clearSuppressionTimer();
      suppressNextClickRef.current = false;
      if (keyboardActivation === 'managed' && event.key === ' ') event.preventDefault();
      keyboardKeyRef.current = event.key;
      setPressed(true);
    },
    [clearSuppressionTimer, disabled, keyboardActivation, setPressed],
  );

  const onKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled || keyboardKeyRef.current !== event.key) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (keyboardActivation === 'managed') event.preventDefault();
      keyboardKeyRef.current = null;
      setPressed(false);
      if (keyboardActivation === 'managed') callbacksRef.current.onPress?.({ source: 'keyboard' });
    },
    [disabled, keyboardActivation, setPressed],
  );


  const onClickCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    if (!suppressNextClickRef.current) return;
    clearSuppressionTimer();
    suppressNextClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, [clearSuppressionTimer]);

  const onBlur = useCallback(
    (_event: ReactFocusEvent<HTMLElement>) => {
      keyboardKeyRef.current = null;
      setPressed(false);
    },
    [setPressed],
  );

  useEffect(
    () => () => {
      clearPointerSession();
      clearSuppressionTimer();
    },
    [clearPointerSession, clearSuppressionTimer],
  );

  const pressProps: PressElementAttributes = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture: onPointerCancel,
    onClickCapture,
    onKeyDown,
    onKeyUp,
    onBlur,
    'data-pressed': pressed || undefined,
  };

  return { pressProps, pressed };
}

function normalizePointerSource(pointerType: string): PressSource {
  if (pointerType === 'touch' || pointerType === 'pen' || pointerType === 'mouse') return pointerType;
  return 'mouse';
}
