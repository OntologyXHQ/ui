import { Button, FieldGroup, FieldSection, Stack, TextField } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'FieldGroup',
    layer: 'components',
    category: 'Fields',
    order: 30,
    summary: 'Accessible grouping for related developer-facing form controls.',
    usage:
      'Use when several fields form one logical choice or data-entry group; it owns native fieldset/legend grouping and shared description relationships, not individual field chrome or validation.',
    status: 'accepted',
    accessibility:
      'Uses a native fieldset/legend relationship with aria-describedby for shared guidance while each child keeps its own native label, required and validation semantics.',
    rtl: 'Uses logical layout and inherits the scoped UI direction without reordering semantic field order.',
    touch:
      'Adds no private interaction layer; child Components preserve their own touch target and editing contracts.',
    responsive:
      'Vertical by default and capable of explicit horizontal composition without silently hiding fields.',
    examples: [
      {
        id: 'group-contract',
        title: 'Related fields',
        description:
          'A semantic field group keeps shared guidance separate from each native input relationship.',
        component: 'FieldGroupExample',
      },
    ],
  },
  {
    exportName: 'FieldSection',
    layer: 'components',
    category: 'Fields',
    order: 30,
    summary:
      'Section-level form composition with title, description and an optional action region.',
    usage:
      'Use for meaningful form sections such as profile, connectivity or account details; avoid using it as generic surface chrome.',
    status: 'accepted',
    accessibility:
      'Uses a real section with explicit labelled-by/described-by relationships and a bounded semantic Heading level.',
    rtl: 'Header/action composition is logical-direction safe and does not reorder section content.',
    touch: 'Section actions retain the accepted Button/IconButton interaction contracts.',
    responsive:
      'Header, action and field content reflow inside narrow containers without hiding form controls.',
    examples: [
      {
        id: 'section-contract',
        title: 'Form section',
        description:
          'A labelled form section composes accepted field and action controls without taking ownership of their state.',
        component: 'FieldSectionExample',
      },
    ],
  },
] as const);

export function FieldGroupExample() {
  return (
    <FieldGroup label="Identity" description="Names used by workspace surfaces.">
      <TextField label="Display name" defaultValue="OntologyX" required />
      <TextField label="Handle" prefix="@" defaultValue="ontologyx" />
    </FieldGroup>
  );
}

export function FieldSectionExample() {
  return (
    <FieldSection
      title="Profile"
      description="Section ownership stops at structure and relationships."
      action={<Button variant="secondary">Reset profile</Button>}
    >
      <Stack gap="sm">
        <TextField label="Display name" defaultValue="OntologyX" />
        <TextField label="Contact email" type="email" defaultValue="hello@example.com" />
      </Stack>
    </FieldSection>
  );
}
