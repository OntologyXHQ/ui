import type { RefObject } from 'react';
import { useCallback, useLayoutEffect, useState } from 'react';
import { observeElementGeometry, resolveUiDirection, useUiEnvironment } from '../foundations';

export type FloatingPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'inline-start'
  | 'inline-end'
  | 'left'
  | 'right';

export type FloatingPosition = {
  x: number;
  y: number;
  placement: FloatingPlacement;
  ready: boolean;
};

export type FloatingGeometryRect = Pick<
  DOMRectReadOnly,
  'top' | 'right' | 'bottom' | 'left' | 'width' | 'height'
>;

export type FloatingAnchor =
  | { kind: 'element'; ref: RefObject<HTMLElement | null> }
  | { kind: 'rect'; rect: FloatingGeometryRect };

export type FloatingOptions = {
  open: boolean;
  anchor: FloatingAnchor;
  surfaceRef: RefObject<HTMLElement | null>;
  placement?: FloatingPlacement;
  gap?: number;
  viewportMargin?: number;
};

const fallback: FloatingPosition = { x: 0, y: 0, placement: 'bottom-start', ready: false };

export function useFloatingPosition({
  open,
  anchor,
  surfaceRef,
  placement = 'bottom-start',
  gap = 8,
  viewportMargin = 8,
}: FloatingOptions) {
  const { direction } = useUiEnvironment();
  const [position, setPosition] = useState<FloatingPosition>(fallback);
  const anchorKind = anchor.kind;
  const anchorElementRef = anchor.kind === 'element' ? anchor.ref : null;
  const rect = anchor.kind === 'rect' ? anchor.rect : null;
  const top = rect?.top ?? null;
  const right = rect?.right ?? null;
  const bottom = rect?.bottom ?? null;
  const left = rect?.left ?? null;
  const width = rect?.width ?? null;
  const height = rect?.height ?? null;

  const update = useCallback(() => {
    if (!open || typeof window === 'undefined') return;
    const surface = surfaceRef.current;
    const resolvedRect: FloatingGeometryRect | null =
      anchorKind === 'element'
        ? anchorElementRef?.current?.getBoundingClientRect() ?? null
        : top !== null && right !== null && bottom !== null && left !== null && width !== null && height !== null
          ? { top, right, bottom, left, width, height }
          : null;
    if (!surface || !resolvedRect) return;

    const surfaceRect = surface.getBoundingClientRect();
    const next = resolveFloatingPosition({
      anchorRect: resolvedRect,
      surfaceWidth: surfaceRect.width,
      surfaceHeight: surfaceRect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      placement,
      direction: resolveUiDirection(direction, surface),
      gap,
      viewportMargin,
    });
    setPosition((current) => (samePosition(current, next) ? current : next));
  }, [anchorElementRef, anchorKind, bottom, direction, gap, height, left, open, placement, right, surfaceRef, top, viewportMargin, width]);

  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') {
      setPosition((current) => (current.ready ? { ...current, ready: false } : current));
      return;
    }

    const surface = surfaceRef.current;
    const anchorElement = anchorElementRef?.current ?? null;
    return observeElementGeometry([surface, anchorElement], update);
  }, [anchorElementRef, open, surfaceRef, update]);

  return { position, update };
}

export function resolveFloatingPosition({
  anchorRect,
  surfaceWidth,
  surfaceHeight,
  viewportWidth,
  viewportHeight,
  placement,
  direction = 'ltr',
  gap,
  viewportMargin,
}: {
  anchorRect: FloatingGeometryRect;
  surfaceWidth: number;
  surfaceHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  placement: FloatingPlacement;
  direction?: 'ltr' | 'rtl';
  gap: number;
  viewportMargin: number;
}): FloatingPosition {
  let resolved = placement;
  let point = candidate(anchorRect, surfaceWidth, surfaceHeight, resolved, direction, gap);
  const overBottom = point.y + surfaceHeight > viewportHeight - viewportMargin;
  const overTop = point.y < viewportMargin;
  const overRight = point.x + surfaceWidth > viewportWidth - viewportMargin;
  const overLeft = point.x < viewportMargin;

  if (resolved.startsWith('bottom') && overBottom) resolved = resolved.replace('bottom', 'top') as FloatingPlacement;
  else if (resolved.startsWith('top') && overTop) resolved = resolved.replace('top', 'bottom') as FloatingPlacement;
  else if (resolved === 'inline-end' && (direction === 'ltr' ? overRight : overLeft)) resolved = 'inline-start';
  else if (resolved === 'inline-start' && (direction === 'ltr' ? overLeft : overRight)) resolved = 'inline-end';
  else if (resolved === 'right' && overRight) resolved = 'left';
  else if (resolved === 'left' && overLeft) resolved = 'right';

  point = candidate(anchorRect, surfaceWidth, surfaceHeight, resolved, direction, gap);
  return {
    x: clamp(point.x, viewportMargin, Math.max(viewportMargin, viewportWidth - surfaceWidth - viewportMargin)),
    y: clamp(point.y, viewportMargin, Math.max(viewportMargin, viewportHeight - surfaceHeight - viewportMargin)),
    placement: resolved,
    ready: true,
  };
}

function candidate(
  anchor: FloatingGeometryRect,
  width: number,
  height: number,
  placement: FloatingPlacement,
  direction: 'ltr' | 'rtl',
  gap: number,
) {
  const startX = direction === 'rtl' ? anchor.right - width : anchor.left;
  const endX = direction === 'rtl' ? anchor.left : anchor.right - width;
  const inlineStartX = direction === 'rtl' ? anchor.right + gap : anchor.left - width - gap;
  const inlineEndX = direction === 'rtl' ? anchor.left - width - gap : anchor.right + gap;

  if (placement === 'bottom-end') return { x: endX, y: anchor.bottom + gap };
  if (placement === 'top-start') return { x: startX, y: anchor.top - height - gap };
  if (placement === 'top-end') return { x: endX, y: anchor.top - height - gap };
  if (placement === 'inline-start') return { x: inlineStartX, y: anchor.top + (anchor.height - height) / 2 };
  if (placement === 'inline-end') return { x: inlineEndX, y: anchor.top + (anchor.height - height) / 2 };
  if (placement === 'left') return { x: anchor.left - width - gap, y: anchor.top + (anchor.height - height) / 2 };
  if (placement === 'right') return { x: anchor.right + gap, y: anchor.top + (anchor.height - height) / 2 };
  return { x: startX, y: anchor.bottom + gap };
}

function samePosition(left: FloatingPosition, right: FloatingPosition) {
  return left.x === right.x && left.y === right.y && left.placement === right.placement && left.ready === right.ready;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
