import type { ReactNode } from 'react';
import { ActionGroup, AlertDialog, Button } from '../components';
import type { UiCommandRegistry } from './commands';
import type { UiRuntimeCommandGroupNode, UiRuntimeConfirmationNode } from './resolve';

export type SemanticCommandGroupProps<Context> = {
  node: UiRuntimeCommandGroupNode;
  registry: UiCommandRegistry<Context>;
  context: Context;
  onCommandError?: (error: unknown, commandId: string) => void;
};

export function SemanticCommandGroup<Context>({
  node,
  registry,
  context,
  onCommandError,
}: SemanticCommandGroupProps<Context>) {
  return (
    <ActionGroup
      label={node.label}
      orientation="horizontal"
      data-ui-ir-kind={node.kind}
      data-ui-ir-id={node.id}
    >
      {node.commands.map((command) => (
        <Button
          key={command.id}
          variant={command.emphasis}
          intent={command.intent}
          disabled={!command.enabled}
          aria-keyshortcuts={command.shortcut}
          data-ui-command={command.id}
          onClick={() => {
            void registry.execute(command.id, context).catch((error: unknown) => {
              onCommandError?.(error, command.id);
            });
          }}
        >
          {command.label}
        </Button>
      ))}
    </ActionGroup>
  );
}

export type SemanticConfirmationProps<Context> = {
  node: UiRuntimeConfirmationNode;
  registry: UiCommandRegistry<Context>;
  context: Context;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  onCommandError?: (error: unknown, commandId: string) => void;
};

export function SemanticConfirmation<Context>({
  node,
  registry,
  context,
  open,
  onOpenChange,
  children,
  onCommandError,
}: SemanticConfirmationProps<Context>) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title={node.title}
      description={node.description}
      confirmLabel={node.confirmLabel}
      cancelLabel={node.cancelLabel}
      confirmTone={node.intent === 'destructive' ? 'danger' : 'default'}
      onConfirm={() => {
        void registry.execute(node.command.id, context).catch((error: unknown) => {
          onCommandError?.(error, node.command.id);
        });
      }}
    >
      {children}
    </AlertDialog>
  );
}
