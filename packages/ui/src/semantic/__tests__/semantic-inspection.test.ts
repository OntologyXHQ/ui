import { describe, expect, it, vi } from 'vitest';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import {
  createUiBindingRegistry,
  createUiSourceRegistry,
  defineUiBinding,
  defineUiSource,
} from '../data';
import {
  inspectUiRuntime,
  invokeUiInspectionCommand,
  UI_INSPECTION_MAX_SELECTION,
} from '../inspection';
import { resolveUiDefinition } from '../resolve';

type Context = {
  selection: readonly string[];
  executed: string[];
  allowOpen: boolean;
};

function fixture(selection: readonly string[] = ['readme']) {
  const context: Context = { selection, executed: [], allowOpen: true };
  const open = vi.fn(
    (_context: Context, invocation?: { target?: string; selection?: readonly string[] }) => {
      context.executed.push(`open:${invocation?.target ?? 'none'}`);
    },
  );
  const remove = vi.fn(() => {
    context.executed.push('delete');
  });
  const commands = createUiCommandRegistry<Context>([
    defineCommand<Context>({
      id: 'file.open',
      label: 'Open',
      shortcut: 'Enter',
      isAvailable: ({ allowOpen }) => allowOpen,
      execute: open,
    }),
    defineCommand<Context>({
      id: 'file.delete',
      label: 'Delete',
      intent: 'destructive',
      execute: remove,
    }),
    defineCommand<Context>({ id: 'workspace.refresh', label: 'Refresh', execute: () => undefined }),
  ]);
  const bindings = createUiBindingRegistry<Context>([
    defineUiBinding<Context>({
      id: 'files.selection',
      kind: 'string-list',
      read: ({ selection }) => selection,
    }),
  ]);
  const sources = createUiSourceRegistry<Context>([
    defineUiSource<Context>({
      id: 'files.current',
      kind: 'collection',
      read: () => [
        { id: 'readme', label: 'README.md' },
        { id: 'roadmap', label: 'ROADMAP.md' },
        { id: 'disabled', label: 'Disabled', disabled: true },
      ],
    }),
  ]);
  const definition = defineUi({
    id: 'files.surface',
    nodes: [
      ui.commandGroup({
        id: 'files.actions',
        label: 'Workspace actions',
        commands: [{ command: 'workspace.refresh' }],
      }),
      ui.collection({
        id: 'files.current',
        source: 'files.current',
        selection: { mode: 'multiple', binding: 'files.selection' },
        commands: ['file.delete'],
        activationCommand: 'file.open',
      }),
      ui.confirmation({
        id: 'files.delete-confirmation',
        title: 'Delete files?',
        confirmCommand: 'file.delete',
      }),
    ],
  });
  const runtime = resolveUiDefinition(definition, commands, context, { bindings, sources });
  return { context, commands, runtime, open, remove };
}

