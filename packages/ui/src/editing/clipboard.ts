export type UiClipboardAdapter = {
  isAvailable: () => boolean;
  writeText: (text: string) => boolean;
  readText: () => Promise<string>;
};

let configuredClipboardAdapter: UiClipboardAdapter | undefined;

/**
 * Configures the process default adapter used by subsequently rendered UiRoot scopes.
 * Prefer the UiRoot `clipboardAdapter` prop when multiple roots need different transports.
 */
export function configureUiClipboardAdapter(adapter: UiClipboardAdapter | undefined): void {
  configuredClipboardAdapter = adapter;
}

export function getConfiguredUiClipboardAdapter(): UiClipboardAdapter | undefined {
  return configuredClipboardAdapter;
}

// Compatibility helpers for non-UiRoot consumers and focused unit tests.
export function hasUiClipboardTransport(): boolean {
  return configuredClipboardAdapter?.isAvailable() ?? false;
}

export function writeUiClipboardText(text: string): boolean {
  return configuredClipboardAdapter?.writeText(text) ?? false;
}

export function readUiClipboardText(): Promise<string> {
  if (!configuredClipboardAdapter) {
    return Promise.reject(new Error('OntologyX UI clipboard adapter is unavailable.'));
  }
  return configuredClipboardAdapter.readText();
}
