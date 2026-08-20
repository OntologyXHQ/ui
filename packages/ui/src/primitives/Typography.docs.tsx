import { Code, Heading, Label, Stack, Surface, Text } from '@ontologyx/ui';
import { defineUiDocsGroup } from '../docs/defineUiDocs';

const acceptedTypography = {
  layer: 'primitives' as const,
  category: 'Typography',
  order: 20,
  status: 'accepted' as const,
  accessibility:
    'Preserves real native text/heading/code semantics; truncation is visual only and never replaces the accessible/full text value.',
  rtl: 'Inherits native bidi direction and accepts native dir/lang; no physical left/right alignment API is exposed.',
  touch:
    'Selectable text can opt into browser-native mouse/touch selection without creating an interaction target.',
  responsive:
    'Token typography reflows inside its containing block; overflowWrap="anywhere" is the explicit escape hatch for unbreakable content.',
};

export const uiDocs = defineUiDocsGroup([
  {
    exportName: 'Text',
    ...acceptedTypography,
    summary:
      'Paragraph/inline copy primitive with semantic tone, wrap, truncation and selection policy.',
    usage:
      'Use for prose and supporting copy. Choose `as="span"` only for genuinely inline text; use `overflowWrap="anywhere"` for user/generated tokens that must not force horizontal overflow.',
    examples: [
      {
        id: 'mixed-copy',
        title: 'Mixed-script resilient copy',
        description:
          'Persian/English text, explicit selection and a long unbreakable token reflow inside a narrow container.',
        component: 'TextMixedCopyExample',
      },
    ],
  },
  {
    exportName: 'Heading',
    ...acceptedTypography,
    summary: 'Native h1–h6 heading semantics with an independent finite visual scale.',
    usage:
      'Choose `level` from document structure first, then choose `size` for visual hierarchy. The display tier never owns a content width.',
    examples: [
      {
        id: 'semantic-rank',
        title: 'Semantic rank vs visual scale',
        description: 'A real h3 can use the title scale without pretending to be an h2/h1.',
        component: 'HeadingSemanticExample',
      },
    ],
  },
  {
    exportName: 'Label',
    ...acceptedTypography,
    summary: 'Compact span-based label/metadata typography with regular or strong emphasis.',
    usage:
      'Use for short visual labels/metadata. Label intentionally renders a span; Field and other Components own native form-label association.',
    accessibility:
      'Adds no form-label relationship by itself; semantic control association belongs to the owning Field/Component contract.',
    examples: [
      {
        id: 'metadata-label',
        title: 'Visual metadata label',
        description: 'Compact strong/regular labels remain non-interactive span semantics.',
        component: 'LabelMetadataExample',
      },
    ],
  },
  {
    exportName: 'Code',
    ...acceptedTypography,
    summary: 'Native code/kbd/samp typography using the Foundation monospace family.',
    usage:
      'Choose the native semantic element by meaning. Opt into `overflowWrap="anywhere"` only when wrapping a long token is preferable to an owning scroll container.',
    rtl: 'Native dir remains available; code-like content can explicitly use dir="ltr" inside an RTL surrounding document without physical CSS.',
    examples: [
      {
        id: 'native-code-semantics',
        title: 'Native code semantics',
        description:
          'Keyboard-input semantics, monospace fallback and long-token reflow stay explicit.',
        component: 'CodeSemanticExample',
      },
    ],
  },
] as const);

export function TextMixedCopyExample() {
  return (
    <Stack gap="sm">
      <Text data-visual-cert="text" dir="auto" selectable wrap="pretty" overflowWrap="anywhere">
        این متن فارسی با OntologyX UI و English content در یک جریان واقعی قرار می‌گیرد —
        supercalifragilisticexpialidocious-ontologyx-ui-unbreakable-token-2026.
      </Text>
      <Text as="span" variant="caption" tone="tertiary">
        Inline caption remains a real span.
      </Text>
    </Stack>
  );
}

export function HeadingSemanticExample() {
  return (
    <Stack gap="xs">
      <Heading data-visual-cert="heading" level={3} size="title" overflowWrap="anywhere">
        Semantic h3, visual title
      </Heading>
      <Text tone="secondary">
        Rank belongs to document structure; visual scale does not rewrite it.
      </Text>
    </Stack>
  );
}

export function LabelMetadataExample() {
  return (
    <Stack gap="xs">
      <Label data-visual-cert="label" emphasis="strong" tone="accent">
        Certified metadata
      </Label>
      <Label tone="tertiary">Visual label only — control association stays above Primitives.</Label>
    </Stack>
  );
}

export function CodeSemanticExample() {
  return (
    <Surface material="subtle" elevation={0} border="subtle" radius="md">
      <Code data-visual-cert="code" as="kbd" dir="ltr" overflowWrap="anywhere">
        Ctrl+Shift+P · ontologyx-ui-very-long-command-token-without-natural-break-opportunities
      </Code>
    </Surface>
  );
}
