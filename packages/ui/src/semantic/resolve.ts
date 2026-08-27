import type { UiCommandRegistry, UiResolvedCommand } from './commands';
import { DEFAULT_UI_RESOLVER_ENVIRONMENT, type UiResolverEnvironment } from './environment';
import type {
  UiBindingRegistry,
  UiResolvedBinding,
  UiResolvedSource,
  UiSourceRegistry,
} from './data';
import type {
  UiChoiceNode,
  UiCollectionNode,
  UiCommandEmphasis,
  UiCommandGroupNode,
  UiConfirmationNode,
  UiDefinition,
  UiFieldNode,
  UiFormNode,
  UiIrVersion,
  UiSemanticId,
  UiToggleNode,
} from './model';

export type UiResolutionServices<Context> = {
  bindings?: UiBindingRegistry<Context>;
  sources?: UiSourceRegistry<Context>;
  environment?: UiResolverEnvironment;
};

export type UiRuntimeCommandPlacement = 'inline' | 'overflow';

export type UiRuntimeCommand = UiResolvedCommand & {
  emphasis: UiCommandEmphasis;
  placement: UiRuntimeCommandPlacement;
};

export type UiRuntimeCommandGroupNode = Omit<UiCommandGroupNode, 'commands'> & {
  commands: readonly UiRuntimeCommand[];
  resolvedPresentation: 'inline' | 'inline-overflow' | 'menu';
};

export type UiRuntimeCollectionSource = {
  id: UiSemanticId;
  available: boolean;
  itemCount: number | null;
};

export type UiRuntimeCollectionNode = UiCollectionNode & {
  availableCommands: readonly UiResolvedCommand[];
  sourceState: UiRuntimeCollectionSource;
};

export type UiRuntimeConfirmationNode = UiConfirmationNode & {
  command: UiResolvedCommand;
  confirmLabel: string;
  cancelLabel: string;
  intent: 'neutral' | 'destructive';
};

export type UiRuntimeFieldNode = Omit<UiFieldNode, 'binding'> & {
  binding: UiResolvedBinding & { kind: 'string'; value: string };
};

export type UiRuntimeChoiceNode = Omit<UiChoiceNode, 'binding' | 'optionsSource'> & {
  binding: UiResolvedBinding & { kind: 'string'; value: string };
  optionsSource: UiResolvedSource & { kind: 'options' };
  resolvedPresentation: 'select' | 'segmented' | 'radio';
};

export type UiRuntimeToggleNode = Omit<UiToggleNode, 'binding'> & {
  binding: UiResolvedBinding & { kind: 'boolean'; value: boolean };
};

export type UiRuntimeFormControlNode =
  | UiRuntimeFieldNode
  | UiRuntimeChoiceNode
  | UiRuntimeToggleNode;

export type UiRuntimeFormNode = Omit<UiFormNode, 'fields'> & {
  fields: readonly UiRuntimeFormControlNode[];
};

export type UiRuntimeNode =
  | UiRuntimeCommandGroupNode
  | UiRuntimeCollectionNode
  | UiRuntimeConfirmationNode
  | UiRuntimeFormNode;

export type UiRuntimeDefinition = {
  irVersion: UiIrVersion;
  kind: 'surface';
  id: UiSemanticId;
  nodes: readonly UiRuntimeNode[];
  environment: UiResolverEnvironment;
  diagnostics: readonly UiRuntimeDiagnostic[];
};

export type UiRuntimeDiagnosticCode =
  | 'unknown-command'
  | 'unknown-binding'
  | 'binding-kind-mismatch'
  | 'unknown-source'
  | 'source-kind-mismatch';

export type UiRuntimeDiagnostic = {
  code: UiRuntimeDiagnosticCode;
  path: string;
  message: string;
  command?: UiSemanticId;
  binding?: UiSemanticId;
  source?: UiSemanticId;
};

