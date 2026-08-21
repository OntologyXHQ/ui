import { consumeScrollDelta, type ScrollAxis, type ScrollDeltaResult } from './physics';
import { readLogicalHorizontalScroll, writeLogicalHorizontalScroll } from './logicalPosition';

type NativeScrollTarget = {
  element: HTMLElement;
  position: number;
  max: number;
};

/**
 * Finds the nearest non-OXS native scroll container that can consume `delta` in the requested
 * direction. OXS ScrollView ownership is resolved by the ScrollView controller chain first; this
 * helper only bridges the exhausted remainder into ordinary host scroll containers.
 */
export function findNativeScrollableAncestor(
  viewport: HTMLElement,
  axis: ScrollAxis,
  delta: number,
): HTMLElement | null {
  return findNativeScrollTarget(viewport, axis, delta)?.element ?? null;
}

/**
 * Returns whether one concrete non-OXS element is a native scroll owner for this delta.
 * This is used while resolving mixed OXS/native ancestor chains so a farther OXS ScrollView
 * can never jump across a nearer native scroll container that can consume the same input.
 */
export function canNativeScrollElementConsume(
  element: HTMLElement,
  axis: ScrollAxis,
  delta: number,
): boolean {
  if (delta === 0 || element.matches('[data-oxs-scroll-viewport="true"]')) return false;
  const target = nativeScrollTarget(element, axis);
  if (!target) return false;
  return delta < 0 ? target.position > 0 : target.position < target.max;
}

/** Read a native ancestor through the same logical inline coordinate used by ScrollView. */
export function readNativeScrollPosition(element: HTMLElement, axis: ScrollAxis): number {
  if (axis === 'vertical') return element.scrollTop;
  return readLogicalHorizontalScroll(element, elementDirection(element));
}

/**
 * Deterministically consumes exhausted wheel overflow through ordinary native scroll containers.
 * ScrollView invokes this bridge only after its own nested controller chain is exhausted and only
 * when a concrete owner-realm ancestor can consume the delta. The originating wheel transaction is
 * then cancelled so the browser cannot apply the same delta a second time.
 */
export function consumeNativeScrollChain(
  viewport: HTMLElement,
  axis: ScrollAxis,
  delta: number,
): ScrollDeltaResult {
  let remaining = delta;
  let totalConsumed = 0;
  let finalPosition = 0;
  let cursor: HTMLElement | null = viewport.parentElement;

  while (cursor && remaining !== 0) {
    if (cursor.matches('[data-oxs-scroll-viewport="true"]')) {
      cursor = cursor.parentElement;
      continue;
    }

    const target = nativeScrollTarget(cursor, axis);
    if (target) {
      const result = consumeScrollDelta({ position: target.position, max: target.max }, remaining);
      if (result.consumed !== 0) {
        writeNativeScrollPosition(cursor, axis, result.position);
        totalConsumed += result.consumed;
        finalPosition = result.position;
        remaining = result.overflow;
      }
    }

    cursor = cursor.parentElement;
  }

  return {
    position: finalPosition,
    consumed: totalConsumed,
    overflow: remaining,
  };
}

function findNativeScrollTarget(
  viewport: HTMLElement,
  axis: ScrollAxis,
  delta: number,
): NativeScrollTarget | null {
  let element: HTMLElement | null = viewport.parentElement;
  while (element) {
    if (element.matches('[data-oxs-scroll-viewport="true"]')) {
      element = element.parentElement;
      continue;
    }

    const target = nativeScrollTarget(element, axis);
    if (
      target &&
      ((delta < 0 && target.position > 0) || (delta > 0 && target.position < target.max))
    ) {
      return target;
    }
    element = element.parentElement;
  }
  return null;
}

function nativeScrollTarget(element: HTMLElement, axis: ScrollAxis): NativeScrollTarget | null {
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow) return null;
  const style = ownerWindow.getComputedStyle(element);
  const overflow = axis === 'vertical' ? style.overflowY : style.overflowX;
  const max =
    axis === 'vertical'
      ? Math.max(0, element.scrollHeight - element.clientHeight)
      : Math.max(0, element.scrollWidth - element.clientWidth);
  if (!/(auto|scroll|overlay)/.test(overflow) || max <= 0) return null;
  return { element, position: readNativeScrollPosition(element, axis), max };
}

function writeNativeScrollPosition(element: HTMLElement, axis: ScrollAxis, position: number) {
  if (axis === 'vertical') {
    element.scrollTop = position;
    return;
  }
  writeLogicalHorizontalScroll(element, elementDirection(element), position);
}

function elementDirection(element: HTMLElement): 'ltr' | 'rtl' {
  return element.ownerDocument.defaultView?.getComputedStyle(element).direction === 'rtl'
    ? 'rtl'
    : 'ltr';
}
