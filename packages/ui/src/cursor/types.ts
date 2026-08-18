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
export type PointerModality = 'pointer' | 'touch' | 'pen';
export type CursorAnimationPreference = 'system' | 'enabled' | 'disabled';

export type CursorRuntimeConfig = {
  theme: string;
  nominalSize: number;
  scale: number;
  animation: CursorAnimationPreference;
  hideOnTouch: boolean;
  pointerRestoreDistance: number;
};

export const DEFAULT_CURSOR_RUNTIME_CONFIG: CursorRuntimeConfig = {
  theme: 'system',
  nominalSize: 24,
  scale: 1,
  animation: 'system',
  hideOnTouch: true,
  pointerRestoreDistance: 2,
};

export function normalizeCursorRole(role: CursorRole): SystemCursorRole {
  return role.startsWith('custom:') ? 'default' : (role as SystemCursorRole);
}