export function resolveUiDefinition<Context>(
  definition: UiDefinition,
  registry: UiCommandRegistry<Context>,
  context: Context,
  services: UiResolutionServices<Context> = {},
): UiRuntimeDefinition {
  const diagnostics: UiRuntimeDiagnostic[] = [];
  const environment = services.environment ?? DEFAULT_UI_RESOLVER_ENVIRONMENT;
  const nodes = definition.nodes.flatMap<UiRuntimeNode>((node, index) => {
    const path = `$.nodes[${index}]`;
    if (node.kind === 'command-group') {
      const commands = node.commands.flatMap<Omit<UiRuntimeCommand, 'placement'>>(
        (reference, commandIndex) => {
          const command = registry.resolve(reference.command, context);
          if (!command) {
            diagnostics.push(
              unknownCommand(`${path}.commands[${commandIndex}]`, reference.command),
            );
            return [];
          }
          return [
            {
              ...command,
              label: reference.label ?? command.label,
              emphasis: reference.emphasis ?? 'quiet',
            },
          ];
        },
      );
      const resolvedPresentation = resolveCommandGroupPresentation(
        node,
        commands.length,
        environment,
      );
      const inlineLimit = resolveCommandInlineLimit(resolvedPresentation, environment);
      return [
        {
          ...node,
          commands: commands.map<UiRuntimeCommand>((command, commandIndex) => ({
            ...command,
            placement: commandIndex < inlineLimit ? 'inline' : 'overflow',
          })),
          resolvedPresentation,
        },
      ];
    }

    if (node.kind === 'collection') {
      const availableCommands = (node.commands ?? []).flatMap<UiResolvedCommand>(
        (commandId, commandIndex) => {
          const command = registry.resolve(commandId, context);
          if (!command) {
            diagnostics.push(unknownCommand(`${path}.commands[${commandIndex}]`, commandId));
            return [];
          }
          return [command];
        },
      );
      const source = services.sources?.resolve(node.source, context) ?? null;
      if (services.sources && !source)
        diagnostics.push(unknownSource(`${path}.source`, node.source));
      if (source && source.kind !== 'collection') {
        diagnostics.push(
          sourceKindMismatch(`${path}.source`, node.source, 'collection', source.kind),
        );
      }
      return [
        {
          ...node,
          availableCommands,
          sourceState: {
            id: node.source,
            available: source?.kind === 'collection',
            itemCount: source?.kind === 'collection' ? source.items.length : null,
          },
        },
      ];
    }

    if (node.kind === 'confirmation') {
      const command = registry.resolve(node.confirmCommand, context);
      if (!command) {
        diagnostics.push(unknownCommand(`${path}.confirmCommand`, node.confirmCommand));
        return [];
      }
      return [
        {
          ...node,
          command,
          confirmLabel: node.confirmLabel ?? command.label,
          cancelLabel: node.cancelLabel ?? 'Cancel',
          intent: node.intent ?? command.intent,
        },
      ];
    }

    return [resolveForm(node, path, context, services, environment, diagnostics)];
  });

  return {
    irVersion: definition.irVersion,
    kind: 'surface',
    id: definition.id,
    nodes,
    environment,
    diagnostics,
  };
}

function resolveForm<Context>(
  node: UiFormNode,
  path: string,
  context: Context,
  services: UiResolutionServices<Context>,
  environment: UiResolverEnvironment,
  diagnostics: UiRuntimeDiagnostic[],
): UiRuntimeFormNode {
  const fields = node.fields.flatMap<UiRuntimeFormControlNode>((field, index) => {
    const fieldPath = `${path}.fields[${index}]`;
    if (field.kind === 'field') {
      const binding = resolveBinding(
        services.bindings,
        field.binding,
        'string',
        `${fieldPath}.binding`,
        context,
        diagnostics,
      );
      if (!binding || binding.kind !== 'string' || typeof binding.value !== 'string') return [];
      return [{ ...field, binding: binding as UiRuntimeFieldNode['binding'] }];
    }

    if (field.kind === 'toggle') {
      const binding = resolveBinding(
        services.bindings,
        field.binding,
        'boolean',
        `${fieldPath}.binding`,
        context,
        diagnostics,
      );
      if (!binding || binding.kind !== 'boolean' || typeof binding.value !== 'boolean') return [];
      return [{ ...field, binding: binding as UiRuntimeToggleNode['binding'] }];
    }

    const binding = resolveBinding(
      services.bindings,
      field.binding,
      'string',
      `${fieldPath}.binding`,
      context,
      diagnostics,
    );
    const source = services.sources?.resolve(field.optionsSource, context) ?? null;
    if (!services.sources || !source) {
      diagnostics.push(unknownSource(`${fieldPath}.optionsSource`, field.optionsSource));
      return [];
    }
    if (source.kind !== 'options') {
      diagnostics.push(
        sourceKindMismatch(
          `${fieldPath}.optionsSource`,
          field.optionsSource,
          'options',
          source.kind,
        ),
      );
      return [];
    }
    if (!binding || binding.kind !== 'string' || typeof binding.value !== 'string') return [];
    return [
      {
        ...field,
        binding: binding as UiRuntimeChoiceNode['binding'],
        optionsSource: source as UiRuntimeChoiceNode['optionsSource'],
        resolvedPresentation: resolveChoicePresentation(
          field,
          source,
          environment,
          binding.writable,
        ),
      },
    ];
  });

  return { ...node, fields };
}