describe('semantic inspection + actionability', () => {
  it('projects a bounded serializable semantic snapshot without host values/functions', () => {
    const { runtime } = fixture(['readme', 'offscreen']);
    const snapshot = inspectUiRuntime(runtime, {
      focus: { node: 'files.current', item: 'roadmap' },
    });

    expect(snapshot).toMatchObject({
      inspectionVersion: 1,
      kind: 'ui-inspection',
      surface: 'files.surface',
      focus: { node: 'files.current', item: 'roadmap' },
      focusedItem: { id: 'roadmap', label: 'ROADMAP.md', disabled: false },
      selections: [
        {
          node: 'files.current',
          ids: ['readme', 'offscreen'],
          totalCount: 2,
          truncated: false,
        },
      ],
    });
    expect(snapshot.availableCommands).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ command: 'workspace.refresh', scope: 'surface' }),
        expect.objectContaining({ command: 'file.delete', scope: 'selection' }),
        expect.objectContaining({
          command: 'file.open',
          scope: 'focused-item',
          invocation: { target: 'roadmap', selection: ['readme', 'offscreen'] },
        }),
        expect.objectContaining({
          command: 'file.delete',
          scope: 'confirmation',
          requiresConfirmation: true,
          invocable: false,
        }),
      ]),
    );
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(JSON.stringify(snapshot)).not.toMatch(/allowOpen|executed|function|description/u);
  });

  it('invokes only a command action already exposed by the snapshot and derives target/selection itself', async () => {
    const { runtime, context, commands, open } = fixture(['readme']);
    const snapshot = inspectUiRuntime(runtime, {
      focus: { node: 'files.current', item: 'roadmap' },
    });

    await expect(
      invokeUiInspectionCommand(snapshot, commands, context, {
        command: 'file.open',
        sourceNode: 'files.current',
        scope: 'focused-item',
      }),
    ).resolves.toMatchObject({ status: 'executed', command: 'file.open' });
    expect(open).toHaveBeenCalledWith(context, { target: 'roadmap', selection: ['readme'] });

    await expect(
      invokeUiInspectionCommand(snapshot, commands, context, { command: 'file.missing' }),
    ).resolves.toMatchObject({ status: 'unknown-command' });
  });

  it('rechecks host availability at execution instead of trusting a stale inspection snapshot', async () => {
    const { runtime, context, commands, open } = fixture();
    const snapshot = inspectUiRuntime(runtime, {
      focus: { node: 'files.current', item: 'roadmap' },
    });
    context.allowOpen = false;

    await expect(
      invokeUiInspectionCommand(snapshot, commands, context, {
        command: 'file.open',
        sourceNode: 'files.current',
        scope: 'focused-item',
      }),
    ).resolves.toMatchObject({ status: 'unavailable' });
    expect(open).not.toHaveBeenCalled();
  });

  it('never bypasses a semantic confirmation action', async () => {
    const { runtime, context, commands, remove } = fixture();
    const snapshot = inspectUiRuntime(runtime);

    await expect(
      invokeUiInspectionCommand(snapshot, commands, context, {
        command: 'file.delete',
        sourceNode: 'files.delete-confirmation',
        scope: 'confirmation',
      }),
    ).resolves.toMatchObject({ status: 'requires-confirmation' });
    expect(remove).not.toHaveBeenCalled();
  });

  it('blocks invocation instead of truncating a selection that exceeds the inspection bound', async () => {
    const selection = Array.from(
      { length: UI_INSPECTION_MAX_SELECTION + 1 },
      (_, index) => `file-${index}`,
    );
    const { runtime, context, commands, open } = fixture(selection);
    const snapshot = inspectUiRuntime(runtime, {
      focus: { node: 'files.current', item: 'roadmap' },
    });

    expect(snapshot.selections[0]).toMatchObject({
      totalCount: UI_INSPECTION_MAX_SELECTION + 1,
      truncated: true,
    });
    expect(snapshot.selections[0]?.ids).toHaveLength(UI_INSPECTION_MAX_SELECTION);
    expect(
      snapshot.availableCommands.find(
        (command) => command.command === 'file.open' && command.scope === 'focused-item',
      ),
    ).toMatchObject({ invocable: false, blockedReason: 'selection-truncated' });

    await expect(
      invokeUiInspectionCommand(snapshot, commands, context, {
        command: 'file.open',
        sourceNode: 'files.current',
        scope: 'focused-item',
      }),
    ).resolves.toMatchObject({ status: 'selection-truncated' });
    expect(open).not.toHaveBeenCalled();
  });

  it('rejects stale focus references and disables activation of disabled focused items', () => {
    const { runtime } = fixture();
    const stale = inspectUiRuntime(runtime, { focus: { node: 'files.current', item: 'missing' } });
    expect(stale.focus).toEqual({ node: 'files.current' });
    expect(stale.diagnostics).toEqual([expect.objectContaining({ code: 'unknown-focus-item' })]);

    const disabled = inspectUiRuntime(runtime, {
      focus: { node: 'files.current', item: 'disabled' },
    });
    expect(disabled.focusedItem).toMatchObject({ id: 'disabled', disabled: true });
    expect(
      disabled.availableCommands.find(
        (command) => command.command === 'file.open' && command.scope === 'focused-item',
      ),
    ).toMatchObject({ enabled: false, invocable: false });
  });
});
