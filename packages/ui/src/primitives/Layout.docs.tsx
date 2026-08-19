import { defineUiDocsGroup } from '../docs/defineUiDocs';
import {
  Box,
  Container,
  Grid,
  Inset,
  Row,
  SafeArea,
  Spacer,
  Stack,
  Surface,
  Text,
  Wrap,
} from '@ontologyx/ui';

const acceptedCore = {
  layer: 'primitives' as const,
  category: 'Layout',
  order: 10,
  status: 'accepted' as const,
  accessibility:
    'Adds no interaction role of its own; semantic element selection preserves native document structure while visual ordering never changes DOM order.',
  rtl: 'Uses logical axes and flex/grid semantics; no left/right public layout API is exposed.',
  touch: 'Layout-only; it preserves the target geometry and interaction ownership of child Components.',
  responsive:
    'Intrinsic and container-first; overflow/min-size controls prevent nested layouts from forcing viewport overflow.',
};

const candidate = {
  layer: 'primitives' as const,
  category: 'Layout',
  order: 10,
  status: 'candidate' as const,
  accessibility: 'Preserves the semantics of its children and adds no interaction semantics.',
  rtl: 'Uses logical flow, alignment and spacing semantics.',
  touch: 'Layout-only; touch behavior belongs to Components.',
  responsive: 'Container-first and intrinsic; no device-name branching.',
};

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Box',
    ...acceptedCore,
    summary:
      'Polymorphic structural boundary with typed overflow, min-size, flex-child, self-alignment and grid-span controls.',
    usage:
      'Use as the neutral structural primitive when semantic HTML and a small typed layout escape hatch are needed; use Inset/gap/Surface for spacing and visual decoration.',
    examples: [
      {
        id: 'boundary-contract',
        title: 'Structural boundary',
        description:
          'Semantic element selection, nested overflow safety and explicit child-layout participation without inline style serialization.',
        component: 'BoxBoundaryExample',
      },
    ],
  },
  {
    exportName: 'Stack',
    ...acceptedCore,
    summary: 'Polymorphic block-axis flex composition with semantic gap, alignment and distribution.',
    usage:
      'Use for vertical one-dimensional composition; choose a semantic `as` element when the group carries document structure.',
    examples: [
      {
        id: 'block-flow',
        title: 'Block-axis flow',
        description: 'Token gap plus start/center/end/stretch alignment without manual margins.',
        component: 'StackFlowExample',
      },
    ],
  },
  {
    exportName: 'Row',
    ...acceptedCore,
    summary: 'Polymorphic inline-axis flex composition that follows the resolved writing direction.',
    usage:
      'Use when peers must remain on one logical row; use Wrap instead when contraction is allowed to create additional lines.',
    examples: [
      {
        id: 'inline-flow',
        title: 'Logical inline flow',
        description: 'Inline-axis distribution follows LTR/RTL without reversing DOM order.',
        component: 'RowFlowExample',
      },
    ],
  },
  {
    exportName: 'Wrap',
    ...acceptedCore,
    summary: 'Polymorphic wrapping inline-axis flex composition for intrinsic responsive groups.',
    usage:
      'Use for peer controls/chips that should wrap naturally as their container contracts instead of branching on viewport/device names.',
    examples: [
      {
        id: 'intrinsic-wrap',
        title: 'Intrinsic wrapping',
        description: 'Peers wrap from available container space while preserving logical order.',
        component: 'WrapFlowExample',
      },
    ],
  },
  {
    exportName: 'Grid',
    ...candidate,
    summary: 'Intrinsic responsive grid.',
    usage: 'Candidate pending UIR03-B redesign for explicit columns, minmax/auto-fit and span semantics.',
  },
  {
    exportName: 'Container',
    ...candidate,
    summary: 'Readable width constraint.',
    usage: 'Candidate pending UIR03-B redesign for semantic readable/content/wide/full composition.',
  },
  {
    exportName: 'Inset',
    ...candidate,
    summary: 'Tokenized logical padding wrapper.',
    usage: 'Candidate pending UIR03-B redesign for all/inline/block/edge-specific logical spacing.',
  },
  {
    exportName: 'SafeArea',
    ...candidate,
    summary: 'Logical persistent safe-area wrapper.',
    usage: 'Candidate pending UIR03-B completion of logical edge ownership and environment integration.',
  },
  {
    exportName: 'Spacer',
    ...candidate,
    summary: 'Non-semantic token-sized spacer.',
    usage: 'Candidate pending UIR03-B axis cleanup; prefer parent gap or Inset whenever they express the structure.',
  },
] as const);

function DemoTile({ label }: { label: string }) {
  return (
    <Surface material="subtle" radius="md">
      <Inset space="sm">
        <Text as="span">{label}</Text>
      </Inset>
    </Surface>
  );
}

export function BoxBoundaryExample() {
  return (
    <Stack gap="sm">
      <Text tone="secondary">
        Box keeps layout behavior typed: semantic element, overflow, min-size and parent-layout participation.
      </Text>
      <Row gap="sm" aria-label="Box flex boundary host">
        <Box
          as="section"
          aria-label="Certified Box boundary"
          overflow="auto"
          minInlineSize="zero"
          flex="grow"
        >
          <Surface material="subtle" radius="md">
            <Inset space="sm">
              <Text>Long nested content remains owned by this boundary instead of forcing the outer document wider.</Text>
            </Inset>
          </Surface>
        </Box>
        <Box as="aside" flex="none" aria-label="Fixed Box peer">
          <DemoTile label="Fixed peer" />
        </Box>
      </Row>
      <Grid min="tile" gap="xs" aria-label="Box grid span host">
        <Box gridSpan="full" aria-label="Full-span Box">
          <DemoTile label="Full grid span" />
        </Box>
        <Box><DemoTile label="Grid peer A" /></Box>
        <Box><DemoTile label="Grid peer B" /></Box>
      </Grid>
    </Stack>
  );
}

export function StackFlowExample() {
  return (
    <Stack as="section" aria-label="Certified Stack flow" gap="sm" align="stretch" justify="start">
      <DemoTile label="First" />
      <DemoTile label="Second" />
      <DemoTile label="Third" />
    </Stack>
  );
}

export function RowFlowExample() {
  return (
    <Row as="section" aria-label="Certified Row flow" gap="sm" align="center" justify="between">
      <DemoTile label="First" />
      <DemoTile label="Second" />
      <DemoTile label="Third" />
    </Row>
  );
}

export function WrapFlowExample() {
  return (
    <Wrap as="section" aria-label="Certified Wrap flow" gap="xs" align="center" justify="start">
      {['Alpha item', 'Beta item', 'Gamma item', 'Delta item', 'Epsilon item', 'Zeta item'].map((label) => (
        <Box key={label} flex="none">
          <DemoTile label={label} />
        </Box>
      ))}
    </Wrap>
  );
}
