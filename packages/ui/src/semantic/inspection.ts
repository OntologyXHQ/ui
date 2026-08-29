import type { UiCommandInvocation, UiCommandRegistry } from './commands';
import type { UiResolverEnvironment } from './environment';
import type { UiCommandIntent, UiSemanticId } from './model';
import type {
  UiRuntimeCollectionNode,
  UiRuntimeCommandGroupNode,
  UiRuntimeDefinition,
  UiRuntimeNode,
} from './resolve';

export const UI_INSPECTION_VERSION = 1 as const;
export const UI_INSPECTION_MAX_SELECTION = 128 as const;
export const UI_INSPECTION_MAX_COMMANDS = 128 as const;

export type UiInspectionFocus = Readonly<{
  node: UiSemanticId;
  item?: UiSemanticId;
}>;

export type UiInspectionCommandScope = 'surface' | 'selection' | 'focused-item' | 'confirmation';

export type UiInspectionSelection = Readonly<{
  node: UiSemanticId;
  mode: 'none' | 'single' | 'multiple';
  ids: readonly UiSemanticId[];
  totalCount: number;
  truncated: boolean;
}>;

export type UiInspectionCommand = Readonly<{
  command: UiSemanticId;
  sourceNode: UiSemanticId;
  scope: UiInspectionCommandScope;
  label: string;
  intent: UiCommandIntent;
  shortcut?: string;
  enabled: boolean;
  requiresConfirmation: boolean;
  invocable: boolean;
  blockedReason?: 'selection-truncated';
  invocation?: UiCommandInvocation;
}>;

export type UiInspectionDiagnosticCode =
  | 'unknown-focus-node'
  | 'unknown-focus-item'
  | 'command-limit-exceeded';

export type UiInspectionDiagnostic = Readonly<{
  code: UiInspectionDiagnosticCode;
  message: string;
}>;

export type UiInspectionSnapshot = Readonly<{
  inspectionVersion: typeof UI_INSPECTION_VERSION;
  kind: 'ui-inspection';
  surface: UiSemanticId;
  environment: UiResolverEnvironment;
  focus: UiInspectionFocus | null;
  focusedItem: Readonly<{
    id: UiSemanticId;
    label: string;
    disabled: boolean;
  }> | null;
  selections: readonly UiInspectionSelection[];
  availableCommands: readonly UiInspectionCommand[];
  runtimeDiagnostics: Readonly<{
    count: number;
    codes: readonly string[];
  }>;
  diagnostics: readonly UiInspectionDiagnostic[];
}>;

export type UiInspectionOptions = Readonly<{
  focus?: UiInspectionFocus | null;
}>;

export type UiInspectionCommandRequest = Readonly<{
  command: UiSemanticId;
  sourceNode?: UiSemanticId;
  scope?: UiInspectionCommandScope;
}>;

export type UiInspectionInvocationStatus =
  | 'executed'
  | 'unknown-command'
  | 'ambiguous-command'
  | 'disabled'
  | 'requires-confirmation'
  | 'selection-truncated'
  | 'unavailable';

export type UiInspectionInvocationResult = Readonly<{
  status: UiInspectionInvocationStatus;
  command: UiSemanticId;
  sourceNode?: UiSemanticId;
  scope?: UiInspectionCommandScope;
}>;

/**
 * Produces a bounded, JSON-serializable semantic projection for diagnostics, AI and automation.
 * It intentionally omits binding values, full source payloads, executable functions and host authority.
 */
