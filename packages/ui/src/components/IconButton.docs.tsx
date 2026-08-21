import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { IconButton, Row } from '@ontologyx/ui';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'IconButton',
    layer: 'components',
    category: 'Actions',
    order: 11,
    summary:
      'Compact icon-only action with mandatory accessible naming, linked tooltip description, Button-family intent/emphasis and full modality target sizing.',
    usage:
      'Use when a familiar glyph is the primary visual affordance; label remains mandatory and tooltip text is supplemental rather than the accessible-name source.',
    status: 'accepted',
    accessibility:
      'Always exposes aria-label; optional tooltip is linked through aria-describedby while native button keyboard semantics and optional aria-pressed remain intact.',
    rtl: 'Directional glyphs mirror through Icon while the hit target and accessible name remain direction-independent.',
    touch:
      'Visible glyph size stays compact but the Button-family hit target never shrinks below the current modality minimum.',
    responsive:
      'Fits toolbars without target shrinkage; labels are non-visual so localization cannot change the visible control footprint.',
    playground: { preferredWidth: 'narrow', fixture: { icon: 'settings', label: 'Settings' } },
    examples: [
      {
        id: 'contract',
        title: 'Labeled icon actions',
        description:
          'Accessible naming, linked tooltip, destructive intent, loading and toggle state.',
        component: 'IconButtonContractExample',
      },
    ],
  },
] as const);

export function IconButtonContractExample() {
  return (
    <Row gap="sm">
      <IconButton icon="search" label="Search" tooltip="Search workspace" />
      <IconButton icon="settings" label="Settings" variant="primary" />
      <IconButton icon="check" label="Pinned" defaultPressed variant="secondary" />
      <IconButton icon="close" label="Delete" intent="destructive" variant="secondary" />
      <IconButton icon="chevron-end" label="Next" tooltip="Move to next item" />
    </Row>
  );
}
