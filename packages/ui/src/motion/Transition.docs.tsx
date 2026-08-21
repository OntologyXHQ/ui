import {
  Button,
  CollapseTransition,
  FadeTransition,
  MotionTransition,
  ReplaceTransition,
  RevealTransition,
  ScaleTransition,
  SlideTransition,
  Stack,
  Text,
  UiRoot,
} from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

const lifecycleExample = {
  id: 'lifecycle',
  title: 'Interruptible semantic transitions',
  component: 'MotionLifecycleExample',
} as const;

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'MotionTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary:
      'Interruptible enter/exit transition whose logical presence, accessibility state and reduced-motion settlement remain authoritative.',
    usage:
      'Use the smallest semantic transition that communicates state change; reversal inherits the current spring value instead of restarting from an endpoint.',
    status: 'accepted',
    accessibility:
      'Logical absence immediately owns aria-hidden/inert semantics; reduced motion settles without spatial interpolation while preserving the same final state.',
    rtl: 'Physical transition kinds remain explicit; the SlideTransition alias adds logical inline/block direction for direction-sensitive movement.',
    touch:
      'An in-flight target can reverse without a visual jump, so direct interaction can interrupt and retarget motion safely.',
    responsive:
      'Motion reads semantic spring tokens from the animated element realm and avoids permanent compositor promotion when idle.',
    examples: [
      lifecycleExample,
      { id: 'authority', title: 'Motion runtime authority', component: 'MotionAuthorityExample' },
    ],
  },
  {
    exportName: 'FadeTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Direction-neutral opacity alias over the shared interruptible transition lifecycle.',
    usage: 'Use for low-spatial-emphasis appearance or disappearance.',
    status: 'accepted',
    accessibility: 'Uses the same logical visibility and immediate reduced-motion settlement as MotionTransition.',
    rtl: 'Direction-neutral and unchanged by reading direction.',
    touch: 'Retargets through the shared spring lifecycle without blocking pointer input while present.',
    responsive: 'Container-independent and promoted only while motion is actively running.',
    examples: [lifecycleExample],
  },
  {
    exportName: 'ScaleTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Bounded scale alias over the shared interruptible transition lifecycle.',
    usage: 'Use for bounded surface appearance/disappearance where scale carries useful emphasis.',
    status: 'accepted',
    accessibility: 'Reduced motion removes spatial scaling rather than merely shortening its duration.',
    rtl: 'Direction-neutral and unchanged by reading direction.',
    touch: 'In-flight scale can reverse from its current visual value.',
    responsive: 'Uses the actual element and semantic spring tokens rather than viewport categories.',
    examples: [lifecycleExample],
  },
  {
    exportName: 'SlideTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Logical block/inline slide alias with explicit compatibility support for physical directions.',
    usage:
      'Prefer block-start/block-end/inline-start/inline-end when movement communicates hierarchy or navigation; physical values are compatibility escape hatches.',
    status: 'accepted',
    accessibility: 'Reduced motion settles directly to the final semantic visibility state with no spatial translation.',
    rtl: 'inline-start and inline-end resolve against the owning UiRoot direction, so semantic travel mirrors in RTL.',
    touch: 'Rapid retargeting preserves current spring value and velocity.',
    responsive: 'Distance is a bounded component value and does not branch on device class.',
    examples: [lifecycleExample],
  },
  {
    exportName: 'RevealTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Clip-and-translate reveal alias using the shared lifecycle and reduced-motion semantics.',
    usage: 'Use when progressive disclosure benefits from a bounded reveal treatment.',
    status: 'accepted',
    accessibility: 'Logical visibility owns accessibility state independently of visual clipping.',
    rtl: 'The current reveal treatment is block-axis and therefore direction-safe.',
    touch: 'Retargeting remains interruptible through the shared spring owner.',
    responsive: 'Clip geometry follows the rendered element and avoids permanent will-change layers.',
    examples: [lifecycleExample],
  },
  {
    exportName: 'CollapseTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Block-axis collapse alias using the shared interruptible transition lifecycle.',
    usage: 'Use for compact disclosure where a visual block-axis collapse is appropriate.',
    status: 'accepted',
    accessibility: 'Final absence is inert/hidden semantically and reduced motion skips scale interpolation.',
    rtl: 'Block-axis collapse does not encode physical left/right behavior.',
    touch: 'Can reverse while active without restarting from an endpoint.',
    responsive: 'Operates on the current element without viewport-size assumptions.',
    examples: [lifecycleExample],
  },
  {
    exportName: 'ReplaceTransition',
    layer: 'components',
    category: 'Interaction',
    order: 80,
    summary: 'Subtle replacement alias for related content states using one shared lifecycle owner.',
    usage: 'Use for related state replacement when a full spatial navigation transition would overstate the change.',
    status: 'accepted',
    accessibility: 'Visibility semantics remain authoritative and reduced motion removes interpolation.',
    rtl: 'Direction-neutral unless the owning composition adds separate navigation semantics.',
    touch: 'Does not require hover and remains interruptible while active.',
    responsive: 'Container-independent and does not keep a compositor layer promoted after settlement.',
    examples: [lifecycleExample],
  },
] as const);

export function MotionLifecycleExample() {
  const [present, setPresent] = useState(true);
  return (
    <Stack gap="sm" data-motion-lifecycle-example>
      <Button size="sm" onClick={() => setPresent((value) => !value)}>
        Toggle transitions
      </Button>
      <div className="ui-doc-motion-alias-grid">
        <FadeTransition present={present} data-motion-alias="fade">
          <div className="ui-doc-example-chip">Fade</div>
        </FadeTransition>
        <ScaleTransition present={present} data-motion-alias="scale">
          <div className="ui-doc-example-chip">Scale</div>
        </ScaleTransition>
        <SlideTransition present={present} direction="inline-start" data-motion-alias="slide">
          <div className="ui-doc-example-chip">Slide</div>
        </SlideTransition>
        <RevealTransition present={present} data-motion-alias="reveal">
          <div className="ui-doc-example-chip">Reveal</div>
        </RevealTransition>
        <CollapseTransition present={present} data-motion-alias="collapse">
          <div className="ui-doc-example-chip">Collapse</div>
        </CollapseTransition>
        <ReplaceTransition present={present} data-motion-alias="replace">
          <div className="ui-doc-example-chip">Replace</div>
        </ReplaceTransition>
      </div>
    </Stack>
  );
}

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
        <MotionTransition
          present={present}
          kind="scale"
          spring="expressive"
          data-motion-probe-surface
        >
          <div className="ui-doc-example-chip">Motion target</div>
        </MotionTransition>
      </Stack>
    </div>
  );
}
