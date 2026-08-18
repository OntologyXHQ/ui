import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { FieldGroup, FieldSection, TextField } from '@ontologyx/ui';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'FieldGroup',
    layer: 'components',
    category: 'Fields', order: 30,
    summary: 'Accessible grouping for related developer-facing form controls.',
    usage:
      'Use when several fields form one logical choice or data-entry group; it owns group labeling, not individual field chrome.',
    status: 'candidate',
    accessibility: 'Connects group label and description to a semantic group relationship.',
    rtl: 'Uses logical layout and inherits the scoped UI direction.',
    touch: 'Adds no private interaction layer; child Components own their touch contracts.',
    responsive: 'Vertical by default and capable of container-driven horizontal composition.',
  },
  {
    exportName: 'FieldSection',
    layer: 'components',
    category: 'Fields', order: 30,
    summary: 'Section-level form composition with title, description and an optional action region.',
    usage:
      'Use for meaningful form sections such as profile, connectivity or account details; avoid using it as generic surface chrome.',
    status: 'candidate',
    accessibility: 'Uses a real section with an explicit labelled-by relationship.',
    rtl: 'Header/action composition is logical-direction safe.',
    touch: 'Action ownership remains with child Components.',
    responsive: 'Header and content reflow inside narrow containers.',
    examples: [
      {
        id: 'overview',
        title: 'Form composition',
        description: 'Field section and group composition using the same field Components as application code.',
        component: 'FieldCompositionExample',
      },
    ],
  },
] as const);

export function FieldCompositionExample() {
  return (
    <FieldSection title="Profile" description="Shared field chrome keeps relationships consistent.">
      <FieldGroup label="Identity" description="A logical group of related fields.">
        <TextField label="Display name" defaultValue="OXS" required />
        <TextField label="Handle" prefix="@" placeholder="handle" />
      </FieldGroup>
    </FieldSection>
  );
}
