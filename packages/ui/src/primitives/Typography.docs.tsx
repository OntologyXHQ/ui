import { Code, Heading, Label, Stack, Text } from '../index';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

const common = {
  layer: 'primitives' as const,
  category: 'Typography', order: 20,
  status: 'stable' as const,
  accessibility: 'Uses real text/heading/code semantics and preserves selection policy.',
  rtl: 'Inherits bidi direction; wrapping and truncation are direction-neutral.',
  touch: 'Selectable text remains available to touch selection.',
  responsive: 'Typography uses Foundation tokens and container-safe wrapping.',
};

export const uiDocs = defineUiDocsGroup([
  { exportName: 'Text', ...common, summary: 'Body/caption text primitive.', usage: 'Use for general copy with explicit tone, variant and wrap policy.', examples: [{ id: 'overview', title: 'Typography vocabulary', component: 'TypographyExample' }] },
  { exportName: 'Heading', ...common, summary: 'Semantic heading with independent visual size.', usage: 'Choose a real heading level for document structure; size is visual only.' },
  { exportName: 'Label', ...common, summary: 'Compact metadata/control label.', usage: 'Use for short labels and metadata; Components own control association.' },
  { exportName: 'Code', ...common, summary: 'Monospace code/kbd/sample primitive.', usage: 'Use for code-like text without feature-owned font or inline styling.' },
] as const);

export function TypographyExample() {
  return (
    <Stack gap="sm">
      <Heading level={3} size="title">Primitive typography</Heading>
      <Text wrap="pretty">Readable body text can wrap naturally without local typography CSS.</Text>
      <Label tone="tertiary">Metadata label</Label>
      <Code>pnpm quality</Code>
    </Stack>
  );
}
