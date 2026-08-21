import { Button, SharedBounds, Stack, Text } from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'SharedBounds',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Root-owned shared-bounds continuity helper with interruption-safe measurement, expiry and cleanup lifecycle.',
    usage:
      'Give related source/destination surfaces one stable transitionId; use layoutKey only when a mounted destination changes geometry without changing identity.',
    status: 'accepted',
    accessibility:
      'Shared-bounds motion is supplementary; reduced motion keeps the destination semantic state and skips geometry interpolation.',
    rtl: 'Physical DOMRect interpolation is isolated to visual geometry while child content continues to inherit logical direction.',
    touch:
      'A new layout target cancels the prior animation/expiry owner before starting the next transition, so direct interaction can interrupt safely.',
    responsive:
      'Each lifecycle reads current DOMRect bounds and temporary will-change promotion is removed after settlement.',
    examples: [
      {
        id: 'bounds-lifecycle',
        title: 'Shared bounds interruption and cleanup',
        component: 'SharedBoundsLifecycleExample',
      },
    ],
  },
] as const);

export function SharedBoundsLifecycleExample() {
  const [end, setEnd] = useState(false);
  return (
    <Stack gap="sm" data-shared-bounds-example>
      <Button size="sm" onClick={() => setEnd((value) => !value)}>
        Move shared surface
      </Button>
      <div className="ui-doc-shared-bounds-stage" data-position={end ? 'end' : 'start'}>
        <SharedBounds
          transitionId="docs-shared-surface"
          layoutKey={end ? 'end' : 'start'}
          data-shared-bounds-target
        >
          <div className="ui-doc-example-chip">
            <Text>Shared surface</Text>
          </div>
        </SharedBounds>
      </div>
    </Stack>
  );
}
