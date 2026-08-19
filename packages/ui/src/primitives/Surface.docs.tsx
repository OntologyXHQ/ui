import { Divider, Grid, Stack, Surface, Text } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Surface', layer: 'primitives', category: 'Surfaces', order: 30, status: 'candidate',
    summary: 'Token-driven material/elevation/shape surface.', usage: 'Use for visual layering only; card/dialog/system semantics belong above Primitives.',
    accessibility: 'Adds no role or focus behavior by itself.', rtl: 'Direction-neutral material with logical sizing.', touch: 'Visual-only; Components own targets.', responsive: 'Sizes only within its container.',
    examples: [{ id: 'overview', title: 'Surface vocabulary', component: 'SurfaceMaterialsExample' }],
  },
  {
    exportName: 'Divider', layer: 'primitives', category: 'Surfaces', order: 30, status: 'candidate',
    summary: 'Semantic horizontal/vertical separator.', usage: 'Use to separate adjacent regions without inventing feature-local border CSS.',
    accessibility: 'Exposes separator semantics and orientation.', rtl: 'Inset start/end are logical.', touch: 'Non-interactive.', responsive: 'Stretches within its containing layout.',
  },
] as const);

export function SurfaceMaterialsExample() {
  return (
    <Stack gap="md">
      <Grid columns="auto-fit" minColumn="tile" gap="sm">
        {(['clear', 'subtle', 'glass', 'solid'] as const).map((material) => (
          <Surface key={material} material={material} elevation={material === 'clear' ? 0 : 1} radius="lg" className="ui-doc-example-surface">
            <Text>{material}</Text>
          </Surface>
        ))}
      </Grid>
      <Divider inset="both" />
    </Stack>
  );
}
