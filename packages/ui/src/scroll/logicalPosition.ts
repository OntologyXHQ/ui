export type RtlScrollType = 'negative' | 'positive-descending' | 'positive-ascending';

let cachedRtlScrollType: RtlScrollType | null = null;

export function rtlScrollType(): RtlScrollType {
  if (cachedRtlScrollType) return cachedRtlScrollType;
  if (typeof document === 'undefined' || !document.body) return 'negative';

  const outer = document.createElement('div');
  const inner = document.createElement('div');
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
  document.body.append(outer);

  if (outer.scrollLeft > 0) {
    cachedRtlScrollType = 'positive-descending';
  } else {
    outer.scrollLeft = 1;
    cachedRtlScrollType = outer.scrollLeft === 0 ? 'negative' : 'positive-ascending';
  }
  outer.remove();
  return cachedRtlScrollType;
}

export function logicalHorizontalFromPhysical(
  type: RtlScrollType,
  max: number,
  physical: number,
) {
  const boundedMax = Math.max(0, max);
  const logical = type === 'negative'
    ? -physical
    : type === 'positive-descending'
      ? boundedMax - physical
      : physical;
  return Math.min(boundedMax, Math.max(0, logical));
}

export function physicalHorizontalFromLogical(
  type: RtlScrollType,
  max: number,
  logical: number,
) {
  const boundedMax = Math.max(0, max);
  const value = Math.min(boundedMax, Math.max(0, logical));
  if (type === 'negative') return -value;
  if (type === 'positive-descending') return boundedMax - value;
  return value;
}

export function readLogicalHorizontalScroll(element: HTMLElement, direction: 'ltr' | 'rtl') {
  if (direction === 'ltr') return element.scrollLeft;
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  return logicalHorizontalFromPhysical(rtlScrollType(), max, element.scrollLeft);
}

export function writeLogicalHorizontalScroll(
  element: HTMLElement,
  direction: 'ltr' | 'rtl',
  logicalPosition: number,
) {
  const max = Math.max(0, element.scrollWidth - element.clientWidth);
  const value = Math.min(max, Math.max(0, logicalPosition));
  element.scrollLeft = direction === 'ltr'
    ? value
    : physicalHorizontalFromLogical(rtlScrollType(), max, value);
}

export function logicalInlineStart(item: HTMLElement, content: HTMLElement, direction: 'ltr' | 'rtl') {
  if (direction === 'ltr') return item.offsetLeft;
  return Math.max(0, content.scrollWidth - (item.offsetLeft + item.offsetWidth));
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
