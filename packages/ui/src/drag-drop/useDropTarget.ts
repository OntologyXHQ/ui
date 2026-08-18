import type { HTMLAttributes } from 'react';
import { useEffect, useState } from 'react';
import { useDragDropRuntime } from './runtime';
import type { DropTargetContract } from './types';

export function useDropTarget(target: DropTargetContract): HTMLAttributes<HTMLElement> & {
  ref: (node: HTMLElement | null) => void;
  'data-oxs-drop-target': string;
  'data-oxs-drop-active': string;
} {
  const { registerTarget, session } = useDragDropRuntime();
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!element) return undefined;
    return registerTarget({ ...target, element });
  }, [element, registerTarget, target]);

  return {
    ref: setElement,
    tabIndex: -1,
    'aria-label': target.label,
    'data-oxs-drop-target': target.id,
    'data-oxs-drop-active': session?.targetId === target.id ? 'true' : 'false',
  };
}
