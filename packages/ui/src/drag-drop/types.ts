import type { ReactNode } from 'react';
import type { SystemCursorRole } from '../cursor';

export const DRAG_OPERATIONS = ['none', 'copy', 'move', 'ask'] as const;
export type DragOperation = (typeof DRAG_OPERATIONS)[number];

export type DragItem = {
  id: string;
  type: string;
  label?: string;
  data?: unknown;
};

export type DragPoint = { x: number; y: number };

export type DragPreview = ReactNode | ((item: DragItem) => ReactNode);

export type DragInputModality = 'pointer' | 'touch' | 'pen' | 'keyboard';

export type DragSession = {
  active: boolean;
  sourceId: string;
  pointerId: number;
  pointerType: string;
  modality: DragInputModality;
  item: DragItem;
  point: DragPoint;
  targetId?: string;
  operation: DragOperation;
  preview?: DragPreview;
};

export type DropTargetContract = {
  id: string;
  /** Human-readable target name used for keyboard drag announcements. */
  label?: string;
  accepts?: (item: DragItem) => boolean;
  operation?: DragOperation | ((item: DragItem) => DragOperation);
  onDrop: (item: DragItem, operation: DragOperation) => void;
};

export function cursorRoleForDragOperation(operation: DragOperation): SystemCursorRole {
  switch (operation) {
    case 'copy':
      return 'drag-copy';
    case 'move':
      return 'drag-move';
    case 'ask':
      return 'pointer';
    case 'none':
      return 'no-drop';
  }
}

export function reorderItemsById<T>(
  items: readonly T[],
  sourceId: string,
  targetId: string,
  getId: (item: T) => string,
): T[] {
  const from = items.findIndex((item) => getId(item) === sourceId);
  const to = items.findIndex((item) => getId(item) === targetId);
  if (from < 0 || to < 0 || from === to) return [...items];
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
