import { defineUiDocsGroup } from '../docs/defineUiDocs';
import { Box, Container, Grid, Inset, Row, SafeArea, Spacer, Stack, Surface, Text, Wrap } from '../index';

const common = {
  layer: 'primitives' as const,
  category: 'Layout', order: 10,
  status: 'stable' as const,
  accessibility: 'Preserves the semantics of its children and adds no interaction semantics.',
  rtl: 'Uses logical flow, alignment and spacing semantics.',
  touch: 'Layout-only; touch behavior belongs to Components.',
  responsive: 'Container-first and intrinsic; no device-name branching.',
};

export const uiDocs = defineUiDocsGroup([
  { exportName: 'Box', ...common, summary: 'Minimal semantic block wrapper.', usage: 'Use as the neutral structural wrapper before adding bespoke layout CSS.', examples: [{ id: 'overview', title: 'Layout vocabulary', component: 'LayoutFlowExample' }] },
  { exportName: 'Stack', ...common, summary: 'Vertical logical flex layout.', usage: 'Use for one-dimensional block flow with tokenized gap/alignment.' },
  { exportName: 'Row', ...common, summary: 'Inline logical flex layout.', usage: 'Use for one-dimensional inline composition that should not wrap.' },
  { exportName: 'Wrap', ...common, summary: 'Wrapping inline flex layout.', usage: 'Use when peers should wrap naturally as container space contracts.' },
  { exportName: 'Grid', ...common, summary: 'Intrinsic responsive grid.', usage: 'Use for repeated peers that adapt from a typed minimum item size.' },
  { exportName: 'Container', ...common, summary: 'Readable width constraint.', usage: 'Use to bound content width without viewport/device breakpoints.' },
  { exportName: 'Inset', ...common, summary: 'Tokenized logical padding wrapper.', usage: 'Use for structural inset around arbitrary content.' },
  { exportName: 'SafeArea', ...common, summary: 'Logical safe-area wrapper.', usage: 'Use at boundaries that need block/inline environment safe-area insets.' },
  { exportName: 'Spacer', ...common, summary: 'Non-semantic token-sized spacer.', usage: 'Use sparingly when gap or inset cannot express the required structure.' },
] as const);

export function LayoutFlowExample() {
  return (
    <Stack gap="md">
      <Wrap gap="xs">
        {['Box', 'Stack', 'Row', 'Wrap'].map((item) => (
          <Surface key={item} material="subtle" radius="md" className="ui-doc-example-chip">
            <Text as="span">{item}</Text>
          </Surface>
        ))}
      </Wrap>
      <Grid min="tile" gap="sm">
        {['Grid', 'Container', 'Inset'].map((item) => (
          <Surface key={item} material="subtle" radius="md" className="ui-doc-example-chip">
            <Text>{item}</Text>
          </Surface>
        ))}
      </Grid>
      <Box as="section">
        <Container width="compact">
          <Inset space="sm">
            <SafeArea edges="inline">
              <Row gap="xs">
                <Text as="span">Logical flow</Text>
                <Spacer size="xs" axis="inline" />
                <Text as="span" tone="tertiary">LTR / RTL</Text>
              </Row>
            </SafeArea>
          </Inset>
        </Container>
      </Box>
    </Stack>
  );
}
