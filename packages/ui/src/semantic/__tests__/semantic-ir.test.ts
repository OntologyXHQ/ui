import { describe, expect, it, vi } from 'vitest';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import {
  createUiBindingRegistry,
  createUiSourceRegistry,
  defineUiBinding,
  defineUiSource,
} from '../data';
import { UiIrValidationError, validateUiDefinition } from '../diagnostics';
import { resolveUiDefinition } from '../resolve';

type Context = {
  selection: readonly string[];
  displayName: string;
  appearance: string;
  reducedMotion: boolean;
};

function createContext(): Context {
  return {
    selection: ['a.ts', 'b.ts'],
    displayName: 'OntologyX',
    appearance: 'system',
    reducedMotion: false,
  };
}

function createDataRegistries() {
  const bindings = createUiBindingRegistry<Context>([
    defineUiBinding<Context>({
      id: 'settings.display-name',
      kind: 'string',
      read: (context) => context.displayName,
      write: (value, context) => {
        if (typeof value === 'string') context.displayName = value;
      },
    }),
    defineUiBinding<Context>({
      id: 'settings.appearance',
      kind: 'string',
      read: (context) => context.appearance,
      write: (value, context) => {
        if (typeof value === 'string') context.appearance = value;
      },
    }),
    defineUiBinding<Context>({
      id: 'settings.reduced-motion',
      kind: 'boolean',
      read: (context) => context.reducedMotion,
      write: (value, context) => {
        if (typeof value === 'boolean') context.reducedMotion = value;
      },
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
    defineUiSource<Context>({
      id: 'files.current-directory',
      kind: 'collection',
      read: ({ selection }) => selection.map((id) => ({ id, label: id })),
    }),
  ]);
  return { bindings, sources };
}

describe('V2 semantic UI IR', () => {
  it('authors a versioned JSON-serializable surface without behavior functions or embedded state', () => {
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
        ui.form({
          id: 'settings.profile',
          title: 'Profile settings',
          fields: [
            ui.field({
              id: 'settings.display-name-field',
              binding: 'settings.display-name',
              label: 'Display name',
            }),
            ui.choice({
              id: 'settings.appearance-field',
              binding: 'settings.appearance',
              optionsSource: 'settings.appearance-options',
              label: 'Appearance',
              presentation: { preferred: 'segmented' },
            }),
            ui.toggle({
              id: 'settings.reduced-motion-field',
              binding: 'settings.reduced-motion',
              label: 'Reduce motion',
            }),
          ],
        }),
      ],
    });

    expect(definition.irVersion).toBe(1);
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition);
    expect(JSON.stringify(definition)).not.toContain('OntologyX');
    expect(validateUiDefinition(definition)).toEqual([]);
  });

  it('rejects functions, arbitrary presentation fields and invalid semantic ids before IR enters runtime', () => {
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

    const context = createContext();
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

  it('resolves host-owned bindings and sources without putting application values or functions in Author IR', async () => {
    const context = createContext();
    const { bindings, sources } = createDataRegistries();
    const definition = defineUi({
      id: 'settings.main',
      nodes: [
        ui.form({
          id: 'settings.appearance',
          title: 'Appearance',
          fields: [
            ui.field({
              id: 'settings.display-name-field',
              binding: 'settings.display-name',
              label: 'Display name',
            }),
            ui.choice({
              id: 'settings.appearance-field',
              binding: 'settings.appearance',
              optionsSource: 'settings.appearance-options',
              label: 'Appearance',
              presentation: { preferred: 'segmented' },
            }),
            ui.toggle({
              id: 'settings.reduced-motion-field',
              binding: 'settings.reduced-motion',
              label: 'Reduce motion',
            }),
          ],
        }),
        ui.collection({
          id: 'files.current',
          source: 'files.current-directory',
          commands: [],
        }),
      ],
    });

    const runtime = resolveUiDefinition(definition, createUiCommandRegistry<Context>([]), context, {
      bindings,
      sources,
    });

    expect(runtime.diagnostics).toEqual([]);
    expect(runtime.nodes[0]).toMatchObject({
      kind: 'form',
      fields: [
        { kind: 'field', binding: { id: 'settings.display-name', value: 'OntologyX' } },
        {
          kind: 'choice',
          binding: { id: 'settings.appearance', value: 'system' },
          optionsSource: { id: 'settings.appearance-options', kind: 'options' },
          resolvedPresentation: 'segmented',
        },
        {
          kind: 'toggle',
          binding: { id: 'settings.reduced-motion', value: false },
        },
      ],
    });
    expect(runtime.nodes[1]).toMatchObject({
      kind: 'collection',
      sourceState: { id: 'files.current-directory', available: true, itemCount: 2 },
    });
    expect(JSON.parse(JSON.stringify(runtime))).toEqual(runtime);

    await expect(bindings.write('settings.display-name', 'OXS', context)).resolves.toBe(true);
    await expect(bindings.write('settings.reduced-motion', true, context)).resolves.toBe(true);
    expect(context.displayName).toBe('OXS');
    expect(context.reducedMotion).toBe(true);
  });

  it('reports missing and mismatched data capabilities instead of coercing them', () => {
    const context = createContext();
    const bindings = createUiBindingRegistry<Context>([
      defineUiBinding<Context>({
        id: 'settings.wrong-toggle',
        kind: 'string',
        read: () => 'not-a-boolean',
      }),
    ]);
    const sources = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'settings.wrong-options',
        kind: 'collection',
        read: () => [],
      }),
    ]);
    const definition = defineUi({
      id: 'settings.main',
      nodes: [
        ui.form({
          id: 'settings.form',
          title: 'Settings',
          fields: [
            ui.field({ id: 'missing', binding: 'settings.missing', label: 'Missing' }),
            ui.toggle({
              id: 'wrong-toggle',
              binding: 'settings.wrong-toggle',
              label: 'Wrong toggle',
            }),
            ui.choice({
              id: 'wrong-choice',
              binding: 'settings.missing-choice',
              optionsSource: 'settings.wrong-options',
              label: 'Wrong choice',
            }),
          ],
        }),
      ],
    });

    const runtime = resolveUiDefinition(definition, createUiCommandRegistry<Context>([]), context, {
      bindings,
      sources,
    });

    expect(runtime.nodes[0]).toMatchObject({ kind: 'form', fields: [] });
    expect(runtime.diagnostics.map((item) => item.code)).toEqual([
      'unknown-binding',
      'binding-kind-mismatch',
      'unknown-binding',
      'source-kind-mismatch',
    ]);
  });

  it('records unknown command references as runtime diagnostics instead of inventing behavior', () => {
    const registry = createUiCommandRegistry<Context>([]);
    const definition = defineUi({
      id: 'files.main',
      nodes: [ui.commandGroup({ label: 'File actions', commands: [{ command: 'file.missing' }] })],
    });

    const runtime = resolveUiDefinition(definition, registry, createContext());
    expect(runtime.nodes[0]).toMatchObject({ kind: 'command-group', commands: [] });
    expect(runtime.diagnostics).toEqual([
      expect.objectContaining({ code: 'unknown-command', command: 'file.missing' }),
    ]);
  });
});
