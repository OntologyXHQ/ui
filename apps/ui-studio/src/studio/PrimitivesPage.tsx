import {
  Box,
  Code,
  Container,
  Divider,
  Grid,
  Heading,
  Icon,
  Inset,
  Label,
  Row,
  SafeArea,
  ScrollView,
  Spacer,
  Stack,
  Surface,
  Text,
  UiRoot,
  Wrap,
  defineUiIcon,
} from '@ontologyx/ui';
import { StudioNav } from './StudioNav';

const spark = defineUiIcon({ paths: ['m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7Z'] });
const vocabulary = ['Box', 'Stack', 'Row', 'Wrap', 'Grid', 'Container', 'Inset', 'SafeArea', 'Spacer'];

function DirectionPreview({ direction }: { direction: 'ltr' | 'rtl' }) {
  return (
    <UiRoot scope="nested" direction={direction} safeArea={{ inlineStart: 14, inlineEnd: 24 }}>
      <Surface material="subtle" radius="lg" className="ui-primitives-direction-card">
        <SafeArea edges="inline">
          <Stack gap="sm">
            <Row justify="between" gap="sm">
              <Label tone="accent" emphasis="strong">{direction.toUpperCase()}</Label>
              <Row gap="xs">
                <Icon name="chevron-start" />
                <Icon name="chevron-end" />
              </Row>
            </Row>
            <Text wrap="pretty">
              {direction === 'rtl' ? 'چیدمان منطقی از ابتدا تا انتها' : 'Logical layout flows from start to end.'}
            </Text>
            <Divider />
            <Wrap gap="xs">
              {['start', 'middle', 'end'].map((item) => (
                <Surface key={item} material="solid" radius="md" className="ui-primitives-chip">
                  <Text as="span" variant="caption">{item}</Text>
                </Surface>
              ))}
            </Wrap>
          </Stack>
        </SafeArea>
      </Surface>
    </UiRoot>
  );
}

export function PrimitivesPage() {
  return (
    <UiRoot>
      <main className="ui-studio-page">
        <ScrollView className="ui-studio-page__scroll" ariaLabel="OntologyX UI primitive layer">
          <Stack className="ui-studio-page__content" gap="xl">
            <StudioNav current="primitives" />

            <section className="ui-studio-hero">
              <Stack gap="md">
                <Row gap="sm" className="ui-studio-hero__meta">
                  <Label tone="accent" emphasis="strong">UIP05</Label>
                  <Label tone="tertiary">Primitive layer · frozen vocabulary</Label>
                </Row>
                <Heading level={1} size="display">Small vocabulary. Everything above it.</Heading>
                <Text className="ui-studio-hero__lede" tone="secondary" selectable wrap="pretty">
                  Primitives now stop at structure, typography, material, separators and icons. No app,
                  product or system meaning belongs here. Components start from this vocabulary instead
                  of inventing another layout or styling engine.
                </Text>
              </Stack>
            </section>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">Structure</Label>
                  <Heading level={2} size="title">Layout vocabulary</Heading>
                </Stack>
                <Container width="wide">
                  <Grid min="tile" gap="sm">
                    {vocabulary.map((item) => (
                      <Surface key={item} material="subtle" radius="lg" className="ui-primitives-vocab-card">
                        <Stack gap="xs">
                          <Code>{item}</Code>
                          <Text variant="caption" tone="tertiary">logical · tokenized · container-safe</Text>
                        </Stack>
                      </Surface>
                    ))}
                  </Grid>
                </Container>
              </Stack>
            </section>

            <Grid min="wide" gap="lg">
              <Surface material="glass" elevation={1} radius="xl" className="ui-primitives-panel">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Typography</Label>
                  <Heading level={2} size="title">Semantic type, not styled divs</Heading>
                  <Text wrap="pretty">Body copy can use pretty wrapping and semantic tone while preserving actual text elements.</Text>
                  <Label tone="tertiary">Short metadata</Label>
                  <Code>const primitive = 'stable';</Code>
                </Stack>
              </Surface>

              <Surface material="glass" elevation={1} radius="xl" className="ui-primitives-panel">
                <Stack gap="md">
                  <Label tone="accent" emphasis="strong">Surface + separator</Label>
                  <Row gap="sm" align="stretch">
                    {(['clear', 'subtle', 'glass', 'solid'] as const).map((material) => (
                      <Surface key={material} material={material} radius="md" className="ui-primitives-material-swatch">
                        <Text as="span" variant="caption">{material}</Text>
                      </Surface>
                    ))}
                  </Row>
                  <Divider inset="both" />
                  <Text tone="tertiary" variant="caption">Material stays visual; Components own behavior.</Text>
                </Stack>
              </Surface>
            </Grid>

            <section>
              <Stack gap="md">
                <Stack gap="2xs">
                  <Label tone="accent" emphasis="strong">RTL built in</Label>
                  <Heading level={2} size="title">The same primitives in both directions</Heading>
                </Stack>
                <Grid min="wide" gap="md">
                  <DirectionPreview direction="ltr" />
                  <DirectionPreview direction="rtl" />
                </Grid>
              </Stack>
            </section>

            <Surface material="subtle" radius="xl" className="ui-primitives-panel">
              <Stack gap="md">
                <Label tone="accent" emphasis="strong">Icon contract</Label>
                <Row gap="lg" align="center">
                  <Icon name="search" label="Search" size="lg" />
                  <Icon name="settings" label="Settings" size="lg" />
                  <Icon name="chevron-start" size="lg" />
                  <Icon name="chevron-end" size="lg" />
                  <Icon glyph={spark} label="Custom path icon" size="lg" />
                </Row>
                <Divider />
                <Box as="section">
                  <Inset space="sm">
                    <Row gap="xs">
                      <Text as="span" tone="tertiary">Inline style is not a Primitive API.</Text>
                      <Spacer size="xs" axis="inline" />
                      <Code>tokens → props → className escape hatch</Code>
                    </Row>
                  </Inset>
                </Box>
              </Stack>
            </Surface>
          </Stack>
        </ScrollView>
      </main>
    </UiRoot>
  );
}
