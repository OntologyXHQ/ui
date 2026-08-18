import type { PropsWithChildren } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useUiEnvironment } from '../foundations';
import type { CursorRuntimeConfig, PointerModality } from './types';
import { DEFAULT_CURSOR_RUNTIME_CONFIG } from './types';

export type CursorRuntimeSnapshot = {
  config: CursorRuntimeConfig;
  modality: PointerModality;
  pointerVisible: boolean;
};

type CursorRuntimeProviderProps = PropsWithChildren<{
  config?: Partial<CursorRuntimeConfig>;
}>;

const CursorRuntimeContext = createContext<CursorRuntimeSnapshot | null>(null);

export function CursorRuntimeProvider({ children, config }: CursorRuntimeProviderProps) {
  const environment = useUiEnvironment();
  const resolvedConfig = useMemo(() => ({ ...DEFAULT_CURSOR_RUNTIME_CONFIG, ...config }), [config]);
  const modality: PointerModality =
    environment.modality === 'touch' || environment.modality === 'pen'
      ? environment.modality
      : 'pointer';
  const pointerVisible = !(resolvedConfig.hideOnTouch && modality !== 'pointer');

  const snapshot = useMemo(
    () => ({ config: resolvedConfig, modality, pointerVisible }),
    [modality, pointerVisible, resolvedConfig],
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
