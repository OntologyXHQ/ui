import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { useMediaQuery } from './observation';
import { type UiTokenOverrides, uiTokenStyle } from './tokens';

export type UiDensity = 'auto' | 'compact' | 'comfortable';
export type UiResolvedDensity = Exclude<UiDensity, 'auto'>;
export type UiTheme = 'system' | 'dark' | 'light' | 'custom';
export type UiColorScheme = 'auto' | 'dark' | 'light';
export type UiResolvedColorScheme = Exclude<UiColorScheme, 'auto'>;
export type UiDirection = 'auto' | 'ltr' | 'rtl';
export type UiResolvedDirection = Exclude<UiDirection, 'auto'>;
export type UiInputModality = 'keyboard' | 'mouse' | 'touch' | 'pen';
export type UiModalityPreference = 'auto' | UiInputModality;
export type UiPointerPrecision = 'fine' | 'coarse';
export type UiPointerPrecisionPreference = 'auto' | UiPointerPrecision;
export type UiAdaptiveBand = 'compact' | 'medium' | 'expanded' | 'wide';
export type UiControlState =
  | 'enabled'
  | 'disabled'
  | 'read-only'
  | 'selected'
  | 'checked'
  | 'busy'
  | 'invalid';

/** CSS length supplied by the host. Units are explicit; numbers are not guessed as pixels. */
export type UiEnvironmentLength = string;

export type UiLogicalInsets = {
  blockStart?: UiEnvironmentLength;
  inlineEnd?: UiEnvironmentLength;
  blockEnd?: UiEnvironmentLength;
  inlineStart?: UiEnvironmentLength;
};

/** Persistent display cutout / system-chrome insets expressed in logical coordinates. */
export type UiSafeAreaInsets = UiLogicalInsets;
/** Transient host occlusion (for example a virtual keyboard) expressed in logical coordinates. */
export type UiOcclusionInsets = UiLogicalInsets;

export type UiEnvironmentOptions = {
  /** Theme palette preference for this root. Omit to inherit the enclosing UiRoot, otherwise default to system. */
  theme?: UiTheme;
  /** Native form-control color-scheme preference. Custom themes may override it explicitly; other themes resolve from their palette/system preference. */
  colorScheme?: UiColorScheme;
  /** Visual density preference. Auto resolves from pointer precision without device-name sniffing. */
  density?: UiDensity;
  /** Logical text/layout direction. Auto inherits the enclosing UiRoot or owning document direction. */
  direction?: UiDirection;
  /** Input-modality preference. Auto tracks keyboard, mouse, touch, and pen activity in the owning Window realm. */
  modality?: UiModalityPreference;
  /** Pointer precision preference. Auto resolves from the owning Window's coarse-pointer media query. */
  pointerPrecision?: UiPointerPrecisionPreference;
  /** Persistent host safe-area insets in logical coordinates with explicit CSS units. */
  safeArea?: UiSafeAreaInsets;
  /** Transient host occlusion, such as a virtual keyboard, in logical coordinates with explicit CSS units. */
  occlusion?: UiOcclusionInsets;
  /** Finite semantic token overrides scoped to this root and inherited by nested roots. */
  tokens?: UiTokenOverrides;
};

/** Resolved runtime environment consumed by engines/components. Preferences remain available for diagnostics. */
export type UiEnvironmentSnapshot = {
  theme: UiTheme;
  colorScheme: UiResolvedColorScheme;
  colorSchemePreference: UiColorScheme;
  density: UiResolvedDensity;
  densityPreference: UiDensity;
  direction: UiResolvedDirection;
  directionPreference: UiDirection;
  modality: UiInputModality;
  modalityPreference: UiModalityPreference;
  pointerPrecision: UiPointerPrecision;
  pointerPrecisionPreference: UiPointerPrecisionPreference;
  safeArea: UiSafeAreaInsets;
  occlusion: UiOcclusionInsets;
  tokens: UiTokenOverrides;
};

export const UI_ADAPTIVE_BREAKPOINTS = Object.freeze({
  compactMax: 480,
  mediumMax: 896,
  expandedMax: 1280,
});

const UiEnvironmentContext = createContext<UiEnvironmentSnapshot | null>(null);

type UiEnvironmentProviderProps = PropsWithChildren<
  UiEnvironmentOptions & {
    /** Internal owner realm resolved by UiRoot after its host element commits. */
    realmWindow?: Window | null;
    /** Internal owner document resolved by UiRoot after its host element commits. */
    realmDocument?: Document | null;
  }
>;

