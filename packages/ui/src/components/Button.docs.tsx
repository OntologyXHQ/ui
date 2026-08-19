import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { Button, Icon, Row, Stack, Text, ToggleButton } from '@ontologyx/ui';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Button', layer: 'components', category: 'Actions', order: 10,
    summary: 'Native action control with quiet/secondary/primary emphasis, destructive intent, form semantics, shared press ownership and explicit pending state.',
    usage: 'Use for momentary actions. Choose emphasis independently from destructive intent; use ToggleButton only when a pressed state is genuinely part of the action semantics.',
    status: 'accepted',
    accessibility: 'Preserves native button/form activation, disabled and busy semantics; loading replaces the accessible name while canceling active press ownership.',
    rtl: 'Leading/trailing slots are logical and directional glyphs mirror through Icon without reordering DOM content.',
    touch: 'Shared Press/Gesture Arena ownership preserves pointer/touch cancellation and modality-driven minimum targets.',
    responsive: 'Intrinsic by default or full-inline-size on request; content truncation/wrapping stays inside the caller-owned layout.',
    playground: {
      preferredWidth: 'medium', controls: ['variant', 'intent', 'size', 'loading', 'fullWidth'], fixture: { children: 'Continue' },
      options: { variant: ['quiet', 'secondary', 'primary'], intent: ['neutral', 'destructive'], size: ['sm', 'md', 'lg'] },
    },
    examples: [{ id: 'contract', title: 'Native action contract', description: 'Emphasis, destructive intent, loading cancellation, logical slots and explicit submit behavior.', component: 'ButtonContractExample' }],
  },
  {
    exportName: 'ToggleButton', layer: 'components', category: 'Actions', order: 10,
    summary: 'Button-family toggle action with controlled or uncontrolled pressed state.', usage: 'Use for independent on/off actions that should expose aria-pressed rather than choice-field semantics.',
    status: 'candidate', accessibility: 'Uses native button semantics plus aria-pressed and the same focus/disabled behavior as Button.',
    rtl: 'Content slots remain logical and state semantics are direction-independent.', touch: 'Uses the Button target and shared press-state contract.', responsive: 'Shares Button sizing and full-width behavior.',
  },
] as const);

export function ButtonContractExample() {
  const [submits, setSubmits] = useState(0);
  const [activations, setActivations] = useState(0);
  return (
    <Stack gap="md">
      <Row gap="sm" className="ui-doc-example-wrap">
        <Button variant="primary" leading={<Icon name="check" size="sm" />} onClick={() => setActivations((value) => value + 1)}>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="quiet">Quiet</Button>
        <Button intent="destructive" variant="secondary">Delete</Button>
        <Button disabled>Disabled</Button>
        <Button loading loadingLabel="Saving changes">Saving</Button>
      </Row>
      <form onSubmit={(event) => { event.preventDefault(); setSubmits((value) => value + 1); }}>
        <Button type="submit" variant="primary" trailing={<Icon name="chevron-end" size="sm" />}>Submit form</Button>
      </form>
      <Text data-action-primary-count={activations}>Primary activation count: {activations}</Text>
      <Text data-action-submit-count={submits}>Native submit count: {submits}</Text>
    </Stack>
  );
}
