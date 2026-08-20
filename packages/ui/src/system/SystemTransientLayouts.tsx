import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { useMemo, useRef } from 'react';
import type { BadgeTone } from '../components';
import {
  Card,
  ContentState,
  Dialog,
  List,
  ListItem,
  Progress,
  ScrollView,
  SearchField,
  StatusIndicator,
} from '../components';
import { SystemSurface } from './SystemScaffold';

export type SystemOsdProps = {
  label: string;
  value?: number;
  max?: number;
  icon?: ReactNode;
  tone?: BadgeTone;
  status?: ReactNode;
  className?: string;
};

export function SystemOsd({
  label,
  value,
  max = 100,
  icon,
  tone = 'neutral',
  status,
  className = '',
}: SystemOsdProps) {
  return (
    <SystemSurface
      kind="transient"
      edge="none"
      label={label}
      className={`ui-system-osd ${className}`.trim()}
    >
      <Card className="ui-system-osd__card" padding="sm" emphasis="strong">
        <div className="ui-system-osd__row">
          {icon ? (
            <span className="ui-system-osd__icon" aria-hidden>
              {icon}
            </span>
          ) : null}
          <div className="ui-system-osd__content">
            <StatusIndicator label={label} tone={tone} />
            {status ? <div className="ui-system-osd__status">{status}</div> : null}
            {value === undefined ? null : <Progress label={label} value={value} max={max} />}
          </div>
        </div>
      </Card>
    </SystemSurface>
  );
}

export type SystemCommandItem = {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  shortcut?: ReactNode;
  ariaKeyShortcuts?: string;
  disabled?: boolean;
};

export type SystemCommandSurfaceProps = {
  open: boolean;
  query: string;
  commands: readonly SystemCommandItem[];
  onQueryChange: (query: string) => void;
  onActivate: (id: string) => void;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  searchLabel?: string;
  searchPlaceholder?: string;
  collectionLabel?: string;
  emptyTitle?: ReactNode;
  emptyDescription?: ReactNode;
};

export function SystemCommandSurface({
  open,
  query,
  commands,
  onQueryChange,
  onActivate,
  onOpenChange,
  title = 'Commands',
  searchLabel = 'Search commands',
  searchPlaceholder = 'Type a command',
  collectionLabel = 'Commands',
  emptyTitle = 'No commands found',
  emptyDescription = 'Try another search.',
}: SystemCommandSurfaceProps) {
  const commandListRef = useRef<HTMLDivElement | null>(null);
  const visibleCommands = useMemo(() => filterSystemCommands(commands, query), [commands, query]);

  const commandButtons = () => [
    ...(commandListRef.current?.querySelectorAll<HTMLButtonElement>(
      '[data-system-command-id] button:not([disabled])',
    ) ?? []),
  ];

  const focusCommand = (edge: 'first' | 'last') => {
    const buttons = commandButtons();
    (edge === 'first' ? buttons[0] : buttons.at(-1))?.focus({ preventScroll: true });
  };

  const moveCommandFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const buttons = commandButtons();
    if (!buttons.length) return;
    event.preventDefault();
    if (event.key === 'Home') {
      buttons[0]?.focus({ preventScroll: true });
      return;
    }
    if (event.key === 'End') {
      buttons.at(-1)?.focus({ preventScroll: true });
      return;
    }
    const current =
      document.activeElement instanceof HTMLButtonElement
        ? buttons.indexOf(document.activeElement)
        : -1;
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const next =
      current < 0
        ? delta > 0
          ? 0
          : buttons.length - 1
        : (current + delta + buttons.length) % buttons.length;
    buttons[next]?.focus({ preventScroll: true });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      size="lg"
      className="ui-system-command-surface"
    >
      <SearchField
        hideLabel
        label={searchLabel}
        placeholder={searchPlaceholder}
        value={query}
        onValueChange={onQueryChange}
        autoComplete="off"
        data-autofocus
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusCommand('first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusCommand('last');
          }
        }}
      />
      <div ref={commandListRef} onKeyDown={moveCommandFocus}>
        <ScrollView className="ui-system-command-surface__scroll" ariaLabel={collectionLabel}>
          {visibleCommands.length > 0 ? (
            <List label={collectionLabel} divided>
              {visibleCommands.map((command) => (
                <ListItem
                  key={command.id}
                  data-system-command-id={command.id}
                  primary={command.label}
                  secondary={command.description}
                  metadata={command.shortcut}
                  actionAriaKeyShortcuts={command.ariaKeyShortcuts}
                  disabled={command.disabled}
                  onActivate={command.disabled ? undefined : () => onActivate(command.id)}
                />
              ))}
            </List>
          ) : (
            <ContentState kind="empty" title={emptyTitle} description={emptyDescription} />
          )}
        </ScrollView>
      </div>
    </Dialog>
  );
}

function filterSystemCommands(commands: readonly SystemCommandItem[], query: string) {
  const tokens = query.normalize('NFKC').trim().toLocaleLowerCase().split(/\s+/u).filter(Boolean);
  if (!tokens.length) return [...commands];
  return commands.filter((command) => {
    const haystack = [command.label, command.description ?? '', command.shortcut ?? '']
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .normalize('NFKC')
      .toLocaleLowerCase();
    return tokens.every((token) => haystack.includes(token));
  });
}

export type SystemLockLayoutProps = {
  primary: ReactNode;
  secondary?: ReactNode;
  identity?: ReactNode;
  authentication?: ReactNode;
  status?: ReactNode;
  actions?: ReactNode;
  label?: string;
  className?: string;
  contentRole?: 'main' | 'region';
};

export function SystemLockLayout({
  primary,
  secondary,
  identity,
  authentication,
  status,
  actions,
  label = 'Lock screen',
  className = '',
  contentRole = 'region',
}: SystemLockLayoutProps) {
  const content = (
    <>
      <div className="ui-system-lock-layout__status">{status}</div>
      <Card
        className="ui-system-lock-layout__card"
        title={primary}
        description={secondary}
        leading={identity}
        actions={actions}
        emphasis="strong"
        padding="lg"
      >
        {authentication}
      </Card>
    </>
  );
  return contentRole === 'main' ? (
    <main className={`ui-system-lock-layout ${className}`.trim()} aria-label={label}>
      {content}
    </main>
  ) : (
    <section
      className={`ui-system-lock-layout ${className}`.trim()}
      role="region"
      aria-label={label}
    >
      {content}
    </section>
  );
}
