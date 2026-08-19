import type { RefObject } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;

    const layer = layerRef?.current ?? surfaceRef.current;
    const restoreTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const surface = surfaceRef.current;

    // Modal isolation must never hide the currently focused background node from
    // assistive technology. Move focus into the committed overlay surface before
    // the coordinator applies inert + aria-hidden to sibling boundaries.
    if (modal && surface && !surface.contains(document.activeElement)) {
      if (autoFocus) focusFirstInteractive(surface);
      else surface.focus({ preventScroll: true });
    }

    setDepth(coordinator.register({ id, layer, modal, lockScroll, restoreFocus: restoreTarget }));

    const focusFrame =
      !modal && autoFocus && surface
        ? requestAnimationFrame(() => {
            if (coordinator.isEventTopMost(id)) focusFirstInteractive(surfaceRef.current);
          })
        : null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!coordinator.isEventTopMost(id)) return;
      if (modal) keepFocusInside(event, surfaceRef.current);
      if (escape && event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dismissRef.current();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!outsidePress || !coordinator.isEventTopMost(id) || !(event.target instanceof Node)) return;
      if (surfaceRef.current?.contains(event.target) || anchorRef?.current?.contains(event.target)) return;
      dismissRef.current();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
      if (focusFrame !== null) cancelAnimationFrame(focusFrame);
      const wasEventTopMost = coordinator.isEventTopMost(id);
      const previous = coordinator.unregister(id);

      if (restoreFocus && wasEventTopMost && previous?.isConnected) {
        queueMicrotask(() => {
          if (previous.isConnected && !previous.closest('[inert]')) {
            previous.focus({ preventScroll: true });
          }
        });
      }
    };
  }, [anchorRef, autoFocus, coordinator, escape, id, layerRef, lockScroll, modal, open, outsidePress, restoreFocus, surfaceRef]);

  return {
    depth,
    layerProps: {
      'data-oxs-overlay-depth': depth,
      style: { '--oxs-overlay-depth': depth } as Record<string, string | number>,
    },
  };
}
