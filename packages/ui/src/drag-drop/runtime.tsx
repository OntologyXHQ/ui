import type { PropsWithChildren, ReactNode } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useUiPortalHost, viewportPointToPortalHost } from '../foundations/portal';
import type {
  DragItem,
  DragOperation,
  DragPoint,
  DragPreview,
  DragSession,
  DropTargetContract,
} from './types';
import { cursorRoleForDragOperation } from './types';

type RegisteredTarget = DropTargetContract & { element: HTMLElement };

type DragDropRuntime = {
  session: DragSession | null;
  begin: (input: Omit<DragSession, 'active' | 'targetId' | 'operation'>) => boolean;
  update: (point: DragPoint) => void;
  stepTarget: (direction: 'next' | 'previous') => void;
  finish: () => void;
  cancel: () => void;
  registerTarget: (target: RegisteredTarget) => () => void;
};

const DragDropContext = createContext<DragDropRuntime | null>(null);

export function DragDropProvider({ children }: PropsWithChildren) {
  const portalHost = useUiPortalHost();
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const targetsRef = useRef(new Map<string, RegisteredTarget>());
  const sessionRef = useRef<DragSession | null>(null);
  const [session, setSession] = useState<DragSession | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const ownerDocument = rootElement?.ownerDocument ?? portalHost?.ownerDocument ?? null;
  const ownerWindow = ownerDocument?.defaultView ?? null;

  const commitSession = useCallback((next: DragSession | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const registerTarget = useCallback(
    (target: RegisteredTarget) => {
      targetsRef.current.set(target.id, target);
      return () => {
        if (targetsRef.current.get(target.id)?.element !== target.element) return;
        targetsRef.current.delete(target.id);
        const current = sessionRef.current;
        if (current?.targetId === target.id) {
          commitSession({ ...current, targetId: undefined, operation: 'none' });
        }
      };
    },
    [commitSession],
  );

  const begin = useCallback(
    (input: Omit<DragSession, 'active' | 'targetId' | 'operation'>) => {
      if (sessionRef.current) return false;
      commitSession({ ...input, active: true, operation: 'none' });
      setAnnouncement(`Picked up ${input.item.label ?? input.item.id}.`);
      return true;
    },
    [commitSession],
  );

  const update = useCallback(
    (point: DragPoint) => {
      const current = sessionRef.current;
      if (!current) return;
      const target = findDropTarget(targetsRef.current.values(), current.item, point);
      const operation = target ? operationForTarget(target, current.item) : 'none';
      commitSession({ ...current, point, targetId: target?.id, operation });
    },
    [commitSession],
  );

  const stepTarget = useCallback(
    (direction: 'next' | 'previous') => {
      const current = sessionRef.current;
      if (!current) return;
      const targets = orderedTargets(targetsRef.current.values(), current.item);
      if (!targets.length) return;
      const currentIndex = current.targetId
        ? targets.findIndex((target) => target.id === current.targetId)
        : -1;
      const delta = direction === 'next' ? 1 : -1;
      const nextIndex =
        currentIndex < 0
          ? direction === 'next'
            ? 0
            : targets.length - 1
          : (currentIndex + delta + targets.length) % targets.length;
      const target = targets[nextIndex];
      if (!target?.element.isConnected) return;
      const rect = target.element.getBoundingClientRect();
      const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const operation = operationForTarget(target, current.item);
      commitSession({ ...current, point, targetId: target.id, operation });
      setAnnouncement(
        `${current.item.label ?? current.item.id} over ${target.label ?? target.id}. ${operation} operation.`,
      );
      target.element.focus({ preventScroll: true });
    },
    [commitSession],
  );

  const cancel = useCallback(() => {
    const current = sessionRef.current;
    if (current) setAnnouncement(`Cancelled ${current.item.label ?? current.item.id}.`);
    commitSession(null);
  }, [commitSession]);

  const finish = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const target = current.targetId ? targetsRef.current.get(current.targetId) : undefined;
    if (
      target?.element.isConnected &&
      current.operation !== 'none' &&
      target.accepts?.(current.item) !== false
    ) {
      target.onDrop(current.item, current.operation);
      setAnnouncement(
        `Dropped ${current.item.label ?? current.item.id} on ${target.label ?? target.id}.`,
      );
    } else {
      setAnnouncement(`No valid drop target for ${current.item.label ?? current.item.id}.`);
    }
    commitSession(null);
  }, [commitSession]);

  useEffect(() => {
    if (!ownerWindow || !ownerDocument) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const current = sessionRef.current;
      if (!current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
        return;
      }
      if (current.modality !== 'keyboard') return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        finish();
        return;
      }
      const activeElement = ownerDocument.activeElement;
      const active =
        activeElement instanceof ownerWindow.HTMLElement ? (activeElement as HTMLElement) : null;
      const direction = active
        ? ownerWindow.getComputedStyle(active).direction
        : ownerWindow.getComputedStyle(ownerDocument.documentElement).direction;
      let step: 'next' | 'previous' | null = null;
      if (event.key === 'ArrowDown') step = 'next';
      if (event.key === 'ArrowUp') step = 'previous';
      if (event.key === 'ArrowRight') step = direction === 'rtl' ? 'previous' : 'next';
      if (event.key === 'ArrowLeft') step = direction === 'rtl' ? 'next' : 'previous';
      if (step) {
        event.preventDefault();
        stepTarget(step);
      }
    };
    ownerWindow.addEventListener('keydown', onKeyDown, true);
    return () => ownerWindow.removeEventListener('keydown', onKeyDown, true);
  }, [cancel, finish, ownerDocument, ownerWindow, stepTarget]);

  useEffect(() => {
    if (!session || session.modality === 'keyboard' || !ownerWindow || !ownerDocument) return;
    let frame: number | null = null;
    const tick = () => {
      const current = sessionRef.current;
      if (!current || current.modality === 'keyboard') return;
      autoScrollAt(ownerDocument, current.point);
      frame = ownerWindow.requestAnimationFrame(tick);
    };
    frame = ownerWindow.requestAnimationFrame(tick);
    return () => {
      if (frame !== null) ownerWindow.cancelAnimationFrame(frame);
    };
  }, [ownerDocument, ownerWindow, session?.modality, session?.sourceId]);

  useEffect(
    () => () => {
      sessionRef.current = null;
      targetsRef.current.clear();
    },
    [],
  );

  const runtime = useMemo(
    () => ({ session, begin, update, stepTarget, finish, cancel, registerTarget }),
    [begin, cancel, finish, registerTarget, session, stepTarget, update],
  );
  const cursorRole = session ? cursorRoleForDragOperation(session.operation) : undefined;

  return (
    <DragDropContext.Provider value={runtime}>
      <div
        ref={setRootElement}
        className="ui-drag-drop-runtime"
        data-oxs-drag-active={session ? 'true' : 'false'}
        data-oxs-drag-cursor-role={cursorRole}
      >
        {children}
      </div>
      <span className="ui-visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      {session && session.modality !== 'keyboard' && portalHost ? (
        <DragPreviewLayer session={session} portalHost={portalHost} />
      ) : null}
    </DragDropContext.Provider>
  );
}

