import type { UiCatalogEntry, UiCatalogLayer, UiCatalogStatus } from './types';

export const catalogLayerOrder: readonly UiCatalogLayer[] = [
  'foundations',
  'primitives',
  'components',
  'system',
];

export type CatalogCategory = {
  id: string;
  layer: UiCatalogLayer;
  label: string;
  order: number;
  entries: readonly UiCatalogEntry[];
};

export type CatalogLayerGroup = {
  layer: UiCatalogLayer;
  categories: readonly CatalogCategory[];
  count: number;
};

export function catalogSearchText(entry: UiCatalogEntry) {
  return [
    entry.exportName,
    entry.layer,
    entry.category,
    entry.status,
    entry.summary,
    entry.usage,
    entry.accessibility,
    entry.rtl,
    entry.touch,
    entry.responsive,
    ...entry.props.flatMap((prop) => [
      prop.name,
      prop.type,
      prop.description,
      prop.default ?? '',
      prop.deprecated ? 'deprecated' : '',
    ]),
    ...entry.examples.flatMap((example) => [example.id, example.title, example.description]),
  ]
    .join(' ')
    .normalize('NFKC')
    .toLocaleLowerCase();
}

export function filterCatalog(
  entries: readonly UiCatalogEntry[],
  query: string,
  filters: {
    layer?: UiCatalogLayer | 'all';
    status?: UiCatalogStatus | 'all';
  } = {},
) {
  const normalized = query.trim().normalize('NFKC').toLocaleLowerCase();
  const terms = normalized ? normalized.split(/\s+/).filter(Boolean) : [];
  return entries.filter((entry) => {
    if (filters.layer && filters.layer !== 'all' && entry.layer !== filters.layer) return false;
    if (filters.status && filters.status !== 'all' && entry.status !== filters.status) return false;
    if (!terms.length) return true;
    const haystack = catalogSearchText(entry);
    return terms.every((term) => haystack.includes(term));
  });
}

export function groupCatalog(entries: readonly UiCatalogEntry[]): readonly CatalogLayerGroup[] {
  return catalogLayerOrder
    .map((layer) => {
      const layerEntries = entries.filter((entry) => entry.layer === layer);
      const categoryMap = new Map<string, UiCatalogEntry[]>();
      for (const entry of layerEntries) {
        const bucket = categoryMap.get(entry.category) ?? [];
        bucket.push(entry);
        categoryMap.set(entry.category, bucket);
      }
      const categories = [...categoryMap.entries()]
        .map(([label, categoryEntries]) => ({
          id: `${layer}:${label}`,
          layer,
          label,
          order: Math.min(...categoryEntries.map((entry) => entry.order)),
          entries: [...categoryEntries].sort(
            (a, b) => a.order - b.order || a.exportName.localeCompare(b.exportName),
          ),
        }))
        .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
      return { layer, categories, count: layerEntries.length };
    })
    .filter((group) => group.count > 0);
}