export function inspectUiRuntime(
  runtime: UiRuntimeDefinition,
  options: UiInspectionOptions = {},
): UiInspectionSnapshot {
  const diagnostics: UiInspectionDiagnostic[] = [];
  const nodesById = new Map<UiSemanticId, UiRuntimeNode>();
  for (const node of runtime.nodes) {
    if ('id' in node && node.id) nodesById.set(node.id, node);
  }

  const focus = resolveInspectionFocus(options.focus ?? null, nodesById, diagnostics);
  const focusedNode = focus ? (nodesById.get(focus.node) ?? null) : null;
  const focusedItem =
    focus?.item && focusedNode?.kind === 'collection'
      ? (focusedNode.sourceState.items.find((item) => item.id === focus.item) ?? null)
      : null;

  const selections = runtime.nodes.flatMap<UiInspectionSelection>((node) => {
    if (node.kind !== 'collection') return [];
    const totalCount = node.selection.selected.length;
    return [
      {
        node: node.id,
        mode: node.selection.mode,
        ids: node.selection.selected.slice(0, UI_INSPECTION_MAX_SELECTION),
        totalCount,
        truncated: totalCount > UI_INSPECTION_MAX_SELECTION,
      },
    ];
  });

  const commands: UiInspectionCommand[] = [];
  for (const node of runtime.nodes) {
    if (node.kind === 'command-group' && node.id) {
      commands.push(...inspectCommandGroup(node));
      continue;
    }
    if (node.kind === 'confirmation' && node.id) {
      commands.push({
        command: node.command.id,
        sourceNode: node.id,
        scope: 'confirmation',
        label: node.command.label,
        intent: node.command.intent,
        ...(node.command.shortcut ? { shortcut: node.command.shortcut } : {}),
        enabled: node.command.enabled,
        requiresConfirmation: true,
        invocable: false,
      });
    }
  }

  if (focusedNode?.kind === 'collection') {
    commands.push(...inspectFocusedCollection(focusedNode, focus?.item));
  }

  if (commands.length > UI_INSPECTION_MAX_COMMANDS) {
    diagnostics.push({
      code: 'command-limit-exceeded',
      message: `Semantic inspection exposed more than ${UI_INSPECTION_MAX_COMMANDS} command actions; the snapshot was bounded.`,
    });
  }

  return Object.freeze({
    inspectionVersion: UI_INSPECTION_VERSION,
    kind: 'ui-inspection' as const,
    surface: runtime.id,
    environment: runtime.environment,
    focus,
    focusedItem: focusedItem
      ? Object.freeze({
          id: focusedItem.id,
          label: focusedItem.label,
          disabled: focusedItem.disabled ?? false,
        })
      : null,
    selections: Object.freeze(selections),
    availableCommands: Object.freeze(commands.slice(0, UI_INSPECTION_MAX_COMMANDS)),
    runtimeDiagnostics: Object.freeze({
      count: runtime.diagnostics.length,
      codes: Object.freeze([...new Set(runtime.diagnostics.map((item) => item.code))]),
    }),
    diagnostics: Object.freeze(diagnostics),
  });
}

/**
 * Executes only a command action already exposed by a semantic inspection snapshot.
 * Invocation target/selection are snapshot-derived; callers cannot inject arbitrary host targets.
 */
export async function invokeUiInspectionCommand<Context>(
  snapshot: UiInspectionSnapshot,
  registry: UiCommandRegistry<Context>,
  context: Context,
  request: UiInspectionCommandRequest,
): Promise<UiInspectionInvocationResult> {
  const matches = snapshot.availableCommands.filter(
    (entry) =>
      entry.command === request.command &&
      (request.sourceNode === undefined || entry.sourceNode === request.sourceNode) &&
      (request.scope === undefined || entry.scope === request.scope),
  );

  if (matches.length === 0) return invocationResult('unknown-command', request);
  if (matches.length > 1) return invocationResult('ambiguous-command', request);

  const action = matches[0];
  if (!action.enabled) return invocationResult('disabled', request, action);
  if (action.requiresConfirmation)
    return invocationResult('requires-confirmation', request, action);
  if (action.blockedReason === 'selection-truncated')
    return invocationResult('selection-truncated', request, action);
  if (!action.invocable) return invocationResult('unavailable', request, action);

  const executed = await registry.execute(action.command, context, action.invocation);
  return invocationResult(executed ? 'executed' : 'unavailable', request, action);
}

