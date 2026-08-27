import { describe, expect, it, vi } from 'vitest';
import { defineUi, ui } from '../authoring';
import { createUiCommandRegistry, defineCommand } from '../commands';
import {
  createUiBindingRegistry,
  createUiSourceRegistry,
  defineUiBinding,
  defineUiSource,
  UI_SOURCE_SNAPSHOT_MAX_ITEMS,
} from '../data';
import { UiIrValidationError, validateUiDefinition } from '../diagnostics';
import { createUiResolverEnvironment } from '../environment';
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

function resolverEnvironment(
  overrides: Partial<Parameters<typeof createUiResolverEnvironment>[0]> = {},
) {
  return createUiResolverEnvironment({
    container: 'regular',
    modality: 'mouse',
    density: 'comfortable',
    direction: 'ltr',
    pointerPrecision: 'fine',
    ...overrides,
  });
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
    defineUiBinding<Context>({
      id: 'files.selection',
      kind: 'string-list',
      read: (context) => context.selection,
      write: (value, context) => {
        if (Array.isArray(value) && value.every((item) => typeof item === 'string'))
          context.selection = value;
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

  it('keeps executable behavior in registries and resolves serializable runtime state', async () => {
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
      resolvedPresentation: 'inline',
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

  it('resolves host-owned bindings and sources without putting application functions in IR', async () => {
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
      ],
    });

    const runtime = resolveUiDefinition(definition, createUiCommandRegistry<Context>([]), context, {
      bindings,
      sources,
      environment: resolverEnvironment(),
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

  it('treats author presentation as a soft preference under adaptive policy', () => {
    const context = createContext();
    const { bindings, sources } = createDataRegistries();
    const registry = createUiCommandRegistry<Context>([
      defineCommand<Context>({ id: 'file.open', label: 'Open', execute: () => undefined }),
    ]);
    const definition = defineUi({
      id: 'adaptive.main',
      nodes: [
        ui.commandGroup({
          label: 'File actions',
          commands: [{ command: 'file.open' }],
          presentation: { preferred: 'inline' },
        }),
        ui.form({
          id: 'settings.form',
          title: 'Settings',
          fields: [
            ui.choice({
              id: 'appearance',
              binding: 'settings.appearance',
              optionsSource: 'settings.appearance-options',
              label: 'Appearance',
              presentation: { preferred: 'segmented' },
            }),
          ],
        }),
      ],
    });

    const compact = resolveUiDefinition(definition, registry, context, {
      bindings,
      sources,
      environment: resolverEnvironment({
        container: 'compact',
        modality: 'touch',
        pointerPrecision: 'coarse',
      }),
    });
    const regular = resolveUiDefinition(definition, registry, context, {
      bindings,
      sources,
      environment: resolverEnvironment(),
    });

    expect(compact.nodes[0]).toMatchObject({
      kind: 'command-group',
      resolvedPresentation: 'menu',
    });
    expect(compact.nodes[1]).toMatchObject({
      kind: 'form',
      fields: [{ kind: 'choice', resolvedPresentation: 'select' }],
    });
    expect(regular.nodes[0]).toMatchObject({
      kind: 'command-group',
      resolvedPresentation: 'inline',
    });
    expect(regular.nodes[1]).toMatchObject({
      kind: 'form',
      fields: [{ kind: 'choice', resolvedPresentation: 'segmented' }],
    });
  });

  it('keeps resolver environment explicit, resolved and JSON-serializable', () => {
    const environment = resolverEnvironment({
      container: 'wide',
      modality: 'keyboard',
      density: 'compact',
      direction: 'rtl',
      capabilities: ['workspace.rename', 'workspace.rename', 'workspace.preview'],
    });

    expect(environment).toEqual({
      container: 'wide',
      modality: 'keyboard',
      density: 'compact',
      direction: 'rtl',
      pointerPrecision: 'fine',
      capabilities: ['workspace.rename', 'workspace.preview'],
    });
    expect(JSON.parse(JSON.stringify(environment))).toEqual(environment);
    expect(() =>
      createUiResolverEnvironment({
        container: 'regular',
        modality: 'auto' as never,
        density: 'comfortable',
        direction: 'ltr',
        pointerPrecision: 'fine',
      }),
    ).toThrow('Invalid UI resolver modality: auto');
  });

  it('places larger command groups deterministically without losing command metadata', () => {
    const context = createContext();
    const registry = createUiCommandRegistry<Context>([
      defineCommand<Context>({
        id: 'a.one',
        label: 'One',
        shortcut: '1',
        execute: () => undefined,
      }),
      defineCommand<Context>({
        id: 'a.two',
        label: 'Two',
        shortcut: '2',
        execute: () => undefined,
      }),
      defineCommand<Context>({ id: 'a.three', label: 'Three', execute: () => undefined }),
      defineCommand<Context>({ id: 'a.four', label: 'Four', execute: () => undefined }),
      defineCommand<Context>({ id: 'a.five', label: 'Five', execute: () => undefined }),
    ]);
    const definition = defineUi({
      id: 'commands.main',
      nodes: [
        ui.commandGroup({
          label: 'Actions',
          commands: [
            { command: 'a.one', emphasis: 'primary' },
            { command: 'a.two', emphasis: 'secondary' },
            { command: 'a.three' },
            { command: 'a.four' },
            { command: 'a.five' },
          ],
          presentation: { preferred: 'inline' },
        }),
      ],
    });

    const regular = resolveUiDefinition(definition, registry, context, {
      environment: resolverEnvironment(),
    });
    const wide = resolveUiDefinition(definition, registry, context, {
      environment: resolverEnvironment({ container: 'wide' }),
    });
    const compact = resolveUiDefinition(definition, registry, context, {
      environment: resolverEnvironment({
        container: 'compact',
        modality: 'touch',
        pointerPrecision: 'coarse',
      }),
    });

    expect(regular.nodes[0]).toMatchObject({
      kind: 'command-group',
      resolvedPresentation: 'inline-overflow',
      commands: [
        { id: 'a.one', shortcut: '1', placement: 'inline' },
        { id: 'a.two', shortcut: '2', placement: 'inline' },
        { id: 'a.three', placement: 'inline' },
        { id: 'a.four', placement: 'overflow' },
        { id: 'a.five', placement: 'overflow' },
      ],
    });
    expect(wide.nodes[0]).toMatchObject({
      kind: 'command-group',
      resolvedPresentation: 'inline',
      commands: [
        { id: 'a.one', placement: 'inline' },
        { id: 'a.two', placement: 'inline' },
        { id: 'a.three', placement: 'inline' },
        { id: 'a.four', placement: 'inline' },
        { id: 'a.five', placement: 'inline' },
      ],
    });
    expect(compact.nodes[0]).toMatchObject({
      kind: 'command-group',
      resolvedPresentation: 'menu',
      commands: [
        { id: 'a.one', placement: 'overflow' },
        { id: 'a.two', placement: 'overflow' },
        { id: 'a.three', placement: 'overflow' },
        { id: 'a.four', placement: 'overflow' },
        { id: 'a.five', placement: 'overflow' },
      ],
    });
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

  it('resolves bounded collection snapshots, host-owned selection and semantic activation targets', async () => {
    const context = createContext();
    const { bindings } = createDataRegistries();
    const sources = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'files.window',
        kind: 'collection',
        read: () => ({
          items: [
            { id: 'a.ts', label: 'a.ts' },
            { id: 'b.ts', label: 'b.ts' },
            { id: 'c.ts', label: 'c.ts' },
          ],
          offset: 10,
          totalCount: 42,
          hasMore: true,
        }),
      }),
    ]);
    const activated = vi.fn();
    const commands = createUiCommandRegistry<Context>([
      defineCommand<Context>({
        id: 'file.open',
        label: 'Open',
        execute: (_context, invocation) => activated(invocation),
      }),
    ]);
    const definition = defineUi({
      id: 'files.workspace',
      nodes: [
        ui.collection({
          id: 'files.current',
          source: 'files.window',
          selection: { mode: 'multiple', binding: 'files.selection' },
          navigation: { mode: 'spatial' },
          activationCommand: 'file.open',
          presentation: { preferred: 'grid' },
        }),
      ],
    });

    const runtime = resolveUiDefinition(definition, commands, context, {
      bindings,
      sources,
      environment: resolverEnvironment({ container: 'wide' }),
    });
    expect(runtime.diagnostics).toEqual([]);
    expect(runtime.nodes[0]).toMatchObject({
      kind: 'collection',
      resolvedPresentation: 'grid',
      selection: { mode: 'multiple', selected: ['a.ts', 'b.ts'] },
      sourceState: { offset: 10, totalCount: 42, hasMore: true },
      activationCommand: { id: 'file.open', enabled: true },
    });
    await expect(
      commands.execute('file.open', context, { target: 'b.ts', selection: ['a.ts', 'b.ts'] }),
    ).resolves.toBe(true);
    expect(activated).toHaveBeenCalledWith({ target: 'b.ts', selection: ['a.ts', 'b.ts'] });
  });

  it('keeps workspace regions semantic and independent from window/process authority', () => {
    const definition = defineUi({
      id: 'files.surface',
      nodes: [
        ui.collection({ id: 'files.places', source: 'files.places-source' }),
        ui.collection({ id: 'files.current', source: 'files.current-source' }),
        ui.workspace({
          id: 'files.workspace',
          label: 'Files workspace',
          regions: [
            { id: 'places', role: 'sidebar', label: 'Places', content: ['files.places'] },
            { id: 'content', role: 'pane', label: 'Files', content: ['files.current'] },
            { id: 'details', role: 'inspector', label: 'Details', content: ['files.current'] },
          ],
        }),
      ],
    });

    expect(validateUiDefinition(definition)).toEqual([]);
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition);
    expect(JSON.stringify(definition)).not.toMatch(/window|process|native/i);
  });

  it('keeps host selection independent from the visible bounded source window', () => {
    const context = createContext();
    context.selection = ['a.ts', 'offscreen.ts', 'a.ts'];
    const { bindings } = createDataRegistries();
    const sources = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'files.window',
        kind: 'collection',
        read: () => ({
          items: [{ id: 'a.ts', label: 'a.ts' }],
          offset: 0,
          totalCount: 42,
          hasMore: true,
        }),
      }),
    ]);
    const definition = defineUi({
      id: 'files.selection-window',
      nodes: [
        ui.collection({
          id: 'files.current',
          source: 'files.window',
          selection: { mode: 'multiple', binding: 'files.selection' },
        }),
      ],
    });

    const runtime = resolveUiDefinition(definition, createUiCommandRegistry<Context>([]), context, {
      bindings,
      sources,
    });
    expect(runtime.nodes[0]).toMatchObject({
      kind: 'collection',
      selection: { selected: ['a.ts', 'offscreen.ts'] },
      sourceState: { items: [{ id: 'a.ts', label: 'a.ts' }], totalCount: 42, hasMore: true },
    });
  });

  it('enforces a concrete bounded source window without requiring known total cardinality', () => {
    const registry = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'files.unknown-total',
        kind: 'collection',
        read: () => ({ items: [{ id: 'a', label: 'A' }], hasMore: true }),
      }),
    ]);
    expect(registry.resolve('files.unknown-total', createContext())).toMatchObject({
      totalCount: null,
      hasMore: true,
      items: [{ id: 'a', label: 'A' }],
    });

    const oversized = createUiSourceRegistry<Context>([
      defineUiSource<Context>({
        id: 'files.oversized',
        kind: 'collection',
        read: () =>
          Array.from({ length: UI_SOURCE_SNAPSHOT_MAX_ITEMS + 1 }, (_, index) => ({
            id: `item-${index}`,
            label: `Item ${index}`,
          })),
      }),
    ]);
    expect(() => oversized.resolve('files.oversized', createContext())).toThrow(
      /bounded snapshot limit/u,
    );
  });

  it('rejects ambiguous workspace region layouts before rendering', () => {
    const diagnostics = validateUiDefinition({
      irVersion: 1,
      kind: 'surface',
      id: 'workspace.invalid',
      nodes: [
        {
          kind: 'workspace',
          id: 'workspace.root',
          label: 'Workspace',
          regions: [
            { id: 'left', role: 'sidebar', label: 'Left', content: ['content.one'] },
            { id: 'right', role: 'sidebar', label: 'Right', content: ['content.two'] },
          ],
        },
      ],
    });
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: expect.stringContaining('at most one sidebar') }),
        expect.objectContaining({ message: expect.stringContaining('exactly one primary pane') }),
      ]),
    );
  });
});
