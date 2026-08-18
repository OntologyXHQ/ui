import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { SearchField, Stack, TextArea, TextField } from '../index';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'TextField',
    layer: 'components',
    category: 'Fields', order: 30,
    summary: 'Single-line field built on the shared field frame and editable-text runtime.',
    usage:
      'Use for generic text entry; label, support/error relationships, affixes, actions and editing-state publication stay inside the shared field contract.',
    status: 'candidate',
    accessibility: 'Native input semantics with protected required/read-only/invalid relationships; meaningful affixes join aria-describedby, and secure fields block copy/cut from both keyboard and context-menu paths.',
    rtl: 'Field chrome uses logical edges while text content can independently use auto, LTR or RTL bidi direction.',
    touch: 'Uses the shared editable-text session and touch-safe field target sizing.',
    responsive: 'Fills available container width without device-name breakpoints.',
    examples: [
      {
        id: 'overview',
        title: 'Field states',
        description: 'Required, affixed, invalid and search states from one shared field frame.',
        component: 'TextFieldStatesExample',
      },
    ],
  },
  {
    exportName: 'SearchField',
    layer: 'components',
    category: 'Fields', order: 30,
    summary: 'Search-specialized TextField with clear behavior and an optional suggestions-request seam.',
    usage:
      'Use for search/filter entry; suggestions are requested through a callback so the field does not own a second popup engine.',
    status: 'candidate',
    accessibility: 'Carries searchbox semantics, an accessible default label and labelled clear/suggestions actions.',
    rtl: 'Search text and affordances preserve logical ordering and bidi behavior.',
    touch: 'Clear and suggestions actions use the shared IconButton hit-target policy.',
    responsive: 'Designed for full-width narrow containers and adaptive toolbars.',
    playground: {
      preferredWidth: 'medium',
      controls: ['value', 'disabled', 'readOnly', 'suggestionsAvailable'],
      fixture: { value: 'Launcher', label: 'Search applications', placeholder: 'Search apps and commands' },
    },
  },
  {
    exportName: 'TextArea',
    layer: 'components',
    category: 'Fields', order: 30,
    summary: 'Multiline field sharing the same editing, validation and field-frame contracts.',
    usage:
      'Use for multiline text. Resize policy is explicit and optional character guidance is owned by the field support region.',
    status: 'candidate',
    accessibility: 'Native textarea semantics with protected label/description/error relationships; optional character count stays visible without announcing every keystroke.',
    rtl: 'Supports content bidi direction independently of logical field chrome.',
    touch: 'Selection/composition flows through the shared editable-text runtime.',
    responsive: 'Block resize and width remain container-safe.',
    examples: [
      {
        id: 'multiline',
        title: 'Multiline',
        description: 'Character guidance and multiline editing share the canonical field frame.',
        component: 'TextAreaExample',
      },
    ],
  },
] as const);

export function TextFieldStatesExample() {
  const [value, setValue] = useState('OXS');
  const [search, setSearch] = useState('Launcher');
  return (
    <Stack gap="sm">
      <TextField
        label="Workspace name"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        description="Shown in local system surfaces."
        required
      />
      <TextField label="Handle" prefix="@" suffix=".local" placeholder="workspace" />
      <TextField label="Recovery code" defaultValue="expired-code" error="This code has expired." />
      <SearchField
        value={search}
        onValueChange={setSearch}
        placeholder="Search apps"
        suggestionsAvailable
        onSuggestionsRequest={() => {}}
      />
    </Stack>
  );
}

export function TextAreaExample() {
  const [value, setValue] = useState('Touch-first, responsive and RTL-safe.');
  return (
    <TextArea
      label="Notes"
      value={value}
      onChange={(event) => setValue(event.currentTarget.value)}
      maxLength={160}
      showCharacterCount
      rows={5}
    />
  );
}
