import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive/UiRoot';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import {
  createUiBindingRegistry,
  createUiSourceRegistry,
  defineUiBinding,
  defineUiSource,
} from '../data';
import { SemanticCommandGroup, SemanticConfirmation, SemanticForm } from '../react';
import { resolveUiDefinition } from '../resolve';

type Context = {
  selected: boolean;
  name: string;
  appearance: string;
  reducedMotion: boolean;
};

function renderRoot(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('V2 semantic React bridge', () => {
  it('renders a resolved command group through canonical ActionGroup and Button behavior', () => {
    const execute = vi.fn();
    const context = { selected: true, name: 'OXS', appearance: 'system', reducedMotion: false };
    const registry = createUiCommandRegistry<Context>([
      defineCommand<Context>({ id: 'file.rename', label: 'Rename', shortcut: 'F2', execute }),
    ]);
    const definition = defineUi({
      id: 'files.main',
      nodes: [
        ui.commandGroup({
          id: 'files.actions',
          label: 'File actions',
          commands: [{ command: 'file.rename', emphasis: 'secondary' }],
        }),
      ],
    });
    const runtime = resolveUiDefinition(definition, registry, context);
    const node = runtime.nodes[0];
    if (!node || node.kind !== 'command-group') throw new Error('Expected command group');

    renderRoot(<SemanticCommandGroup node={node} registry={registry} context={context} />);

    const button = screen.getByRole('button', { name: 'Rename' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'F2');
    expect(button).toHaveAttribute('data-ui-command', 'file.rename');
    fireEvent.click(button);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('maps destructive confirmation semantics onto the accepted AlertDialog contract', () => {
    const execute = vi.fn();
    const onOpenChange = vi.fn();
    const context = { selected: true, name: 'OXS', appearance: 'system', reducedMotion: false };
    const registry = createUiCommandRegistry<Context>([
      defineCommand<Context>({
        id: 'file.delete',
        label: 'Delete',
        intent: 'destructive',
        execute,
      }),
    ]);
    const definition = defineUi({
      id: 'files.main',
      nodes: [ui.confirmation({ title: 'Delete file?', confirmCommand: 'file.delete' })],
    });
    const runtime = resolveUiDefinition(definition, registry, context);
    const node = runtime.nodes[0];
    if (!node || node.kind !== 'confirmation') throw new Error('Expected confirmation');

    renderRoot(
      <SemanticConfirmation
        node={node}
        registry={registry}
        context={context}
        open
        onOpenChange={onOpenChange}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm).toHaveClass('ui-button--intent-destructive');
    fireEvent.click(confirm);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders semantic form bindings through canonical TextField, Select and Switch controls', () => {
    const writeName = vi.fn();
    const writeAppearance = vi.fn();
    const writeReducedMotion = vi.fn();
    const context: Context = {
      selected: true,
      name: 'OntologyX',
      appearance: 'system',
      reducedMotion: false,
    };
    const bindings = createUiBindingRegistry<Context>([
      defineUiBinding<Context>({
        id: 'settings.name',
        kind: 'string',
        read: ({ name }) => name,
        write: (value) => writeName(value),
      }),
      defineUiBinding<Context>({
        id: 'settings.appearance',
        kind: 'string',
        read: ({ appearance }) => appearance,
        write: (value) => writeAppearance(value),
      }),
      defineUiBinding<Context>({
        id: 'settings.reduced-motion',
        kind: 'boolean',
        read: ({ reducedMotion }) => reducedMotion,
        write: (value) => writeReducedMotion(value),
      }),
    ]);
    const sources = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'settings.appearance-options',
        kind: 'options',
        read: () => [
          { id: 'system', label: 'System', value: 'system' },
          { id: 'light', label: 'Light', value: 'light' },
          { id: 'dark', label: 'Dark', value: 'dark' },
        ],
      }),
    ]);
    const definition = defineUi({
      id: 'settings.main',
      nodes: [
        ui.form({
          id: 'settings.form',
          title: 'Appearance',
          fields: [
            ui.field({ id: 'name', binding: 'settings.name', label: 'Display name' }),
            ui.choice({
              id: 'appearance',
              binding: 'settings.appearance',
              optionsSource: 'settings.appearance-options',
              label: 'Appearance',
            }),
            ui.toggle({
              id: 'reduced-motion',
              binding: 'settings.reduced-motion',
              label: 'Reduce motion',
            }),
          ],
        }),
      ],
    });
    const runtime = resolveUiDefinition(definition, createUiCommandRegistry<Context>([]), context, {
      bindings,
      sources,
    });
    const node = runtime.nodes[0];
    if (!node || node.kind !== 'form') throw new Error('Expected form');

    renderRoot(<SemanticForm node={node} bindings={bindings} context={context} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Display name' }), {
      target: { value: 'OXS' },
    });
    expect(writeName).toHaveBeenCalledWith('OXS');

    fireEvent.click(screen.getByRole('combobox', { name: 'Appearance' }));
    fireEvent.click(screen.getByRole('option', { name: 'Dark' }));
    expect(writeAppearance).toHaveBeenCalledWith('dark');

    fireEvent.click(screen.getByRole('switch', { name: 'Reduce motion' }));
    expect(writeReducedMotion).toHaveBeenCalledWith(true);
  });
});
