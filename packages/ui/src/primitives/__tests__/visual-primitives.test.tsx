import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive';
import {
  Code,
  Divider,
  Heading,
  Icon,
  Label,
  Surface,
  Text,
  defineUiIcon,
} from '..';

describe('accepted visual primitive contract', () => {
  it('keeps typography semantic, token-classed and explicit about long-token wrapping', () => {
    render(
      <UiRoot direction="rtl">
        <Text as="span" tone="warning" wrap="pretty" overflowWrap="anywhere" selectable data-testid="text">
          mixed فارسی English
        </Text>
        <Heading level={4} size="title" overflowWrap="anywhere">Semantic heading</Heading>
        <Label emphasis="strong" data-testid="label">Metadata</Label>
        <Code as="kbd" dir="ltr" overflowWrap="anywhere">Ctrl+K</Code>
      </UiRoot>,
    );

    expect(screen.getByTestId('text').tagName).toBe('SPAN');
    expect(screen.getByTestId('text')).toHaveClass(
      'ui-text--warning',
      'ui-text--wrap-pretty',
      'ui-text--overflow-wrap-anywhere',
      'ui-text--selectable',
    );
    expect(screen.getByRole('heading', { level: 4 })).toHaveClass('ui-heading--title');
    expect(screen.getByTestId('label').tagName).toBe('SPAN');
    expect(screen.getByText('Ctrl+K').tagName).toBe('KBD');
    expect(screen.getByText('Ctrl+K')).toHaveAttribute('dir', 'ltr');
  });

  it('normalizes immutable multi-state glyph families with explicit transient transitions', () => {
    const glyph = defineUiIcon({
      defaultState: 'off',
      states: {
        off: ['M5 12h14'],
        on: ['M12 5v14'],
      },
      transitions: [
        {
          from: 'off',
          to: 'on',
          transientState: 'activating',
          transient: ['M6 12h12M12 6v12'],
          motion: 'pulse',
        },
      ],
    });

    expect(glyph.defaultState).toBe('off');
    expect(glyph.transitions[0]?.transientState).toBe('activating');
    expect(Object.isFrozen(glyph)).toBe(true);
    expect(Object.isFrozen(glyph.states.off)).toBe(true);
    expect(Object.isFrozen(glyph.transitions)).toBe(true);
  });

  it('moves stable → transient → stable and reserves animation lifecycle ownership inside Icon', async () => {
    const glyph = defineUiIcon({
      defaultState: 'idle',
      states: {
        idle: ['M5 12h14'],
        active: ['M12 5v14'],
      },
      transitions: [
        {
          from: 'idle',
          to: 'active',
          transientState: 'activating',
          transient: ['M6 12h12M12 6v12'],
        },
      ],
    });

    const { container, rerender } = render(
      <UiRoot motion="full">
        <Icon glyph={glyph} state="idle" label="Stateful" />
      </UiRoot>,
    );
    const icon = screen.getByRole('img', { name: 'Stateful' });
    expect(icon).toHaveAttribute('data-oxs-icon-state', 'idle');
    expect(icon).toHaveAttribute('data-oxs-icon-visual-state', 'idle');
    expect(icon).toHaveAttribute('data-oxs-icon-phase', 'stable');

    rerender(
      <UiRoot motion="full">
        <Icon glyph={glyph} state="active" label="Stateful" />
      </UiRoot>,
    );

    await waitFor(() => expect(icon).toHaveAttribute('data-oxs-icon-phase', 'transitioning'));
    expect(icon).toHaveAttribute('data-oxs-icon-state', 'active');
    expect(icon).toHaveAttribute('data-oxs-icon-visual-state', 'activating');
    expect(icon).toHaveAttribute('data-oxs-icon-from', 'idle');
    expect(icon).toHaveAttribute('data-oxs-icon-to', 'active');
    const transition = container.querySelector('.ui-icon__transition');
    expect(transition).toHaveAttribute('data-oxs-icon-transient', 'activating');
    fireEvent.animationEnd(transition as Element);

    await waitFor(() => expect(icon).toHaveAttribute('data-oxs-icon-phase', 'stable'));
    expect(icon).toHaveAttribute('data-oxs-icon-visual-state', 'active');
    expect(container.querySelector('.ui-icon__transition')).toBeNull();
  });

  it('keeps static icons decorative by default, labeled icons standalone, and directional glyphs semantic', () => {
    const custom = defineUiIcon({ paths: ['M4 12h16'] });
    const { container } = render(
      <UiRoot direction="rtl">
        <Icon name="chevron-end" />
        <Icon glyph={custom} label="Custom" />
      </UiRoot>,
    );
    const icons = container.querySelectorAll('svg');
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true');
    expect(icons[0]).toHaveClass('ui-icon--mirror-rtl');
    expect(icons[0]).toHaveAttribute('focusable', 'false');
    expect(screen.getByRole('img', { name: 'Custom' })).not.toHaveAttribute('aria-hidden');
  });

  it('keeps Surface static and Divider semantics/token roles explicit', () => {
    render(
      <UiRoot>
        <Surface
          data-testid="surface"
          material="glass"
          elevation={2}
          radius="xl"
          border="strong"
          clip
        >
          content
        </Surface>
        <Divider data-testid="semantic" tone="strong" thickness="strong" inset="start" />
        <Divider data-testid="decorative" decorative />
      </UiRoot>,
    );

    expect(screen.getByTestId('surface')).toHaveClass(
      'ui-surface--material-glass',
      'ui-surface--elevation-2',
      'ui-radius-xl',
      'ui-surface--border-strong',
      'ui-surface--clip',
    );
    expect(screen.getByTestId('semantic')).toHaveAttribute('role', 'separator');
    expect(screen.getByTestId('semantic')).toHaveAttribute('aria-orientation', 'horizontal');
    expect(screen.getByTestId('semantic')).toHaveClass(
      'ui-divider--tone-strong',
      'ui-divider--thickness-strong',
      'ui-divider--inset-start',
    );
    expect(screen.getByTestId('decorative')).toHaveAttribute('role', 'none');
    expect(screen.getByTestId('decorative')).toHaveAttribute('aria-hidden', 'true');
  });

  it('rejects invalid icon family topology before render', () => {
    expect(() => defineUiIcon({ paths: [] })).toThrow(/at least one non-empty SVG path/);
    expect(() => defineUiIcon({
      defaultState: 'idle',
      states: { idle: ['M4 12h16'] },
      transitions: [{ from: 'idle', to: 'idle', transientState: 'loop' }],
    })).toThrow(/distinct stable states/);
  });

  it('keeps visual APIs type-bounded and removes the legacy generic animated icon knob', () => {
    if (false) {
      <Text as="span" title="native span prop">typed</Text>;
      // @ts-expect-error paragraph semantics do not accept anchor-only href
      <Text as="p" href="/nope">bad</Text>;
      <Code as="kbd" title="shortcut">Ctrl+K</Code>;
      // @ts-expect-error code/kbd/samp do not accept anchor-only href
      <Code as="kbd" href="/nope">bad</Code>;
      // @ts-expect-error generic spin animation was removed; stateful icon families own motion
      <Icon name="settings" animated />;
      // @ts-expect-error Icon explicitly reserves decorative/labeled aria-hidden semantics from raw SVG props
      <Icon name="settings" aria-hidden={false} />;
      // @ts-expect-error divider tone stays on the finite semantic border vocabulary
      <Divider tone="accent" />;
      // @ts-expect-error Divider owns separator/decorative role semantics
      <Divider role="presentation" />;
      // @ts-expect-error built-in Icon state is restricted to the selected glyph family
      <Icon name="settings" state="pause" />;
      // @ts-expect-error playback only accepts its declared stable states
      <Icon name="playback" state="default" />;
      // @ts-expect-error visual primitives continue to forbid inline style
      <Surface style={{ background: 'red' }} />;
    }
    expect(true).toBe(true);
  });
});
