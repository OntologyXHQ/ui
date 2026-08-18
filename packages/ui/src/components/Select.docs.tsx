import { useState } from 'react';
import { defineUiDocs } from '../docs/defineUiDocs';
import { Select } from '../index';

export const uiDocs = defineUiDocs({
  exportName: 'Select',
  layer: 'components',
  category: 'Fields', order: 30,
  summary: 'Choice field using the shared field frame plus the common floating, overlay and roving-focus services.',
  usage:
    'Use for a bounded option set. Searchable combobox behavior is intentionally not bundled into Select until a capability demand requires it.',
  status: 'provisional',
  accessibility: 'Trigger exposes listbox state; options use selected/disabled semantics and keyboard selection.',
  rtl: 'Floating placement and trigger geometry resolve through the shared direction-aware services.',
  touch: 'Trigger and options use touch-safe Component sizing without a private pointer engine.',
  responsive: 'Popup width tracks the trigger minimum while remaining viewport-collision safe.',
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
      id: 'overview',
      title: 'Choice field',
      description: 'A bounded choice field without a second popup implementation.',
      component: 'SelectExample',
    },
  ],
} as const);

const options = [
  { value: 'comfortable', label: 'Comfortable', description: 'More breathing room.' },
  { value: 'compact', label: 'Compact', description: 'Denser information layout.' },
  { value: 'locked', label: 'Unavailable', disabled: true },
] as const;

export function SelectExample() {
  const [value, setValue] = useState('comfortable');
  return <Select label="Density" options={options} value={value} onValueChange={setValue} />;
}
