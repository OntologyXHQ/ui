import { Button, Scrim, Stack, Text } from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Scrim',
    layer: 'components',
    category: 'Overlays',
    order: 70,
    summary: 'Backdrop surface for modal and transient layered UI.',
    usage:
      'Use behind an owned overlay; overlay lifecycle/focus ownership is centralized in UIP03.',
    status: 'accepted',
    accessibility: 'Decorative by default; interaction semantics belong to the owning overlay.',
    rtl: 'Covers logical viewport bounds identically in LTR and RTL.',
    touch: 'Pointer dismissal behavior belongs to the overlay owner, not the scrim itself.',
    responsive: 'Stretches with its containing layer and safe-area contract.',
    examples: [
      {
        id: 'ownership',
        title: 'Caller-owned scrim dismissal',
        component: 'ScrimOwnershipExample',
      },
    ],
  },
] as const);

export function ScrimOwnershipExample() {
  const [active, setActive] = useState(true);
  return (
    <Stack gap="sm" data-scrim-contract="owner-controlled">
      <Text>The owning surface controls whether the backdrop is active.</Text>
      <Button onClick={() => setActive((value) => !value)}>
        {active ? 'Hide scrim' : 'Show scrim'}
      </Button>
      <div className="ui-doc-scrim-stage">
        <Scrim
          active={active}
          onDismiss={() => setActive(false)}
          dismissLabel="Dismiss preview overlay"
        />
      </div>
    </Stack>
  );
}
