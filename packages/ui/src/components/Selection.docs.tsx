import {
  Button,
  Checkbox,
  Radio,
  RadioGroup,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  Text,
  ToggleGroup,
} from '@ontologyx/ui';
import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Checkbox',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Native binary or mixed-state choice with controlled/uncontrolled ownership, read-only policy and form reset recovery.',
    usage:
      'Use for independent form-style choices; mixed is a transient presentation owned separately from the persisted checked value.',
    status: 'accepted',
    accessibility:
      'Native checkbox semantics, explicit mixed state and label/description relationships remain intact.',
    rtl: 'Indicator and copy use logical layout.',
    touch: 'The full labelled row preserves the shared coarse-pointer target floor.',
    responsive: 'Copy wraps without shrinking the indicator.',
    examples: [
      {
        id: 'native-contract',
        title: 'Native selection + form reset',
        component: 'SelectionNativeContractExample',
      },
    ],
  },
  {
    exportName: 'RadioGroup',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Mutually-exclusive native Radio owner with controlled/uncontrolled value and native form-reset recovery.',
    usage:
      'Own one related Radio set and a stable accessible group name; use SegmentedControl for compact mode selection.',
    status: 'accepted',
    accessibility:
      'Radiogroup semantics wrap native radio controls with shared naming and read-only/disabled policy.',
    rtl: 'Horizontal and vertical groups preserve logical order.',
    touch: 'Every child Radio row is the activation target.',
    responsive: 'Copy reflows naturally.',
    examples: [
      {
        id: 'native-contract',
        title: 'Native selection + form reset',
        component: 'SelectionNativeContractExample',
      },
    ],
  },
  {
    exportName: 'Radio',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary: 'Native radio choice whose selected value is owned by RadioGroup.',
    usage: 'Render only inside RadioGroup with a unique value and visible label.',
    status: 'accepted',
    accessibility:
      'Native radio keyboard, checked and label/description relationships remain browser-owned.',
    rtl: 'Indicator/copy order is logical.',
    touch: 'Whole labelled row activates.',
    responsive: 'Description wraps independently.',
    examples: [
      {
        id: 'native-contract',
        title: 'Native selection + form reset',
        component: 'SelectionNativeContractExample',
      },
    ],
  },
  {
    exportName: 'Switch',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Immediate on/off setting with controlled/uncontrolled state and realm-owned shared pan gesture support.',
    usage:
      'Use for settings that take effect immediately; use Checkbox for submitted form choices.',
    status: 'accepted',
    accessibility:
      'Role=switch and aria-checked expose state while the visible label activates the native button.',
    rtl: 'Drag direction resolves against UiRoot logical direction.',
    touch: 'Tap and pan share Gesture Arena ownership.',
    responsive: 'Copy wraps beside fixed affordance.',
    examples: [
      {
        id: 'state-contract',
        title: 'Switch + toggle state',
        component: 'SelectionStateContractExample',
      },
    ],
  },
  {
    exportName: 'Slider',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Single numeric value control with shared pan ownership, keyboard steps, logical RTL direction and optional marks.',
    usage:
      'Use for bounded numeric adjustment when direct manipulation is more useful than text entry.',
    status: 'accepted',
    accessibility: 'Exposes slider value/min/max/orientation semantics and Home/End/Page keys.',
    rtl: 'Horizontal arrows/value growth are logical.',
    touch: 'Uses shared pan arena.',
    responsive: 'Fills its container.',
    playground: { preferredWidth: 'medium', fixture: { label: 'Volume', defaultValue: 64 } },
  },
  {
    exportName: 'SegmentedControl',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Compact single-selection radiogroup with controlled/uncontrolled normalization and logical roving focus.',
    usage: 'Use for a small peer set of modes/views, not application routing.',
    status: 'accepted',
    accessibility:
      'Radiogroup/radio semantics keep one selected option and one roving tab stop even after invalid controlled input.',
    rtl: 'Horizontal roving follows logical direction.',
    touch: 'Each segment preserves target policy.',
    responsive: 'Intrinsic or full-width.',
    playground: {
      preferredWidth: 'medium',
      fixture: {
        label: 'Density',
        options: [
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
        ],
        defaultValue: 'comfortable',
      },
    },
    examples: [
      {
        id: 'group-contract',
        title: 'Segmented + independent toggle groups',
        component: 'SelectionGroupContractExample',
      },
    ],
  },
  {
    exportName: 'ToggleGroup',
    layer: 'components',
    category: 'Selection',
    order: 20,
    summary:
      'Independent multi-toggle group with immutable normalized values and one logical roving tab stop.',
    usage: 'Use for a small labelled collection of independent aria-pressed actions.',
    status: 'accepted',
    accessibility:
      'Group naming plus ToggleButton aria-pressed semantics expose each independent state.',
    rtl: 'Roving focus follows logical direction.',
    touch: 'Members inherit Button targets.',
    responsive: 'Parent layout owns wrapping.',
    playground: {
      preferredWidth: 'medium',
      fixture: {
        label: 'View options',
        options: [
          { value: 'grid', label: 'Grid' },
          { value: 'list', label: 'List' },
        ],
        defaultValue: ['grid'],
      },
    },
    examples: [
      {
        id: 'group-contract',
        title: 'Segmented + independent toggle groups',
        component: 'SelectionGroupContractExample',
      },
    ],
  },
] as const);

export function SelectionNativeContractExample() {
  const [submits, setSubmits] = useState('none');
  return (
    <Stack gap="md">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setSubmits(`${data.get('preview') ?? 'off'}:${data.get('theme') ?? 'none'}`);
        }}
      >
        <Stack gap="sm">
          <Checkbox
            name="preview"
            value="on"
            defaultChecked
            label="Show previews"
            description="Independent native checkbox"
          />
          <Checkbox label="Mixed import state" indeterminate readOnly />
          <RadioGroup label="Theme" name="theme" defaultValue="system">
            <Radio value="system" label="System" />
            <Radio value="dark" label="Dark" />
          </RadioGroup>
          <Button type="submit" variant="primary">
            Submit choices
          </Button>
          <Button type="reset" variant="secondary">
            Reset choices
          </Button>
        </Stack>
      </form>
      <Text data-selection-form-result>Submitted: {submits}</Text>
    </Stack>
  );
}

export function SelectionStateContractExample() {
  return (
    <Stack gap="md">
      <Switch
        defaultChecked
        label="Live updates"
        description="Tap or drag; drag direction follows RTL."
      />
    </Stack>
  );
}

export function SelectionGroupContractExample() {
  return (
    <Stack gap="md">
      <SegmentedControl
        label="Density"
        defaultValue="compact"
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]}
      />
      <ToggleGroup
        label="Tools"
        options={[
          { value: 'grid', label: 'Grid' },
          { value: 'snap', label: 'Snap' },
          { value: 'locked', label: 'Locked', disabled: true },
        ]}
      />
    </Stack>
  );
}

export function SelectionControlsExample() {
  const [slider, setSlider] = useState(60);
  return (
    <Stack gap="md">
      <SelectionNativeContractExample />
      <SelectionStateContractExample />
      <SelectionGroupContractExample />
      <Slider
        label="Volume"
        value={slider}
        onValueChange={setSlider}
        marks={[{ value: 0 }, { value: 50 }, { value: 100 }]}
      />
    </Stack>
  );
}
