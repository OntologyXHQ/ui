import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Box, Row, Stack, Wrap } from '..';

describe('accepted layout core contract', () => {
  it('keeps Box semantic and layout escape hatches typed and class-backed', () => {
    render(
      <UiRoot>
        <Row aria-label="host">
          <Box
            as="section"
            aria-label="Box boundary"
            overflow="auto"
            overflowInline="hidden"
            overflowBlock="clip"
            minInlineSize="zero"
            minBlockSize="zero"
            flex="grow"
            alignSelf="stretch"
            gridSpan={3}
          >
            Content
          </Box>
        </Row>
      </UiRoot>,
    );

    const box = screen.getByRole('region', { name: 'Box boundary' });
    expect(box.tagName).toBe('SECTION');
    expect(box).toHaveClass(
      'ui-overflow-auto',
      'ui-overflow-inline-hidden',
      'ui-overflow-block-clip',
      'ui-min-inline-zero',
      'ui-min-block-zero',
      'ui-flex-grow',
      'ui-align-self-stretch',
      'ui-grid-span-3',
    );
  });

  it('keeps Stack, Row and Wrap on one logical flow vocabulary without DOM reordering', () => {
    render(
      <UiRoot direction="rtl">
        <Stack as="section" aria-label="Stack" gap="sm" align="end" justify="evenly">
          <span>one</span>
          <span>two</span>
        </Stack>
        <Row as="section" aria-label="Row" gap="xs" align="baseline" justify="around">
          <span>first</span>
          <span>second</span>
        </Row>
        <Wrap as="section" aria-label="Wrap" gap="2xs" align="center" justify="between">
          <span>alpha</span>
          <span>beta</span>
        </Wrap>
      </UiRoot>,
    );

    expect(screen.getByRole('region', { name: 'Stack' })).toHaveClass(
      'ui-stack',
      'ui-gap-sm',
      'ui-align-end',
      'ui-justify-evenly',
    );
    expect(screen.getByRole('region', { name: 'Row' })).toHaveClass(
      'ui-row',
      'ui-gap-xs',
      'ui-align-baseline',
      'ui-justify-around',
    );
    expect(screen.getByRole('region', { name: 'Wrap' })).toHaveClass(
      'ui-wrap',
      'ui-gap-2xs',
      'ui-justify-between',
    );
    expect(screen.getByRole('region', { name: 'Row' }).textContent).toBe('firstsecond');
  });

  it('preserves native prop typing through polymorphic as while forbidding inline style', () => {
    if (false) {
      <Box as="ol" start={2}><li>Docs</li></Box>;
      <Stack as="ol" start={2}><li>Item</li></Stack>;
      // @ts-expect-error section does not accept ordered-list-only start
      <Box as="section" start={2} />;
      // @ts-expect-error inline style bypasses the typed Foundations/Primitive contract
      <Box style={{ padding: 12 }} />;
    }
    expect(true).toBe(true);
  });
});
