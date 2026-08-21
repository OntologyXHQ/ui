import type { HTMLAttributes } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useDragDropRuntime } from './runtime';
import type { DragItem, DragOperation, DropTargetContract } from './types';

export function useDropTarget(target: DropTargetContract): HTMLAttributes<HTMLElement> & {
  ref: (node: HTMLElement | null) => void;
  'data-oxs-drop-target': string;
  'data-oxs-drop-active': string;
} {
  const { registerTarget, session } = useDragDropRuntime();
  const [element, setElement] = useState<HTMLElement | null>(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    if (!element) return undefined;
    return registerTarget({
      id: target.id,
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
  }, [element, registerTarget, target.id, target.label]);

  return {
    ref: setElement,
    tabIndex: -1,
    'aria-label': target.label,
    'data-oxs-drop-target': target.id,
    'data-oxs-drop-active': session?.targetId === target.id ? 'true' : 'false',
  };
}