export function UiEnvironmentProvider({
  children,
  theme,
  colorScheme,
  density,
  direction,
  modality,
  pointerPrecision,
  safeArea,
  occlusion,
  tokens,
  realmWindow,
  realmDocument,
}: UiEnvironmentProviderProps) {
  const parent = useContext(UiEnvironmentContext);
  const activeWindow = realmWindow === undefined
    ? (typeof window === 'undefined' ? null : window)
    : realmWindow;
  const activeDocument = realmDocument === undefined
    ? (typeof document === 'undefined' ? null : document)
    : realmDocument;
  const systemLight = useMediaQuery('(prefers-color-scheme: light)', false, activeWindow);
  const coarsePointer = useMediaQuery('(pointer: coarse)', false, activeWindow);
  const documentDirection = useDocumentDirection(activeDocument);

  const themeValue = theme ?? parent?.theme ?? 'system';
  const colorSchemePreference = colorScheme ?? parent?.colorSchemePreference ?? 'auto';
  const resolvedColorScheme = resolveUiColorScheme(
    themeValue,
    colorSchemePreference,
    systemLight ? 'light' : 'dark',
    parent?.colorScheme,
  );

  const pointerPrecisionPreference =
    pointerPrecision ?? parent?.pointerPrecisionPreference ?? 'auto';
  const resolvedPointerPrecision = resolveUiPointerPrecision(
    pointerPrecisionPreference,
    coarsePointer,
  );

  const densityPreference = density ?? parent?.densityPreference ?? 'auto';
  const resolvedDensity = resolveUiDensity(densityPreference, resolvedPointerPrecision);

  const directionPreference = direction ?? parent?.directionPreference ?? 'auto';
  const resolvedDirection = resolveUiDirection(
    directionPreference,
    undefined,
    parent?.direction ?? documentDirection,
  );

  const modalityPreference = modality ?? parent?.modalityPreference ?? 'auto';
  const resolvedModality = useResolvedModality(modalityPreference, activeWindow);

  const snapshot = useMemo<UiEnvironmentSnapshot>(
    () => ({
      theme: themeValue,
      colorScheme: resolvedColorScheme,
      colorSchemePreference,
      density: resolvedDensity,
      densityPreference,
      direction: resolvedDirection,
      directionPreference,
      modality: resolvedModality,
      modalityPreference,
      pointerPrecision: resolvedPointerPrecision,
      pointerPrecisionPreference,
      safeArea: { ...parent?.safeArea, ...safeArea },
      occlusion: { ...parent?.occlusion, ...occlusion },
      tokens: { ...parent?.tokens, ...tokens },
    }),
    [
      colorSchemePreference,
      densityPreference,
      directionPreference,
      occlusion,
      parent,
      pointerPrecisionPreference,
      resolvedColorScheme,
      resolvedDensity,
      resolvedDirection,
      resolvedModality,
      resolvedPointerPrecision,
      safeArea,
      themeValue,
      tokens,
      modalityPreference,
    ],
  );

  return <UiEnvironmentContext.Provider value={snapshot}>{children}</UiEnvironmentContext.Provider>;
}

export function useUiEnvironment() {
  const environment = useContext(UiEnvironmentContext);
  if (!environment) throw new Error('useUiEnvironment must render inside UiRoot.');
  return environment;
}

export function resolveUiColorScheme(
  theme: UiTheme,
  preference: UiColorScheme,
  system: UiResolvedColorScheme,
  inherited?: UiResolvedColorScheme,
): UiResolvedColorScheme {
  if (theme === 'dark' || theme === 'light') return theme;
  if (theme === 'system') return system;
  if (preference === 'dark' || preference === 'light') return preference;
  return inherited ?? system;
}

export function resolveUiPointerPrecision(
  preference: UiPointerPrecisionPreference,
  coarsePointer: boolean,
): UiPointerPrecision {
  return preference === 'auto' ? (coarsePointer ? 'coarse' : 'fine') : preference;
}

export function resolveUiDensity(
  preference: UiDensity,
  pointerPrecision: UiPointerPrecision,
): UiResolvedDensity {
  if (preference === 'compact' || preference === 'comfortable') return preference;
  return pointerPrecision === 'coarse' ? 'comfortable' : 'compact';
}

export function resolveUiAdaptiveBand(inlineSize: number): UiAdaptiveBand {
  if (!Number.isFinite(inlineSize) || inlineSize < 0) return 'compact';
  if (inlineSize <= UI_ADAPTIVE_BREAKPOINTS.compactMax) return 'compact';
  if (inlineSize <= UI_ADAPTIVE_BREAKPOINTS.mediumMax) return 'medium';
  if (inlineSize <= UI_ADAPTIVE_BREAKPOINTS.expandedMax) return 'expanded';
  return 'wide';
}

type ModalityStore = {
  value: UiInputModality;
  listeners: Set<() => void>;
  cleanup: (() => void) | null;
};

const modalityStores = new WeakMap<Window, ModalityStore>();

function currentModalityStore(realmWindow: Window | null | undefined) {
  if (!realmWindow) return null;
  let store = modalityStores.get(realmWindow);
  if (!store) {
    store = { value: 'mouse', listeners: new Set(), cleanup: null };
    modalityStores.set(realmWindow, store);
  }
  return store;
}

