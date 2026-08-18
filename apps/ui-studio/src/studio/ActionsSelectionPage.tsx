import {
  Button,
  Checkbox,
  Grid,
  Heading,
  IconButton,
  Label,
  Radio,
  RadioGroup,
  Row,
  ScrollView,
  SegmentedControl,
  Slider,
  Stack,
  Surface,
  Switch,
  Text,
  ToggleButton,
  ToggleGroup,
  UiRoot,
  Wrap,
} from '@oxs/ui';
import { useState } from 'react';
import { StudioNav } from './StudioNav';

const densityOptions = [
  { value: 'compact', label: 'Compact' },
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'spacious', label: 'Spacious' },
] as const;

const toolOptions = [
  { value: 'grid', label: 'Grid', icon: 'apps' as const },
  { value: 'snap', label: 'Snap' },
  { value: 'labels', label: 'Labels' },
] as const;

export function ActionsSelectionPage() {
  const [theme, setTheme] = useState('system');
  const [notifications, setNotifications] = useState(true);
  const [volume, setVolume] = useState(64);
  const [density, setDensity] = useState('comfortable');
  const [tools, setTools] = useState<readonly string[]>(['grid']);

  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI actions and selection Components">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="actions" />

            <section className="ui-studio-hero ui-actions-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP06</Label>
                  <Label tone="tertiary">Components · actions + selection</Label>
                </Row>
                <Heading level={1} size="display">The developer control floor.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Buttons, toggles and value controls now share the same primitive vocabulary, touch target policy,
                  focus language and interaction ownership. These are reusable application Components, not OXS shell widgets.
                </Text>
              </Stack>
            </section>

            <Grid min="wide" gap="lg">
              <Surface material="glass" elevation={1} radius="xl" className="ui-actions-card">
                <Stack gap="lg">
                  <Stack gap="2xs">
                    <Label tone="accent" emphasis="strong">Action family</Label>
                    <Heading level={2} size="title">One button language</Heading>
                    <Text tone="tertiary" variant="caption">variant × tone × size × loading × toggle</Text>
                  </Stack>
                  <Wrap gap="sm">
                    <Button variant="filled">Primary</Button>
                    <Button variant="soft">Secondary</Button>
                    <Button tone="danger" variant="soft">Remove</Button>
                    <Button leading="+">Create</Button>
                    <Button loading loadingLabel="Saving changes">Save</Button>
                  </Wrap>
                  <Wrap gap="sm">
                    <IconButton icon="search" label="Search" />
                    <IconButton icon="settings" label="Settings" variant="soft" />
                    <IconButton icon="check" label="Pinned" defaultPressed />
                    <ToggleButton defaultPressed>Preview</ToggleButton>
                    <Button disabled>Unavailable</Button>
                  </Wrap>
                </Stack>
              </Surface>

              <Surface material="glass" elevation={1} radius="xl" className="ui-actions-card">
                <Stack gap="lg">
                  <Stack gap="2xs">
                    <Label tone="accent" emphasis="strong">Choice family</Label>
                    <Heading level={2} size="title">State without duplicated state engines</Heading>
                  </Stack>
                  <Checkbox defaultChecked label="Show window previews" description="A normal independent choice" />
                  <Checkbox indeterminate label="Selected applications" description="Mixed child selection" />
                  <Checkbox disabled label="Managed by policy" />
                  <RadioGroup label="Theme" value={theme} onValueChange={setTheme} orientation="horizontal">
                    <Radio value="system" label="System" />
                    <Radio value="dark" label="Dark" />
                    <Radio value="light" label="Light" />
                  </RadioGroup>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                    label="Live notifications"
                    description="Tap it or drag the switch thumb"
                  />
                </Stack>
              </Surface>
            </Grid>

            <Surface material="subtle" radius="xl" className="ui-actions-card">
              <Stack gap="lg">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Direct manipulation</Label>
                  <Heading level={2} size="title">Slider + compact selection groups</Heading>
                </Stack>
                <Slider
                  label="Volume"
                  value={volume}
                  onValueChange={setVolume}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 50, label: '50' },
                    { value: 100, label: '100' },
                  ]}
                  formatValue={(value) => `${value}%`}
                />
                <SegmentedControl
                  label="Density"
                  value={density}
                  onValueChange={setDensity}
                  options={densityOptions}
                  fullWidth
                />
                <ToggleGroup label="Workspace tools" value={tools} onValueChange={setTools} options={toolOptions} />
                <Text tone="tertiary" variant="caption">
                  Density: {density} · Tools: {tools.length ? tools.join(', ') : 'none'}
                </Text>
              </Stack>
            </Surface>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Acceptance matrix</Label>
                  <Heading level={2} size="title">RTL + coarse pointer in the same patch</Heading>
                  <Text tone="secondary" wrap="pretty">
                    The patch closes direction and touch behavior now instead of scheduling a later retrofit.
                  </Text>
                </Stack>
                <Grid min="wide" gap="md">
                  <DirectionMatrix direction="ltr" />
                  <DirectionMatrix direction="rtl" />
                </Grid>
              </Stack>
            </section>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}

function DirectionMatrix({ direction }: { direction: 'ltr' | 'rtl' }) {
  const [value, setValue] = useState(35);
  return (
    <UiRoot scope="nested" direction={direction} modality="touch" pointerPrecision="coarse">
      <Surface material="glass" radius="xl" className="ui-actions-card">
        <Stack gap="md">
          <Row justify="between" gap="sm">
            <Label tone="accent" emphasis="strong">{direction.toUpperCase()}</Label>
            <Label tone="tertiary">touch · 48px floor</Label>
          </Row>
          <Switch defaultChecked label={direction === 'rtl' ? 'اتصال خودکار' : 'Auto connect'} />
          <Slider
            label={direction === 'rtl' ? 'روشنایی' : 'Brightness'}
            value={value}
            onValueChange={setValue}
            step={5}
          />
          <SegmentedControl
            label="Direction demo"
            defaultValue="one"
            options={[
              { value: 'one', label: direction === 'rtl' ? 'اول' : 'First' },
              { value: 'two', label: direction === 'rtl' ? 'دوم' : 'Second' },
            ]}
            fullWidth
          />
        </Stack>
      </Surface>
    </UiRoot>
  );
}
