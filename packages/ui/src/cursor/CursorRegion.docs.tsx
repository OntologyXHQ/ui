import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'CursorRegion',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Declares a semantic cursor role for a bounded interaction region.',
    usage: 'Use semantic cursor roles instead of feature-owned CSS cursor values.',
    status: 'provisional',
    accessibility: 'Cursor decoration does not replace accessible interaction semantics.',
    rtl: 'Start/end resize semantics are normalized by the cursor service.',
    touch: 'Touch does not depend on cursor visibility; pointer modality remains optional.',
    responsive: 'Region behavior follows its container rather than screen-size assumptions.',
    playground: { preferredWidth: 'medium', fixture: { role: 'pointer' } },
  },
] as const);
