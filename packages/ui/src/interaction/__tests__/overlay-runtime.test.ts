import { afterEach, describe, expect, it } from 'vitest';
import { documentOverlayBroker, OverlayCoordinator } from '../overlayRuntime';

const coordinators: OverlayCoordinator[] = [];
const frames: HTMLIFrameElement[] = [];

afterEach(() => {
  for (const coordinator of coordinators.splice(0)) coordinator.dispose();
  for (const frame of frames.splice(0)) frame.remove();
});

function coordinator() {
  const value = new OverlayCoordinator();
  coordinators.push(value);
  return value;
}

function layerIn(documentRef: Document) {
  const root = documentRef.createElement('div');
  root.className = 'ui-root';
  const runtime = documentRef.createElement('div');
  const portal = documentRef.createElement('div');
  portal.setAttribute('data-oxs-portal-root', 'true');
  const layer = documentRef.createElement('div');
  portal.append(layer);
  root.append(runtime, portal);
  documentRef.body.append(root);
  return { root, runtime, portal, layer };
}

function register(
  owner: OverlayCoordinator,
  layer: HTMLElement,
  counters: { key: number; pointer: number },
) {
  return owner.register({
    id: `entry-${Math.random()}`,
    layer,
    modal: false,
    lockScroll: false,
    restoreFocus: null,
    onKeyDown: () => {
      counters.key += 1;
    },
    onPointerDown: () => {
      counters.pointer += 1;
    },
  });
}

describe('overlay realm authority', () => {
  it('arbitrates one top-most event target across independent UiRoots in the same Document', () => {
    const a = coordinator();
    const b = coordinator();
    const aFixture = layerIn(document);
    const bFixture = layerIn(document);
    const aLayer = aFixture.layer;
    const bLayer = bFixture.layer;
    const aEvents = { key: 0, pointer: 0 };
    const bEvents = { key: 0, pointer: 0 };
    const aId = 'root-a';
    const bId = 'root-b';

    a.register({
      id: aId,
      layer: aLayer,
      modal: false,
      lockScroll: false,
      restoreFocus: null,
      onKeyDown: () => {
        aEvents.key += 1;
      },
      onPointerDown: () => {
        aEvents.pointer += 1;
      },
    });
    b.register({
      id: bId,
      layer: bLayer,
      modal: false,
      lockScroll: false,
      restoreFocus: null,
      onKeyDown: () => {
        bEvents.key += 1;
      },
      onPointerDown: () => {
        bEvents.pointer += 1;
      },
    });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(aEvents).toEqual({ key: 0, pointer: 0 });
    expect(bEvents).toEqual({ key: 1, pointer: 1 });
    expect(documentOverlayBroker(document).registrationCount()).toBeGreaterThanOrEqual(2);
    expect(
      Number(aFixture.portal.style.getPropertyValue('--oxs-overlay-document-depth')),
    ).toBeLessThan(Number(bFixture.portal.style.getPropertyValue('--oxs-overlay-document-depth')));

    b.unregister(bId);
    expect(bFixture.portal.style.getPropertyValue('--oxs-overlay-document-depth')).toBe('');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(aEvents.key).toBe(1);
  });

  it('keeps event brokers isolated between concrete Document realms', () => {
    const frame = document.createElement('iframe');
    frames.push(frame);
    document.body.append(frame);
    const frameDocument = frame.contentDocument;
    const frameWindow = frame.contentWindow;
    expect(frameDocument).not.toBeNull();
    expect(frameWindow).not.toBeNull();
    if (!frameDocument || !frameWindow) return;
    const frameRealm = frameWindow as Window & typeof globalThis;

    const main = coordinator();
    const nestedRealm = coordinator();
    const mainEvents = { key: 0, pointer: 0 };
    const frameEvents = { key: 0, pointer: 0 };
    register(main, layerIn(document).layer, mainEvents);
    register(nestedRealm, layerIn(frameDocument).layer, frameEvents);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(mainEvents.key).toBe(1);
    expect(frameEvents.key).toBe(0);

    frameDocument.dispatchEvent(
      new frameRealm.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    expect(mainEvents.key).toBe(1);
    expect(frameEvents.key).toBe(1);

    const modalRealm = coordinator();
    const frameLayer = layerIn(frameDocument);
    modalRealm.register({
      id: 'frame-modal',
      layer: frameLayer.layer,
      modal: true,
      lockScroll: true,
      restoreFocus: null,
      onKeyDown: () => {},
      onPointerDown: () => {},
    });
    expect(frameLayer.runtime).toHaveAttribute('inert');
    expect(frameLayer.runtime).toHaveAttribute('aria-hidden', 'true');
    expect(frameLayer.root.style.overflow).toBe('hidden');
    modalRealm.unregister('frame-modal');
    expect(frameLayer.runtime).not.toHaveAttribute('inert');
    expect(frameLayer.root.style.overflow).toBe('');
  });

  it('restores pre-existing inert and aria-hidden state after modal isolation disposal', () => {
    const owner = coordinator();
    const { root, runtime, layer } = layerIn(document);
    runtime.setAttribute('inert', '');
    runtime.setAttribute('aria-hidden', 'false');
    owner.register({
      id: 'modal',
      layer,
      modal: true,
      lockScroll: true,
      restoreFocus: null,
      onKeyDown: () => {},
      onPointerDown: () => {},
    });
    expect(root.style.overflow).toBe('hidden');
    expect(runtime).toHaveAttribute('inert');
    expect(runtime).toHaveAttribute('aria-hidden', 'true');

    owner.unregister('modal');
    expect(root.style.overflow).toBe('');
    expect(runtime).toHaveAttribute('inert');
    expect(runtime).toHaveAttribute('aria-hidden', 'false');
  });
});