function resolveBinding<Context>(
  registry: UiBindingRegistry<Context> | undefined,
  id: UiSemanticId,
  expected: 'string' | 'boolean',
  path: string,
  context: Context,
  diagnostics: UiRuntimeDiagnostic[],
): UiResolvedBinding | null {
  const binding = registry?.resolve(id, context) ?? null;
  if (!binding) {
    diagnostics.push(unknownBinding(path, id));
    return null;
  }
  if (binding.kind !== expected) {
    diagnostics.push(bindingKindMismatch(path, id, expected, binding.kind));
    return null;
  }
  return binding;
}

function resolveCommandGroupPresentation(
  node: UiCommandGroupNode,
  commandCount: number,
  environment: UiResolverEnvironment,
): 'inline' | 'inline-overflow' | 'menu' {
  if (node.presentation?.preferred === 'menu') return 'menu';
  if (environment.container === 'compact' || environment.modality === 'touch') return 'menu';
  return commandCount > commandInlineCapacity(environment) ? 'inline-overflow' : 'inline';
}

function resolveCommandInlineLimit(
  presentation: UiRuntimeCommandGroupNode['resolvedPresentation'],
  environment: UiResolverEnvironment,
): number {
  if (presentation === 'menu') return 0;
  if (presentation === 'inline') return Number.POSITIVE_INFINITY;
  return commandInlineCapacity(environment);
}

function commandInlineCapacity(environment: UiResolverEnvironment): number {
  return environment.container === 'wide' ? 5 : 3;
}

function resolveChoicePresentation(
  node: UiChoiceNode,
  source: UiResolvedSource,
  environment: UiResolverEnvironment,
  writable: boolean,
): 'select' | 'segmented' | 'radio' {
  const preferred = node.presentation?.preferred ?? 'select';
  if (preferred === 'select') return 'select';
  if (environment.container === 'compact' || environment.modality === 'touch') return 'select';
  if ((node.readOnly || !writable) && preferred === 'segmented') return 'radio';
  if (preferred === 'segmented' && source.items.length > 5) return 'select';
  return preferred;
}

function unknownCommand(path: string, command: UiSemanticId): UiRuntimeDiagnostic {
  return {
    code: 'unknown-command',
    path,
    command,
    message: `Unknown UI command: ${command}`,
  };
}

function unknownBinding(path: string, binding: UiSemanticId): UiRuntimeDiagnostic {
  return {
    code: 'unknown-binding',
    path,
    binding,
    message: `Unknown UI binding: ${binding}`,
  };
}

function bindingKindMismatch(
  path: string,
  binding: UiSemanticId,
  expected: string,
  actual: string,
): UiRuntimeDiagnostic {
  return {
    code: 'binding-kind-mismatch',
    path,
    binding,
    message: `UI binding ${binding} has kind ${actual}; expected ${expected}.`,
  };
}

function unknownSource(path: string, source: UiSemanticId): UiRuntimeDiagnostic {
  return {
    code: 'unknown-source',
    path,
    source,
    message: `Unknown UI source: ${source}`,
  };
}

function sourceKindMismatch(
  path: string,
  source: UiSemanticId,
  expected: string,
  actual: string,
): UiRuntimeDiagnostic {
  return {
    code: 'source-kind-mismatch',
    path,
    source,
    message: `UI source ${source} has kind ${actual}; expected ${expected}.`,
  };
}
