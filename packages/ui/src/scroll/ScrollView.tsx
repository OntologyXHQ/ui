import type {
  CSSProperties,
  HTMLAttributes,
  KeyboardEvent,
  PropsWithChildren,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  Ref,
} from 'react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { observeElementSize, resolveUiDirection, useUiEnvironment } from '../foundations';
import { useGestureArena } from '../gestures/runtime';
import {
  releasePointerCaptureIfSupported,
  setPointerCaptureIfSupported,
} from '../gestures/pointerCapture';
import { readSpringSpec, SpringValue, useMotionRuntime, useReducedMotion } from '../motion';
import {
  applyEdgeResistance,
  computeIndicatorMetrics,
  consumeScrollDelta,
  decayScrollVelocity,
  nearestSnapOffset,
  normalizeWheelDelta,
  readScrollBounceSpec,
  readScrollPhysicsConfig,
  type ScrollAxis,
  type ScrollDeltaResult,
  type ScrollIndicatorMode,
  type ScrollSnapMode,
} from './physics';
import {
  alignedSnapOffset,
  logicalSnapItemStart,
  readLogicalHorizontalScroll,
  writeLogicalHorizontalScroll,
} from './logicalPosition';
import { consumeNativeScrollChain, findNativeScrollableAncestor } from './nativeChain';

export type ScrollViewHandle = {
  /** Current native viewport element, or null before mount. */
  element: HTMLElement | null;
  /** Scroll to the logical start edge. */
  scrollToStart: (animated?: boolean) => void;
  /** Scroll to the logical end edge. */
  scrollToEnd: (animated?: boolean) => void;
  /** Scroll to a bounded logical offset independent of the browser RTL scrollLeft model. */
  scrollToOffset: (offset: number, animated?: boolean) => void;
};

export type ScrollViewProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLElement>, 'onScroll'> & {
    /** Logical scroll axis. @default vertical */
    axis?: ScrollAxis;
    /** Overlay indicator visibility policy. @default auto */
    indicator?: ScrollIndicatorMode;
    /** Enables focus and keyboard scrolling on the viewport. @default true */
    keyboard?: boolean;
    /** Edge response after local and nested owners are exhausted. @default elastic */
    overscroll?: 'elastic' | 'clamp';
    /** Nearest-child snap policy. @default none */
    snap?: ScrollSnapMode;
    /** Accessible label applied to the focusable native scroll viewport. */
    ariaLabel?: string;
    /** Caller-owned key used to restore the logical offset when this ScrollView remounts in the same Document realm. */
    restorationKey?: string;
  }
>;

type PointerSession = {
  id: number;
  target: HTMLElement;
  originCoordinate: number;
  previousCoordinate: number;
  previousTime: number;
  velocity: number;
  moved: boolean;
  claimed: boolean;
  unregister: () => void;
};

type InternalScrollController = {
  axis: ScrollAxis;
  canConsumeChainedDelta: (delta: number) => boolean;
  consumeChainedDelta: (delta: number) => ScrollDeltaResult;
};

const scrollControllers = new WeakMap<HTMLElement, InternalScrollController>();

