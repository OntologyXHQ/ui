import type { RefObject } from 'react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { focusFirstInteractive, keepFocusInside } from './focus';
import { useOverlayCoordinator } from './overlayRuntime';

export type OverlayLifecycleOptions = {
  open: boolean;
  surfaceRef: RefObject<HTMLElement | null>;
  layerRef?: RefObject<HTMLElement | null>;
  anchorRef?: RefObject<HTMLElement | null>;
  onDismiss: () => void;
  modal?: boolean;
  autoFocus?: boolean;
  escape?: boolean;
  outsidePress?: boolean;
  restoreFocus?: boolean;
  lockScroll?: boolean;
};

export function useOverlayLifecycle({
  open,
  surfaceRef,
  layerRef,
  anchorRef,
  onDismiss,
  modal = false,
  autoFocus = false,
  escape = true,
  outsidePress = true,
  restoreFocus = true,
  lockScroll = modal,
}: OverlayLifecycleOptions) {
  const id = useId();
  const coordinator = useOverlayCoordinator();
  const dismissRef = useRef(onDismiss);
  const [depth, setDepth] = useState(0);
  dismissRef.current = onDismiss;

  useLayoutEffect(() => {
    if (!open) return;

    const layer = layerRef?.current ?? surfaceRef.current;
    const surface = surfaceRef.current;
    const ownerDocument =
      layer?.ownerDocument ?? surface?.ownerDocument ?? anchorRef?.current?.ownerDocument ?? null;
    const ownerWindow = ownerDocument?.defaultView ?? null;
    if (!ownerDocument || !layer) return;

    const activeElement = ownerDocument.activeElement;
    const HTMLElementCtor = ownerWindow?.HTMLElement;
    const restoreTarget =
      HTMLElementCtor && activeElement instanceof HTMLElementCtor
        ? (activeElement as HTMLElement)
        : null;

    // Focus enters the concrete modal realm before inert/aria-hidden isolation is applied.
    if (modal && surface && !surface.contains(ownerDocument.activeElement)) {
      if (autoFocus) focusFirstInteractive(surface);
      else surface.focus({ preventScroll: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (modal) keepFocusInside(event, surfaceRef.current);
      if (escape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dismissRef.current();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!outsidePress) return;
      const target = event.target;
      const NodeCtor = ownerWindow?.Node;
      if (!target || (NodeCtor && !(target instanceof NodeCtor))) return;
      const node = target as Node;
      if (surfaceRef.current?.contains(node) || anchorRef?.current?.contains(node)) return;
      dismissRef.current();
    };

    setDepth(
      coordinator.register({
        id,
        layer,
        modal,
        lockScroll,
        restoreFocus: restoreTarget,
        onKeyDown,
        onPointerDown,
      }),
    );

    const focusFrame =
      !modal && autoFocus && surface && ownerWindow?.requestAnimationFrame
        ? ownerWindow.requestAnimationFrame(() => {
            if (coordinator.isEventTopMost(id)) focusFirstInteractive(surfaceRef.current);
          })
        : null;

    return () => {
      if (focusFrame !== null) ownerWindow?.cancelAnimationFrame(focusFrame);
      const wasEventTopMost = coordinator.isEventTopMost(id);
      const previous = coordinator.unregister(id);

      if (restoreFocus && wasEventTopMost && previous?.isConnected) {
        scheduleMicrotask(ownerWindow, () => {
          if (previous.isConnected && !previous.closest('[inert]')) {
            previous.focus({ preventScroll: true });
          }
        });
      }
    };
  }, [
    anchorRef,
    autoFocus,
    coordinator,
    escape,
    id,
    layerRef,
    lockScroll,
    modal,
    open,
    outsidePress,
    restoreFocus,
    surfaceRef,
  ]);

  return {
    depth,
    layerProps: {
      'data-oxs-overlay-depth': depth,
      style: { '--oxs-overlay-depth': depth } as Record<string, string | number>,
    },
  };
}

function scheduleMicrotask(ownerWindow: Window | null, task: () => void) {
  if (ownerWindow?.queueMicrotask) {
    ownerWindow.queueMicrotask(task);
    return;
  }
  Promise.resolve().then(task);
}
