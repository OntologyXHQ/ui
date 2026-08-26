import { describe, expect, it, vi } from 'vitest';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import { UiIrValidationError, validateUiDefinition } from '../diagnostics';
import { resolveUiDefinition } from '../resolve';

type Context = {
  selection: readonly string[];
};

describe('V2 semantic UI IR', () => {
  it('authors a versioned JSON-serializable surface without behavior functions', () => {
    const definition = defineUi({
      id: 'files.main',
      nodes: [
        ui.collection({
          id: 'files.current',
          source: 'files.current-directory',
          selection: { mode: 'multiple' },
          navigation: { mode: 'spatial' },
          commands: ['file.open', 'file.delete'],
          presentation: { preferred: 'grid' },
        }),
        ui.commandGroup({
          id: 'files.actions',
          label: 'File actions',
          commands: [{ command: 'file.open', emphasis: 'primary' }, { command: 'file.delete' }],
        }),
        ui.confirmation({
          id: 'files.delete-confirmation',
          title: 'Delete selected files?',
          description: 'This action cannot be undone.',
          confirmCommand: 'file.delete',
          intent: 'destructive',
        }),
      ],
    });

    expect(definition.irVersion).toBe(1);
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition);
    expect(validateUiDefinition(definition)).toEqual([]);
  });

  it('rejects functions and invalid semantic ids before IR enters the runtime', () => {
    const invalid = {
      irVersion: 1,
      id: 'bad id',
      nodes: [
        {
          kind: 'confirmation',
          title: 'Delete?',
          confirmCommand: 'file.delete',
          style: { color: 'red' },
          onConfirm: () => undefined,
        },
      ],
    };

    const diagnostics = validateUiDefinition(invalid);
    expect(diagnostics.some((item) => item.code === 'invalid-id' && item.path === '$.id')).toBe(
      true,
    );
    expect(
      diagnostics.some(
        (item) => item.code === 'non-serializable' && item.path === '$.nodes[0].onConfirm',
      ),
    ).toBe(true);
    expect(
      diagnostics.some((item) => item.code === 'unknown-field' && item.path === '$.nodes[0].style'),
    ).toBe(true);
    expect(() => defineUi(invalid as never)).toThrow(UiIrValidationError);
  });

  it('keeps executable behavior in the command registry and resolves serializable runtime state', async () => {
    const executeDelete = vi.fn();
    const registry = createUiCommandRegistry<Context>([
      defineCommand<Context>({
        id: 'file.open',
        label: 'Open',
        shortcut: 'Enter',
        isAvailable: ({ selection }) => selection.length === 1,
        execute: () => undefined,
      }),
      defineCommand<Context>({
        id: 'file.delete',
        label: 'Delete',
        intent: 'destructive',
        shortcut: 'Delete',
        isAvailable: ({ selection }) => selection.length > 0,
        execute: executeDelete,
      }),
    ]);
    const definition = defineUi({
      id: 'files.main',
      nodes: [
        ui.commandGroup({
          label: 'File actions',
          commands: [{ command: 'file.open', emphasis: 'primary' }, { command: 'file.delete' }],
        }),
        ui.confirmation({
          title: 'Delete selected files?',
          confirmCommand: 'file.delete',
        }),
      ],
    });

    const context = { selection: ['a.ts', 'b.ts'] };
    const runtime = resolveUiDefinition(definition, registry, context);

    expect(runtime.diagnostics).toEqual([]);
    expect(runtime.nodes[0]).toMatchObject({
      kind: 'command-group',
      commands: [
        { id: 'file.open', label: 'Open', enabled: false, emphasis: 'primary' },
        { id: 'file.delete', label: 'Delete', enabled: true, intent: 'destructive' },
      ],
    });
    expect(runtime.nodes[1]).toMatchObject({
      kind: 'confirmation',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      intent: 'destructive',
    });
    expect(JSON.parse(JSON.stringify(runtime))).toEqual(runtime);

    await expect(registry.execute('file.open', context)).resolves.toBe(false);
    await expect(registry.execute('file.delete', context)).resolves.toBe(true);
    expect(executeDelete).toHaveBeenCalledTimes(1);
  });

  it('records unknown command references as runtime diagnostics instead of inventing behavior', () => {
    const registry = createUiCommandRegistry<Context>([]);
    const definition = defineUi({
      id: 'files.main',
      nodes: [ui.commandGroup({ label: 'File actions', commands: [{ command: 'file.missing' }] })],
    });

    const runtime = resolveUiDefinition(definition, registry, { selection: [] });
    expect(runtime.nodes[0]).toMatchObject({ kind: 'command-group', commands: [] });
    expect(runtime.diagnostics).toEqual([
      expect.objectContaining({ code: 'unknown-command', command: 'file.missing' }),
    ]);
  });
});
