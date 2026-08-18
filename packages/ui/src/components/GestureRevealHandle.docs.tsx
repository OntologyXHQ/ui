import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'GestureRevealHandle',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Visual handle for edge/reveal interactions.',
    usage:
      'Use as the reusable visual handle for a shared reveal/edge gesture owner; product/System placement and open-state policy stay outside the Component.',
    status: 'candidate',
    accessibility:
      'Handle is supplementary and should not be the only accessible way to reveal content.',
    rtl: 'Edge meaning must distinguish semantic start/end from physical system edges.',
    touch: 'Intended for direct manipulation with coarse pointers.',
    responsive: 'Handle placement follows the owning adaptive surface.',
    playground: { preferredWidth: 'narrow', fixture: { gestureProps: {} } },
  },
] as const);