const ScrollViewImpl = forwardRef(function ScrollView(
  {
    axis = 'vertical',
    indicator = 'auto',
    keyboard = true,
    overscroll = 'elastic',
    snap = 'none',
    ariaLabel,
    restorationKey,
    children,
    className,
    style,
    onClickCapture,
    onKeyDown,
    onLostPointerCapture,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    ...props
  }: ScrollViewProps,
  forwardedRef: Ref<ScrollViewHandle>,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const pointerSessionRef = useRef<PointerSession | null>(null);
  const suppressNextClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const momentumUnsubscribeRef = useRef<(() => void) | null>(null);
  const snapTimerRef = useRef<number | null>(null);
  const hideIndicatorTimerRef = useRef<number | null>(null);
  const overscrollRef = useRef(0);
  const gestureOwner = useId();
  const gestureArena = useGestureArena();
  const { clock } = useMotionRuntime();
  const { direction } = useUiEnvironment();
  const reducedMotion = useReducedMotion();

  const stopMomentum = useCallback(() => {
    momentumUnsubscribeRef.current?.();
    momentumUnsubscribeRef.current = null;
  }, []);

  const clearSnapTimer = useCallback(() => {
    if (snapTimerRef.current !== null) {
      clock.cancelTimeout(snapTimerRef.current);
      snapTimerRef.current = null;
    }
  }, [clock]);

  const coordinateForPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>) =>
      axis === 'vertical' ? event.clientY : event.clientX,
    [axis],
  );

  const readPosition = useCallback(
    (viewport: HTMLElement) =>
      axis === 'vertical'
        ? viewport.scrollTop
        : readLogicalHorizontalScroll(viewport, resolveUiDirection(direction, viewport)),
    [axis, direction],
  );

  const readMax = useCallback(
    (viewport: HTMLElement) =>
      axis === 'vertical'
        ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
        : Math.max(0, viewport.scrollWidth - viewport.clientWidth),
    [axis],
  );

  const readViewportExtent = useCallback(
    (viewport: HTMLElement) => (axis === 'vertical' ? viewport.clientHeight : viewport.clientWidth),
    [axis],
  );

  const writePosition = useCallback(
    (viewport: HTMLElement, position: number) => {
      if (axis === 'vertical') {
        viewport.scrollTop = position;
      } else {
        writeLogicalHorizontalScroll(viewport, resolveUiDirection(direction, viewport), position);
      }
    },
    [axis, direction],
  );

  const writeOverscroll = useCallback(
    (value: number) => {
      overscrollRef.current = value;
      const content = contentRef.current;

      if (!content) {
        return;
      }

      content.style.setProperty(
        '--oxs-scroll-overscroll-x',
        axis === 'horizontal' ? `${value}px` : '0px',
      );
      content.style.setProperty(
        '--oxs-scroll-overscroll-y',
        axis === 'vertical' ? `${value}px` : '0px',
      );
      const root = rootRef.current;
      if (root) {
        if (Math.abs(value) > 0.01) root.dataset.overscrolling = 'true';
        else delete root.dataset.overscrolling;
      }
    },
    [axis],
  );

  const showIndicator = useCallback(() => {
    const root = rootRef.current;

    if (!root || indicator === 'hidden') {
      return;
    }

    root.dataset.indicatorActive = 'true';

    if (hideIndicatorTimerRef.current !== null) {
      clock.cancelTimeout(hideIndicatorTimerRef.current);
    }

    if (indicator === 'auto') {
      hideIndicatorTimerRef.current = clock.scheduleTimeout(() => {
        if (rootRef.current) {
          rootRef.current.dataset.indicatorActive = 'false';
        }
        hideIndicatorTimerRef.current = null;
      }, 620);
    }
  }, [clock, indicator]);

  const updateIndicator = useCallback(() => {
    const viewport = viewportRef.current;
    const indicatorElement = indicatorRef.current;

    if (!viewport || !indicatorElement) {
      return;
    }

    const viewportExtent = axis === 'vertical' ? viewport.clientHeight : viewport.clientWidth;
    const contentExtent = axis === 'vertical' ? viewport.scrollHeight : viewport.scrollWidth;
    const metrics = computeIndicatorMetrics(viewportExtent, contentExtent, readPosition(viewport));

    indicatorElement.dataset.visible = metrics.visible ? 'true' : 'false';
    indicatorElement.style.setProperty('--oxs-scroll-indicator-size', `${metrics.size}px`);
    indicatorElement.style.setProperty('--oxs-scroll-indicator-offset', `${metrics.offset}px`);
  }, [axis, readPosition]);

  const applyLocalDelta = useCallback(
    (delta: number, allowElastic: boolean) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return { position: 0, consumed: 0, overflow: delta };
      }

      const result = consumeScrollDelta(
        { position: readPosition(viewport), max: readMax(viewport) },
        delta,
      );

      writePosition(viewport, result.position);

      if (result.overflow !== 0 && allowElastic && overscroll === 'elastic' && !reducedMotion) {
        writeOverscroll(
          applyEdgeResistance(
            overscrollRef.current,
            result.overflow,
            readViewportExtent(viewport),
            readScrollPhysicsConfig(rootRef.current),
          ),
        );
      } else if (result.overflow === 0 && overscrollRef.current !== 0) {
        writeOverscroll(0);
      }

      updateIndicator();
      showIndicator();
      return result;
    },
    [
      overscroll,
      readMax,
      readPosition,
      readViewportExtent,
      reducedMotion,
      showIndicator,
      updateIndicator,
      writeOverscroll,
      writePosition,
    ],
  );

  const consumeChainedDelta = useCallback(
    (delta: number): ScrollDeltaResult => {
      const localResult = applyLocalDelta(delta, false);

      if (localResult.overflow === 0) {
        return localResult;
      }

      const viewport = viewportRef.current;
      const parentViewport = viewport ? findParentScrollViewport(viewport) : null;
      const parentController = parentViewport ? scrollControllers.get(parentViewport) : null;

      if (parentController && parentController.axis === axis) {
        return parentController.consumeChainedDelta(localResult.overflow);
      }

      return localResult;
    },
    [applyLocalDelta, axis],
  );

  const canConsumeChainedDelta = useCallback(
    (delta: number): boolean => {
      const viewport = viewportRef.current;
      if (!viewport || delta === 0) return false;
      const position = readPosition(viewport);
      const max = readMax(viewport);
      if ((delta < 0 && position > 0) || (delta > 0 && position < max)) return true;
      const parentViewport = findParentScrollViewport(viewport);
      const parentController = parentViewport ? scrollControllers.get(parentViewport) : null;
      return parentController && parentController.axis === axis
        ? parentController.canConsumeChainedDelta(delta)
        : false;
    },
    [axis, readMax, readPosition],
  );

  const applyChainedDelta = useCallback(
    (delta: number): ScrollDeltaResult => {
      const chainedResult = consumeChainedDelta(delta);

      if (chainedResult.overflow === 0) {
        return chainedResult;
      }

      return applyLocalDelta(chainedResult.overflow, true);
    },
    [applyLocalDelta, consumeChainedDelta],
  );

  const settleOverscroll = useCallback(
    (inheritedVelocity = 0) => {
      if (overscrollRef.current === 0) {
        return;
      }

      if (reducedMotion) {
        writeOverscroll(0);
        return;
      }

      stopMomentum();

      const spring = new SpringValue(
        overscrollRef.current,
        readScrollBounceSpec(contentRef.current),
        inheritedVelocity,
      );
      spring.setTarget(0, inheritedVelocity);

      momentumUnsubscribeRef.current = clock.subscribe((frame) => {
        const state = spring.step(frame.deltaMs);
        writeOverscroll(state.value);

        if (spring.isSettled()) {
          writeOverscroll(0);
          stopMomentum();
        }
      });
    },
    [clock, reducedMotion, stopMomentum, writeOverscroll],
  );

  const snapToNearest = useCallback(() => {
    if (snap === 'none') {
      return;
    }

    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return;
    }

    const resolvedDirection = resolveUiDirection(direction, viewport);
    const viewportExtent = readViewportExtent(viewport);
    const current = readPosition(viewport);
    const viewportRect = viewport.getBoundingClientRect();
    const snapItems = [
      ...content.querySelectorAll<HTMLElement>('[data-oxs-scroll-snap-item="true"]'),
    ];
    const offsets = snapItems.map((item) => {
      const itemRect = item.getBoundingClientRect();
      const itemStart = logicalSnapItemStart(
        itemRect,
        viewportRect,
        current,
        axis,
        resolvedDirection,
      );
      const itemExtent = axis === 'vertical' ? itemRect.height : itemRect.width;
      const rawAlign = item.dataset.snapAlign;
      const align = rawAlign === 'center' || rawAlign === 'end' ? rawAlign : 'start';
      return alignedSnapOffset(itemStart, itemExtent, viewportExtent, align);
    });
    const target = nearestSnapOffset(offsets, current, readMax(viewport));

    if (target === null) {
      return;
    }

    if (snap === 'proximity') {
      const viewportExtent = readViewportExtent(viewport);
      if (Math.abs(target - current) > viewportExtent * 0.28) {
        return;
      }
    }

    if (reducedMotion) {
      writePosition(viewport, target);
      updateIndicator();
      return;
    }

    stopMomentum();

    const spring = new SpringValue(current, readSpringSpec(viewport, 'snappy'));
    spring.setTarget(target);

    momentumUnsubscribeRef.current = clock.subscribe((frame) => {
      const state = spring.step(frame.deltaMs);
      writePosition(viewport, state.value);
      updateIndicator();
      showIndicator();

      if (spring.isSettled()) {
        writePosition(viewport, target);
        stopMomentum();
      }
    });
  }, [
    axis,
    clock,
    direction,
    readMax,
    readPosition,
    readViewportExtent,
    reducedMotion,
    showIndicator,
    snap,
    stopMomentum,
    updateIndicator,
    writePosition,
  ]);

  const scheduleSnap = useCallback(() => {
    clearSnapTimer();

    if (snap !== 'none') {
      snapTimerRef.current = clock.scheduleTimeout(() => {
        snapTimerRef.current = null;
        snapToNearest();
      }, 90);
    }
  }, [clearSnapTimer, snap, snapToNearest]);

  const startMomentum = useCallback(
    (velocity: number) => {
      const config = readScrollPhysicsConfig(rootRef.current);

      if (reducedMotion || Math.abs(velocity) <= config.stopVelocity) {
        settleOverscroll();
        scheduleSnap();
        return;
      }

      stopMomentum();
      let currentVelocity = velocity;

      momentumUnsubscribeRef.current = clock.subscribe((frame) => {
        const result = applyChainedDelta(currentVelocity * frame.deltaMs);

        currentVelocity = decayScrollVelocity(currentVelocity, frame.deltaMs, config);

        if (result.overflow !== 0) {
          stopMomentum();
          settleOverscroll(-currentVelocity * 0.5);
          scheduleSnap();
          return;
        }

        if (currentVelocity === 0) {
          stopMomentum();
          scheduleSnap();
        }
      });
    },
    [applyChainedDelta, clock, reducedMotion, scheduleSnap, settleOverscroll, stopMomentum],
  );

  const scrollToOffset = useCallback(
    (offset: number, animated = true) => {
      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const target = Math.min(readMax(viewport), Math.max(0, offset));
      clearSnapTimer();
      stopMomentum();
      writeOverscroll(0);

      if (!animated || reducedMotion) {
        writePosition(viewport, target);
        updateIndicator();
        showIndicator();
        return;
      }

      const spring = new SpringValue(readPosition(viewport), readSpringSpec(viewport, 'standard'));
      spring.setTarget(target);

      momentumUnsubscribeRef.current = clock.subscribe((frame) => {
        const state = spring.step(frame.deltaMs);
        writePosition(viewport, state.value);
        updateIndicator();
        showIndicator();

        if (spring.isSettled()) {
          writePosition(viewport, target);
          stopMomentum();
        }
      });
    },
    [
      clearSnapTimer,
      clock,
      readMax,
      readPosition,
      reducedMotion,
      showIndicator,
      stopMomentum,
      updateIndicator,
      writeOverscroll,
      writePosition,
    ],
  );

  useImperativeHandle(
    forwardedRef,
    () => ({
      element: viewportRef.current,
      scrollToStart: (animated = true) => scrollToOffset(0, animated),
      scrollToEnd: (animated = true) => {
        const viewport = viewportRef.current;
        if (viewport) {
          scrollToOffset(readMax(viewport), animated);
        }
      },
      scrollToOffset,
    }),
    [readMax, scrollToOffset],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !restorationKey) return;

    const restored = readRestoredOffset(viewport, axis, restorationKey);
    if (restored !== null) writePosition(viewport, Math.min(readMax(viewport), restored));
    updateIndicator();

    return () => {
      saveRestoredOffset(viewport, axis, restorationKey, readPosition(viewport));
    };
  }, [axis, readMax, readPosition, restorationKey, updateIndicator, writePosition]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    scrollControllers.set(viewport, { axis, canConsumeChainedDelta, consumeChainedDelta });

    return () => {
      scrollControllers.delete(viewport);
    };
  }, [axis, canConsumeChainedDelta, consumeChainedDelta]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const onWheelEvent = (event: WheelEvent) => {
      const resolvedDirection = resolveUiDirection(direction, viewport);
      const rawDelta =
        axis === 'vertical'
          ? event.deltaY
          : resolvedDirection === 'rtl'
            ? -event.deltaX
            : event.deltaX;
      if (rawDelta === 0) {
        return;
      }

      const delta = normalizeWheelDelta(
        rawDelta,
        event.deltaMode,
        16,
        readViewportExtent(viewport) * 0.9,
      );

      const position = readPosition(viewport);
      const max = readMax(viewport);
      const atBoundary = (delta < 0 && position <= 0) || (delta > 0 && position >= max);
      if (atBoundary && !canConsumeChainedDelta(delta)) {
        const nativeAncestor = findNativeScrollableAncestor(viewport, axis, delta);
        if (nativeAncestor) {
          const nativeResult = consumeNativeScrollChain(viewport, axis, delta);
          if (nativeResult.consumed !== 0) {
            event.preventDefault();
            event.stopPropagation();
            clearSnapTimer();
            stopMomentum();
            return;
          }
        }
      }

      event.preventDefault();
      event.stopPropagation();
      clearSnapTimer();
      stopMomentum();
      applyChainedDelta(delta);
      scheduleSnap();
    };

    viewport.addEventListener('wheel', onWheelEvent, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheelEvent);
  }, [
    applyChainedDelta,
    axis,
    canConsumeChainedDelta,
    clearSnapTimer,
    clock,
    direction,
    readMax,
    readPosition,
    readViewportExtent,
    scheduleSnap,
    stopMomentum,
  ]);

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    const onNativeScroll = () => {
      if (restorationKey)
        saveRestoredOffset(viewport, axis, restorationKey, readPosition(viewport));
      updateIndicator();
      showIndicator();
    };

    viewport.addEventListener('scroll', onNativeScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', onNativeScroll);
  }, [axis, readPosition, restorationKey, showIndicator, updateIndicator]);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      updateIndicator();
      return;
    }

    const reconcileGeometry = () => {
      const current = readPosition(viewport);
      const bounded = Math.min(readMax(viewport), Math.max(0, current));
      if (bounded !== current) writePosition(viewport, bounded);
      updateIndicator();
      scheduleSnap();
    };
    const stopViewport = observeElementSize(viewport, reconcileGeometry);
    const stopContent = observeElementSize(content, reconcileGeometry);
    return () => {
      stopViewport();
      stopContent();
    };
  }, [readMax, readPosition, scheduleSnap, updateIndicator, writePosition]);

  useEffect(
    () => () => {
      clearSnapTimer();
      stopMomentum();

      if (hideIndicatorTimerRef.current !== null) {
        clock.cancelTimeout(hideIndicatorTimerRef.current);
        hideIndicatorTimerRef.current = null;
      }
      if (suppressClickTimerRef.current !== null) {
        clock.cancelTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = null;
      }
    },
    [clearSnapTimer, clock, stopMomentum],
  );

  const cancelPointerSession = useCallback(() => {
    const session = pointerSessionRef.current;
    if (!session) {
      return;
    }

    pointerSessionRef.current = null;
    session.unregister();
    gestureArena.release(session.id, gestureOwner);

    releasePointerCaptureIfSupported(session.target, session.id);

    if (rootRef.current) {
      delete rootRef.current.dataset.dragging;
      delete rootRef.current.dataset.oxsCursorRole;
    }

    if (overscrollRef.current !== 0) {
      settleOverscroll();
    }
  }, [gestureArena, gestureOwner, settleOverscroll]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || (event.pointerType !== 'touch' && event.pointerType !== 'pen')) {
      return;
    }

    clearSnapTimer();
    stopMomentum();

    if (overscrollRef.current !== 0) {
      writeOverscroll(0);
    }

    const coordinate = coordinateForPointer(event);
    const session: PointerSession = {
      id: event.pointerId,
      target: event.currentTarget,
      originCoordinate: coordinate,
      previousCoordinate: coordinate,
      previousTime: event.timeStamp,
      velocity: 0,
      moved: false,
      claimed: false,
      unregister: () => {},
    };

    session.unregister = gestureArena.register(event.pointerId, {
      owner: gestureOwner,
      priority: 'content',
      onCancel: cancelPointerSession,
    });

    pointerSessionRef.current = session;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerMove?.(event);
    if (event.defaultPrevented) return;
    const session = pointerSessionRef.current;

    if (!session || session.id !== event.pointerId) {
      return;
    }

    const coordinate = coordinateForPointer(event);
    const totalDistance = Math.abs(coordinate - session.originCoordinate);

    if (!session.claimed && totalDistance >= 6) {
      if (!gestureArena.claim(event.pointerId, gestureOwner)) {
        return;
      }

      session.claimed = true;
      setPointerCaptureIfSupported(event.currentTarget, event.pointerId);

      if (rootRef.current) {
        rootRef.current.dataset.dragging = 'true';
        rootRef.current.dataset.oxsCursorRole = 'grabbing';
      }

      showIndicator();
    }

    if (!session.claimed || !gestureArena.owns(event.pointerId, gestureOwner)) {
      return;
    }

    const delta = coordinate - session.previousCoordinate;
    const elapsedMs = Math.max(1, event.timeStamp - session.previousTime);
    const resolvedDirection = resolveUiDirection(direction, viewportRef.current);
    const scrollDelta = axis === 'horizontal' && resolvedDirection === 'rtl' ? delta : -delta;

    event.preventDefault();
    applyChainedDelta(scrollDelta);

    session.velocity = session.velocity * 0.72 + (scrollDelta / elapsedMs) * 0.28;
    session.previousCoordinate = coordinate;
    session.previousTime = event.timeStamp;
    session.moved ||= Math.abs(delta) > 2;
  };

  const finishPointer = (event: ReactPointerEvent<HTMLElement>) => {
    onPointerUp?.(event);
    const session = pointerSessionRef.current;

    if (!session || session.id !== event.pointerId) {
      return;
    }

    const owned = session.claimed && gestureArena.owns(event.pointerId, gestureOwner);
    pointerSessionRef.current = null;
    session.unregister();

    if (rootRef.current) {
      delete rootRef.current.dataset.dragging;
      delete rootRef.current.dataset.oxsCursorRole;
    }

    releasePointerCaptureIfSupported(event.currentTarget, event.pointerId);

    gestureArena.release(event.pointerId, gestureOwner);

    if (!owned) {
      scheduleSnap();
      return;
    }

    if (session.moved) {
      suppressNextClickRef.current = true;
      if (suppressClickTimerRef.current !== null)
        clock.cancelTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = clock.scheduleTimeout(() => {
        suppressNextClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, 0);
    }

    if (overscrollRef.current !== 0) {
      settleOverscroll(-session.velocity * 120);
      scheduleSnap();
    } else if (session.moved) {
      startMomentum(session.velocity);
    } else {
      scheduleSnap();
    }
  };

  const handleClickCapture = (event: ReactMouseEvent<HTMLElement>) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      if (suppressClickTimerRef.current !== null) {
        clock.cancelTimeout(suppressClickTimerRef.current);
        suppressClickTimerRef.current = null;
      }
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClickCapture?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented || !keyboard) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const extent = readViewportExtent(viewport);
    const line = 48;
    let delta: number | null = null;
    let absolute: number | null = null;

    if (axis === 'vertical') {
      if (event.key === 'ArrowDown') delta = line;
      if (event.key === 'ArrowUp') delta = -line;
    } else {
      const resolvedDirection = resolveUiDirection(direction, viewport);
      if (event.key === 'ArrowRight') delta = resolvedDirection === 'rtl' ? -line : line;
      if (event.key === 'ArrowLeft') delta = resolvedDirection === 'rtl' ? line : -line;
    }

    if (event.key === 'PageDown') delta = extent * 0.88;
    if (event.key === 'PageUp') delta = -extent * 0.88;
    if (event.key === 'Home') absolute = 0;
    if (event.key === 'End') absolute = readMax(viewport);

    if (absolute !== null) {
      event.preventDefault();
      scrollToOffset(absolute);
      return;
    }

    if (delta !== null) {
      event.preventDefault();
      scrollToOffset(readPosition(viewport) + delta);
    }
  };

  const classes = ['ui-scroll-view', className].filter(Boolean).join(' ');
  const rootStyle = { '--oxs-scroll-axis': axis, ...style } as CSSProperties;

  return (
    <div
      ref={rootRef}
      className={classes}
      style={rootStyle}
      data-axis={axis}
      data-indicator={indicator}
      data-indicator-active={indicator === 'always' ? 'true' : 'false'}
      data-overscroll={overscroll}
      data-snap={snap}
      data-motion-preference={reducedMotion ? 'reduced' : 'full'}
    >
      <section
        {...props}
        ref={viewportRef}
        className="ui-scroll-view__viewport"
        data-oxs-scroll-viewport="true"
        aria-label={ariaLabel}
        tabIndex={keyboard ? 0 : undefined}
        onClickCapture={handleClickCapture}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={(event) => {
          onPointerCancel?.(event);
          cancelPointerSession();
        }}
        onLostPointerCapture={(event) => {
          onLostPointerCapture?.(event);
          cancelPointerSession();
        }}
      >
        <div ref={contentRef} className="ui-scroll-view__content">
          {children}
        </div>
      </section>
      <div ref={indicatorRef} className="ui-scroll-indicator" aria-hidden data-visible="false" />
    </div>
  );
});

