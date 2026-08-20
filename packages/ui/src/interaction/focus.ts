import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from 'react';
import { useCallback } from 'react';
import { resolveUiDirection, useUiEnvironment } from '../foundations';

export type RovingOrientation = 'horizontal' | 'vertical' | 'both';

export type RovingFocusOptions = {
  containerRef: RefObject<HTMLElement | null>;
  itemSelector: string;
  orientation?: RovingOrientation;
  loop?: boolean;
  disabled?: boolean;
};

const INTERACTIVE_SELECTOR = [
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  '[href]:not([aria-disabled="true"]):not([tabindex="-1"])',
  '[contenteditable="true"]:not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useRovingFocus({
  containerRef,
  itemSelector,
  orientation = 'vertical',
  loop = true,
  disabled = false,
}: RovingFocusOptions) {
  const { direction } = useUiEnvironment();

  return useCallback(
    (event: ReactKeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      const items = focusableItems(containerRef.current, itemSelector);
      if (!items.length) return;

      const active = containerRef.current?.ownerDocument.activeElement ?? null;
      const currentIndex = active ? items.indexOf(active as HTMLElement) : -1;
      const resolvedDirection = resolveUiDirection(direction, containerRef.current);
      const delta = navigationDelta(event.key, orientation, resolvedDirection);

      if (delta !== null) {
        event.preventDefault();
        const base = currentIndex < 0 ? (delta > 0 ? -1 : 0) : currentIndex;
        let next = base + delta;
        if (loop) next = (next + items.length) % items.length;
        else next = Math.min(items.length - 1, Math.max(0, next));
        items[next]?.focus({ preventScroll: true });
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        items[0]?.focus({ preventScroll: true });
      } else if (event.key === 'End') {
        event.preventDefault();
        items.at(-1)?.focus({ preventScroll: true });
      }
    },
    [containerRef, direction, disabled, itemSelector, loop, orientation],
  );
}

export function focusRelativeTo(reference: HTMLElement | null, backwards = false) {
  if (!reference) return false;
  const ownerDocument = reference.ownerDocument;
  const root = reference.closest<HTMLElement>('.ui-root') ?? ownerDocument.body;
  const items = focusableItems(root, INTERACTIVE_SELECTOR).filter(
    (element) => !element.closest('[data-oxs-portal-root]'),
  );
  const directIndex = items.indexOf(reference);
  let target: HTMLElement | undefined;
  if (directIndex >= 0) {
    target = items[directIndex + (backwards ? -1 : 1)];
  } else {
    const ordered = backwards ? [...items].reverse() : items;
    target = ordered.find((candidate) => {
      const relation = reference.compareDocumentPosition(candidate);
      const NodeCtor = reference.ownerDocument.defaultView?.Node;
      const preceding = NodeCtor?.DOCUMENT_POSITION_PRECEDING ?? 2;
      const following = NodeCtor?.DOCUMENT_POSITION_FOLLOWING ?? 4;
      return backwards ? Boolean(relation & preceding) : Boolean(relation & following);
    });
  }
  if (!target) return false;
  target.focus({ preventScroll: true });
  return true;
}

export function focusFirstInteractive(surface: HTMLElement | null) {
  if (!surface) return;
  const preferred = surface.querySelector<HTMLElement>(
    '[data-autofocus]:not([disabled]):not([inert])',
  );
  const fallback = surface.querySelector<HTMLElement>(INTERACTIVE_SELECTOR);
  (preferred ?? fallback ?? surface).focus({ preventScroll: true });
}

export function keepFocusInside(event: KeyboardEvent, surface: HTMLElement | null) {
  if (event.key !== 'Tab' || !surface) return;

  const items = focusableItems(surface, INTERACTIVE_SELECTOR);

  if (!items.length) {
    event.preventDefault();
    surface.focus({ preventScroll: true });
    return;
  }

  const first = items[0];
  const last = items.at(-1);
  const active = surface.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || !surface.contains(active))) {
    event.preventDefault();
    last?.focus({ preventScroll: true });
  } else if (!event.shiftKey && (active === last || !surface.contains(active))) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
}

function focusableItems(container: HTMLElement | null, selector: string) {
  if (!container) return [];
  return [...container.querySelectorAll<HTMLElement>(selector)].filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      !element.hasAttribute('inert') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      isRendered(element),
  );
}

function isRendered(element: HTMLElement) {
  if (element.hidden || element.closest('[hidden], [inert]')) return false;
  const ownerWindow = element.ownerDocument.defaultView;
  if (!ownerWindow || typeof ownerWindow.getComputedStyle !== 'function') return true;
  const style = ownerWindow.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function navigationDelta(
  key: string,
  orientation: RovingOrientation,
  direction: 'ltr' | 'rtl',
): -1 | 1 | null {
  if ((orientation === 'vertical' || orientation === 'both') && key === 'ArrowDown') return 1;
  if ((orientation === 'vertical' || orientation === 'both') && key === 'ArrowUp') return -1;
  if (orientation === 'horizontal' || orientation === 'both') {
    if (key === 'ArrowRight') return direction === 'rtl' ? -1 : 1;
    if (key === 'ArrowLeft') return direction === 'rtl' ? 1 : -1;
  }
  return null;
}
