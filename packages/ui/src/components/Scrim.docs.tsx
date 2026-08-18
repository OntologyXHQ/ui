import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Scrim',
    layer: 'components',
    category: 'Overlays', order: 70,
    summary: 'Backdrop surface for modal and transient layered UI.',
    usage:
      'Use behind an owned overlay; overlay lifecycle/focus ownership is centralized in UIP03.',
    status: 'provisional',
    accessibility: 'Decorative by default; interaction semantics belong to the owning overlay.',
    rtl: 'Covers logical viewport bounds identically in LTR and RTL.',
    touch: 'Pointer dismissal behavior belongs to the overlay owner, not the scrim itself.',
    responsive: 'Stretches with its containing layer and safe-area contract.',
  },
] as const);
