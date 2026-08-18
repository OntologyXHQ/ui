import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'SharedBounds',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Shared-bounds transition helper for related visual elements.',
    usage:
      'Use for continuity between related source and destination surfaces, not as generic layout.',
    status: 'candidate',
    accessibility: 'Motion is supplementary and respects reduced-motion policy.',
    rtl: 'Geometry is physical, while content direction remains logical.',
    touch: 'Transitions must remain interruptible under direct touch interaction.',
    responsive: 'Measurements follow actual element bounds rather than device breakpoints.',
  },
] as const);