function resolveInspectionFocus(
  requested: UiInspectionFocus | null,
  nodesById: Map<UiSemanticId, UiRuntimeNode>,
  diagnostics: UiInspectionDiagnostic[],
): UiInspectionFocus | null {
  if (!requested) return null;
  const node = nodesById.get(requested.node);
  if (!node) {
    diagnostics.push({
      code: 'unknown-focus-node',
      message: `Semantic inspection focus node is not present in this runtime surface: ${requested.node}.`,
    });
    return null;
  }
  if (requested.item !== undefined) {
    if (
      node.kind !== 'collection' ||
      !node.sourceState.items.some((item) => item.id === requested.item)
    ) {
      diagnostics.push({
        code: 'unknown-focus-item',
        message: `Semantic inspection focus item is not present in the resolved source window: ${requested.item}.`,
      });
      return Object.freeze({ node: requested.node });
    }
  }
  return Object.freeze({ ...requested });
}

function inspectCommandGroup(node: UiRuntimeCommandGroupNode): UiInspectionCommand[] {
  if (!node.id) return [];
  return node.commands.map((command) => ({
    command: command.id,
    sourceNode: node.id as UiSemanticId,
    scope: 'surface' as const,
    label: command.label,
    intent: command.intent,
    ...(command.shortcut ? { shortcut: command.shortcut } : {}),
    enabled: command.enabled,
    requiresConfirmation: false,
    invocable: command.enabled,
  }));
}

function inspectFocusedCollection(
  node: UiRuntimeCollectionNode,
  focusedItemId: UiSemanticId | undefined,
): UiInspectionCommand[] {
  const selection = node.selection.selected;
  const selectionTruncated = selection.length > UI_INSPECTION_MAX_SELECTION;
  const boundedSelection = selection.slice(0, UI_INSPECTION_MAX_SELECTION);
  const selectionInvocation = selectionTruncated ? undefined : { selection: boundedSelection };
  const commands = node.availableCommands.map<UiInspectionCommand>((command) => ({
    command: command.id,
    sourceNode: node.id,
    scope: 'selection',
    label: command.label,
    intent: command.intent,
    ...(command.shortcut ? { shortcut: command.shortcut } : {}),
    enabled: command.enabled,
    requiresConfirmation: false,
    invocable: command.enabled && !selectionTruncated,
    ...(selectionTruncated ? { blockedReason: 'selection-truncated' as const } : {}),
    ...(selectionInvocation ? { invocation: selectionInvocation } : {}),
  }));

  if (!node.activationCommand || !focusedItemId) return commands;
  const item = node.sourceState.items.find((candidate) => candidate.id === focusedItemId);
  const enabled = Boolean(item && !item.disabled && node.activationCommand.enabled);
  commands.push({
    command: node.activationCommand.id,
    sourceNode: node.id,
    scope: 'focused-item',
    label: node.activationCommand.label,
    intent: node.activationCommand.intent,
    ...(node.activationCommand.shortcut ? { shortcut: node.activationCommand.shortcut } : {}),
    enabled,
    requiresConfirmation: false,
    invocable: enabled && !selectionTruncated,
    ...(selectionTruncated ? { blockedReason: 'selection-truncated' as const } : {}),
    ...(!selectionTruncated
      ? {
          invocation: {
            target: focusedItemId,
            selection: boundedSelection,
          },
        }
      : {}),
  });
  return commands;
}

function invocationResult(
  status: UiInspectionInvocationStatus,
  request: UiInspectionCommandRequest,
  action?: UiInspectionCommand,
): UiInspectionInvocationResult {
  return Object.freeze({
    status,
    command: request.command,
    ...(action?.sourceNode || request.sourceNode
      ? { sourceNode: action?.sourceNode ?? request.sourceNode }
      : {}),
    ...(action?.scope || request.scope ? { scope: action?.scope ?? request.scope } : {}),
  });
}
