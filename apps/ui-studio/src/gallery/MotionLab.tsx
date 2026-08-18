import {
  Button,
  Grid,
  Label,
  MotionTransition,
  Row,
  SharedBounds,
  Stack,
  Surface,
  Text,
  useDragReveal,
} from '@oxs/ui';
import {
  type SpringPreset,
  useFramePerformanceSnapshot,
} from '@oxs/ui/advanced';
import { useEffect, useRef, useState } from 'react';

const springPresets: SpringPreset[] = ['gentle', 'standard', 'snappy', 'expressive'];
const frameRates = [60, 90, 120] as const;

export function MotionLab() {
  const [visible, setVisible] = useState(true);
  const [sharedWide, setSharedWide] = useState(false);
  const [spring, setSpring] = useState<SpringPreset>('expressive');

  return (
    <Surface className="ui-motion-lab" material="glass" elevation={1} radius="lg">
      <Stack gap="lg">
        <Row gap="sm" className="ui-kit-gallery__control-row">
          <Button variant="filled" onClick={() => setVisible((value) => !value)}>
            {visible ? 'Reverse transition' : 'Play transition'}
          </Button>
          <Button variant="soft" onClick={() => setSharedWide((value) => !value)}>
            Move shared bounds
          </Button>
          {springPresets.map((preset) => (
            <Button
              key={preset}
              variant={spring === preset ? 'filled' : 'ghost'}
              size="sm"
              onClick={() => setSpring(preset)}
            >
              {preset}
            </Button>
          ))}
        </Row>

        <div className="ui-kit-gallery__motion-stage">
          <MotionTransition
            present={visible}
            kind="scale"
            spring={spring}
            className="ui-kit-gallery__motion-card"
          >
            <Surface material="subtle" elevation={0} radius="md">
              <Stack gap="xs">
                <Label tone="accent" emphasis="strong">
                  Interruptible spring
                </Label>
                <Text tone="secondary">
                  Reverse this while it is moving. The current visual value and velocity are kept.
                </Text>
              </Stack>
            </Surface>
          </MotionTransition>
          <div className="ui-kit-gallery__shared-track" data-wide={sharedWide}>
            <SharedBounds
              transitionId="gallery-shared-card"
              className="ui-kit-gallery__shared-card"
              spring={spring}
            >
              <Surface material="solid" elevation={1} radius="md">
                <Label emphasis="strong">Shared bounds</Label>
              </Surface>
            </SharedBounds>
          </div>
        </div>

        <InteractiveMotionPreview />
        <FrameBudgetMatrix />
        <MotionPerformanceReadout />
      </Stack>
    </Surface>
  );
}

function InteractiveMotionPreview() {
  const [open, setOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const reveal = useDragReveal({
    open,
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    distance: 180,
  });

  useEffect(
    () =>
      reveal.transition.subscribe((snapshot) => {
        previewRef.current?.style.setProperty(
          '--oxs-motion-lab-progress',
          String(snapshot.progress),
        );
      }),
    [reveal.transition],
  );

  return (
    <Surface className="ui-motion-lab__interactive" material="subtle" elevation={0} radius="md">
      <Stack gap="sm">
        <Label emphasis="strong">Gesture-driven progress</Label>
        <Text tone="secondary">
          Drag the handle upward or activate it. Release velocity is handed to the same spring
          runtime.
        </Text>
        <div ref={previewRef} className="ui-motion-lab__interactive-track">
          <div className="ui-motion-lab__interactive-card" />
          <Button
            {...reveal.gestureProps}
            className="ui-motion-lab__gesture-handle"
            variant="soft"
            size="sm"
            onClick={reveal.activate}
            aria-label="Toggle interactive motion preview"
          >
            Drag
          </Button>
        </div>
      </Stack>
    </Surface>
  );
}

function FrameBudgetMatrix() {
  return (
    <Grid min="card" gap="sm">
      {frameRates.map((rate) => (
        <Surface key={rate} material="subtle" elevation={0} radius="md">
          <Stack gap="3xs" className="ui-motion-lab__budget">
            <Label tone="tertiary">{rate} Hz budget</Label>
            <Text>{(1000 / rate).toFixed(2)} ms</Text>
          </Stack>
        </Surface>
      ))}
    </Grid>
  );
}

function MotionPerformanceReadout() {
  const performance = useFramePerformanceSnapshot();

  return (
    <Surface material="subtle" elevation={0} radius="md">
      <Grid min="card" gap="sm">
        <Stack gap="3xs">
          <Label tone="tertiary">Runtime target</Label>
          <Text>{performance.targetFrameRate} Hz</Text>
        </Stack>
        <Stack gap="3xs">
          <Label tone="tertiary">Observed cadence</Label>
          <Text>
            {performance.observedRefreshRateHz > 0
              ? `${performance.observedRefreshRateHz.toFixed(1)} Hz`
              : 'Sampling'}
          </Text>
        </Stack>
        <Stack gap="3xs">
          <Label tone="tertiary">Budget misses</Label>
          <Text>{performance.budgetMisses}</Text>
        </Stack>
        <Stack gap="3xs">
          <Label tone="tertiary">Longest interval</Label>
          <Text>{performance.maximumFrameIntervalMs.toFixed(2)} ms</Text>
        </Stack>
      </Grid>
    </Surface>
  );
}
