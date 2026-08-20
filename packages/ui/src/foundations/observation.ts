import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

export type UiObservedSize = {
  width: number;
  height: number;
  inlineSize: number;
  blockSize: number;
};

type SizeListener = (size: UiObservedSize) => void;
type RealmWindow = Window & typeof globalThis;

const listeners = new WeakMap<Element, Set<SizeListener>>();
const resizeObservers = new WeakMap<Window, ResizeObserver>();

function ownerWindow(element: Element): RealmWindow | null {
  return element.ownerDocument.defaultView;
}

function readSize(element: Element): UiObservedSize {
  const rect = element.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    inlineSize: rect.width,
    blockSize: rect.height,
  };
}

function observerFor(element: Element) {
  const realmWindow = ownerWindow(element);
  const ResizeObserverConstructor = (realmWindow as (Window & typeof globalThis) | null)
    ?.ResizeObserver;
  if (!realmWindow || typeof ResizeObserverConstructor !== 'function') return null;

  let observer = resizeObservers.get(realmWindow);
  if (!observer) {
    observer = new ResizeObserverConstructor((entries) => {
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
    resizeObservers.set(realmWindow, observer);
  }
  return observer;
}

export function observeElementSize(element: Element, listener: SizeListener) {
  let elementListeners = listeners.get(element);
  if (!elementListeners) {
    elementListeners = new Set();
    listeners.set(element, elementListeners);
    observerFor(element)?.observe(element);
  }
  elementListeners.add(listener);
  listener(readSize(element));

  return () => {
    const current = listeners.get(element);
    if (!current) return;
    current.delete(listener);
    if (!current.size) {
      observerFor(element)?.unobserve(element);
      listeners.delete(element);
    }
  };
}

export function observeElementGeometry(
  elements: readonly (Element | null | undefined)[],
  listener: () => void,
) {
  const live = elements.filter((element): element is Element => Boolean(element));
  const cleanups = live.map((element) => observeElementSize(element, listener));
  const windows = new Set<RealmWindow>();
  for (const element of live) {
    const realmWindow = ownerWindow(element);
    if (realmWindow) windows.add(realmWindow);
  }
  for (const realmWindow of windows) {
    realmWindow.addEventListener('resize', listener);
    realmWindow.addEventListener('scroll', listener, true);
  }
  listener();
  return () => {
    for (const cleanup of cleanups) cleanup();
    for (const realmWindow of windows) {
      realmWindow.removeEventListener('resize', listener);
      realmWindow.removeEventListener('scroll', listener, true);
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

// A UI package can render into multiple Window realms (Studio previews, iframes,
// tests). Media-query state therefore belongs to the concrete Window, never to
// one module-global query cache shared across documents.
const mediaQueryStores = new WeakMap<Window, Map<string, MediaQueryStore>>();

function mediaQueryStore(query: string, realmWindow: Window | null | undefined) {
  if (!realmWindow || typeof realmWindow.matchMedia !== 'function') return null;
  let stores = mediaQueryStores.get(realmWindow);
  if (!stores) {
    stores = new Map();
    mediaQueryStores.set(realmWindow, stores);
  }
  let store = stores.get(query);
  if (store) return store;
  const media = realmWindow.matchMedia(query);
  store = {
    media,
    listeners: new Set(),
    onChange: () => {
      const current = mediaQueryStores.get(realmWindow)?.get(query);
      if (!current) return;
      for (const listener of current.listeners) listener();
    },
  };
  media.addEventListener('change', store.onChange);
  stores.set(query, store);
  return store;
}

export function useMediaQuery(
  query: string,
  fallback = false,
  realmWindow: Window | null | undefined = typeof window === 'undefined' ? null : window,
) {
  return useSyncExternalStore(
    (listener) => {
      const store = mediaQueryStore(query, realmWindow);
      if (!store) return () => {};
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
        if (!store.listeners.size && realmWindow) {
          const stores = mediaQueryStores.get(realmWindow);
          if (stores?.get(query) === store) {
            store.media.removeEventListener('change', store.onChange);
            stores.delete(query);
          }
        }
      };
    },
    () => mediaQueryStore(query, realmWindow)?.media.matches ?? fallback,
    () => fallback,
  );
}
