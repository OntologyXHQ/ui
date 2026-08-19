import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';
import { GestureArena } from './arena';

const fallbackGestureArena = new GestureArena();
const GestureArenaContext = createContext<GestureArena>(fallbackGestureArena);

/**
 * Root-scoped gesture arbitration. UiRoot owns one arena so nested roots cannot
 * steal/cancel pointer ownership from one another. The fallback arena preserves
 * isolated hook/component fixtures rendered without UiRoot.
 */
export function GestureRuntimeProvider({ children }: PropsWithChildren) {
  const arenaRef = useRef<GestureArena | null>(null);
  const arena = arenaRef.current ?? (arenaRef.current = new GestureArena());

  useEffect(() => () => arena.dispose(), [arena]);

  return <GestureArenaContext.Provider value={arena}>{children}</GestureArenaContext.Provider>;
}

export function useGestureArena() {
  return useContext(GestureArenaContext);
}
