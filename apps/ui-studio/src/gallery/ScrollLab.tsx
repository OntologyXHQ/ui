import {
  Button,
  Grid,
  Label,
  Row,
  ScrollSnapItem,
  ScrollView,
  type ScrollViewHandle,
  Stack,
  Surface,
  Text,
} from '@ontologyx/ui';
import { useRef } from 'react';

const rows = Array.from({ length: 18 }, (_, index) => index + 1);
const nestedRows = Array.from({ length: 8 }, (_, index) => index + 1);
const snapCards = Array.from({ length: 7 }, (_, index) => index + 1);

export function ScrollLab() {
  const mainScrollRef = useRef<ScrollViewHandle>(null);

  return (
    <Surface className="ui-kit-gallery__stage" material="glass" elevation={1} radius="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">
            Scroll runtime
          </Label>
          <Text tone="secondary">
            Use touch, wheel, trackpad, Arrow keys, Page Up/Down, Home, and End. Pull past either
            edge to inspect elastic resistance and spring return.
          </Text>
        </Stack>
        <Row gap="sm" className="ui-kit-gallery__control-row">
          <Button variant="soft" onClick={() => mainScrollRef.current?.scrollToStart()}>
            Scroll to start
          </Button>
          <Button variant="soft" onClick={() => mainScrollRef.current?.scrollToEnd()}>
            Scroll to end
          </Button>
        </Row>
        <Grid min="card" gap="md" className="ui-scroll-lab__grid">
          <Stack gap="xs">
            <Label tone="secondary" emphasis="strong">
              Elastic + nested
            </Label>
            <ScrollView
              ref={mainScrollRef}
              className="ui-scroll-lab__viewport"
              ariaLabel="Elastic ScrollView demo"
              indicator="auto"
              overscroll="elastic"
            >
              <Stack gap="xs" className="ui-scroll-lab__content">
                {rows.map((row) => (
                  <Surface
                    key={row}
                    className="ui-scroll-lab__row"
                    material="subtle"
                    elevation={0}
                    radius="sm"
                    border="subtle"
                  >
                    <Row justify="between">
                      <Label emphasis="strong">Row {row}</Label>
                      <Text tone="tertiary">ScrollView</Text>
                    </Row>
                  </Surface>
                ))}
                <Surface material="solid" elevation={1} radius="md">
                  <Stack gap="xs" className="ui-scroll-lab__nested-frame">
                    <Label tone="accent" emphasis="strong">
                      Nested vertical ScrollView
                    </Label>
                    <ScrollView
                      className="ui-scroll-lab__nested"
                      ariaLabel="Nested vertical ScrollView demo"
                      indicator="always"
                      overscroll="elastic"
                    >
                      <Stack gap="2xs" className="ui-scroll-lab__nested-content">
                        {nestedRows.map((row) => (
                          <Surface
                            key={row}
                            material="subtle"
                            elevation={0}
                            radius="sm"
                            className="ui-scroll-lab__nested-row"
                          >
                            <Text>Nested item {row}</Text>
                          </Surface>
                        ))}
                      </Stack>
                    </ScrollView>
                    <Text tone="tertiary">
                      At either nested edge, remaining same-axis delta chains into the parent.
                    </Text>
                  </Stack>
                </Surface>
              </Stack>
            </ScrollView>
          </Stack>
          <Stack gap="xs">
            <Label tone="secondary" emphasis="strong">
              Horizontal mandatory snap
            </Label>
            <ScrollView
              axis="horizontal"
              className="ui-scroll-lab__snap"
              ariaLabel="Horizontal snapping ScrollView demo"
              indicator="always"
              overscroll="elastic"
              snap="mandatory"
            >
              <Row gap="sm" className="ui-scroll-lab__snap-track">
                {snapCards.map((card) => (
                  <ScrollSnapItem key={card} align="center" className="ui-scroll-lab__snap-item">
                    <Surface material="subtle" elevation={0} radius="md" border="subtle">
                      <Stack gap="xs" className="ui-scroll-lab__snap-card">
                        <Label tone="accent">Snap {card}</Label>
                        <Text tone="secondary">Release between cards.</Text>
                      </Stack>
                    </Surface>
                  </ScrollSnapItem>
                ))}
              </Row>
            </ScrollView>
            <Surface material="subtle" elevation={0} radius="md">
              <Stack gap="xs" className="ui-scroll-lab__notes">
                <Label emphasis="strong">Structural contract</Label>
                <Text tone="secondary">
                  Scroll position stays native. Elasticity is a transient content offset. Momentum,
                  snap, indicators, keyboard input, and nested chaining all remain UI Runtime owned.
                </Text>
              </Stack>
            </Surface>
          </Stack>
        </Grid>
      </Stack>
    </Surface>
  );
}
