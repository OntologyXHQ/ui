import type { PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

const UiPortalHostContext = createContext<HTMLElement | null>(null);

export function UiPortalHostProvider({
  children,
  host,
}: PropsWithChildren<{ host: HTMLElement | null }>) {
  return <UiPortalHostContext.Provider value={host}>{children}</UiPortalHostContext.Provider>;
}

export function useUiPortalHost() {
  return useContext(UiPortalHostContext);
}


export type UiPortalPoint = { x: number; y: number };

/** Converts viewport/client coordinates into the coordinate plane owned by a UiRoot portal.
 * Scale/translation are supported; rotation/skew are intentionally outside the V1 portal contract.
 */
export function viewportPointToPortalHost(
  host: HTMLElement,
  point: UiPortalPoint,
): UiPortalPoint {
  const rect = host.getBoundingClientRect();
  const layoutWidth = host.offsetWidth || rect.width || 1;
  const layoutHeight = host.offsetHeight || rect.height || 1;
  const scaleX = rect.width > 0 ? rect.width / layoutWidth : 1;
  const scaleY = rect.height > 0 ? rect.height / layoutHeight : 1;
  return {
    x: (point.x - rect.left) / (scaleX || 1),
    y: (point.y - rect.top) / (scaleY || 1),
  };
}

export function viewportLengthToPortalHost(
  host: HTMLElement,
  length: number,
  axis: 'inline' | 'block',
) {
  const rect = host.getBoundingClientRect();
  const layout = axis === 'inline' ? (host.offsetWidth || rect.width || 1) : (host.offsetHeight || rect.height || 1);
  const visual = axis === 'inline' ? rect.width : rect.height;
  const scale = visual > 0 ? visual / layout : 1;
  return length / (scale || 1);
}
