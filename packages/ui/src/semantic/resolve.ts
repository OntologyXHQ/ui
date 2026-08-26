import type { UiCommandRegistry, UiResolvedCommand } from './commands';
import type {
  UiCollectionNode,
  UiCommandEmphasis,
  UiCommandGroupNode,
  UiConfirmationNode,
  UiDefinition,
  UiIrVersion,
  UiSemanticId,
} from './model';

export type UiRuntimeCommand = UiResolvedCommand & {
  emphasis: UiCommandEmphasis;
};

export type UiRuntimeCommandGroupNode = Omit<UiCommandGroupNode, 'commands'> & {
  commands: readonly UiRuntimeCommand[];
};

export type UiRuntimeCollectionNode = UiCollectionNode & {
  availableCommands: readonly UiResolvedCommand[];
};

export type UiRuntimeConfirmationNode = UiConfirmationNode & {
  command: UiResolvedCommand;
  confirmLabel: string;
  cancelLabel: string;
  intent: 'neutral' | 'destructive';
};

export type UiRuntimeNode =
  | UiRuntimeCommandGroupNode
  | UiRuntimeCollectionNode
  | UiRuntimeConfirmationNode;

export type UiRuntimeDefinition = {
  irVersion: UiIrVersion;
  kind: 'surface';
  id: UiSemanticId;
  nodes: readonly UiRuntimeNode[];
  diagnostics: readonly UiRuntimeDiagnostic[];
};

export type UiRuntimeDiagnostic = {
  code: 'unknown-command';
  path: string;
  command: UiSemanticId;
  message: string;
};

export function resolveUiDefinition<Context>(
  definition: UiDefinition,
  registry: UiCommandRegistry<Context>,
  context: Context,
): UiRuntimeDefinition {
  const diagnostics: UiRuntimeDiagnostic[] = [];
  const nodes = definition.nodes.flatMap<UiRuntimeNode>((node, index) => {
    const path = `$.nodes[${index}]`;
    if (node.kind === 'command-group') {
      const commands = node.commands.flatMap<UiRuntimeCommand>((reference, commandIndex) => {
        const command = registry.resolve(reference.command, context);
        if (!command) {
          diagnostics.push(unknownCommand(`${path}.commands[${commandIndex}]`, reference.command));
          return [];
        }
        return [
          {
            ...command,
            label: reference.label ?? command.label,
            emphasis: reference.emphasis ?? 'quiet',
          },
        ];
      });
      return [{ ...node, commands }];
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
      return [{ ...node, availableCommands }];
    }

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
  });

  return {
    irVersion: definition.irVersion,
    kind: 'surface',
    id: definition.id,
    nodes,
    diagnostics,
  };
}

function unknownCommand(path: string, command: UiSemanticId): UiRuntimeDiagnostic {
  return {
    code: 'unknown-command',
    path,
    command,
    message: `Unknown UI command: ${command}`,
  };
}
