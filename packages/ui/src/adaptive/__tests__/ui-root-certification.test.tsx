import { act, render, waitFor } from '@testing-library/react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../UiRoot';

const originalMatchMedia = window.matchMedia;

type MatchMediaOptions = {
  light?: boolean;
  coarse?: boolean;
  reduced?: boolean;
};

function installMatchMedia(realmWindow: Window, options: MatchMediaOptions) {
  const matchMedia = vi.fn((query: string) => {
    const matches = query.includes('prefers-color-scheme')
      ? Boolean(options.light)
      : query.includes('pointer: coarse')
        ? Boolean(options.coarse)
        : query.includes('prefers-reduced-motion')
          ? Boolean(options.reduced)
          : false;
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;
  });
  Object.defineProperty(realmWindow, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return matchMedia;
}

afterEach(() => {
  document.documentElement.dir = '';
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: originalMatchMedia,
  });
  vi.restoreAllMocks();
});

describe('UiRoot certification', () => {
  it('infers nested scope and inherits environment/tokens while keeping root portal hosts independent', async () => {
    const { container } = render(
      <UiRoot
        theme="dark"
        direction="rtl"
        density="comfortable"
        modality="keyboard"
        pointerPrecision="fine"
        safeArea={{ blockStart: '12px' }}
        tokens={{ 'radius-md': '18px' }}
      >
        <div>Outer content</div>
        <UiRoot density="compact" occlusion={{ blockEnd: '40px' }} tokens={{ 'radius-md': '6px' }}>
          <div>Inner content</div>
        </UiRoot>
      </UiRoot>,
    );

    const roots = container.querySelectorAll<HTMLElement>('.ui-root');
    expect(roots).toHaveLength(2);
    const [outer, inner] = roots;

    await waitFor(() => expect(outer.dataset.oxsAdaptiveBand).toBeTruthy());
    expect(outer).toHaveAttribute('data-oxs-scope', 'root');
    expect(inner).toHaveAttribute('data-oxs-scope', 'nested');
    expect(inner).toHaveAttribute('data-oxs-theme', 'dark');
    expect(inner).toHaveAttribute('data-oxs-color-scheme', 'dark');
    expect(inner).toHaveAttribute('data-oxs-direction', 'rtl');
    expect(inner).toHaveAttribute('data-oxs-density', 'compact');
    expect(inner.style.getPropertyValue('--oxs-safe-block-start')).toBe('12px');
    expect(inner.style.getPropertyValue('--oxs-occlusion-block-end')).toBe('40px');
    expect(outer.style.getPropertyValue('--oxs-radius-md')).toBe('18px');
    expect(inner.style.getPropertyValue('--oxs-radius-md')).toBe('6px');

    const outerPortal = outer.querySelector(':scope > [data-oxs-portal-root]');
    const innerPortal = inner.querySelector(':scope > [data-oxs-portal-root]');
    expect(outerPortal).toBeInTheDocument();
    expect(innerPortal).toBeInTheDocument();
    expect(outerPortal).not.toBe(innerPortal);
  });

  it('detects a DOM-nested UiRoot even when a separate React root owns it', async () => {
    const { container } = render(
      <UiRoot theme="light">
        <div data-testid="microfrontend-host" />
      </UiRoot>,
    );
    const host = container.querySelector<HTMLElement>('[data-testid="microfrontend-host"]');
    expect(host).toBeTruthy();
    if (!host) return;

    const childRoot = createRoot(host);
    await act(async () => {
      childRoot.render(<UiRoot>Independent React root</UiRoot>);
    });
    await waitFor(() => {
      const roots = container.querySelectorAll<HTMLElement>('.ui-root');
      expect(roots).toHaveLength(2);
      expect(roots[0]).toHaveAttribute('data-oxs-scope', 'root');
      expect(roots[1]).toHaveAttribute('data-oxs-scope', 'nested');
    });
    await act(async () => childRoot.unmount());
  });

  it('server-renders and hydrates system/auto preferences without a recoverable hydration mismatch', async () => {
    const tree = (
      <UiRoot
        theme="system"
        direction="auto"
        density="auto"
        pointerPrecision="auto"
        motion="system"
      >
        <button type="button">Hydrated action</button>
      </UiRoot>
    );
    const markup = renderToString(tree);
    expect(markup).toContain('data-oxs-theme="system"');
    expect(markup).toContain('data-oxs-color-scheme="dark"');
    expect(markup).toContain('data-oxs-direction="ltr"');
    expect(markup).toContain('data-oxs-density="compact"');
    expect(markup).toContain('data-oxs-motion="full"');
    expect(markup).not.toContain('data-oxs-adaptive-band=');

    installMatchMedia(window, { light: true, coarse: true, reduced: true });
    const host = document.createElement('div');
    host.innerHTML = markup;
    document.body.append(host);
    const recoverable: unknown[] = [];
    const root = hydrateRoot(host, tree, {
      onRecoverableError: (error) => recoverable.push(error),
    });

    await waitFor(() => {
      const uiRoot = host.querySelector<HTMLElement>('.ui-root');
      expect(uiRoot).toHaveAttribute('data-oxs-color-scheme', 'light');
      expect(uiRoot).toHaveAttribute('data-oxs-density', 'comfortable');
      expect(uiRoot).toHaveAttribute('data-oxs-pointer-precision', 'coarse');
      expect(uiRoot).toHaveAttribute('data-oxs-motion', 'reduced');
    });
    expect(recoverable).toEqual([]);

    await act(async () => root.unmount());
    host.remove();
  });

  it('resolves system capabilities from the concrete owner Window/Document realm', async () => {
    installMatchMedia(window, { light: false, coarse: false, reduced: false });
    document.documentElement.dir = 'ltr';

    const outerHost = document.createElement('div');
    document.body.append(outerHost);
    const outerRoot = createRoot(outerHost);
    await act(async () => {
      outerRoot.render(
        <UiRoot
          theme="system"
          direction="auto"
          density="auto"
          pointerPrecision="auto"
          motion="system"
        >
          Parent realm
        </UiRoot>,
      );
    });

    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const iframeWindow = iframe.contentWindow;
    const iframeDocument = iframe.contentDocument;
    expect(iframeWindow).toBeTruthy();
    expect(iframeDocument).toBeTruthy();
    if (!iframeWindow || !iframeDocument) return;

    installMatchMedia(iframeWindow, { light: true, coarse: true, reduced: true });
    iframeDocument.documentElement.dir = 'rtl';
    const iframeHost = iframeDocument.createElement('div');
    iframeDocument.body.append(iframeHost);
    const iframeRoot = createRoot(iframeHost);
    await act(async () => {
      iframeRoot.render(
        <UiRoot
          theme="system"
          direction="auto"
          density="auto"
          pointerPrecision="auto"
          motion="system"
        >
          Child realm
        </UiRoot>,
      );
    });

    await waitFor(() => {
      const parent = outerHost.querySelector<HTMLElement>('.ui-root');
      const child = iframeHost.querySelector<HTMLElement>('.ui-root');
      expect(parent).toHaveAttribute('data-oxs-color-scheme', 'dark');
      expect(parent).toHaveAttribute('data-oxs-direction', 'ltr');
      expect(parent).toHaveAttribute('data-oxs-pointer-precision', 'fine');
      expect(parent).toHaveAttribute('data-oxs-motion', 'full');
      expect(child).toHaveAttribute('data-oxs-color-scheme', 'light');
      expect(child).toHaveAttribute('data-oxs-direction', 'rtl');
      expect(child).toHaveAttribute('data-oxs-pointer-precision', 'coarse');
      expect(child).toHaveAttribute('data-oxs-density', 'comfortable');
      expect(child).toHaveAttribute('data-oxs-motion', 'reduced');
    });

    await act(async () => {
      iframeRoot.unmount();
      outerRoot.unmount();
    });
    iframe.remove();
    outerHost.remove();
  });
});
