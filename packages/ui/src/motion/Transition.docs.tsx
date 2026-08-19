import { useState } from 'react';
import { Button, MotionTransition, Stack, Text, UiRoot } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'MotionTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'General enter/exit transition wrapper.',
    usage:
      'Use the smallest semantic transition that communicates state change; reduced-motion behavior is built into the motion runtime.',
    status: 'candidate',
    accessibility:
      'Content remains in the accessibility tree according to its owning visibility state.',
    rtl: 'Directional slide behavior must use semantic direction where relevant.',
    touch: 'Transitions remain interruptible during direct interaction.',
    responsive: 'Animation derives from content state, not fixed viewport assumptions.',
    examples: [{ id: 'authority', title: 'Motion runtime authority', component: 'MotionAuthorityExample' }],
  },
  {
    exportName: 'FadeTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Fade transition alias.',
    usage: 'Use for low-spatial emphasis changes.',
    status: 'candidate',
    accessibility: 'Respects reduced motion.',
    rtl: 'Direction-neutral.',
    touch: 'Does not block touch interaction.',
    responsive: 'Container-independent.',
  },
  {
    exportName: 'ScaleTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Scale transition alias.',
    usage: 'Use for bounded surface appearance/disappearance.',
    status: 'candidate',
    accessibility: 'Respects reduced motion.',
    rtl: 'Direction-neutral.',
    touch: 'Must remain interruptible.',
    responsive: 'Origin and bounds follow the actual element.',
  },
  {
    exportName: 'SlideTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Sliding transition alias.',
    usage: 'Use when spatial direction communicates navigation or reveal.',
    status: 'candidate',
    accessibility: 'Respects reduced motion.',
    rtl: 'Semantic directions must mirror under RTL where applicable.',
    touch: 'Must remain interruptible.',
    responsive: 'Distance follows token/config rather than device category.',
  },
  {
    exportName: 'RevealTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Reveal transition alias.',
    usage: 'Use for progressive disclosure where clipping communicates hierarchy.',
    status: 'candidate',
    accessibility: 'Respects reduced motion.',
    rtl: 'Reveal edge must remain logical when semantic.',
    touch: 'Direct manipulation may take over the transition.',
    responsive: 'Bounds follow the containing element.',
  },
  {
    exportName: 'CollapseTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Collapse/expand transition alias.',
    usage: 'Use for layout disclosure with measured bounds.',
    status: 'candidate',
    accessibility: 'Respects reduced motion and final visibility semantics.',
    rtl: 'Block/inline collapse semantics must remain direction-safe.',
    touch: 'Direct interaction must be cancellable.',
    responsive: 'Measurement follows content/container size.',
  },
  {
    exportName: 'ReplaceTransition',
    layer: 'components',
    category: 'Interaction', order: 80,
    summary: 'Content replacement transition alias.',
    usage: 'Use for related state replacement without layering independent screens.',
    status: 'candidate',
    accessibility: 'Respects reduced motion.',
    rtl: 'Direction-neutral unless the owning navigation adds semantics.',
    touch: 'Does not require hover.',
    responsive: 'Container-independent.',
  },
] as const);


export function MotionAuthorityExample() {
  return (
    <Stack gap="sm">
      <MotionRealmProbe label="Outer runtime" />
      <UiRoot targetFrameRate={120} className="ui-doc-motion-nested-root">
        <MotionRealmProbe label="Nested runtime" />
      </UiRoot>
    </Stack>
  );
}

function MotionRealmProbe({ label }: { label: string }) {
  const [present, setPresent] = useState(true);
  return (
    <div className="ui-doc-motion-authority-probe" data-motion-authority-probe={label}>
      <Stack gap="xs">
        <Text>{label}: realm scheduler + interruption + reduced-motion settlement.</Text>
        <Button onClick={() => setPresent((value) => !value)}>Toggle motion</Button>
        <MotionTransition present={present} kind="scale" spring="expressive" data-motion-probe-surface>
          <div className="ui-doc-example-chip">Motion target</div>
        </MotionTransition>
      </Stack>
    </div>
  );
}
