import type { UiCatalogLayer, UiCatalogStatus } from './types';

export type CatalogTab = 'overview' | 'api' | 'examples' | 'playground';

export type StudioView = 'catalog' | 'semantic';

export function readStudioView(): StudioView {
  return new URLSearchParams(window.location.search).get('view') === 'semantic'
    ? 'semantic'
    : 'catalog';
}

export function updateStudioView(view: StudioView) {
  const url = new URL(window.location.href);
  url.searchParams.set('ui-kit', '1');
  url.searchParams.set('view', view);
  if (view === 'semantic') {
    for (const key of ['entry', 'tab', 'example', 'state', 'q', 'layer', 'status']) {
      url.searchParams.delete(key);
    }
  }
  window.history.pushState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export type CatalogLayerFilter = UiCatalogLayer | 'all';
export type CatalogStatusFilter = UiCatalogStatus | 'all';

const layers = new Set<UiCatalogLayer>(['foundations', 'primitives', 'components', 'system']);
const statuses = new Set<UiCatalogStatus>(['candidate', 'accepted', 'experimental', 'deprecated']);

function readLayer(value: string | null): CatalogLayerFilter {
  return value && layers.has(value as UiCatalogLayer) ? (value as UiCatalogLayer) : 'all';
}

function readStatus(value: string | null): CatalogStatusFilter {
  return value && statuses.has(value as UiCatalogStatus) ? (value as UiCatalogStatus) : 'all';
}

export function readCatalogRoute() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  return {
    entry: params.get('entry'),
    tab: (tab === 'api' || tab === 'examples' || tab === 'playground'
      ? tab
      : 'overview') as CatalogTab,
    example: params.get('example'),
    state: params.get('state'),
    query: params.get('q') ?? '',
    layer: readLayer(params.get('layer')),
    status: readStatus(params.get('status')),
  };
}

export function updateCatalogRoute(
  patch: Partial<{
    entry: string | null;
    tab: CatalogTab | null;
    example: string | null;
    state: string | null;
    query: string | null;
    layer: CatalogLayerFilter | null;
    status: CatalogStatusFilter | null;
  }>,
  mode: 'push' | 'replace' = 'push',
) {
  const url = new URL(window.location.href);
  url.searchParams.set('ui-kit', '1');
  url.searchParams.set('view', 'catalog');
  for (const [key, value] of Object.entries(patch)) {
    const param = key === 'query' ? 'q' : key;
    if (
      value === null ||
      value === undefined ||
      value === '' ||
      ((param === 'layer' || param === 'status') && value === 'all')
    ) {
      url.searchParams.delete(param);
    } else {
      url.searchParams.set(param, String(value));
    }
  }
  if (mode === 'push') window.history.pushState(null, '', url);
  else window.history.replaceState(null, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
