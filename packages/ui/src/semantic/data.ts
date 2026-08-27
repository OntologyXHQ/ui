import type { UiSemanticId } from './model';

export type UiBindingKind = 'string' | 'boolean';
export type UiBindingValue = string | boolean;

export type UiBindingDefinition<Context = unknown> = {
  /** Stable host-owned binding identity referenced by semantic IR. */
  id: UiSemanticId;
  /** Runtime value contract used to reject control/binding mismatches deterministically. */
  kind: UiBindingKind;
  /** Reads the current host-owned value. Values stay outside Author IR. */
  read: (context: Context) => UiBindingValue;
  /** Optional mutation authority. Omit to expose a read-only binding. */
  write?: (value: UiBindingValue, context: Context) => void | Promise<void>;
};

export type UiResolvedBinding = {
  id: UiSemanticId;
  kind: UiBindingKind;
  value: UiBindingValue;
  writable: boolean;
};

export type UiBindingRegistry<Context = unknown> = {
  has(id: UiSemanticId): boolean;
  resolve(id: UiSemanticId, context: Context): UiResolvedBinding | null;
  write(id: UiSemanticId, value: UiBindingValue, context: Context): Promise<boolean>;
};

export function defineUiBinding<Context>(
  definition: UiBindingDefinition<Context>,
): UiBindingDefinition<Context> {
  validateSemanticId(definition.id, 'binding');
  if (!['string', 'boolean'].includes(definition.kind)) {
    throw new Error(`Invalid UI binding kind for ${definition.id}: ${String(definition.kind)}`);
  }
  return definition;
}

export function createUiBindingRegistry<Context>(
  definitions: readonly UiBindingDefinition<Context>[],
): UiBindingRegistry<Context> {
  const bindings = new Map<UiSemanticId, UiBindingDefinition<Context>>();
  for (const definition of definitions) {
    defineUiBinding(definition);
    if (bindings.has(definition.id)) throw new Error(`Duplicate UI binding id: ${definition.id}`);
    bindings.set(definition.id, definition);
  }

  return {
    has(id) {
      return bindings.has(id);
    },
    resolve(id, context) {
      const definition = bindings.get(id);
      if (!definition) return null;
      const value = definition.read(context);
      if (!bindingValueMatchesKind(value, definition.kind)) {
        throw new Error(
          `UI binding ${definition.id} returned ${typeof value}; expected ${definition.kind}.`,
        );
      }
      return {
        id: definition.id,
        kind: definition.kind,
        value,
        writable: Boolean(definition.write),
      };
    },
    async write(id, value, context) {
      const definition = bindings.get(id);
      if (!definition?.write || !bindingValueMatchesKind(value, definition.kind)) return false;
      await definition.write(value, context);
      return true;
    },
  };
}

export type UiSourceKind = 'options' | 'collection';

export type UiSourceItem = {
  /** Stable item identity inside the source. */
  id: string;
  /** Visible semantic label projected by canonical presentation. */
  label: string;
  /** Stable value used by option/choice sources. Defaults to id when omitted. */
  value?: string;
  /** Optional supporting text. */
  description?: string;
  /** Keeps the item visible while removing activation/mutation. */
  disabled?: boolean;
};

export type UiSourceDefinition<Context = unknown> = {
  /** Stable host-owned source identity referenced by semantic IR. */
  id: UiSemanticId;
  /** Bounded semantic shape of the source. */
  kind: UiSourceKind;
  /** Reads a JSON-serializable semantic projection of host-owned data. */
  read: (context: Context) => readonly UiSourceItem[];
};

export type UiResolvedSource = {
  id: UiSemanticId;
  kind: UiSourceKind;
  items: readonly UiSourceItem[];
};

export type UiSourceRegistry<Context = unknown> = {
  has(id: UiSemanticId): boolean;
  resolve(id: UiSemanticId, context: Context): UiResolvedSource | null;
};

export function defineUiSource<Context>(
  definition: UiSourceDefinition<Context>,
): UiSourceDefinition<Context> {
  validateSemanticId(definition.id, 'source');
  if (!['options', 'collection'].includes(definition.kind)) {
    throw new Error(`Invalid UI source kind for ${definition.id}: ${String(definition.kind)}`);
  }
  return definition;
}

export function createUiSourceRegistry<Context>(
  definitions: readonly UiSourceDefinition<Context>[],
): UiSourceRegistry<Context> {
  const sources = new Map<UiSemanticId, UiSourceDefinition<Context>>();
  for (const definition of definitions) {
    defineUiSource(definition);
    if (sources.has(definition.id)) throw new Error(`Duplicate UI source id: ${definition.id}`);
    sources.set(definition.id, definition);
  }

  return {
    has(id) {
      return sources.has(id);
    },
    resolve(id, context) {
      const definition = sources.get(id);
      if (!definition) return null;
      const seenIds = new Set<string>();
      const seenValues = new Set<string>();
      const items = definition.read(context).map((item, index) => {
        validateSourceItem(item, definition.id, index);
        if (seenIds.has(item.id)) {
          throw new Error(`UI source ${definition.id} contains duplicate item id: ${item.id}`);
        }
        seenIds.add(item.id);
        const optionValue = item.value ?? item.id;
        if (definition.kind === 'options') {
          if (seenValues.has(optionValue)) {
            throw new Error(
              `UI source ${definition.id} contains duplicate option value: ${optionValue}`,
            );
          }
          seenValues.add(optionValue);
        }
        return {
          id: item.id,
          label: item.label,
          ...(item.value !== undefined ? { value: item.value } : {}),
          ...(item.description !== undefined ? { description: item.description } : {}),
          ...(item.disabled !== undefined ? { disabled: item.disabled } : {}),
        };
      });
      return { id: definition.id, kind: definition.kind, items };
    },
  };
}

function bindingValueMatchesKind(value: UiBindingValue, kind: UiBindingKind) {
  return kind === 'string' ? typeof value === 'string' : typeof value === 'boolean';
}

function validateSemanticId(id: string, owner: string) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/u.test(id)) {
    throw new Error(`Invalid UI ${owner} id: ${id}`);
  }
}

function validateSourceItem(item: UiSourceItem, sourceId: string, index: number) {
  if (!item || typeof item !== 'object') {
    throw new Error(`UI source ${sourceId} item ${index} must be an object.`);
  }
  if (typeof item.id !== 'string' || item.id.length === 0) {
    throw new Error(`UI source ${sourceId} item ${index} requires a non-empty id.`);
  }
  if (typeof item.label !== 'string' || item.label.trim().length === 0) {
    throw new Error(`UI source ${sourceId} item ${index} requires a non-empty label.`);
  }
  if (item.value !== undefined && (typeof item.value !== 'string' || item.value.length === 0)) {
    throw new Error(
      `UI source ${sourceId} item ${index} value must be a non-empty string when provided.`,
    );
  }
  if (item.description !== undefined && typeof item.description !== 'string') {
    throw new Error(
      `UI source ${sourceId} item ${index} description must be a string when provided.`,
    );
  }
  if (item.disabled !== undefined && typeof item.disabled !== 'boolean') {
    throw new Error(`UI source ${sourceId} item ${index} disabled must be boolean when provided.`);
  }
}
