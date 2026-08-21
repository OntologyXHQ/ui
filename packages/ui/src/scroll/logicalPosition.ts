export type RtlScrollType = 'negative' | 'positive-descending' | 'positive-ascending';

const rtlScrollTypes = new WeakMap<Document, RtlScrollType>();

/** Resolve the host browser's RTL scrollLeft model inside the element's own Document realm. */
export function rtlScrollType(ownerDocument: Document | null | undefined): RtlScrollType {
  if (!ownerDocument?.body) return 'negative';
  const cached = rtlScrollTypes.get(ownerDocument);
  if (cached) return cached;

  const outer = ownerDocument.createElement('div');
  const inner = ownerDocument.createElement('div');
  outer.dir = 'rtl';
  Object.assign(outer.style, {
    width: '4px',
    height: '1px',
    overflow: 'scroll',
    position: 'absolute',
    top: '-10000px',
    visibility: 'hidden',
  });
  Object.assign(inner.style, { width: '8px', height: '1px' });
  outer.append(inner);
  ownerDocument.body.append(outer);

  let type: RtlScrollType;
  if (outer.scrollLeft > 0) {
    type = 'positive-descending';
  } else {
    outer.scrollLeft = 1;
    type = outer.scrollLeft === 0 ? 'negative' : 'positive-ascending';
  }
  outer.remove();
  rtlScrollTypes.set(ownerDocument, type);
  return type;
}

export function logicalHorizontalFromPhysical(type: RtlScrollType, max: number, physical: number) {
  const boundedMax = Math.max(0, max);
  const logical =
    type === 'negative'
      ? -physical
      : type === 'positive-descending'
        ? boundedMax - physical
        : physical;
  return Math.min(boundedMax, Math.max(0, logical));
}

export function physicalHorizontalFromLogical(type: RtlScrollType, max: number, logical: number) {
  const boundedMax = Math.max(0, max);
  const value = Math.min(boundedMax, Math.max(0, logical));
  if (type === 'negative') return -value;
  if (type === 'positive-descending') return boundedMax - value;
  return value;
}

export function readLogicalHorizontalScroll(element: HTMLElement, direction: 'ltr' | 'rtl') {
  if (direction === 'ltr') return element.scrollLeft;
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  return logicalHorizontalFromPhysical(
    rtlScrollType(element.ownerDocument),
    max,
    element.scrollLeft,
  );
}

export function writeLogicalHorizontalScroll(
  element: HTMLElement,
  direction: 'ltr' | 'rtl',
  logicalPosition: number,
) {
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const value = Math.min(max, Math.max(0, logicalPosition));
  element.scrollLeft =
    direction === 'ltr'
      ? value
      : physicalHorizontalFromLogical(rtlScrollType(element.ownerDocument), max, value);
}

/** Resolve a snap child's logical start from live viewport-relative geometry. */
export function logicalSnapItemStart(
  itemRect: Pick<DOMRect, 'top' | 'left' | 'right'>,
  viewportRect: Pick<DOMRect, 'top' | 'left' | 'right'>,
  currentPosition: number,
  axis: 'vertical' | 'horizontal',
  direction: 'ltr' | 'rtl',
) {
  if (axis === 'vertical') return currentPosition + itemRect.top - viewportRect.top;
  if (direction === 'rtl') return currentPosition + viewportRect.right - itemRect.right;
  return currentPosition + itemRect.left - viewportRect.left;
}

export function alignedSnapOffset(
  itemStart: number,
  itemExtent: number,
  viewportExtent: number,
  align: 'start' | 'center' | 'end',
) {
  if (align === 'center') return itemStart - (viewportExtent - itemExtent) / 2;
  if (align === 'end') return itemStart - (viewportExtent - itemExtent);
  return itemStart;
}
