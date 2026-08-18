import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { IconButton, Row } from '../index';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'IconButton',
    layer: 'components',
    category: 'Actions', order: 10,
    summary: 'Compact icon-only action in the Button family, including optional controlled/uncontrolled toggle state.',
    usage: 'Use when the icon is the primary visual label; provide label and use pressed state only for genuine toggle actions.',
    status: 'stable',
    accessibility: 'Requires an explicit accessible label; toggle mode adds aria-pressed and keeps native button keyboard semantics.',
    rtl: 'Directional icons mirror semantically through the shared Icon primitive.',
    touch: 'Keeps the same minimum target policy as Button even when the visible glyph is compact.',
    responsive: 'Fits compact toolbars without shrinking below the active modality target.',
    examples: [
      {
        id: 'states',
        title: 'Icon actions',
        description: 'Plain, filled and toggle icon actions.',
        component: 'IconButtonStatesExample',
      },
    ],
  },
] as const);

export function IconButtonStatesExample() {
  return (
    <Row gap="sm">
      <IconButton icon="search" label="Search" />
      <IconButton icon="settings" label="Settings" variant="filled" />
      <IconButton icon="check" label="Pinned" defaultPressed variant="soft" />
    </Row>
  );
}
