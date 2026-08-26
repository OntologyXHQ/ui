import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive/UiRoot';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import { SemanticCommandGroup, SemanticConfirmation } from '../react';
import { resolveUiDefinition } from '../resolve';

type Context = { selected: boolean };

describe('V2 semantic React bridge', () => {
  it('renders a resolved command group through canonical ActionGroup and Button behavior', () => {
    const execute = vi.fn();
    const context = { selected: true };
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

    render(
      <UiRoot>
        <SemanticCommandGroup node={node} registry={registry} context={context} />
      </UiRoot>,
    );

    const button = screen.getByRole('button', { name: 'Rename' });
    expect(button).toHaveAttribute('aria-keyshortcuts', 'F2');
    expect(button).toHaveAttribute('data-ui-command', 'file.rename');
    fireEvent.click(button);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('maps destructive confirmation semantics onto the accepted AlertDialog contract', () => {
    const execute = vi.fn();
    const onOpenChange = vi.fn();
    const context = { selected: true };
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

    render(
      <UiRoot>
        <SemanticConfirmation
          node={node}
          registry={registry}
          context={context}
          open
          onOpenChange={onOpenChange}
        />
      </UiRoot>,
    );

    const confirm = screen.getByRole('button', { name: 'Delete' });
    expect(confirm).toHaveClass('ui-button--intent-destructive');
    fireEvent.click(confirm);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