export const ScrollView = ScrollViewImpl;

export type ScrollSnapItemProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    /** Logical alignment target inside the owning ScrollView viewport. @default start */
    align?: 'start' | 'center' | 'end';
  }
>;

export function ScrollSnapItem({
  align = 'start',
  children,
  className,
  ...props
}: ScrollSnapItemProps) {
  return (
    <div
      {...props}
      className={['ui-scroll-snap-item', className].filter(Boolean).join(' ')}
      data-oxs-scroll-snap-item="true"
      data-snap-align={align}
    >
      {children}
    </div>
  );
}

const MAX_RESTORED_SCROLL_OFFSETS = 128;
const restoredOffsets = new WeakMap<Document, Map<string, number>>();

function restorationStore(viewport: HTMLElement) {
  let store = restoredOffsets.get(viewport.ownerDocument);
  if (!store) {
    store = new Map<string, number>();
    restoredOffsets.set(viewport.ownerDocument, store);
  }
  return store;
}

function restorationIdentity(axis: ScrollAxis, key: string) {
  return `${axis}:${key}`;
}

function readRestoredOffset(viewport: HTMLElement, axis: ScrollAxis, key: string) {
  return restorationStore(viewport).get(restorationIdentity(axis, key)) ?? null;
}

function saveRestoredOffset(viewport: HTMLElement, axis: ScrollAxis, key: string, offset: number) {
  const store = restorationStore(viewport);
  const identity = restorationIdentity(axis, key);
  store.delete(identity);
  store.set(identity, Math.max(0, offset));
  while (store.size > MAX_RESTORED_SCROLL_OFFSETS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

function findParentScrollViewport(viewport: HTMLElement) {
  const parentRoot = viewport.parentElement?.parentElement?.closest<HTMLElement>('.ui-scroll-view');

  return parentRoot?.querySelector<HTMLElement>(':scope > .ui-scroll-view__viewport') ?? null;
}
