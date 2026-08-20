import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Box, Container, Grid, Inset, SafeArea, Spacer } from '..';

describe('accepted grid and spacing boundary contract', () => {
  it('keeps Grid finite, polymorphic and span-compatible without arbitrary track serialization', () => {
    render(
      <UiRoot>
        <Grid
          as="section"
          aria-label="Grid boundary"
          columns="auto-fit"
          minColumn="wide"
          gap="sm"
          align="start"
        >
          <Box gridSpan={2}>span</Box>
        </Grid>
        <Grid as="ol" aria-label="Fixed Grid" columns={4} start={2}>
          <li>one</li>
          <li>two</li>
        </Grid>
      </UiRoot>,
    );

    expect(screen.getByRole('region', { name: 'Grid boundary' })).toHaveClass(
      'ui-grid',
      'ui-grid-columns-auto-fit',
      'ui-grid-min-wide',
      'ui-gap-sm',
      'ui-align-start',
    );
    const fixed = screen.getByRole('list', { name: 'Fixed Grid' });
    expect(fixed.tagName).toBe('OL');
    expect(fixed).toHaveAttribute('start', '2');
    expect(fixed).toHaveClass('ui-grid-columns-4');
  });

  it('keeps Container semantic widths and Inset precedence on finite logical tokens', () => {
    render(
      <UiRoot direction="rtl">
        <Container as="main" width="readable" aria-label="Readable Container">
          <Inset
            as="section"
            aria-label="Logical Inset"
            space="xs"
            inline="lg"
            block="sm"
            inlineStart="2xl"
            blockEnd="none"
          >
            content
          </Inset>
        </Container>
      </UiRoot>,
    );

    expect(screen.getByRole('main', { name: 'Readable Container' })).toHaveClass(
      'ui-container',
      'ui-container-width-readable',
    );
    expect(screen.getByRole('region', { name: 'Logical Inset' })).toHaveClass(
      'ui-inset-all-xs',
      'ui-inset-inline-lg',
      'ui-inset-block-sm',
      'ui-inset-inline-start-2xl',
      'ui-inset-block-end-none',
    );
  });

  it('normalizes SafeArea shorthands and explicit logical edge combinations without consuming occlusion', () => {
    render(
      <UiRoot
        safeArea={{ blockStart: '11px', inlineEnd: '13px', blockEnd: '17px', inlineStart: '19px' }}
        occlusion={{ blockEnd: '240px' }}
      >
        <SafeArea edges="inline" data-testid="inline-safe" />
        <SafeArea
          edges={['inline-start', 'block-end', 'inline-start']}
          data-testid="explicit-safe"
        />
      </UiRoot>,
    );

    expect(screen.getByTestId('inline-safe')).toHaveClass(
      'ui-safe-area-edge-inline-start',
      'ui-safe-area-edge-inline-end',
    );
    expect(screen.getByTestId('inline-safe')).not.toHaveClass(
      'ui-safe-area-edge-block-start',
      'ui-safe-area-edge-block-end',
    );
    const explicit = screen.getByTestId('explicit-safe');
    expect(explicit).toHaveClass('ui-safe-area-edge-inline-start', 'ui-safe-area-edge-block-end');
    expect(explicit.className.match(/ui-safe-area-edge-inline-start/g)).toHaveLength(1);
  });

  it('keeps Spacer permanently decorative and sized on one logical axis only', () => {
    const { container } = render(
      <UiRoot>
        <Spacer axis="inline" size="lg" className="probe" />
      </UiRoot>,
    );
    const spacer = container.querySelector('.ui-spacer');
    expect(spacer).toHaveAttribute('aria-hidden', 'true');
    expect(spacer).toHaveClass('ui-spacer-axis-inline', 'ui-spacer-size-lg', 'probe');
  });

  it('keeps the redesigned APIs type-bounded', () => {
    if (false) {
      <Grid as="ol" start={2} columns={12}>
        <li>typed</li>
      </Grid>;
      // @ts-expect-error arbitrary CSS track strings are not a Grid column contract
      <Grid columns="240px 1fr" />;
      // @ts-expect-error physical spacing is not part of Inset
      <Inset paddingLeft="lg" />;
      // @ts-expect-error SafeArea uses logical edges only
      <SafeArea edges="left" />;
      // @ts-expect-error Spacer is permanently non-focusable/non-semantic and exposes no DOM prop bag
      <Spacer tabIndex={0} />;
      // @ts-expect-error one-axis Spacer intentionally has no two-dimensional `both` mode
      <Spacer axis="both" />;
      // @ts-expect-error accepted polymorphic layout primitives do not expose inline style
      <Container style={{ maxWidth: 640 }} />;
    }
    expect(true).toBe(true);
  });
});
