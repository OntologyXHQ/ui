import type { HTMLAttributes } from 'react';
import { useCallback, useId, useRef } from 'react';
import { useDragDropRuntime } from './runtime';
import type { DragItem, DragOperation, DropTargetContract } from './types';

export function useDropTarget(target: DropTargetContract): HTMLAttributes<HTMLElement> & {
  ref: (node: HTMLElement | null) => void;
  'data-oxs-drop-target': string;
  'data-oxs-drop-target-instance': string;
  'data-oxs-drop-active': string;
} {
  const { registerTarget, session } = useDragDropRuntime();
  const instanceId = useId();
  const targetRef = useRef(target);
  const elementRef = useRef<HTMLElement | null>(null);
  const unregisterRef = useRef<(() => void) | null>(null);
  targetRef.current = target;

  const bindTarget = useCallback(
    (element: HTMLElement | null) => {
      if (elementRef.current === element) return;
      unregisterRef.current?.();
      unregisterRef.current = null;
      elementRef.current = element;
      if (!element) return;

      unregisterRef.current = registerTarget({
        id: target.id,
        instanceId,
        label: target.label,
        element,
        accepts: (item: DragItem) => targetRef.current.accepts?.(item) ?? true,
        operation: (item: DragItem): DragOperation => {
          const current = targetRef.current.operation;
          if (typeof current === 'function') return current(item);
          return current ?? 'copy';
        },
        onDrop: (item: DragItem, operation: DragOperation) =>
          targetRef.current.onDrop(item, operation),
      });
    },
    [instanceId, registerTarget, target.id, target.label],
  );
  return {
    ref: bindTarget,
    tabIndex: -1,
    'aria-label': target.label,
    'data-oxs-drop-target': target.id,
    'data-oxs-drop-target-instance': instanceId,
    'data-oxs-drop-active': session?.targetInstanceId === instanceId ? 'true' : 'false',
  };
}
