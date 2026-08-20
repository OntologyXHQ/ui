import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Box, Code, Divider, Icon, SafeArea, Stack, Text, Wrap, defineUiIcon } from '..';

describe('Primitive layer contract', () => {
  it('renders structural and semantic primitives inside RTL/container scopes', () => {
    render(
      <UiRoot direction="rtl">
        <Box as="section" aria-label="Primitive scope">
          <Stack gap="sm">
            <Wrap gap="xs">
              <Text>سلام</Text>
              <Code>const x = 1</Code>
            </Wrap>
          </Stack>
          <SafeArea edges="inline" data-testid="safe" />
          <Divider data-testid="divider" />
        </Box>
      </UiRoot>,
    );
    expect(screen.getByRole('region', { name: 'Primitive scope' })).toBeInTheDocument();
    expect(screen.getByText('const x = 1').tagName).toBe('CODE');
    expect(screen.getByTestId('safe')).toHaveClass(
      'ui-safe-area-edge-inline-start',
      'ui-safe-area-edge-inline-end',
    );
    expect(screen.getByTestId('divider')).toHaveAttribute('role', 'separator');
  });

  it('keeps icons decorative by default and supports path-only custom glyph extension', () => {
    const glyph = defineUiIcon({ paths: ['M4 12h16'] });
    const { container } = render(
      <>
        <Icon name="chevron-end" />
        <Icon glyph={glyph} label="Custom" />
      </>,
    );
    const icons = container.querySelectorAll('svg');
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    expect(icons[0]).toHaveClass('ui-icon--mirror-rtl');
    expect(screen.getByRole('img', { name: 'Custom' })).toBeInTheDocument();
  });
});
