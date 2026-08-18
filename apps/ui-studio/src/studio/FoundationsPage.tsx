import {
  useState } from 'react';
import {
  Button,
  Grid,
  Heading,
  Label,
  Row,
  ScrollView,
  Stack,
  Surface,
  Text,
  UiRoot,
} from '@ontologyx/ui';
import {
  useUiEnvironment,
  type UiDensity,
  type UiDirection,
  type UiModalityPreference,
  type UiPointerPrecisionPreference,
  type UiTheme,
} from '@ontologyx/ui/advanced';
import type { MotionPreference } from '@ontologyx/ui/advanced';
import { StudioNav } from './StudioNav';

const themes: readonly UiTheme[] = ['system', 'dark', 'light', 'custom'];
const directions: readonly UiDirection[] = ['auto', 'ltr', 'rtl'];
const densities: readonly UiDensity[] = ['auto', 'compact', 'comfortable'];
const motions: readonly MotionPreference[] = ['system', 'full', 'reduced'];
const modalities: readonly UiModalityPreference[] = ['auto', 'mouse', 'touch', 'pen', 'keyboard'];
const precisions: readonly UiPointerPrecisionPreference[] = ['auto', 'fine', 'coarse'];
const widths = {
  compact: '24rem',
  medium: '46rem',
  wide: '72rem',
} as const;

type PreviewWidth = keyof typeof widths;

function ChoiceRow<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: T;
  values: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <Stack gap="xs">
      <Label tone="tertiary" emphasis="strong">
        {label}
      </Label>
      <Row gap="xs" className="ui-foundations-choice-row">
        {values.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={value === option ? 'filled' : 'ghost'}
            onClick={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </Row>
    </Stack>
  );
}

function EnvironmentReadout() {
  const environment = useUiEnvironment();
  return (
    <Grid min="card" gap="sm" className="ui-foundations-readout">
      {[
        ['theme', environment.theme],
        ['direction', environment.direction],
        ['density', environment.density],
        ['modality', environment.modality],
        ['precision', environment.pointerPrecision],
      ].map(([label, value]) => (
        <Surface key={label} material="subtle" radius="md" className="ui-foundations-readout__item">
          <Label tone="tertiary">{label}</Label>
          <Text variant="body-strong">{value}</Text>
        </Surface>
      ))}
    </Grid>
  );
}

function AdaptivePreview({ width, motion }: { width: PreviewWidth; motion: MotionPreference }) {
  return (
    <div className="ui-foundations-preview-frame">
      <UiRoot
        scope="nested"
        motion={motion}
        safeArea={{ blockStart: 12, inlineEnd: 18, blockEnd: 20, inlineStart: 18 }}
        style={{ inlineSize: widths[width], maxInlineSize: '100%', marginInline: 'auto' }}
      >
        <div className="ui-foundations-preview">
          <Stack gap="md">
            <Row justify="between" align="center" gap="sm" className="ui-foundations-preview__header">
              <Stack gap="3xs">
                <Label tone="accent" emphasis="strong">
                  Container scope
                </Label>
                <Heading level={3} size="heading">
                  Available space owns adaptation
                </Heading>
              </Stack>
              <span className="ui-foundations-size-chip">{width}</span>
            </Row>
            <div className="ui-foundations-adaptive-grid">
              <Surface material="solid" radius="lg" className="ui-foundations-demo-card ui-foundations-demo-card--primary">
                <Stack gap="xs">
                  <Label tone="tertiary">Logical start</Label>
                  <Heading level={4} size="heading">سلام OXS</Heading>
                  <Text tone="secondary">
                    The same structure adapts by container width, not by device names.
                  </Text>
                </Stack>
              </Surface>
              <Surface material="subtle" radius="lg" className="ui-foundations-demo-card">
                <Stack gap="xs">
                  <Label tone="tertiary">Touch target floor</Label>
                  <Button fullWidth>Primary action</Button>
                </Stack>
              </Surface>
              <Surface material="subtle" radius="lg" className="ui-foundations-demo-card">
                <Stack gap="xs">
                  <Label tone="tertiary">Safe logical edges</Label>
                  <Text tone="secondary">block-start · inline-end · block-end · inline-start</Text>
                </Stack>
              </Surface>
            </div>
          </Stack>
        </div>
      </UiRoot>
    </div>
  );
}

