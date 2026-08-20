import { Divider, Inset, Row, Stack, Surface, Text } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

const acceptedSurface = {
  layer: 'primitives' as const,
  category: 'Surfaces',
  order: 30,
  status: 'accepted' as const,
  rtl: 'Material and border are direction-neutral; Divider inset start/end use logical axes.',
  touch:
    'Visual-only and non-interactive by default; Components own press/hover/selection state and target behavior.',
  responsive:
    'Never owns viewport breakpoints; geometry follows the containing layout and logical axis.',
};

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Surface',
    ...acceptedSurface,
    summary: 'Static token-driven material, elevation, shape, border and clipping boundary.',
    usage:
      'Use for visual layering only. Material/elevation/border are static visual inputs; do not encode hover, pressed, selected, modal or card semantics in Surface.',
    accessibility:
      'Adds no role, focusability or interaction state by default. Higher-level Components may pass the native role/focus props required by their own semantics.',
    examples: [
      {
        id: 'material-boundary',
        title: 'Material/elevation boundary',
        description:
          'Material, elevation, radius, border and clipping stay finite and token-backed without interactive pseudo-state ownership.',
        component: 'SurfaceMaterialBoundaryExample',
      },
    ],
  },
  {
    exportName: 'Divider',
    ...acceptedSurface,
    summary:
      'Semantic or decorative separator with logical inset, semantic border tone and finite thickness.',
    usage:
      'Use between adjacent regions when separation is meaningful. Set `decorative` only when the visual line should be removed from the accessibility tree.',
    accessibility:
      'Semantic by default with role="separator" and aria-orientation; decorative mode is aria-hidden and has no separator semantics.',
    examples: [
      {
        id: 'separator-semantics',
        title: 'Separator semantics',
        description:
          'Horizontal/vertical geometry, logical inset and decorative-vs-semantic accessibility remain explicit.',
        component: 'DividerSemanticExample',
      },
    ],
  },
] as const);

export function SurfaceMaterialBoundaryExample() {
  return (
    <Stack gap="sm">
      <Surface
        data-visual-cert="surface"
        material="glass"
        elevation={2}
        radius="lg"
        border="strong"
        clip
      >
        <Inset space="md">
          <Text>Certified static visual surface</Text>
        </Inset>
      </Surface>
      <Text tone="tertiary">No hover/pressed/selected prop exists at the Primitive boundary.</Text>
    </Stack>
  );
}

export function DividerSemanticExample() {
  return (
    <Stack gap="md">
      <Text>Before separator</Text>
      <Divider data-visual-cert="horizontal-divider" inset="start" tone="default" />
      <Row gap="sm" align="stretch">
        <Text>Inline start</Text>
        <Divider
          data-visual-cert="vertical-divider"
          orientation="vertical"
          inset="both"
          tone="strong"
          thickness="strong"
        />
        <Text>Inline end</Text>
      </Row>
      <Divider data-visual-cert="decorative-divider" decorative tone="subtle" />
    </Stack>
  );
}
