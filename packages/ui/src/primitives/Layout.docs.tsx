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

const acceptedLayout = {
  layer: 'primitives' as const,
  category: 'Layout',
  order: 10,
  status: 'accepted' as const,
  accessibility:
    'Adds no interaction role of its own; semantic element selection preserves native document structure while visual ordering never changes DOM order.',
  rtl: 'Uses logical axes and flex/grid semantics; no left/right public layout API is exposed.',
  touch:
    'Layout-only; it preserves the target geometry and interaction ownership of child Components.',
  responsive:
    'Intrinsic and container-first; overflow/min-size controls prevent nested layouts from forcing viewport overflow.',
};

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Box',
    ...acceptedLayout,
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
    ...acceptedLayout,
    summary:
      'Polymorphic block-axis flex composition with semantic gap, alignment and distribution.',
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
    ...acceptedLayout,
    summary:
      'Polymorphic inline-axis flex composition that follows the resolved writing direction.',
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
    ...acceptedLayout,
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
    ...acceptedLayout,
    summary:
      'Polymorphic finite-track grid with fixed column counts or intrinsic auto-fit/minmax tracks and Box-owned span participation.',
    usage:
      'Use fixed `columns` when track count is structural; use `columns="auto-fit"` with a semantic `minColumn` when available container space should determine the count. Wrap spanning children in Box and use `gridSpan`.',
    examples: [
      {
        id: 'track-strategies',
        title: 'Track strategies',
        description:
          'Intrinsic auto-fit tracks and an explicit four-column span grid share one finite, token-backed API.',
        component: 'GridTracksExample',
      },
    ],
  },
  {
    exportName: 'Container',
    ...acceptedLayout,
    summary:
      'Polymorphic centered inline-size boundary with readable, content, wide and full semantic width tiers.',
    usage:
      'Use to constrain a content region by meaning rather than viewport/device names. Pair with Inset when the region also owns internal padding.',
    examples: [
      {
        id: 'semantic-widths',
        title: 'Semantic width tiers',
        description:
          'Readable and full-width regions remain centered and bounded by their containing block.',
        component: 'ContainerWidthsExample',
      },
    ],
  },
  {
    exportName: 'Inset',
    ...acceptedLayout,
    summary:
      'Polymorphic logical padding boundary with tokenized all/axis/edge overrides and deterministic edge precedence.',
    usage:
      'Use when a region owns padding. Start with `space`, then override `inline`/`block` or a specific logical edge; never encode left/right spacing.',
    examples: [
      {
        id: 'logical-spacing',
        title: 'Logical spacing precedence',
        description:
          'All → axis → edge precedence stays tokenized and follows logical writing direction.',
        component: 'InsetLogicalExample',
      },
    ],
  },
  {
    exportName: 'SafeArea',
    ...acceptedLayout,
    summary: 'Polymorphic persistent safe-area consumer with explicit logical edge ownership.',
    usage:
      'Use only for persistent display/system-chrome safe area supplied by UiRoot. Transient keyboard/occlusion avoidance belongs to environment-aware Components/System surfaces, not SafeArea.',
    examples: [
      {
        id: 'logical-edges',
        title: 'Persistent logical edges',
        description:
          'Explicit edge combinations consume only persistent UiRoot safe-area variables.',
        component: 'SafeAreaEdgesExample',
      },
    ],
  },
  {
    exportName: 'Spacer',
    ...acceptedLayout,
    accessibility:
      'Always aria-hidden and non-focusable with no public DOM-prop escape hatch; use parent gap whenever spacing belongs to a relationship between siblings.',
    summary: 'Strictly decorative token-sized spacer on exactly one logical axis.',
    usage:
      'Prefer parent `gap` or Inset. Use Spacer only when one explicit empty extent is structurally necessary; choose `inline` or `block` rather than physical width/height.',
    examples: [
      {
        id: 'logical-axis',
        title: 'Logical axis extent',
        description:
          'Inline and block spacers reserve only the selected logical dimension and remain permanently hidden from accessibility APIs.',
        component: 'SpacerAxisExample',
      },
    ],
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
        Box keeps layout behavior typed: semantic element, overflow, min-size and parent-layout
        participation.
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
              <Text>
                Long nested content remains owned by this boundary instead of forcing the outer
                document wider.
              </Text>
            </Inset>
          </Surface>
        </Box>
        <Box as="aside" flex="none" aria-label="Fixed Box peer">
          <DemoTile label="Fixed peer" />
        </Box>
      </Row>
      <Grid columns="auto-fit" minColumn="tile" gap="xs" aria-label="Box grid span host">
        <Box gridSpan="full" aria-label="Full-span Box">
          <DemoTile label="Full grid span" />
        </Box>
        <Box>
          <DemoTile label="Grid peer A" />
        </Box>
        <Box>
          <DemoTile label="Grid peer B" />
        </Box>
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
      {['Alpha item', 'Beta item', 'Gamma item', 'Delta item', 'Epsilon item', 'Zeta item'].map(
        (label) => (
          <Box key={label} flex="none">
            <DemoTile label={label} />
          </Box>
        ),
      )}
    </Wrap>
  );
}

export function GridTracksExample() {
  return (
    <Stack gap="lg">
      <Grid
        as="section"
        aria-label="Certified intrinsic Grid"
        columns="auto-fit"
        minColumn="tile"
        gap="xs"
      >
        {['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((label) => (
          <DemoTile key={label} label={label} />
        ))}
      </Grid>
      <Grid as="section" aria-label="Certified fixed Grid" columns={4} minColumn="tile" gap="xs">
        <Box gridSpan={2} aria-label="Two-column Grid item">
          <DemoTile label="Span 2" />
        </Box>
        <Box>
          <DemoTile label="Peer A" />
        </Box>
        <Box>
          <DemoTile label="Peer B" />
        </Box>
      </Grid>
    </Stack>
  );
}

export function ContainerWidthsExample() {
  return (
    <Stack gap="sm">
      <Container as="section" width="readable" aria-label="Certified readable Container">
        <DemoTile label="Readable prose boundary" />
      </Container>
      <Container as="section" width="full" aria-label="Certified full Container">
        <DemoTile label="Full containing-block width" />
      </Container>
    </Stack>
  );
}

export function InsetLogicalExample() {
  return (
    <Inset
      as="section"
      aria-label="Certified logical Inset"
      space="xs"
      inline="lg"
      inlineStart="2xl"
      blockEnd="none"
    >
      <DemoTile label="All → axis → edge" />
    </Inset>
  );
}

export function SafeAreaEdgesExample() {
  return (
    <SafeArea
      as="section"
      aria-label="Certified SafeArea edges"
      edges={['inline-start', 'block-end']}
    >
      <DemoTile label="inline-start + block-end safe area" />
    </SafeArea>
  );
}

export function SpacerAxisExample() {
  return (
    <Stack gap="sm">
      <Row gap="none" align="center" aria-label="Inline Spacer example">
        <DemoTile label="Start" />
        <Spacer axis="inline" size="2xl" className="ui-doc-spacer-inline" />
        <DemoTile label="End" />
      </Row>
      <Stack gap="none" aria-label="Block Spacer example">
        <DemoTile label="Before" />
        <Spacer axis="block" size="lg" className="ui-doc-spacer-block" />
        <DemoTile label="After" />
      </Stack>
    </Stack>
  );
}
