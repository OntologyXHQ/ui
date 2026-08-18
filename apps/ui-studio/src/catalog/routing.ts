export type CatalogTab = 'overview' | 'api' | 'examples' | 'playground';

export function readCatalogRoute() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return {
    entry: params.get('entry'),
    tab: (tab === 'api' || tab === 'examples' || tab === 'playground' ? tab : 'overview') as CatalogTab,
    example: params.get('example'),
    state: params.get('state'),
  };
}

export function updateCatalogRoute(
  patch: Partial<{ entry: string | null; tab: CatalogTab | null; example: string | null; state: string | null }>,
  mode: 'push' | 'replace' = 'push',
) {
  const url = new URL(window.location.href);
  url.searchParams.set('ui-kit', '1');
  url.searchParams.set('view', 'catalog');
  for (const [key, value] of Object.entries(patch)) {
    if (value === null || value === undefined || value === '') url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
