import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useUiEnvironment } from '../foundations';
import type { CursorRuntimeConfig, PointerModality } from './types';
import { normalizeCursorRuntimeConfig } from './types';

export type CursorRuntimeSnapshot = {
  config: CursorRuntimeConfig;
  modality: PointerModality;
  pointerVisible: boolean;
  /** True while auto modality is waiting for meaningful mouse movement after touch/pen input. */
  pointerSuppressed: boolean;
};

type CursorRuntimeProviderProps = PropsWithChildren<{
  config?: Partial<CursorRuntimeConfig>;
  /** Internal owner realm supplied by UiRoot; omit only for isolated advanced fixtures. */
  realmWindow?: Window | null;
}>;

const CursorRuntimeContext = createContext<CursorRuntimeSnapshot | null>(null);

export function CursorRuntimeProvider({
  children,
  config,
  realmWindow,
}: CursorRuntimeProviderProps) {
  const environment = useUiEnvironment();
  const resolvedConfig = useMemo(() => normalizeCursorRuntimeConfig(config), [config]);
  const activeWindow = realmWindow ?? null;
  const suppressedRef = useRef(false);
  const restoreOriginRef = useRef<{ x: number; y: number } | null>(null);
  const listenerRealmRef = useRef<Window | null>(activeWindow);
  const [pointerSuppressed, setPointerSuppressedState] = useState(false);

  const setPointerSuppressed = (next: boolean) => {
    suppressedRef.current = next;
    setPointerSuppressedState((current) => (current === next ? current : next));
  };

  useEffect(() => {
    if (listenerRealmRef.current !== activeWindow) {
      listenerRealmRef.current = activeWindow;
      restoreOriginRef.current = null;
      if (suppressedRef.current) setPointerSuppressed(false);
    }
    if (!activeWindow || !resolvedConfig.hideOnTouch) {
      restoreOriginRef.current = null;
      if (suppressedRef.current) setPointerSuppressed(false);
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || event.pointerType === 'pen') {
        restoreOriginRef.current = { x: event.clientX, y: event.clientY };
        setPointerSuppressed(true);
        return;
      }
      if (event.pointerType === 'mouse') {
        restoreOriginRef.current = null;
        setPointerSuppressed(false);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !suppressedRef.current) return;
      const origin = restoreOriginRef.current;
      if (!origin) {
        restoreOriginRef.current = { x: event.clientX, y: event.clientY };
        return;
      }
      if (
        Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >=
        resolvedConfig.pointerRestoreDistance
      ) {
        restoreOriginRef.current = null;
        setPointerSuppressed(false);
      }
    };

    activeWindow.addEventListener('pointerdown', onPointerDown, true);
    activeWindow.addEventListener('pointermove', onPointerMove, true);
    return () => {
      activeWindow.removeEventListener('pointerdown', onPointerDown, true);
      activeWindow.removeEventListener('pointermove', onPointerMove, true);
    };
  }, [activeWindow, resolvedConfig.hideOnTouch, resolvedConfig.pointerRestoreDistance]);

  const modality: PointerModality =
    environment.modality === 'mouse' ? 'pointer' : environment.modality;
  const automaticSuppression =
    environment.modalityPreference === 'auto' &&
    resolvedConfig.hideOnTouch &&
    pointerSuppressed &&
    modality === 'pointer';
  const pointerVisible =
    modality !== 'keyboard' &&
    !(resolvedConfig.hideOnTouch && (modality === 'touch' || modality === 'pen')) &&
    !automaticSuppression;

  const snapshot = useMemo(
    () => ({ config: resolvedConfig, modality, pointerVisible, pointerSuppressed }),
    [modality, pointerSuppressed, pointerVisible, resolvedConfig],
  );

  return <CursorRuntimeContext.Provider value={snapshot}>{children}</CursorRuntimeContext.Provider>;
}

export function useCursorRuntime() {
  const runtime = useContext(CursorRuntimeContext);
  if (!runtime) {
    throw new Error('useCursorRuntime must be used within CursorRuntimeProvider');
  }
  return runtime;
}
