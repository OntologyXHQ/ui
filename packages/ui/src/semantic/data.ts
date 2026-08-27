import type { UiSemanticId } from './model';

export type UiBindingKind = 'string' | 'boolean' | 'string-list';
export type UiBindingValue = string | boolean | readonly string[];

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
  if (!['string', 'boolean', 'string-list'].includes(definition.kind)) {
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

/** Hard ceiling for one resolved semantic source window. Larger datasets must page/virtualize. */
export const UI_SOURCE_SNAPSHOT_MAX_ITEMS = 512 as const;

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

export type UiCollectionSnapshot = {
  items: readonly UiSourceItem[];
  offset?: number;
  totalCount?: number;
  hasMore?: boolean;
};

export type UiSourceReadResult = readonly UiSourceItem[] | UiCollectionSnapshot;

export type UiSourceDefinition<Context = unknown> = {
  /** Stable host-owned source identity referenced by semantic IR. */
  id: UiSemanticId;
  /** Bounded semantic shape of the source. */
  kind: UiSourceKind;
  /** Reads a JSON-serializable semantic projection of host-owned data. */
  read: (context: Context) => UiSourceReadResult;
};

export type UiResolvedSource = {
  id: UiSemanticId;
  kind: UiSourceKind;
  items: readonly UiSourceItem[];
  offset: number;
  /** Null when the host can provide a bounded window but does not know the full cardinality. */
  totalCount: number | null;
  hasMore: boolean;
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
      const result = definition.read(context);
      const snapshot: UiCollectionSnapshot = Array.isArray(result)
        ? { items: [...result] }
        : (result as UiCollectionSnapshot);
      if (!Array.isArray(snapshot.items)) {
        throw new Error(`UI source ${definition.id} snapshot items must be an array.`);
      }
      if (snapshot.items.length > UI_SOURCE_SNAPSHOT_MAX_ITEMS) {
        throw new Error(
          `UI source ${definition.id} exceeded the bounded snapshot limit of ${UI_SOURCE_SNAPSHOT_MAX_ITEMS} items.`,
        );
      }
      const items = snapshot.items.map((item, index) => {
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
      const offset = snapshot.offset ?? 0;
      const totalCount =
        snapshot.totalCount ?? (definition.kind === 'options' ? items.length : null);
      const hasMore =
        snapshot.hasMore ?? (totalCount === null ? false : offset + items.length < totalCount);
      if (!Number.isInteger(offset) || offset < 0) {
        throw new Error(`UI source ${definition.id} offset must be a non-negative integer.`);
      }
      if (
        totalCount !== null &&
        (!Number.isInteger(totalCount) || totalCount < offset + items.length)
      ) {
        throw new Error(
          `UI source ${definition.id} totalCount cannot be smaller than the visible window.`,
        );
      }
      if (
        totalCount !== null &&
        snapshot.hasMore !== undefined &&
        hasMore !== offset + items.length < totalCount
      ) {
        throw new Error(
          `UI source ${definition.id} hasMore contradicts totalCount and the visible window.`,
        );
      }
      if (
        definition.kind === 'options' &&
        (offset !== 0 || hasMore || totalCount !== items.length)
      ) {
        throw new Error(
          `UI options source ${definition.id} must resolve as one complete bounded snapshot.`,
        );
      }
      return { id: definition.id, kind: definition.kind, items, offset, totalCount, hasMore };
    },
  };
}

function bindingValueMatchesKind(value: UiBindingValue, kind: UiBindingKind) {
  if (kind === 'string') return typeof value === 'string';
  if (kind === 'boolean') return typeof value === 'boolean';
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
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