function startModalityStore(realmWindow: Window, store: ModalityStore) {
  if (store.cleanup) return;
  const publish = (next: UiInputModality) => {
    if (store.value === next) return;
    store.value = next;
    for (const listener of store.listeners) listener();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    publish('keyboard');
  };
  const onPointerDown = (event: PointerEvent) => {
    publish(event.pointerType === 'touch' ? 'touch' : event.pointerType === 'pen' ? 'pen' : 'mouse');
  };
  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'mouse') publish('mouse');
  };
  realmWindow.addEventListener('keydown', onKeyDown, true);
  realmWindow.addEventListener('pointerdown', onPointerDown, true);
  realmWindow.addEventListener('pointermove', onPointerMove, true);
  store.cleanup = () => {
    realmWindow.removeEventListener('keydown', onKeyDown, true);
    realmWindow.removeEventListener('pointerdown', onPointerDown, true);
    realmWindow.removeEventListener('pointermove', onPointerMove, true);
    store.cleanup = null;
  };
}

function subscribeDetectedModality(realmWindow: Window | null | undefined, listener: () => void) {
  const store = currentModalityStore(realmWindow);
  if (!store || !realmWindow) return () => {};
  store.listeners.add(listener);
  startModalityStore(realmWindow, store);
  return () => {
    store.listeners.delete(listener);
    if (!store.listeners.size) store.cleanup?.();
  };
}

function readDetectedModality(realmWindow: Window | null | undefined) {
  return currentModalityStore(realmWindow)?.value ?? ('mouse' as UiInputModality);
}

function useResolvedModality(
  preference: UiModalityPreference,
  realmWindow: Window | null | undefined,
): UiInputModality {
  const detected = useSyncExternalStore(
    (listener) => subscribeDetectedModality(realmWindow, listener),
    () => readDetectedModality(realmWindow),
    () => 'mouse' as UiInputModality,
  );
  return preference === 'auto' ? detected : preference;
}

type DirectionStore = {
  value: UiResolvedDirection;
  listeners: Set<() => void>;
  observer: MutationObserver | null;
};

const directionStores = new WeakMap<Document, DirectionStore>();

function readDocumentDirection(target: Document): UiResolvedDirection {
  return target.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
}

function currentDirectionStore(realmDocument: Document | null | undefined) {
  if (!realmDocument) return null;
  let store = directionStores.get(realmDocument);
  if (!store) {
    store = { value: readDocumentDirection(realmDocument), listeners: new Set(), observer: null };
    directionStores.set(realmDocument, store);
  } else if (!store.observer) {
    store.value = readDocumentDirection(realmDocument);
  }
  return store;
}

function subscribeDocumentDirection(realmDocument: Document | null | undefined, listener: () => void) {
  const store = currentDirectionStore(realmDocument);
  if (!store || !realmDocument) return () => {};
  store.listeners.add(listener);
  const MutationObserverConstructor = (realmDocument.defaultView as (Window & typeof globalThis) | null)?.MutationObserver;
  if (!store.observer && typeof MutationObserverConstructor === 'function') {
    store.observer = new MutationObserverConstructor(() => {
      const next = readDocumentDirection(realmDocument);
      if (store.value === next) return;
      store.value = next;
      for (const current of store.listeners) current();
    });
    store.observer.observe(realmDocument.documentElement, { attributes: true, attributeFilter: ['dir'] });
  }
  return () => {
    store.listeners.delete(listener);
    if (!store.listeners.size) {
      store.observer?.disconnect();
      store.observer = null;
    }
  };
}

function useDocumentDirection(realmDocument: Document | null | undefined): UiResolvedDirection {
  return useSyncExternalStore(
    (listener) => subscribeDocumentDirection(realmDocument, listener),
    () => currentDirectionStore(realmDocument)?.value ?? 'ltr',
    () => 'ltr',
  );
}

export function resolveUiDirection(
  direction: UiDirection,
  element?: Element | null,
  fallback?: UiResolvedDirection,
): UiResolvedDirection {
  if (direction === 'ltr' || direction === 'rtl') return direction;

  if (typeof getComputedStyle === 'function' && element) {
    return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
  }

  if (fallback) return fallback;

  if (typeof document !== 'undefined') {
    const documentDirection = document.documentElement.dir;
    if (documentDirection === 'ltr' || documentDirection === 'rtl') return documentDirection;
    if (typeof getComputedStyle === 'function') {
      return getComputedStyle(document.documentElement).direction === 'rtl' ? 'rtl' : 'ltr';
    }
  }

  return 'ltr';
}

export function uiEnvironmentStyle(environment: UiEnvironmentSnapshot): Record<string, string | number> {
  return {
    ...uiTokenStyle(environment.tokens),
    ...logicalInsetStyle('--oxs-safe', environment.safeArea),
    ...logicalInsetStyle('--oxs-occlusion', environment.occlusion),
  };
}

function logicalInsetStyle(prefix: string, insets: UiLogicalInsets) {
  return {
    ...(insets.blockStart !== undefined ? { [`${prefix}-block-start`]: insets.blockStart } : {}),
    ...(insets.inlineEnd !== undefined ? { [`${prefix}-inline-end`]: insets.inlineEnd } : {}),
    ...(insets.blockEnd !== undefined ? { [`${prefix}-block-end`]: insets.blockEnd } : {}),
    ...(insets.inlineStart !== undefined ? { [`${prefix}-inline-start`]: insets.inlineStart } : {}),
  };
}
