import type { FocusEvent as ReactFocusEvent, HTMLAttributes, ReactNode } from 'react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { normalizeSingleSelection, useRovingFocus } from '../interaction';
import { Heading } from '../primitives';
import { Button } from './Button';
import { useControllableState } from './controlState';

export type TabItem = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
  id?: string;
  panelId?: string;
};

export function tabRelationshipIds(baseId: string, value: string) {
  const token = safeDomId(value);
  return {
    tabId: `${baseId}-tab-${token}`,
    panelId: `${baseId}-panel-${token}`,
  };
}

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  activationMode?: 'automatic' | 'manual';
  size?: 'sm' | 'md' | 'lg';
};

export function Tabs({
  activationMode = 'automatic',
  className = '',
  defaultValue,
  items,
  label,
  onKeyDown,
  onValueChange,
  size = 'md',
  value,
  ...props
}: TabsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const generatedId = useId().replace(/:/g, '');
  const firstEnabled = normalizeSingleSelection(items, undefined) ?? '';
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? firstEnabled,
    onValueChange,
  });
  const validSelected = normalizeSingleSelection(items, current, 'first-enabled') ?? firstEnabled;
  const [focusedValue, setFocusedValue] = useState(validSelected);
  const rovingValue = items.some((item) => item.value === focusedValue && !item.disabled)
    ? focusedValue
    : validSelected;
  const onRovingKeyDown = useRovingFocus({
    containerRef: rootRef,
    itemSelector: '[role="tab"]:not(:disabled)',
    orientation: 'horizontal',
  });

  useEffect(() => {
    if (!items.some((item) => item.value === focusedValue && !item.disabled)) {
      setFocusedValue(validSelected);
    }
  }, [focusedValue, items, validSelected]);

  return (
    <div
      {...props}
      ref={rootRef}
      className={`ui-tabs ui-tabs--${size} ${className}`.trim()}
      role="tablist"
      aria-label={label}
      onKeyDown={(event) => {
        onRovingKeyDown(event);
        onKeyDown?.(event);
      }}
    >
      {items.map((item) => {
        const selected = item.value === validSelected;
        const tabId = item.id ?? (item.panelId ? `${generatedId}-tab-${safeDomId(item.value)}` : undefined);
        return (
          <Button
            key={item.value}
            id={tabId}
            className="ui-tabs__tab"
            size={size}
            variant="quiet"
            role="tab"
            aria-selected={selected}
            aria-controls={item.panelId}
            tabIndex={item.value === rovingValue ? 0 : -1}
            disabled={item.disabled}
            data-value={item.value}
            data-selected={selected || undefined}
            onFocus={() => {
              if (item.disabled) return;
              setFocusedValue(item.value);
              if (activationMode === 'automatic') setCurrent(item.value);
            }}
            onClick={() => {
              if (!item.disabled) {
                setFocusedValue(item.value);
                setCurrent(item.value);
              }
            }}
          >
            <span className="ui-tabs__label">{item.label}</span>
            {item.badge ? <span className="ui-tabs__badge">{item.badge}</span> : null}
          </Button>
        );
      })}
    </div>
  );
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
  activeValue: string;
  labelledBy: string;
  keepMounted?: boolean;
};

export function TabPanel({
  value,
  activeValue,
  labelledBy,
  keepMounted = false,
  children,
  ...props
}: TabPanelProps) {
  const active = value === activeValue;
  if (!active && !keepMounted) return null;
  return (
    <div
      {...props}
      role="tabpanel"
      aria-labelledby={labelledBy}
      hidden={!active}
      tabIndex={active ? 0 : -1}
    >
      {children}
    </div>
  );
}

export type NavigationItem = {
  value: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
};

export type AdaptiveNavigationProps = Omit<HTMLAttributes<HTMLElement>, 'onChange'> & {
  label: string;
  items: readonly NavigationItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  mode?: 'auto' | 'bar' | 'rail' | 'drawer';
};