export function FoundationsPage() {
  const [theme, setTheme] = useState<UiTheme>('system');
  const [direction, setDirection] = useState<UiDirection>('ltr');
  const [density, setDensity] = useState<UiDensity>('auto');
  const [motion, setMotion] = useState<MotionPreference>('system');
  const [modality, setModality] = useState<UiModalityPreference>('auto');
  const [pointerPrecision, setPointerPrecision] =
    useState<UiPointerPrecisionPreference>('auto');
  const [previewWidth, setPreviewWidth] = useState<PreviewWidth>('medium');

  const customTokens =
    theme === 'custom'
      ? {
          'color-accent': '#74efc1',
          'color-accent-hover': '#91f5cf',
          'color-accent-pressed': '#55d7a8',
          'color-on-accent': '#082018',
          'color-accent-soft': 'rgba(116, 239, 193, 0.14)',
          'color-accent-glow': 'rgba(116, 239, 193, 0.18)',
          'radius-lg': '1.75rem',
          'radius-xl': '2.25rem',
        }
      : undefined;

  return (
    <UiRoot
      theme={theme}
      colorScheme={theme === 'custom' ? 'dark' : 'auto'}
      direction={direction}
      density={density}
      motion={motion}
      modality={modality}
      pointerPrecision={pointerPrecision}
      tokens={customTokens}
    >
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OntologyX UI foundations playground">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="foundations" />

            <section className="ui-foundations-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP02</Label>
                  <Label tone="tertiary">Foundations + environment</Label>
                </Row>
                <Heading level={1} size="display">One environment. Every layer above it.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable>
                  Theme, direction, density, motion preference, input modality, pointer precision,
                  logical safe areas and container-first adaptation are now one scoped contract.
                  Change them here and watch the same UI respond without feature-specific branches.
                </Text>
              </Stack>
            </section>

            <Surface material="glass" elevation={1} radius="xl" className="ui-foundations-controls">
              <Grid min="wide" gap="lg">
                <ChoiceRow label="Theme" value={theme} values={themes} onChange={setTheme} />
                <ChoiceRow label="Direction" value={direction} values={directions} onChange={setDirection} />
                <ChoiceRow label="Density" value={density} values={densities} onChange={setDensity} />
                <ChoiceRow label="Motion" value={motion} values={motions} onChange={setMotion} />
                <ChoiceRow label="Input modality" value={modality} values={modalities} onChange={setModality} />
                <ChoiceRow
                  label="Pointer precision"
                  value={pointerPrecision}
                  values={precisions}
                  onChange={setPointerPrecision}
                />
              </Grid>
            </Surface>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Resolved environment</Label>
                  <Heading level={2} size="title">Live foundation state</Heading>
                </Stack>
                <EnvironmentReadout />
              </Stack>
            </section>

            <section>
              <Stack gap="md">
                <Row justify="between" align="end" gap="md" className="ui-foundations-section-head">
                  <Stack gap="2xs">
                    <Label tone="accent" emphasis="strong">Container-first</Label>
                    <Heading level={2} size="title">Resize the scope, not the device</Heading>
                    <Text tone="tertiary">The nested UiRoot is also an inline-size container.</Text>
                  </Stack>
                  <ChoiceRow
                    label="Preview width"
                    value={previewWidth}
                    values={Object.keys(widths) as PreviewWidth[]}
                    onChange={setPreviewWidth}
                  />
                </Row>
                <AdaptivePreview width={previewWidth} motion={motion} />
              </Stack>
            </section>

            <Grid min="wide" gap="md">
              <Surface material="subtle" radius="lg" className="ui-foundations-contract-card">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">RTL / bidi</Label>
                  <Heading level={3} size="heading">Start and end are semantic</Heading>
                  <Text tone="secondary">
                    Spacing and alignment use logical edges. Physical coordinates remain reserved for
                    genuine geometry such as pointer and floating-surface positioning.
                  </Text>
                </Stack>
              </Surface>
              <Surface material="subtle" radius="lg" className="ui-foundations-contract-card">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">Touch-first</Label>
                  <Heading level={3} size="heading">44px is the floor, not the enhancement</Heading>
                  <Text tone="secondary">
                    Fine and coarse pointers share a usable minimum target; coarse precision can raise
                    the target without changing component APIs.
                  </Text>
                </Stack>
              </Surface>
              <Surface material="subtle" radius="lg" className="ui-foundations-contract-card">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">Customization</Label>
                  <Heading level={3} size="heading">Typed tokens, scoped overrides</Heading>
                  <Text tone="secondary">
                    The custom theme above changes semantic CSS variables on this UiRoot only. No
                    runtime CSS-in-JS engine or global theme mutation is required.
                  </Text>
                </Stack>
              </Surface>
            </Grid>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}
