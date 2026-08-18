import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

export type UiObservedSize = {
  width: number;
  height: number;
  inlineSize: number;
  blockSize: number;
};

type SizeListener = (size: UiObservedSize) => void;

const listeners = new WeakMap<Element, Set<SizeListener>>();
let sharedResizeObserver: ResizeObserver | null = null;

function readSize(element: Element): UiObservedSize {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    inlineSize: rect.width,
    blockSize: rect.height,
  };
}

function observer() {
  if (typeof ResizeObserver === 'undefined') return null;
  if (!sharedResizeObserver) {
    sharedResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const elementListeners = listeners.get(entry.target);
        if (!elementListeners?.size) continue;
        const box = entry.borderBoxSize?.[0];
        const size: UiObservedSize = box
          ? {
              width: entry.contentRect.width,
              height: entry.contentRect.height,
              inlineSize: box.inlineSize,
              blockSize: box.blockSize,
            }
          : readSize(entry.target);
        for (const listener of elementListeners) listener(size);
      }
    });
  }
  return sharedResizeObserver;
}

export function observeElementSize(element: Element, listener: SizeListener) {
  let elementListeners = listeners.get(element);
  if (!elementListeners) {
    elementListeners = new Set();
    listeners.set(element, elementListeners);
    observer()?.observe(element);
  }
  elementListeners.add(listener);
  listener(readSize(element));

  return () => {
    const current = listeners.get(element);
    if (!current) return;
    current.delete(listener);
    if (!current.size) {
      observer()?.unobserve(element);
      listeners.delete(element);
    }
  };
}

export function observeElementGeometry(elements: readonly (Element | null | undefined)[], listener: () => void) {
  const live = elements.filter((element): element is Element => Boolean(element));
  const cleanups = live.map((element) => observeElementSize(element, listener));
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', listener);
    window.addEventListener('scroll', listener, true);
  }
  listener();
  return () => {
    for (const cleanup of cleanups) cleanup();
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', listener);
      window.removeEventListener('scroll', listener, true);
    }
  };
}

export function useObservedElementSize<T extends Element>(ref: RefObject<T | null>) {
  const [size, setSize] = useState<UiObservedSize | null>(null);
  const observedRef = useRef<Element | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Refs are assigned during commit, so reading ref.current during render can miss the
  // initial element. A layout effect runs after ref assignment and also detects a
  // different element being attached to the same RefObject on later commits.
  useLayoutEffect(() => {
    const element = ref.current;
    if (observedRef.current === element) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    observedRef.current = element;

    if (!element) {
      setSize(null);
      return;
    }

    cleanupRef.current = observeElementSize(element, (next) => {
      setSize((current) =>
        current &&
        current.width === next.width &&
        current.height === next.height &&
        current.inlineSize === next.inlineSize &&
        current.blockSize === next.blockSize
          ? current
          : next,
      );
    });
  });

  useEffect(
    () => () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      observedRef.current = null;
    },
    [],
  );

  return size;
}

type MediaQueryStore = {
  media: MediaQueryList;
  listeners: Set<() => void>;
  onChange: () => void;
};

const mediaQueryStores = new Map<string, MediaQueryStore>();

function mediaQueryStore(query: string) {
  if (typeof matchMedia === 'undefined') return null;
  let store = mediaQueryStores.get(query);
  if (store) return store;
  const media = matchMedia(query);
  store = {
    media,
    listeners: new Set(),
    onChange: () => {
      const current = mediaQueryStores.get(query);
      if (!current) return;
      for (const listener of current.listeners) listener();
    },
  };
  media.addEventListener('change', store.onChange);
  mediaQueryStores.set(query, store);
  return store;
}

export function useMediaQuery(query: string, fallback = false) {
  return useSyncExternalStore(
    (listener) => {
      const store = mediaQueryStore(query);
      if (!store) return () => {};
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
        if (!store.listeners.size && mediaQueryStores.get(query) === store) {
          store.media.removeEventListener('change', store.onChange);
          mediaQueryStores.delete(query);
        }
      };
    },
    () => mediaQueryStore(query)?.media.matches ?? fallback,
    () => fallback,
  );
}
