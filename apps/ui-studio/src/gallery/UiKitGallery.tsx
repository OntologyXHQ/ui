import {
  ApplicationItem,
  Button,
  Grid,
  Heading,
  Icon,
  IconButton,
  Label,
  Row,
  Scrim,
  ScrollView,
  SearchField,
  Stack,
  Surface,
  Text,
  TextField,
  UiRoot,
} from '@oxs/ui';
import {
  type FrameRateTarget,
  type MotionPreference,
  type UiDensity,
  type UiTheme,
} from '@oxs/ui/advanced';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { StudioNav } from '../studio/StudioNav';
import { CursorLab } from './CursorLab';
import { MotionLab } from './MotionLab';
import { ScrollLab } from './ScrollLab';
import { SystemUiPatternsLab } from './SystemUiPatternsLab';
import '../styles/ui-kit-gallery.css';

const tokenGroups = [
  [
    'Semantic color',
    '--oxs-color-canvas',
    '--oxs-color-surface',
    '--oxs-color-text-primary',
    '--oxs-color-accent',
  ],
  [
    'Type',
    '--oxs-type-display-size',
    '--oxs-type-title-size',
    '--oxs-type-body-size',
    '--oxs-type-label-size',
  ],
  [
    'Space',
    '--oxs-space-xs',
    '--oxs-space-sm',
    '--oxs-space-md',
    '--oxs-space-lg',
    '--oxs-space-xl',
  ],
  ['Shape', '--oxs-radius-sm', '--oxs-radius-md', '--oxs-radius-lg', '--oxs-radius-xl'],
  [
    'Material',
    '--oxs-material-blur',
    '--oxs-elevation-1',
    '--oxs-elevation-2',
    '--oxs-elevation-3',
  ],
  [
    'Interaction',
    '--oxs-touch-target-min',
    '--oxs-touch-target-coarse',
    '--oxs-focus-ring-width',
    '--oxs-control-press-scale',
  ],
  [
    'Motion',
    '--oxs-motion-fast',
    '--oxs-motion-normal',
    '--oxs-motion-slow',
    '--oxs-ease-emphasized',
  ],
  [
    'Scroll',
    '--oxs-scroll-deceleration',
    '--oxs-scroll-edge-resistance',
    '--oxs-scroll-bounce-stiffness',
  ],
] as const;

const iconNames = [
  'apps',
  'terminal',
  'browser',
  'files',
  'settings',
  'music',
  'photos',
  'editor',
  'software',
] as const;

const futureLabs = [] as const;

