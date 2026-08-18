import { useState } from 'react';
import { defineUiDocsGroup } from '../docs/defineUiDocs';
import {
  Checkbox,
  Radio,
  RadioGroup,
  SegmentedControl,
  Slider,
  Stack,
  Switch,
  ToggleGroup,
} from '../index';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Checkbox',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Binary or mixed-state choice with controlled/uncontrolled state and composed label/support copy.',
    usage: 'Use when multiple independent choices may be selected; use RadioGroup for mutually exclusive choices.',
    status: 'candidate',
    accessibility: 'Uses a native checkbox, explicit mixed state, disabled/read-only semantics and label association.',
    rtl: 'Indicator and copy use logical layout with no physical-side styling.',
    touch: 'The full label row is the target and inherits coarse-pointer minimum sizing.',
    responsive: 'Copy wraps naturally while the indicator keeps a stable target and alignment.',
    examples: [{ id: 'selection', title: 'Selection controls', component: 'SelectionControlsExample' }],
  },
  {
    exportName: 'RadioGroup',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Mutually-exclusive selection owner for native Radio items.',
    usage: 'Own one related set of Radio values and its accessible group label.',
    status: 'candidate',
    accessibility: 'Exposes radiogroup semantics while Radio preserves native radio behavior and keyboard support.',
    rtl: 'Horizontal and vertical groups follow logical document flow.',
    touch: 'Every Radio row is a full touch target.',
    responsive: 'Vertical groups wrap copy naturally; horizontal groups may wrap through surrounding layout composition.',
  },
  {
    exportName: 'Radio',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Native radio choice that receives value ownership from RadioGroup.',
    usage: 'Render only inside RadioGroup and provide a unique string value plus visible label.',
    status: 'candidate',
    accessibility: 'Native radio semantics, shared name and group ownership preserve expected keyboard/AT behavior.',
    rtl: 'Indicator and label order follows logical direction.',
    touch: 'The full label row activates the radio.',
    responsive: 'Description copy may wrap without shrinking the indicator target.',
  },
  {
    exportName: 'Switch',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Immediate on/off setting with controlled/uncontrolled state and shared horizontal pan gesture support.',
    usage: 'Use for settings that take effect immediately; use Checkbox for form-style selection.',
    status: 'candidate',
    accessibility: 'Uses role=switch with aria-checked/read-only and native button keyboard activation.',
    rtl: 'Thumb geometry and drag direction resolve against the active UiRoot direction.',
    touch: 'Tap and drag share the central gesture arena rather than private pointer ownership.',
    responsive: 'Label/support copy wraps independently from the fixed-size switch affordance.',
  },
  {
    exportName: 'Slider',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Single numeric value control with shared pan ownership, keyboard steps, logical RTL direction and optional marks.',
    usage: 'Use for bounded numeric adjustment when direct manipulation is more useful than text entry.',
    status: 'candidate',
    accessibility: 'Exposes slider value/min/max/orientation semantics and full keyboard stepping including Home/End/Page keys.',
    rtl: 'Horizontal value growth and arrow behavior resolve in logical direction; vertical values grow block-end to block-start.',
    touch: 'Track and thumb use the shared pan arena with an enlarged interaction target.',
    responsive: 'Horizontal slider fills its available container; vertical mode owns a stable minimum block size.',
  },
  {
    exportName: 'SegmentedControl',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Compact mutually-exclusive action/selection group with shared roving focus.',
    usage: 'Use for a small set of peer modes or views; do not use as application navigation.',
    status: 'candidate',
    accessibility: 'Radiogroup/radio semantics pair selection with shared keyboard roving focus.',
    rtl: 'Arrow navigation and item order resolve through logical direction.',
    touch: 'Every segment keeps the component control target policy.',
    responsive: 'Can remain intrinsic or fill the available inline size.',
    playground: {
      preferredWidth: 'medium',
      fixture: { label: 'View', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }], defaultValue: 'grid' },
    },
  },
  {
    exportName: 'ToggleGroup',
    layer: 'components',
    category: 'Selection', order: 20,
    summary: 'Multi-toggle grouping built from ToggleButton with shared roving focus and immutable value arrays.',
    usage: 'Use for a small collection of independent toggles that benefit from group labeling and keyboard traversal.',
    status: 'candidate',
    accessibility: 'Group labeling plus aria-pressed on each ToggleButton communicates independent toggle state.',
    rtl: 'Roving focus and content order follow logical direction.',
    touch: 'Each member uses the Button-family touch target and press ownership.',
    responsive: 'Wrap or constrain through parent layout; individual members keep minimum target size.',
    playground: {
      preferredWidth: 'medium',
      fixture: { label: 'View', options: [{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }], defaultValue: 'grid' },
    },
  },
] as const);

export function SelectionControlsExample() {
  const [radio, setRadio] = useState('system');
  const [slider, setSlider] = useState(60);
  return (
    <Stack gap="md">
      <Checkbox defaultChecked label="Show previews" description="Independent form-style choice" />
      <RadioGroup label="Theme" value={radio} onValueChange={setRadio}>
        <Radio value="system" label="System" />
        <Radio value="dark" label="Dark" />
      </RadioGroup>
      <Switch defaultChecked label="Live updates" description="Tap or drag" />
      <Slider label="Volume" value={slider} onValueChange={setSlider} marks={[{ value: 0 }, { value: 50 }, { value: 100 }]} />
      <SegmentedControl label="Density" options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }]} />
      <ToggleGroup label="Tools" options={[{ value: 'grid', label: 'Grid' }, { value: 'snap', label: 'Snap' }]} />
    </Stack>
  );
}
