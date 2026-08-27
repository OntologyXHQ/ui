import type { UiCommandIntent, UiSemanticId } from './model';

export type UiCommandInvocation = {
  target?: UiSemanticId;
  selection?: readonly UiSemanticId[];
};

export type UiCommandDefinition<Context = unknown> = {
  id: UiSemanticId;
  label: string;
  intent?: UiCommandIntent;
  shortcut?: string;
  isAvailable?: (context: Context) => boolean;
  execute: (context: Context, invocation?: UiCommandInvocation) => void | Promise<void>;
};

export type UiResolvedCommand = {
  id: UiSemanticId;
  label: string;
  intent: UiCommandIntent;
  shortcut?: string;
  enabled: boolean;
};

export type UiCommandRegistry<Context = unknown> = {
  has(id: UiSemanticId): boolean;
  resolve(id: UiSemanticId, context: Context): UiResolvedCommand | null;
  execute(id: UiSemanticId, context: Context, invocation?: UiCommandInvocation): Promise<boolean>;
};

export function defineCommand<Context>(
  definition: UiCommandDefinition<Context>,
): UiCommandDefinition<Context> {
  validateCommandDefinition(definition);
  return definition;
}

export function createUiCommandRegistry<Context>(
  definitions: readonly UiCommandDefinition<Context>[],
): UiCommandRegistry<Context> {
  const commands = new Map<UiSemanticId, UiCommandDefinition<Context>>();
  for (const definition of definitions) {
    validateCommandDefinition(definition);
    if (commands.has(definition.id)) throw new Error(`Duplicate UI command id: ${definition.id}`);
    commands.set(definition.id, definition);
  }

  return {
    has(id) {
      return commands.has(id);
    },
    resolve(id, context) {
      const definition = commands.get(id);
      if (!definition) return null;
      return {
        id: definition.id,
        label: definition.label,
        intent: definition.intent ?? 'neutral',
        ...(definition.shortcut ? { shortcut: definition.shortcut } : {}),
        enabled: definition.isAvailable?.(context) ?? true,
      };
    },
    async execute(id, context, invocation) {
      const definition = commands.get(id);
      if (!definition) return false;
      if (!(definition.isAvailable?.(context) ?? true)) return false;
      await definition.execute(context, invocation);
      return true;
    },
  };
}

function validateCommandDefinition<Context>(definition: UiCommandDefinition<Context>) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/u.test(definition.id)) {
    throw new Error(`Invalid UI command id: ${definition.id}`);
  }
  if (definition.label.trim().length === 0) {
    throw new Error(`UI command ${definition.id} requires a non-empty label.`);
  }
}
