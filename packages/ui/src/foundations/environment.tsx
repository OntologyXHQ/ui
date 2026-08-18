import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { useMediaQuery } from './observation';
import { type UiTokenOverrides, uiTokenStyle } from './tokens';

export type UiDensity = 'auto' | 'compact' | 'comfortable';
export type UiTheme = 'system' | 'dark' | 'light' | 'custom';
export type UiColorScheme = 'auto' | 'dark' | 'light';
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

export type UiSafeAreaInsets = {
  blockStart?: string | number;
  inlineEnd?: string | number;
  blockEnd?: string | number;
  inlineStart?: string | number;
};

export type UiEnvironmentOptions = {
  theme?: UiTheme;
  colorScheme?: UiColorScheme;
  density?: UiDensity;
  direction?: UiDirection;
  modality?: UiModalityPreference;
  pointerPrecision?: UiPointerPrecisionPreference;
  safeArea?: UiSafeAreaInsets;
  tokens?: UiTokenOverrides;
};

export type UiEnvironmentSnapshot = {
  theme: UiTheme;
  colorScheme: UiColorScheme;
  density: UiDensity;
  direction: UiDirection;
  modality: UiInputModality;
  pointerPrecision: UiPointerPrecision;
  safeArea: UiSafeAreaInsets;
  tokens: UiTokenOverrides;
};

const UiEnvironmentContext = createContext<UiEnvironmentSnapshot | null>(null);

export function UiEnvironmentProvider({
  children,
  theme,
  colorScheme,
  density,
  direction,
  modality,
  pointerPrecision,
  safeArea,
  tokens,
}: PropsWithChildren<UiEnvironmentOptions>) {
  const parent = useContext(UiEnvironmentContext);
  const inheritedModality = modality === undefined ? parent?.modality : undefined;
  const inheritedPrecision = pointerPrecision === undefined ? parent?.pointerPrecision : undefined;
  const resolvedModality = useResolvedModality(modality ?? inheritedModality ?? 'auto');
  const resolvedPrecision = useResolvedPointerPrecision(
    pointerPrecision ?? inheritedPrecision ?? 'auto',
  );

  const snapshot = useMemo<UiEnvironmentSnapshot>(
    () => ({
      theme: theme ?? parent?.theme ?? 'system',
      colorScheme: colorScheme ?? parent?.colorScheme ?? 'auto',
      density: density ?? parent?.density ?? 'auto',
      direction: direction ?? parent?.direction ?? 'auto',
      modality: resolvedModality,
      pointerPrecision: resolvedPrecision,
      safeArea: { ...parent?.safeArea, ...safeArea },
      tokens: { ...parent?.tokens, ...tokens },
    }),
    [
      colorScheme,
      density,
      direction,
      parent,
      resolvedModality,
      resolvedPrecision,
      safeArea,
      theme,
      tokens,
    ],
  );

  return <UiEnvironmentContext.Provider value={snapshot}>{children}</UiEnvironmentContext.Provider>;
}

export function useUiEnvironment() {
  const environment = useContext(UiEnvironmentContext);
  if (!environment) throw new Error('useUiEnvironment must render inside UiRoot.');
  return environment;
}

type ModalityListener = () => void;
let detectedModality: UiInputModality = 'mouse';
const modalityListeners = new Set<ModalityListener>();
let modalityWindow: Window | null = null;
let stopModalityListeners: (() => void) | null = null;

function ensureModalityListeners() {
  if (typeof window === 'undefined' || modalityWindow === window) return;
  stopModalityListeners?.();
  modalityWindow = window;
  const publish = (next: UiInputModality) => {
    if (detectedModality === next) return;
    detectedModality = next;
    for (const listener of modalityListeners) listener();
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
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  stopModalityListeners = () => {
    window.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('pointermove', onPointerMove, true);
  };
}

function subscribeDetectedModality(listener: ModalityListener) {
  modalityListeners.add(listener);
  ensureModalityListeners();
  return () => {
    modalityListeners.delete(listener);
    if (!modalityListeners.size) {
      stopModalityListeners?.();
      stopModalityListeners = null;
      modalityWindow = null;
    }
  };
}

function useResolvedModality(preference: UiModalityPreference): UiInputModality {
  const detected = useSyncExternalStore(
    subscribeDetectedModality,
    () => detectedModality,
    () => 'mouse' as UiInputModality,
  );
  return preference === 'auto' ? detected : preference;
}

function useResolvedPointerPrecision(
  preference: UiPointerPrecisionPreference,
): UiPointerPrecision {
  const coarse = useMediaQuery('(pointer: coarse)');
  return preference === 'auto' ? (coarse ? 'coarse' : 'fine') : preference;
}

export function resolveUiDirection(
  direction: UiDirection,
  element?: Element | null,
): UiResolvedDirection {
  if (direction === 'ltr' || direction === 'rtl') return direction;

  if (typeof getComputedStyle === 'function' && element) {
    return getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr';
  }

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
  const safe = environment.safeArea;
  return {
    ...uiTokenStyle(environment.tokens),
    ...(safe.blockStart !== undefined
      ? { '--oxs-safe-block-start': cssLength(safe.blockStart) }
      : {}),
    ...(safe.inlineEnd !== undefined ? { '--oxs-safe-inline-end': cssLength(safe.inlineEnd) } : {}),
    ...(safe.blockEnd !== undefined ? { '--oxs-safe-block-end': cssLength(safe.blockEnd) } : {}),
    ...(safe.inlineStart !== undefined
      ? { '--oxs-safe-inline-start': cssLength(safe.inlineStart) }
      : {}),
  };
}

function cssLength(value: string | number) {
  return typeof value === 'number' ? `${value}px` : value;
}
