import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { defineUiIcon, Icon, Row } from '../index';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Icon', layer: 'primitives', category: 'Iconography', order: 40, status: 'stable',
    summary: 'Lightweight current-color SVG icon primitive with a shared glyph contract.',
    usage: 'Use built-in semantic glyphs or defineUiIcon path data; icons never own action semantics.',
    accessibility: 'Decorative by default; pass label only when the glyph itself conveys standalone meaning.',
    rtl: 'Directional glyphs opt into semantic mirroring automatically.', touch: 'Never becomes a touch target by itself.', responsive: 'Uses typed token-compatible sizes.',
    examples: [{ id: 'overview', title: 'Icon vocabulary', component: 'IconExample' }],
  },
] as const);

const customSpark = defineUiIcon({ paths: ['m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z'] });

export function IconExample() {
  return (
    <Row gap="md">
      <Icon name="search" label="Search" />
      <Icon name="chevron-start" />
      <Icon name="chevron-end" />
      <Icon glyph={customSpark} label="Custom icon" />
    </Row>
  );
}