export function AdaptiveNavigation({
  className = '',
  defaultValue,
  items,
  label,
  mode = 'auto',
  onValueChange,
  value,
  ...props
}: AdaptiveNavigationProps) {
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: defaultValue ?? normalizeSingleSelection(items, undefined) ?? '',
    onValueChange,
  });
  const validSelected = normalizeSingleSelection(items, current, 'none') ?? '';

  return (
    <nav
      {...props}
      className={`ui-navigation ui-navigation--${mode} ${className}`.trim()}
      aria-label={label}
      data-mode={mode}
    >
      <div className="ui-navigation__items">
        {items.map((item) => {
          const selected = item.value === validSelected;
          return (
            <Button
              key={item.value}
              className="ui-navigation__item"
              variant="quiet"
              disabled={item.disabled}
              aria-current={selected ? 'page' : undefined}
              data-selected={selected || undefined}
              onClick={() => {
                if (!item.disabled) setCurrent(item.value);
              }}
            >
              {item.icon ? <span className="ui-navigation__icon">{item.icon}</span> : null}
              <span className="ui-navigation__label">{item.label}</span>
              {item.badge ? <span className="ui-navigation__badge">{item.badge}</span> : null}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

export type ActionGroupProps = HTMLAttributes<HTMLDivElement> & {
  /** Accessible name for the related action cluster. */
  label: string;
  /** Logical arrangement only; ActionGroup never hides actions responsively. @default horizontal */
  orientation?: 'horizontal' | 'vertical';
};

export function ActionGroup({
  children,
  className = '',
  label,
  orientation = 'horizontal',
  ...props
}: ActionGroupProps) {
  return (
    <div
      {...props}
      className={`ui-action-group ui-action-group--${orientation} ${className}`.trim()}
      role="group"
      aria-label={label}
      data-orientation={orientation}
    >
      <div className="ui-action-group__content">{children}</div>
    </div>
  );
}

export type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  /** Accessible toolbar name. */
  label: string;
  /** Caller-owned equivalent overflow action; Toolbar pins it but never silently moves/hides commands. */
  overflow?: ReactNode;
  /** Keyboard-roving axis and visual arrangement. @default horizontal */
  orientation?: 'horizontal' | 'vertical';
  /** Whether arrow-key roving wraps at the ends. @default true */
  loop?: boolean;
};

const TOOLBAR_ITEM_SELECTOR = 'button:not([disabled]), [href]:not([aria-disabled="true"])';

export function Toolbar({
  children,
  className = '',
  label,
  loop = true,
  onFocusCapture,
  onKeyDown,
  orientation = 'horizontal',
  overflow,
  ...props
}: ToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onRovingKeyDown = useRovingFocus({
    containerRef: rootRef,
    itemSelector: TOOLBAR_ITEM_SELECTOR,
    orientation,
    loop,
  });

  useLayoutEffect(() => {
    const items = toolbarItems(rootRef.current);
    if (!items.length) return;
    const existing = items.find((item) => item.tabIndex === 0 && !item.hasAttribute('disabled'));
    for (const item of items) item.tabIndex = item === (existing ?? items[0]) ? 0 : -1;
  });

  return (
    <div
      {...props}
      ref={rootRef}
      className={`ui-toolbar ui-toolbar--${orientation} ${className}`.trim()}
      role="toolbar"
      aria-label={label}
      aria-orientation={orientation}
      data-orientation={orientation}
      onFocusCapture={(event) => {
        updateToolbarTabStop(rootRef.current, event.target);
        onFocusCapture?.(event as ReactFocusEvent<HTMLDivElement>);
      }}
      onKeyDown={(event) => {
        onRovingKeyDown(event);
        onKeyDown?.(event);
      }}
    >
      <div className="ui-toolbar__content">{children}</div>
      {overflow ? <div className="ui-toolbar__overflow">{overflow}</div> : null}
    </div>
  );
}

export type AppBarProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  titleLevel?: 1 | 2 | 3 | 4 | 5 | 6;
};

export function AppBar({
  actions,
  className = '',
  leading,
  subtitle,
  title,
  titleLevel = 2,
  ...props
}: AppBarProps) {
  const titleId = useId();
  return (
    <header {...props} className={`ui-app-bar ${className}`.trim()} aria-labelledby={titleId}>
      {leading ? <div className="ui-app-bar__leading">{leading}</div> : null}
      <div className="ui-app-bar__copy">
        <Heading level={titleLevel} size="heading" className="ui-app-bar__title" id={titleId}>
          {title}
        </Heading>
        {subtitle ? <div className="ui-app-bar__subtitle">{subtitle}</div> : null}
      </div>
      {actions ? <div className="ui-app-bar__actions">{actions}</div> : null}
    </header>
  );
}

function toolbarItems(root: HTMLElement | null) {
  if (!root) return [];
  return [...root.querySelectorAll<HTMLElement>(TOOLBAR_ITEM_SELECTOR)].filter(
    (item) => !item.hasAttribute('disabled') && item.getAttribute('aria-disabled') !== 'true',
  );
}

function updateToolbarTabStop(root: HTMLElement | null, target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return;
  const items = toolbarItems(root);
  if (!items.includes(target)) return;
  for (const item of items) item.tabIndex = item === target ? 0 : -1;
}

function safeDomId(value: string) {
  return encodeURIComponent(value);
}
