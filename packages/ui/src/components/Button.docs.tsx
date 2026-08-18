import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { Button, Icon, Row, ToggleButton } from '@ontologyx/ui';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Button',
    layer: 'components',
    category: 'Actions', order: 10,
    summary: 'Developer-facing textual action with stable size, emphasis, tone, loading and content slots.',
    usage: 'Use for explicit actions; variant controls emphasis while tone carries semantic danger intent.',
    status: 'candidate',
    accessibility: 'Native button semantics, disabled/busy behavior, focus-visible and loading announcements are built in.',
    rtl: 'Leading/trailing content follows logical order and directional icons mirror through the Icon primitive.',
    touch: 'Shared press ownership supplies pressed state while native button activation preserves keyboard and assistive semantics.',
    responsive: 'Intrinsic by default and full-width on request; target size follows the UiRoot modality policy.',
    playground: {
      preferredWidth: 'medium',
      controls: ['variant', 'tone', 'size', 'loading', 'fullWidth'],
      fixture: { children: 'Continue' },
      options: {
        variant: ['ghost', 'soft', 'filled'],
        tone: ['default', 'danger'],
        size: ['sm', 'md', 'lg'],
      },
    },
    examples: [
      {
        id: 'states',
        title: 'Action states',
        description: 'Emphasis, danger tone, loading, icon slots and toggle state.',
        component: 'ButtonStatesExample',
      },
    ],
  },
  {
    exportName: 'ToggleButton',
    layer: 'components',
    category: 'Actions', order: 10,
    summary: 'Button-family toggle action with controlled or uncontrolled pressed state.',
    usage: 'Use for independent on/off actions that should expose aria-pressed rather than choice-field semantics.',
    status: 'candidate',
    accessibility: 'Uses native button semantics plus aria-pressed and the same focus/disabled behavior as Button.',
    rtl: 'Content slots remain logical and state semantics are direction-independent.',
    touch: 'Uses the Button target and shared press-state contract.',
    responsive: 'Shares Button sizing and full-width behavior.',
  },
] as const);

export function ButtonStatesExample() {
  return (
    <Row gap="sm" className="ui-doc-example-wrap">
      <Button variant="filled" leading={<Icon name="check" size="sm" />}>Primary</Button>
      <Button variant="soft">Secondary</Button>
      <Button tone="danger" variant="soft">Danger</Button>
      <ToggleButton defaultPressed>Favorite</ToggleButton>
      <Button loading loadingLabel="Saving">Saving</Button>
    </Row>
  );
}
