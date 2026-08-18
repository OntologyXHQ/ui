import { Grid, Heading, Label, Row, ScrollView, Stack, Surface, Text, UiRoot } from '@oxs/ui';
import { StudioNav } from './StudioNav';

const layers = [
  {
    index: '01',
    name: 'Foundations',
    purpose: 'Theme, tokens, direction, adaptive environment, modality, motion preference.',
    rule: 'Semantic contracts first; near-zero runtime where practical.',
  },
  {
    index: '02',
    name: 'Primitives',
    purpose: 'Minimal visual vocabulary for layout, type, icons, surfaces, and structure.',
    rule: 'No OXS product semantics and no feature ownership.',
  },
  {
    index: '03',
    name: 'Components',
    purpose: 'Developer-facing controls and compositions with interaction behavior built in.',
    rule: 'The primary reusable SDK for applications and System UI.',
  },
  {
    index: '04',
    name: 'System UI',
    purpose:
      'OXS-specific launcher, workspace, bars, settings, notifications, and system surfaces.',
    rule: 'Consumes Components; direct Primitive imports are forbidden.',
  },
] as const;

const capabilityGroups = [
  {
    label: 'Shell demand',
    value: 'Launcher · workspace · bars · transient surfaces',
  },
  {
    label: 'Developer demand',
    value: 'Actions · fields · selection · navigation · data · overlays',
  },
  {
    label: 'Environment axes',
    value: 'Theme · RTL · adaptive layout · touch · keyboard · accessibility',
  },
  {
    label: 'Shared engines',
    value: 'Motion · scroll · gestures · cursor · editing · drag and drop',
  },
] as const;

const migrationFacts = [
  ['Production owner', 'packages/ui · @oxs/ui'],
  ['Studio owner', 'apps/ui-studio · development only'],
  ['Consumer contract', 'published @oxs/ui exports only'],
  ['Studio command', 'pnpm dev · localhost:5174'],
  ['Current frontier', 'Standalone 0.1.0 · UIP15'],
  ['Next dependency', 'UIP16 · host-neutral text input contracts'],
] as const;

export function PlatformSpinePage() {
  return (
    <UiRoot instrumentPerformance>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OXS UI Platform spine">
          <Stack className="ui-studio-page__content" gap="2xl">
            <StudioNav current="spine" />

            <section className="ui-studio-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">
                    UIP00
                  </Label>
                  <Label tone="tertiary">Platform spine</Label>
                </Row>
                <Heading level={1} size="display">
                  Build upward once.
                </Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable>
                  OXS UI now ships from an independent workspace as a production platform with four strict
                  layers. Host products consume the published package; implementation remains bottom-up
                  without later RTL, touch, responsive, accessibility, or documentation retrofit passes.
                </Text>
              </Stack>
            </section>

            <section>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">
                    Dependency spine
                  </Label>
                  <Heading level={2} size="heading">
                    Four public responsibilities, one direction
                  </Heading>
                </Stack>
                <div className="ui-studio-layer-flow">
                  {layers.map((layer, index) => (
                    <div className="ui-studio-layer-flow__item" key={layer.name}>
                      <Surface
                        className="ui-studio-layer-card"
                        material={index === 2 ? 'glass' : 'subtle'}
                        elevation={index === 2 ? 1 : 0}
                        radius="lg"
                      >
                        <Stack gap="md">
                          <Row justify="between" align="center" gap="md">
                            <Label tone="tertiary">{layer.index}</Label>
                            <span className="ui-studio-layer-card__status">frozen</span>
                          </Row>
                          <Stack gap="xs">
                            <Heading level={3} size="title">
                              {layer.name}
                            </Heading>
                            <Text tone="secondary">{layer.purpose}</Text>
                          </Stack>
                          <Text variant="caption" tone="tertiary">
                            {layer.rule}
                          </Text>
                        </Stack>
                      </Surface>
                      {index < layers.length - 1 ? (
                        <div className="ui-studio-layer-flow__connector" aria-hidden>
                          ↓
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Stack>
            </section>

            <section>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">
                    Capability demand map
                  </Label>
                  <Heading level={2} size="heading">
                    Higher-layer needs are known before lower APIs freeze
                  </Heading>
                  <Text tone="secondary">
                    This map is intentionally top-down. It prevents a late System UI feature from
                    forcing an ad-hoc Primitive escape hatch.
                  </Text>
                </Stack>
                <Grid min="card" gap="md">
                  {capabilityGroups.map((group) => (
                    <Surface
                      key={group.label}
                      className="ui-studio-capability-card"
                      material="subtle"
                      elevation={0}
                      radius="md"
                    >
                      <Stack gap="xs">
                        <Label emphasis="strong">{group.label}</Label>
                        <Text tone="secondary">{group.value}</Text>
                      </Stack>
                    </Surface>
                  ))}
                </Grid>
              </Stack>
            </section>

            <section>
              <Stack gap="lg">
                <Stack gap="xs">
                  <Label tone="accent" emphasis="strong">
                    Ownership now
                  </Label>
                  <Heading level={2} size="heading">
                    Package and Studio are physically separated
                  </Heading>
                </Stack>
                <Surface className="ui-studio-facts" material="glass" elevation={1} radius="lg">
                  <Stack gap="none">
                    {migrationFacts.map(([label, value]) => (
                      <Row className="ui-studio-fact" key={label} justify="between" gap="lg">
                        <Label tone="tertiary">{label}</Label>
                        <Text className="ui-studio-fact__value" as="span" selectable>
                          {value}
                        </Text>
                      </Row>
                    ))}
                  </Stack>
                </Surface>
              </Stack>
            </section>

            <section>
              <Surface className="ui-studio-rule" material="solid" elevation={2} radius="xl">
                <Stack gap="sm">
                  <Label tone="accent" emphasis="strong">
                    Permanent patch rule
                  </Label>
                  <Heading level={2} size="title">
                    If it cannot be inspected here, the patch is not done.
                  </Heading>
                  <Text tone="secondary">
                    Every UIP patch must finish with a polished Studio presentation of the
                    Foundations, Primitive, Component, interaction, or System UI capability it
                    changed. Code and tests alone are not the visual acceptance boundary.
                  </Text>
                </Stack>
              </Surface>
            </section>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}
