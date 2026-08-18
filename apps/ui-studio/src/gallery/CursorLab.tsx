import {
  Button,
  CursorRegion,
  Grid,
  Label,
  Row,
  Stack,
  Surface,
  Text,
} from '@ontologyx/ui';
import {
  SYSTEM_CURSOR_ROLES,
  useCursorRuntime,
} from '@ontologyx/ui/advanced';
import type { CSSProperties } from 'react';

export type CursorLabProps = {
  scale: number;
  onScaleChange: (scale: number) => void;
};

const previewScales = [1, 1.5, 2] as const;

export function CursorLab({ scale, onScaleChange }: CursorLabProps) {
  const runtime = useCursorRuntime();

  return (
    <Surface className="ui-cursor-lab" material="glass" elevation={1} radius="lg">
      <Stack gap="lg">
        <Stack gap="xs">
          <Label tone="accent" emphasis="strong">
            Cursor Runtime
          </Label>
          <Text tone="secondary">
            Hover or focus each sample to inspect semantic cursor roles. Touch or pen input hides
            the pointer preview; meaningful mouse movement restores it without feature-owned cursor
            code.
          </Text>
        </Stack>

        <Row gap="sm" className="ui-kit-gallery__control-row">
          {previewScales.map((value) => (
            <Button
              key={value}
              variant={scale === value ? 'filled' : 'soft'}
              aria-pressed={scale === value}
              onClick={() => onScaleChange(value)}
            >
              {value}x cursor scale
            </Button>
          ))}
        </Row>

        <Grid min="card" gap="sm">
          <Surface material="subtle" elevation={0} radius="md">
            <Stack gap="xs">
              <Label tone="tertiary">Current modality</Label>
              <Text>{runtime.modality}</Text>
            </Stack>
          </Surface>
          <Surface material="subtle" elevation={0} radius="md">
            <Stack gap="xs">
              <Label tone="tertiary">Pointer visibility</Label>
              <Text>{runtime.pointerVisible ? 'visible' : 'hidden by modality policy'}</Text>
            </Stack>
          </Surface>
          <Surface material="subtle" elevation={0} radius="md">
            <Stack gap="xs">
              <Label tone="tertiary">Theme contract</Label>
              <Text>{runtime.config.theme}</Text>
            </Stack>
          </Surface>
        </Grid>

        <section
          className="ui-cursor-lab__scale-preview"
          aria-label="Cursor scale contract preview"
        >
          <span
            className="ui-cursor-lab__pointer-mark"
            style={{ '--oxs-cursor-preview-scale': scale } as CSSProperties}
            aria-hidden
          />
          <Stack gap="3xs">
            <Label emphasis="strong">Scale and hotspot contract</Label>
            <Text tone="secondary">
              The browser preview scales this diagnostic marker only. Native theme assets, output
              scaling, hotspots, and cursor planes are completed with the compositor backend.
            </Text>
          </Stack>
        </section>

        <Grid min="tile" gap="sm">
          {SYSTEM_CURSOR_ROLES.map((role) => (
            <CursorRegion key={role} role={role}>
              <Surface className="ui-cursor-lab__role" material="subtle" elevation={0} radius="md">
                <Label emphasis="strong">{role}</Label>
                <Text tone="tertiary">semantic role</Text>
              </Surface>
            </CursorRegion>
          ))}
        </Grid>
      </Stack>
    </Surface>
  );
}