export function UiKitGallery() {
  const [search, setSearch] = useState('Terminal');
  const [scrimOpen, setScrimOpen] = useState(false);
  const [cursorScale, setCursorScale] = useState(1);
  const [density, setDensity] = useState<UiDensity>('auto');
  const [theme, setTheme] = useState<UiTheme>('system');
  const [motion, setMotion] = useState<MotionPreference>('system');
  const [targetFrameRate, setTargetFrameRate] = useState<FrameRateTarget>(60);

  return (
    <UiRoot
      density={density}
      theme={theme}
      motion={motion}
      targetFrameRate={targetFrameRate}
      instrumentPerformance
      cursor={{ scale: cursorScale }}
    >
      <main className="ui-kit-gallery">
        <ScrollView
          className="ui-kit-gallery__scroll"
          ariaLabel="OXS UI Kit gallery"
          indicator="auto"
          overscroll="elastic"
        >
          <Stack className="ui-kit-gallery__content" gap="2xl">
            <StudioNav current="gallery" />
            <Stack className="ui-kit-gallery__hero" gap="md">
              <Label tone="accent" emphasis="strong">
                OXS Design System
              </Label>
              <Heading level={1} size="display">
                UI Runtime Controls
              </Heading>
              <Text tone="secondary" selectable>
                This is the current production UI surface migrated into @oxs/ui. UIP01 replaces the
                hand-maintained gallery catalog with generated documentation and navigation.
              </Text>
            </Stack>

            <GallerySection eyebrow="Environment" title="Theme, density, motion, and cadence">
              <Surface
                className="ui-kit-gallery__stage"
                material="subtle"
                elevation={0}
                radius="lg"
              >
                <Stack gap="md">
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    {(['system', 'light', 'dark'] as const).map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={theme === value ? 'filled' : 'ghost'}
                        onClick={() => setTheme(value)}
                      >
                        {value} theme
                      </Button>
                    ))}
                  </Row>
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    {(['auto', 'compact', 'comfortable'] as const).map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={density === value ? 'filled' : 'ghost'}
                        onClick={() => setDensity(value)}
                      >
                        {value} density
                      </Button>
                    ))}
                  </Row>
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    {(['system', 'full', 'reduced'] as const).map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={motion === value ? 'filled' : 'ghost'}
                        onClick={() => setMotion(value)}
                      >
                        {value} motion
                      </Button>
                    ))}
                  </Row>
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    {([60, 90, 120] as const).map((value) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={targetFrameRate === value ? 'filled' : 'ghost'}
                        onClick={() => setTargetFrameRate(value)}
                      >
                        {value} Hz target
                      </Button>
                    ))}
                  </Row>
                </Stack>
              </Surface>
            </GallerySection>

            <GallerySection eyebrow="Foundations" title="Semantic tokens">
              <Grid min="card" gap="md">
                {tokenGroups.map(([label, ...tokens]) => (
                  <Surface
                    className="ui-kit-gallery__token-group"
                    key={label}
                    material="subtle"
                    elevation={0}
                    radius="md"
                  >
                    <Stack gap="md">
                      <Label tone="primary" emphasis="strong">
                        {label}
                      </Label>
                      <Stack gap="xs">
                        {tokens.map((token) => (
                          <code key={token}>{token}</code>
                        ))}
                      </Stack>
                    </Stack>
                  </Surface>
                ))}
              </Grid>
            </GallerySection>

            <GallerySection eyebrow="Controls" title="Buttons and icon actions">
              <Surface className="ui-kit-gallery__stage" material="glass" elevation={1} radius="lg">
                <Stack gap="lg">
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="soft">Soft</Button>
                    <Button variant="filled">Filled</Button>
                    <Button tone="danger" variant="soft">Danger</Button>
                    <Button disabled>Disabled</Button>
                    <Button loading loadingLabel="Saving changes">
                      Loading
                    </Button>
                  </Row>
                  <Row gap="sm" className="ui-kit-gallery__control-row">
                    <IconButton icon="settings" label="Open settings" />
                    <IconButton icon="search" label="Search" variant="soft" />
                    <IconButton icon="close" label="Close" variant="filled" />
                    <IconButton icon="settings" label="Unavailable action" disabled />
                  </Row>
                </Stack>
              </Surface>
            </GallerySection>

            <GallerySection eyebrow="Text input" title="Fields and search">
              <Surface
                className="ui-kit-gallery__stage"
                material="subtle"
                elevation={0}
                radius="lg"
              >
                <Grid min="card" gap="md">
                  <TextField
                    label="Display name"
                    placeholder="Your name"
                    description="Visible locally."
                  />
                  <TextField
                    label="Invalid example"
                    defaultValue="bad value"
                    error="This value cannot be used."
                  />
                  <TextField label="Disabled field" value="Unavailable" disabled readOnly />
                  <SearchField
                    label="Search applications"
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search apps"
                  />
                </Grid>
              </Surface>
            </GallerySection>

            <GallerySection
              eyebrow="Motion lab"
              title="Springs, interruption, gestures, and frame budgets"
            >
              <MotionLab />
            </GallerySection>

            <GallerySection eyebrow="Scroll lab" title="Inertia, bounce, nesting, and snap">
              <ScrollLab />
            </GallerySection>

            <GallerySection eyebrow="Patterns" title="Sheets, menus, context actions, and hints">
              <SystemUiPatternsLab />
            </GallerySection>

            <GallerySection eyebrow="Cursor runtime" title="Semantic roles and pointer modality">
              <CursorLab scale={cursorScale} onScaleChange={setCursorScale} />
            </GallerySection>

            <GallerySection eyebrow="Applications" title="App tile states">
              <Surface className="ui-kit-gallery__stage" material="glass" elevation={1} radius="lg">
                <Grid min="tile" gap="sm">
                  <ApplicationItem name="Terminal" icon="terminal" onActivate={() => undefined} />
                  <ApplicationItem
                    name="A very long localized application name that wraps safely"
                    icon="browser"
                    onActivate={() => undefined}
                  />
                  <ApplicationItem name="Selected app" icon="settings" selected onActivate={() => undefined} />
                  <ApplicationItem name="Unavailable" icon="software" disabled onActivate={() => undefined} />
                </Grid>
              </Surface>
            </GallerySection>

            <GallerySection eyebrow="Accessibility" title="Focus and reduced motion">
              <Surface
                className="ui-kit-gallery__stage"
                material="subtle"
                elevation={0}
                radius="lg"
              >
                <Stack gap="md">
                  <Text tone="secondary">
                    Tab through controls to inspect the shared focus-visible ring. The UI root can
                    use system, full, or reduced motion; reduced motion removes nonessential
                    press/hover displacement while preserving state transitions.
                  </Text>
                  <Button variant="soft" onClick={() => setScrimOpen(true)}>
                    Preview dismissal scrim
                  </Button>
                </Stack>
              </Surface>
            </GallerySection>

            <GallerySection eyebrow="Icons" title="One optical system">
              <Surface
                className="ui-kit-gallery__stage"
                material="subtle"
                elevation={0}
                radius="lg"
              >
                <Row className="ui-kit-gallery__icons" gap="lg">
                  {iconNames.map((name) => (
                    <Stack key={name} gap="xs" align="center">
                      <Icon name={name} size="lg" label={`${name} icon`} />
                      <Label tone="tertiary">{name}</Label>
                    </Stack>
                  ))}
                </Row>
              </Surface>
            </GallerySection>

            <GallerySection eyebrow="Labs" title="Next runtime layers">
              <Surface
                className="ui-kit-gallery__stage"
                material="subtle"
                elevation={0}
                radius="lg"
              >
                <Grid min="card" gap="sm">
                  {futureLabs.map((label) => (
                    <Surface
                      className="ui-kit-gallery__lab"
                      key={label}
                      material="clear"
                      elevation={0}
                      radius="md"
                      border="subtle"
                    >
                      <Label tone="secondary">{label}</Label>
                    </Surface>
                  ))}
                </Grid>
              </Surface>
            </GallerySection>
          </Stack>
        </ScrollView>
        <Scrim
          active={scrimOpen}
          onDismiss={() => setScrimOpen(false)}
          dismissLabel="Close scrim preview"
          className="ui-kit-gallery__scrim"
        />
        {scrimOpen ? (
          <Surface
            className="ui-kit-gallery__scrim-card"
            material="solid"
            elevation={3}
            radius="lg"
          >
            <Stack gap="md" align="center">
              <Heading level={2} size="heading">
                System scrim
              </Heading>
              <Text tone="secondary">Click outside or press the close action.</Text>
              <Button variant="filled" onClick={() => setScrimOpen(false)}>
                Close
              </Button>
            </Stack>
          </Surface>
        ) : null}
      </main>
    </UiRoot>
  );
}

function GallerySection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ui-kit-gallery__section">
      <Stack gap="md">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">
            {eyebrow}
          </Label>
          <Heading level={2} size="heading">
            {title}
          </Heading>
        </Stack>
        {children}
      </Stack>
    </section>
  );
}
