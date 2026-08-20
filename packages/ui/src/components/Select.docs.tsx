import { Button, Select, Stack, Text } from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocs } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocs({
  exportName: 'Select',
  layer: 'components',
  category: 'Fields',
  order: 30,
  summary:
    'Bounded native-form choice field backed by the shared field frame, overlay authority and Unicode typeahead controller.',
  usage:
    'Use for a finite option set. The trigger retains focus while aria-activedescendant tracks the listbox; searchable combobox behavior stays out of this primitive.',
  status: 'accepted',
  accessibility:
    'Combobox/listbox relationships, active-descendant, disabled options, required validity and visible-trigger focus restoration are explicit.',
  rtl: 'Floating placement and trigger/listbox geometry resolve through shared direction-aware services.',
  touch: 'Trigger and options preserve Component target sizing without private pointer ownership.',
  responsive:
    'Popup width follows the trigger minimum while shared collision handling keeps it inside the viewport.',
  playground: {
    preferredWidth: 'medium',
    controls: ['value', 'disabled', 'required'],
    fixture: {
      label: 'Density',
      value: 'comfortable',
      options: [
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
      ],
    },
  },
  examples: [
    {
      id: 'contract',
      title: 'Typeahead + native form contract',
      description:
        'Required validity, reset, disabled options and trigger-retained listbox interaction share one selection owner.',
      component: 'SelectContractExample',
    },
  ],
} as const);

const options = [
  { value: 'comfortable', label: 'Comfortable', description: 'More breathing room.' },
  { value: 'compact', label: 'Compact', description: 'Denser information layout.' },
  { value: 'cozy', label: 'Cozy', description: 'Balanced spacing.' },
  { value: 'locked', label: 'Unavailable', disabled: true },
] as const;

export function SelectContractExample() {
  const [submitted, setSubmitted] = useState('none');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSubmitted(String(data.get('density') ?? 'none'));
      }}
    >
      <Stack gap="sm">
        <Select
          label="Density"
          name="density"
          options={options}
          defaultValue="comfortable"
          required
        />
        <Button type="submit" variant="primary">
          Submit density
        </Button>
        <Button type="reset" variant="secondary">
          Reset density
        </Button>
        <Text data-select-form-result>Submitted: {submitted}</Text>
      </Stack>
    </form>
  );
}

export function SelectExample() {
  const [value, setValue] = useState('comfortable');
  return <Select label="Density" options={options} value={value} onValueChange={setValue} />;
}
