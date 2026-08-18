import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'UiRoot',
    layer: 'foundations',
    category: 'Environment', order: 10,
    summary:
      'Top-level UI environment provider for density, theme, motion, cursor and performance context.',
    usage:
      'Wrap an application or isolated Studio fixture once; nested scoped environment work is completed in UIP02.',
    status: 'provisional',
    accessibility: 'Owns environment semantics without changing the child accessibility tree.',
    rtl: 'Direction support is documented here but becomes a first-class UiRoot contract in UIP02.',
    touch: 'Pointer modality and touch policy flow through the root environment.',
    responsive: 'Designed to host full-window or contained UI without device-name branching.',
  },
] as const);
