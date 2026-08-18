import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'DragDropProvider',
    layer: 'components',
    category: 'Drag and drop', order: 80,
    summary: 'Shared drag/drop session owner for reusable UI interactions.',
    usage:
      'Wrap a surface that contains drag sources and drop targets; backend data transfer remains outside this visual contract.',
    status: 'candidate',
    accessibility:
      'Drag state must expose an accessible alternative before the component layer is closed.',
    rtl: 'Geometry and operation semantics must remain logical-direction safe.',
    touch: 'Designed for touch continuation as well as fine-pointer drag.',
    responsive: 'Autoscroll and target geometry adapt to the active container.',
  },
] as const);
