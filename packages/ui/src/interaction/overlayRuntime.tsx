import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useRef } from 'react';

export type OverlayEntry = {
  id: string;
  layer: HTMLElement | null;
  modal: boolean;
  lockScroll: boolean;
  restoreFocus: HTMLElement | null;
  onKeyDown: (event: KeyboardEvent) => void;
  onPointerDown: (event: PointerEvent) => void;
};

type DocumentOverlayRegistration = {
  owner: OverlayCoordinator;
  entry: OverlayEntry;
};

/**
 * One event broker per concrete Document realm. UiRoots retain independent overlay
 * stacks/isolation/scroll ownership, while Escape/outside-pointer arbitration is
 * coordinated once for overlays that genuinely share the same browser Document.
 */
export class DocumentOverlayBroker {
  private registrations: DocumentOverlayRegistration[] = [];
  private listening = false;
  private readonly rankedPortalRoots = new Set<HTMLElement>();

  constructor(private readonly documentRef: Document) {}

  register(owner: OverlayCoordinator, entry: OverlayEntry) {
    this.registrations = [
      ...this.registrations.filter(
        (candidate) => !(candidate.owner === owner && candidate.entry.id === entry.id),
      ),
      { owner, entry },
    ];
    this.ensureListening();
    this.recomputePortalRanks();
  }

  unregister(owner: OverlayCoordinator, id: string) {
    this.registrations = this.registrations.filter(
      (candidate) => !(candidate.owner === owner && candidate.entry.id === id),
    );
    if (this.registrations.length === 0) this.stopListening();
    this.recomputePortalRanks();
  }

  isTopMost(owner: OverlayCoordinator, id: string) {
    const top = this.registrations.at(-1);
    return top?.owner === owner && top.entry.id === id;
  }

  registrationCount() {
    return this.registrations.length;
  }

  disposeOwner(owner: OverlayCoordinator) {
    this.registrations = this.registrations.filter((candidate) => candidate.owner !== owner);
    if (this.registrations.length === 0) this.stopListening();
    this.recomputePortalRanks();
  }

  private recomputePortalRanks() {
    const next = new Map<HTMLElement, number>();
    this.registrations.forEach((registration, index) => {
      const portalRoot =
        registration.entry.layer?.closest<HTMLElement>('[data-oxs-portal-root]') ?? null;
      if (portalRoot) next.set(portalRoot, index + 1);
    });
    for (const portalRoot of this.rankedPortalRoots) {
      if (!next.has(portalRoot)) portalRoot.style.removeProperty('--oxs-overlay-document-depth');
    }
    for (const [portalRoot, rank] of next) {
      portalRoot.style.setProperty('--oxs-overlay-document-depth', String(rank));
      this.rankedPortalRoots.add(portalRoot);
    }
    for (const portalRoot of [...this.rankedPortalRoots]) {
      if (!next.has(portalRoot)) this.rankedPortalRoots.delete(portalRoot);
    }
  }

  private ensureListening() {
    if (this.listening) return;
    this.documentRef.addEventListener('keydown', this.onKeyDown, true);
    this.documentRef.addEventListener('pointerdown', this.onPointerDown, true);
    this.listening = true;
  }

  private stopListening() {
    if (!this.listening) return;
    this.documentRef.removeEventListener('keydown', this.onKeyDown, true);
    this.documentRef.removeEventListener('pointerdown', this.onPointerDown, true);
    this.listening = false;
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    this.registrations.at(-1)?.entry.onKeyDown(event);
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    this.registrations.at(-1)?.entry.onPointerDown(event);
  };
}

const documentOverlayBrokers = new WeakMap<Document, DocumentOverlayBroker>();

export function documentOverlayBroker(documentRef: Document) {
  let broker = documentOverlayBrokers.get(documentRef);
  if (!broker) {
    broker = new DocumentOverlayBroker(documentRef);
    documentOverlayBrokers.set(documentRef, broker);
  }
  return broker;
}

export class OverlayCoordinator {
  private entries: OverlayEntry[] = [];
  private depthSequence = -1;
  private restoreIsolation: (() => void) | null = null;
  private lockedRoot: HTMLElement | null = null;
  private lockedRootOverflow = '';
  private readonly documents = new Set<Document>();

  register(entry: OverlayEntry) {
    const replaced = this.entries.find((candidate) => candidate.id === entry.id);
    if (
      replaced?.layer?.ownerDocument &&
      replaced.layer.ownerDocument !== entry.layer?.ownerDocument
    ) {
      documentOverlayBroker(replaced.layer.ownerDocument).unregister(this, entry.id);
    }

    this.entries = [...this.entries.filter((candidate) => candidate.id !== entry.id), entry];
    const documentRef = entry.layer?.ownerDocument ?? null;
    if (documentRef) {
      this.documents.add(documentRef);
      documentOverlayBroker(documentRef).register(this, entry);
    }
    this.recomputeModalState();
    this.depthSequence += 1;
    return this.depthSequence;
  }

  unregister(id: string) {
    const removedEntry = this.entries.find((entry) => entry.id === id);
    const documentRef = removedEntry?.layer?.ownerDocument ?? null;
    if (documentRef) documentOverlayBroker(documentRef).unregister(this, id);
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
    const documentRef = entry?.layer?.ownerDocument ?? null;
    return Boolean(
      documentRef && this.isTopMost(id) && documentOverlayBroker(documentRef).isTopMost(this, id),
    );
  }

  dispose() {
    for (const documentRef of this.documents) {
      documentOverlayBroker(documentRef).disposeOwner(this);
    }
    this.documents.clear();
    this.entries = [];
    this.restoreIsolation?.();
    this.restoreIsolation = null;
    this.restoreScrollLock();
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
  const HTMLElementCtor = layer.ownerDocument.defaultView?.HTMLElement;
  const asHtmlElement = (candidate: Element): HTMLElement | null =>
    HTMLElementCtor && candidate instanceof HTMLElementCtor ? (candidate as HTMLElement) : null;

  if (portalRoot?.parentElement) {
    for (const child of portalRoot.parentElement.children) {
      const element = asHtmlElement(child);
      if (element && element !== portalRoot) targets.add(element);
    }
    for (const child of portalRoot.children) {
      const element = asHtmlElement(child);
      if (element && element !== layer) targets.add(element);
    }
  } else if (layer.parentElement) {
    for (const child of layer.parentElement.children) {
      const element = asHtmlElement(child);
      if (element && element !== layer) targets.add(element);
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
