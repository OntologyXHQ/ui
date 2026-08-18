import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

type OverlayEntry = {
  id: string;
  layer: HTMLElement | null;
  modal: boolean;
  lockScroll: boolean;
  restoreFocus: HTMLElement | null;
};

let overlayScopeSequence = 0;
const documentOverlayOrder = new WeakMap<Document, string[]>();

function registerDocumentOverlay(documentRef: Document | null, token: string) {
  if (!documentRef) return;
  const current = documentOverlayOrder.get(documentRef) ?? [];
  documentOverlayOrder.set(documentRef, [...current.filter((candidate) => candidate !== token), token]);
}

function unregisterDocumentOverlay(documentRef: Document | null, token: string) {
  if (!documentRef) return;
  const current = documentOverlayOrder.get(documentRef) ?? [];
  const next = current.filter((candidate) => candidate !== token);
  if (next.length) documentOverlayOrder.set(documentRef, next);
  else documentOverlayOrder.delete(documentRef);
}

function isDocumentOverlayTopMost(documentRef: Document | null, token: string) {
  if (!documentRef) return false;
  return documentOverlayOrder.get(documentRef)?.at(-1) === token;
}

export class OverlayCoordinator {
  private readonly scopeId = `overlay-scope-${++overlayScopeSequence}`;
  private entries: OverlayEntry[] = [];
  private depthSequence = -1;
  private restoreIsolation: (() => void) | null = null;
  private lockedRoot: HTMLElement | null = null;
  private lockedRootOverflow = '';

  register(entry: OverlayEntry) {
    this.entries = [...this.entries.filter((candidate) => candidate.id !== entry.id), entry];
    registerDocumentOverlay(entry.layer?.ownerDocument ?? null, this.documentToken(entry.id));
    this.recomputeModalState();
    this.depthSequence += 1;
    return this.depthSequence;
  }

  unregister(id: string) {
    const removedEntry = this.entries.find((entry) => entry.id === id);
    unregisterDocumentOverlay(removedEntry?.layer?.ownerDocument ?? null, this.documentToken(id));
    if (!removedEntry) return null;
    this.entries = this.entries.filter((entry) => entry.id !== id);
    for (const entry of this.entries) {
      const restoreTarget = entry.restoreFocus;
      if (!restoreTarget) continue;
      if (removedEntry.layer?.contains(restoreTarget) || !restoreTarget.isConnected) {
        entry.restoreFocus = removedEntry.restoreFocus;
      }
    }
    this.recomputeModalState();
    return removedEntry.restoreFocus;
  }

  isTopMost(id: string) {
    return this.entries.at(-1)?.id === id;
  }

  isEventTopMost(id: string) {
    const entry = this.entries.find((candidate) => candidate.id === id);
    return this.isTopMost(id) && isDocumentOverlayTopMost(entry?.layer?.ownerDocument ?? null, this.documentToken(id));
  }

  dispose() {
    for (const entry of this.entries) unregisterDocumentOverlay(entry.layer?.ownerDocument ?? null, this.documentToken(entry.id));
    this.entries = [];
    this.restoreIsolation?.();
    this.restoreIsolation = null;
    this.restoreScrollLock();
  }

  private documentToken(id: string) {
    return `${this.scopeId}:${id}`;
  }

  private recomputeModalState() {
    this.restoreIsolation?.();
    this.restoreIsolation = null;

    const topModal = [...this.entries].reverse().find((entry) => entry.modal && entry.layer);
    if (topModal?.layer) this.restoreIsolation = isolateLayerSiblings(topModal.layer);

    const lockEntry = [...this.entries].reverse().find((entry) => entry.lockScroll && entry.layer);
    const nextRoot = lockEntry?.layer?.closest<HTMLElement>('.ui-root') ?? null;
    if (!nextRoot) {
      this.restoreScrollLock();
      return;
    }

    if (this.lockedRoot !== nextRoot) {
      this.restoreScrollLock();
      this.lockedRoot = nextRoot;
      this.lockedRootOverflow = nextRoot.style.overflow;
    }
    nextRoot.style.overflow = 'hidden';
  }

  private restoreScrollLock() {
    if (!this.lockedRoot) return;
    this.lockedRoot.style.overflow = this.lockedRootOverflow;
    this.lockedRoot = null;
    this.lockedRootOverflow = '';
  }
}

const OverlayCoordinatorContext = createContext<OverlayCoordinator | null>(null);

export function OverlayRuntimeProvider({ children }: PropsWithChildren) {
  const coordinatorRef = useRef<OverlayCoordinator | null>(null);
  if (!coordinatorRef.current) coordinatorRef.current = new OverlayCoordinator();
  useEffect(() => () => coordinatorRef.current?.dispose(), []);
  return (
    <OverlayCoordinatorContext.Provider value={coordinatorRef.current}>
      {children}
    </OverlayCoordinatorContext.Provider>
  );
}

export function useOverlayCoordinator() {
  const coordinator = useContext(OverlayCoordinatorContext);
  if (!coordinator) throw new Error('Overlay lifecycle must render inside UiRoot.');
  return coordinator;
}

function isolateLayerSiblings(layer: HTMLElement) {
  const targets = new Set<HTMLElement>();
  const portalRoot = layer.closest<HTMLElement>('[data-oxs-portal-root]');

  if (portalRoot?.parentElement) {
    for (const child of portalRoot.parentElement.children) {
      if (child instanceof HTMLElement && child !== portalRoot) targets.add(child);
    }
    for (const child of portalRoot.children) {
      if (child instanceof HTMLElement && child !== layer) targets.add(child);
    }
  } else if (layer.parentElement) {
    for (const child of layer.parentElement.children) {
      if (child instanceof HTMLElement && child !== layer) targets.add(child);
    }
  }

  const previous = [...targets].map((element) => ({
    element,
    inert: element.hasAttribute('inert'),
    ariaHidden: element.getAttribute('aria-hidden'),
  }));

  for (const element of targets) {
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
  }

  return () => {
    for (const { element, inert, ariaHidden } of previous) {
      if (!element.isConnected) continue;
      if (inert) element.setAttribute('inert', '');
      else element.removeAttribute('inert');
      if (ariaHidden === null) element.removeAttribute('aria-hidden');
      else element.setAttribute('aria-hidden', ariaHidden);
    }
  };
}
