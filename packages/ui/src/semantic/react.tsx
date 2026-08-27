import type { ChangeEvent, ReactNode } from 'react';
import { useRef, useState } from 'react';
import {
  ActionGroup,
  AlertDialog,
  Button,
  FieldSection,
  List,
  ListItem,
  PageScaffold,
  Tile,
  TileGrid,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  SegmentedControl,
  Select,
  Switch,
  TextField,
} from '../components';
import type { UiCommandRegistry } from './commands';
import type { UiBindingRegistry } from './data';
import type {
  UiRuntimeChoiceNode,
  UiRuntimeCollectionNode,
  UiRuntimeCommandGroupNode,
  UiRuntimeConfirmationNode,
  UiRuntimeFieldNode,
  UiRuntimeFormNode,
  UiRuntimeToggleNode,
  UiRuntimeWorkspaceNode,
} from './resolve';

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
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const execute = (commandId: string) => {
    void registry.execute(commandId, context).catch((error: unknown) => {
      onCommandError?.(error, commandId);
    });
  };
  const inlineCommands = node.commands.filter((command) => command.placement === 'inline');
  const overflowCommands = node.commands.filter((command) => command.placement === 'overflow');
  const menuOnly = node.resolvedPresentation === 'menu';
  const menuCommands = menuOnly ? node.commands : overflowCommands;
  const triggerLabel = menuOnly ? node.label : `${node.label}: More actions`;

  const menu = menuCommands.length ? (
    <>
      <Button
        ref={triggerRef}
        variant={menuOnly ? 'secondary' : 'quiet'}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={triggerLabel}
        data-ui-command-overflow-trigger
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOnly ? node.label : 'More'}
      </Button>
      <Menu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        anchorRef={triggerRef}
        ariaLabel={`${node.label} commands`}
      >
        {menuCommands.map((command) => (
          <MenuItem
            key={command.id}
            disabled={!command.enabled}
            destructive={command.intent === 'destructive'}
            aria-keyshortcuts={command.shortcut}
            data-ui-command={command.id}
            data-ui-command-placement="overflow"
            onSelect={() => execute(command.id)}
          >
            {command.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  ) : null;

  if (menuOnly) {
    return (
      <div data-ui-ir-kind={node.kind} data-ui-ir-id={node.id} data-ui-ir-presentation="menu">
        {menu}
      </div>
    );
  }

  return (
    <ActionGroup
      label={node.label}
      orientation="horizontal"
      data-ui-ir-kind={node.kind}
      data-ui-ir-id={node.id}
      data-ui-ir-presentation={node.resolvedPresentation}
    >
      {inlineCommands.map((command) => (
        <Button
          key={command.id}
          variant={command.emphasis}
          intent={command.intent}
          disabled={!command.enabled}
          aria-keyshortcuts={command.shortcut}
          data-ui-command={command.id}
          data-ui-command-placement="inline"
          onClick={() => execute(command.id)}
        >
          {command.label}
        </Button>
      ))}
      {menu}
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

export type SemanticFormProps<Context> = {
  node: UiRuntimeFormNode;
  bindings: UiBindingRegistry<Context>;
  context: Context;
  onBindingError?: (error: unknown, bindingId: string) => void;
};

export function SemanticForm<Context>({
  node,
  bindings,
  context,
  onBindingError,
}: SemanticFormProps<Context>) {
  const write = (bindingId: string, value: string | boolean) => {
    void bindings.write(bindingId, value, context).catch((error: unknown) => {
      onBindingError?.(error, bindingId);
    });
  };
  const writeString = (bindingId: string, value: string) => write(bindingId, value);
  const writeBoolean = (bindingId: string, value: boolean) => write(bindingId, value);

  return (
    <FieldSection
      title={node.title}
      description={node.description}
      data-ui-ir-kind={node.kind}
      data-ui-ir-id={node.id}
    >
      {node.fields.map((field) => {
        if (field.kind === 'field') {
          return <SemanticField key={field.id} node={field} onWrite={writeString} />;
        }
        if (field.kind === 'choice') {
          return <SemanticChoice key={field.id} node={field} onWrite={writeString} />;
        }
        return <SemanticToggle key={field.id} node={field} onWrite={writeBoolean} />;
      })}
    </FieldSection>
  );
}

function SemanticField({
  node,
  onWrite,
}: {
  node: UiRuntimeFieldNode;
  onWrite: (bindingId: string, value: string) => void;
}) {
  const readOnly = node.readOnly || !node.binding.writable;
  return (
    <TextField
      id={node.id}
      label={node.label}
      description={node.description}
      placeholder={node.placeholder}
      contentPurpose={node.purpose ?? 'text'}
      secure={node.purpose === 'password'}
      required={node.required}
      disabled={node.disabled}
      readOnly={readOnly}
      value={node.binding.value}
      data-ui-binding={node.binding.id}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onWrite(node.binding.id, event.currentTarget.value)
      }
    />
  );
}

function SemanticChoice({
  node,
  onWrite,
}: {
  node: UiRuntimeChoiceNode;
  onWrite: (bindingId: string, value: string) => void;
}) {
  const readOnly = node.readOnly || !node.binding.writable;
  const options = node.optionsSource.items.map((item) => ({
    value: item.value ?? item.id,
    label: item.label,
    ...(item.description !== undefined ? { description: item.description } : {}),
    ...(item.disabled !== undefined ? { disabled: item.disabled } : {}),
  }));

  if (node.resolvedPresentation === 'segmented') {
    return (
      <div data-ui-binding={node.binding.id} data-ui-choice-presentation="segmented">
        <SegmentedControl
          label={node.label}
          options={options}
          value={node.binding.value}
          disabled={node.disabled}
          onValueChange={(value) => onWrite(node.binding.id, value)}
        />
      </div>
    );
  }

  if (node.resolvedPresentation === 'radio') {
    return (
      <div data-ui-binding={node.binding.id} data-ui-choice-presentation="radio">
        <RadioGroup
          label={node.label}
          value={node.binding.value}
          disabled={node.disabled}
          readOnly={readOnly}
          onValueChange={(value) => onWrite(node.binding.id, value)}
        >
          {options.map((option) => (
            <Radio
              key={option.value}
              value={option.value}
              label={option.label}
              description={option.description}
              disabled={option.disabled}
            />
          ))}
        </RadioGroup>
      </div>
    );
  }

  return (
    <div data-ui-binding={node.binding.id} data-ui-choice-presentation="select">
      <Select
        id={node.id}
        label={node.label}
        description={node.description}
        placeholder={node.placeholder}
        options={options}
        value={node.binding.value}
        required={node.required}
        disabled={node.disabled}
        readOnly={readOnly}
        onValueChange={(value) => onWrite(node.binding.id, value)}
      />
    </div>
  );
}

function SemanticToggle({
  node,
  onWrite,
}: {
  node: UiRuntimeToggleNode;
  onWrite: (bindingId: string, value: boolean) => void;
}) {
  return (
    <div data-ui-binding={node.binding.id}>
      <Switch
        label={node.label}
        description={node.description}
        checked={node.binding.value}
        disabled={node.disabled}
        readOnly={node.readOnly || !node.binding.writable}
        onCheckedChange={(checked) => onWrite(node.binding.id, checked)}
      />
    </div>
  );
}

export type SemanticCollectionProps<Context> = {
  node: UiRuntimeCollectionNode;
  commands: UiCommandRegistry<Context>;
  bindings?: UiBindingRegistry<Context>;
  context: Context;
  label?: string;
  onCommandError?: (error: unknown, commandId: string) => void;
  onBindingError?: (error: unknown, bindingId: string) => void;
};

export function SemanticCollection<Context>({
  node,
  commands,
  bindings,
  context,
  label,
  onCommandError,
  onBindingError,
}: SemanticCollectionProps<Context>) {
  const selected = new Set(node.selection.selected);
  const selectable = node.selection.mode !== 'none' && Boolean(node.selection.binding?.writable);
  const setSelection = (itemId: string) => {
    const binding = node.selection.binding;
    const item = node.sourceState.items.find((candidate) => candidate.id === itemId);
    if (item?.disabled || !binding?.writable || !bindings || node.selection.mode === 'none') return;
    const next =
      node.selection.mode === 'single'
        ? [itemId]
        : selected.has(itemId)
          ? node.selection.selected.filter((id) => id !== itemId)
          : [...node.selection.selected, itemId];
    void bindings.write(binding.id, next, context).catch((error: unknown) => {
      onBindingError?.(error, binding.id);
    });
  };
  const activate = (itemId: string) => {
    const command = node.activationCommand;
    const item = node.sourceState.items.find((candidate) => candidate.id === itemId);
    if (item?.disabled || !command?.enabled) return;
    void commands
      .execute(command.id, context, { target: itemId, selection: node.selection.selected })
      .catch((error: unknown) => onCommandError?.(error, command.id));
  };
  const itemProps = (itemId: string) => ({
    selected: selected.has(itemId),
    disabled: node.sourceState.items.find((item) => item.id === itemId)?.disabled ?? false,
    onActivate: selectable
      ? () => setSelection(itemId)
      : node.activationCommand
        ? () => activate(itemId)
        : undefined,
    onDoubleClick: selectable && node.activationCommand ? () => activate(itemId) : undefined,
    'data-ui-collection-item': itemId,
    'data-ui-collection-selected': selected.has(itemId) || undefined,
  });

  const common = {
    'data-ui-ir-kind': node.kind,
    'data-ui-ir-id': node.id,
    'data-ui-collection-source': node.sourceState.id,
    'data-ui-collection-offset': node.sourceState.offset,
    'data-ui-collection-total': node.sourceState.totalCount ?? undefined,
    'data-ui-collection-has-more': node.sourceState.hasMore || undefined,
    'data-ui-collection-presentation': node.resolvedPresentation,
  } as const;

  if (node.resolvedPresentation === 'grid') {
    return (
      <TileGrid
        {...common}
        label={label ?? node.id}
        keyboardNavigation={node.navigation?.mode === 'spatial'}
      >
        {node.sourceState.items.map((item) => (
          <Tile
            key={item.id}
            title={item.label}
            description={item.description}
            {...itemProps(item.id)}
          />
        ))}
      </TileGrid>
    );
  }

  return (
    <List {...common} label={label ?? node.id}>
      {node.sourceState.items.map((item) => (
        <ListItem
          key={item.id}
          primary={item.label}
          secondary={item.description}
          {...itemProps(item.id)}
        />
      ))}
    </List>
  );
}

export type SemanticWorkspaceProps = {
  node: UiRuntimeWorkspaceNode;
  renderContent: (semanticId: string, regionRole: 'sidebar' | 'pane' | 'inspector') => ReactNode;
};

export function SemanticWorkspace({ node, renderContent }: SemanticWorkspaceProps) {
  const sidebar = node.regions.find((region) => region.role === 'sidebar');
  const pane = node.regions.find((region) => region.role === 'pane');
  const inspector = node.regions.find((region) => region.role === 'inspector');
  const renderRegion = (region: typeof sidebar) =>
    region ? (
      <section
        aria-label={region.label}
        data-ui-workspace-region={region.role}
        data-ui-workspace-region-id={region.id}
      >
        {region.content.map((id) => (
          <div key={id}>{renderContent(id, region.role)}</div>
        ))}
      </section>
    ) : null;

  return (
    <PageScaffold
      data-ui-ir-kind={node.kind}
      data-ui-ir-id={node.id}
      contentLabel={pane?.label ?? node.label}
      sidebar={renderRegion(sidebar)}
      sidebarPosition="start"
      inset="sm"
    >
      <div data-ui-workspace-pane>{renderRegion(pane)}</div>
      {inspector ? <aside data-ui-workspace-inspector>{renderRegion(inspector)}</aside> : null}
    </PageScaffold>
  );
}
