import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'MotionRuntimeProvider',
    layer: 'foundations',
    category: 'Environment', order: 10,
    summary: 'Provides realm-owned motion preference, frame timing and optional performance instrumentation.',
    usage: 'Normally owned by UiRoot; use directly only for isolated infrastructure fixtures.',
    status: 'candidate',
    accessibility: 'Reduced-motion preference is a first-class environment input and settles transitions semantically.',
    rtl: 'Direction-neutral timing service.',
    touch: 'Time-based motion keeps behavior consistent across pointer modalities.',
    responsive: 'Frame timing is independent of container size and owned by the concrete Window realm.',
  },
] as const);
