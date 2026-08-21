export const SYSTEM_CURSOR_ROLES = [
  'default',
  'pointer',
  'text',
  'vertical-text',
  'crosshair',
  'grab',
  'grabbing',
  'move',
  'not-allowed',
  'progress',
  'wait',
  'n-resize',
  's-resize',
  'e-resize',
  'w-resize',
  'ne-resize',
  'nw-resize',
  'se-resize',
  'sw-resize',
  'col-resize',
  'row-resize',
  'drag-copy',
  'drag-move',
  'no-drop',
  'hidden',
] as const;

export type SystemCursorRole = (typeof SYSTEM_CURSOR_ROLES)[number];
export type CursorRole = SystemCursorRole | `custom:${string}`;
export type PointerModality = 'pointer' | 'touch' | 'pen' | 'keyboard';
export type CursorAnimationPreference = 'system' | 'enabled' | 'disabled';

/** Hotspot in nominal cursor pixels before runtime scale is applied by the native host. */
export type CursorHotspot = {
  x: number;
  y: number;
};

export type CursorRuntimeConfig = {
  /** Host-resolved cursor theme identifier. `system` leaves theme choice to the platform host. */
  theme: string;
  /** Nominal cursor asset size in CSS pixels before `scale`. */
  nominalSize: number;
  /** Host cursor scale multiplier. */
  scale: number;
  /** Nominal-pixel hotspot carried as host intent; the UI package never installs native cursors. */
  hotspot: CursorHotspot;
  animation: CursorAnimationPreference;
  /** Hide browser-preview/system pointer intent after direct touch/pen modality. */
  hideOnTouch: boolean;
  /** Mouse travel required after touch/pen before pointer visibility is restored in auto modality. */
  pointerRestoreDistance: number;
};

export const DEFAULT_CURSOR_RUNTIME_CONFIG: CursorRuntimeConfig = Object.freeze({
  theme: 'system',
  nominalSize: 24,
  scale: 1,
  hotspot: Object.freeze({ x: 0, y: 0 }),
  animation: 'system',
  hideOnTouch: true,
  pointerRestoreDistance: 2,
});

export function normalizeCursorRuntimeConfig(
  input: Partial<CursorRuntimeConfig> | undefined,
): CursorRuntimeConfig {
  const nominalSize = clampFinite(
    input?.nominalSize,
    1,
    256,
    DEFAULT_CURSOR_RUNTIME_CONFIG.nominalSize,
  );
  const scale = clampFinite(input?.scale, 0.25, 8, DEFAULT_CURSOR_RUNTIME_CONFIG.scale);
  const hotspotInput = input?.hotspot ?? DEFAULT_CURSOR_RUNTIME_CONFIG.hotspot;
  const theme = input?.theme?.trim() || DEFAULT_CURSOR_RUNTIME_CONFIG.theme;
  return {
    theme,
    nominalSize,
    scale,
    hotspot: {
      x: clampFinite(hotspotInput.x, 0, nominalSize, DEFAULT_CURSOR_RUNTIME_CONFIG.hotspot.x),
      y: clampFinite(hotspotInput.y, 0, nominalSize, DEFAULT_CURSOR_RUNTIME_CONFIG.hotspot.y),
    },
    animation: input?.animation ?? DEFAULT_CURSOR_RUNTIME_CONFIG.animation,
    hideOnTouch: input?.hideOnTouch ?? DEFAULT_CURSOR_RUNTIME_CONFIG.hideOnTouch,
    pointerRestoreDistance: clampFinite(
      input?.pointerRestoreDistance,
      0,
      128,
      DEFAULT_CURSOR_RUNTIME_CONFIG.pointerRestoreDistance,
    ),
  };
}

export function normalizeCursorRole(role: CursorRole): SystemCursorRole {
  return role.startsWith('custom:') ? 'default' : (role as SystemCursorRole);
}

function clampFinite(
  value: number | undefined,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}
