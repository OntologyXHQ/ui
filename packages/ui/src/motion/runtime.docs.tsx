import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'MotionRuntimeProvider',
    layer: 'foundations',
    category: 'Environment', order: 10,
    summary: 'Provides motion preference, frame timing and optional performance instrumentation.',
    usage: 'Normally owned by UiRoot; use directly for isolated motion fixtures.',
    status: 'candidate',
    accessibility: 'Reduced-motion preference is a first-class environment input.',
    rtl: 'Direction-neutral timing service.',
    touch: 'Time-based motion keeps behavior consistent across pointer modalities.',
    responsive: 'Frame timing is independent of container size.',
  },
] as const);