export function useDragDropRuntime(): DragDropRuntime {
  const runtime = useContext(DragDropContext);
  if (!runtime) throw new Error('drag/drop hooks must be used within DragDropProvider');
  return runtime;
}

function DragPreviewLayer({
  session,
  portalHost,
}: {
  session: DragSession;
  portalHost: HTMLElement;
}) {
  const content = renderPreview(session.preview, session.item);
  const local = viewportPointToPortalHost(portalHost, session.point);
  return createPortal(
    <div
      className="ui-drag-preview"
      aria-hidden
      style={{ transform: `translate3d(${local.x + 12}px, ${local.y + 12}px, 0)` }}
      data-operation={session.operation}
    >
      {content}
    </div>,
    portalHost,
  );
}

function renderPreview(preview: DragPreview | undefined, item: DragItem): ReactNode {
  if (typeof preview === 'function') return preview(item);
  return preview ?? item.label ?? item.id;
}

function orderedTargets(targets: IterableIterator<RegisteredTarget>, item: DragItem) {
  return [...targets]
    .filter((target) => target.element.isConnected && target.accepts?.(item) !== false)
    .sort((left, right) => {
      const relation = left.element.compareDocumentPosition(right.element);
      const NodeConstructor = left.element.ownerDocument.defaultView?.Node;
      if (!NodeConstructor) return 0;
      if (relation & NodeConstructor.DOCUMENT_POSITION_FOLLOWING) return -1;
      if (relation & NodeConstructor.DOCUMENT_POSITION_PRECEDING) return 1;
      return 0;
    });
}

function findDropTarget(
  targets: IterableIterator<RegisteredTarget>,
  item: DragItem,
  point: DragPoint,
): RegisteredTarget | undefined {
  let selected: RegisteredTarget | undefined;
  let selectedArea = Number.POSITIVE_INFINITY;
  for (const target of targets) {
    if (!target.element.isConnected || target.accepts?.(item) === false) continue;
    const rect = target.element.getBoundingClientRect();
    if (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom)
      continue;
    const area = Math.max(1, rect.width * rect.height);
    if (area < selectedArea) {
      selected = target;
      selectedArea = area;
    }
  }
  return selected;
}

function operationForTarget(target: RegisteredTarget, item: DragItem): DragOperation {
  const operation =
    typeof target.operation === 'function' ? target.operation(item) : target.operation;
  return operation ?? 'copy';
}

export function autoScrollDelta(
  pointer: number,
  start: number,
  end: number,
  edgeSize = 40,
  maxStep = 18,
): number {
  if (pointer < start + edgeSize)
    return -Math.ceil(((start + edgeSize - pointer) / edgeSize) * maxStep);
  if (pointer > end - edgeSize)
    return Math.ceil(((pointer - (end - edgeSize)) / edgeSize) * maxStep);
  return 0;
}

function autoScrollAt(ownerDocument: Document, point: DragPoint) {
  if (typeof ownerDocument.elementFromPoint !== 'function') return;
  const ownerWindow = ownerDocument.defaultView;
  if (!ownerWindow) return;
  let element = ownerDocument.elementFromPoint(point.x, point.y) as HTMLElement | null;
  while (element) {
    const style = ownerWindow.getComputedStyle(element);
    const scrollableY =
      /(auto|scroll|overlay)/.test(style.overflowY) && element.scrollHeight > element.clientHeight;
    const scrollableX =
      /(auto|scroll|overlay)/.test(style.overflowX) && element.scrollWidth > element.clientWidth;
    if (scrollableY || scrollableX) {
      const rect = element.getBoundingClientRect();
      const dx = scrollableX ? autoScrollDelta(point.x, rect.left, rect.right) : 0;
      const dy = scrollableY ? autoScrollDelta(point.y, rect.top, rect.bottom) : 0;
      if (dx !== 0 || dy !== 0) {
        const beforeX = element.scrollLeft;
        const beforeY = element.scrollTop;
        element.scrollBy({ left: dx, top: dy, behavior: 'auto' });
        if (element.scrollLeft !== beforeX || element.scrollTop !== beforeY) return;
      }
    }
    element = element.parentElement;
  }
}
