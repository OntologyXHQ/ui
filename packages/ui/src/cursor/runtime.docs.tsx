import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'CursorRuntimeProvider',
    layer: 'foundations',
    category: 'Environment', order: 10,
    summary: 'Provides cursor theme, scale, modality and visibility state to UI consumers.',
    usage: 'Normally owned by UiRoot; use directly only for isolated runtime fixtures.',
    status: 'provisional',
    accessibility: 'Cursor state supplements but never replaces focus or accessible labels.',
    rtl: 'Directional cursor roles are resolved semantically.',
    touch: 'Tracks pointer modality without making hover a required interaction.',
    responsive: 'Runtime state is independent of viewport category.',
  },
] as const);
