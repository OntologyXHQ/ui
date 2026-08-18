import { Label, Row, Select, Surface, Toolbar } from '@oxs/ui';
import { useStudioEnvironment } from './StudioEnvironment';

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'custom', label: 'Custom' },
] as const;
const directionOptions = [
  { value: 'ltr', label: 'LTR' },
  { value: 'rtl', label: 'RTL' },
  { value: 'auto', label: 'Auto' },
] as const;
const densityOptions = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
  { value: 'auto', label: 'Auto' },
] as const;
const motionOptions = [
  { value: 'system', label: 'Motion: system' },
  { value: 'full', label: 'Motion: full' },
  { value: 'reduced', label: 'Reduced motion' },
] as const;
const modalityOptions = [
  { value: 'auto', label: 'Input: auto' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'touch', label: 'Touch' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'pen', label: 'Pen' },
] as const;
const pointerOptions = [
  { value: 'auto', label: 'Pointer: auto' },
  { value: 'fine', label: 'Fine pointer' },
  { value: 'coarse', label: 'Coarse pointer' },
] as const;
const viewportOptions = [
  { value: 'fit', label: 'Viewport: fit' },
  { value: 'phone', label: '390 · phone' },
  { value: 'tablet', label: '820 · tablet' },
  { value: 'desktop', label: '1280 · desktop' },
  { value: 'ultrawide', label: '1720 · ultrawide' },
] as const;
const containerOptions = [
  { value: 'auto', label: 'Container: auto' },
  { value: 'compact', label: 'Compact content' },
  { value: 'content', label: 'Content width' },
  { value: 'wide', label: 'Wide content' },
] as const;
const safeAreaOptions = [
  { value: 'none', label: 'Safe area: none' },
  { value: 'notch', label: 'Notch' },
  { value: 'gesture', label: 'Gesture inset' },
  { value: 'keyboard', label: 'Keyboard occlusion' },
] as const;

export function StudioEnvironmentToolbar() {
  const { environment, update } = useStudioEnvironment();
  return (
    <Surface className="ui-studio-environment" material="subtle" radius="md">
      <Row gap="sm" align="center" className="ui-studio-environment__row">
        <Label tone="tertiary" emphasis="strong" className="ui-studio-environment__label">
          Environment
        </Label>
        <Toolbar label="Global UI environment" className="ui-studio-environment__toolbar">
          <Select
            label="Theme"
            hideLabel
            fieldSize="sm"
            options={themeOptions}
            value={environment.theme}
            onValueChange={(value) => update('theme', value as typeof environment.theme)}
          />
          <Select
            label="Direction"
            hideLabel
            fieldSize="sm"
            options={directionOptions}
            value={environment.direction}
            onValueChange={(value) => update('direction', value as typeof environment.direction)}
          />
          <Select
            label="Density"
            hideLabel
            fieldSize="sm"
            options={densityOptions}
            value={environment.density}
            onValueChange={(value) => update('density', value as typeof environment.density)}
          />
          <Select
            label="Motion"
            hideLabel
            fieldSize="sm"
            options={motionOptions}
            value={environment.motion}
            onValueChange={(value) => update('motion', value as typeof environment.motion)}
          />
          <Select
            label="Input modality"
            hideLabel
            fieldSize="sm"
            options={modalityOptions}
            value={environment.modality}
            onValueChange={(value) => update('modality', value as typeof environment.modality)}
          />
          <Select
            label="Pointer precision"
            hideLabel
            fieldSize="sm"
            options={pointerOptions}
            value={environment.pointerPrecision}
            onValueChange={(value) => update('pointerPrecision', value as typeof environment.pointerPrecision)}
          />
          <Select
            label="Viewport preset"
            hideLabel
            fieldSize="sm"
            options={viewportOptions}
            value={environment.viewport}
            onValueChange={(value) => update('viewport', value as typeof environment.viewport)}
          />
          <Select
            label="Content container preset"
            hideLabel
            fieldSize="sm"
            options={containerOptions}
            value={environment.container}
            onValueChange={(value) => update('container', value as typeof environment.container)}
          />
          <Select
            label="Safe area and occlusion"
            hideLabel
            fieldSize="sm"
            options={safeAreaOptions}
            value={environment.safeAreaPreset}
            onValueChange={(value) => update('safeAreaPreset', value as typeof environment.safeAreaPreset)}
          />
        </Toolbar>
      </Row>
    </Surface>
  );
}
