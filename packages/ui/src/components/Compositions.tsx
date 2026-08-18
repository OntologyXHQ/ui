import type {
  FocusEvent as ReactFocusEvent,
  HTMLAttributes,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import { useId, useLayoutEffect, useRef } from 'react';
import type { IconName } from '../primitives';
import { Heading, Icon } from '../primitives';
import { Button } from './Button';
import { useControllableState } from './controlState';
import { Spinner } from './Feedback';

export type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  description?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  emphasis?: 'subtle' | 'default' | 'strong';
};

export function Card({
  actions,
  children,
  className = '',
  description,
  emphasis = 'default',
  footer,
  leading,
  padding = 'md',
  title,
  titleLevel = 3,
  ...props
}: CardProps) {
  const titleId = useId();
  const descriptionId = useId();
  const labelled = Boolean(title);
  const described = Boolean(description);
  return (
    <div
      {...props}
      className={`ui-card ui-card--${emphasis} ui-card--pad-${padding} ${className}`.trim()}
      role={props.role ?? (labelled ? 'group' : undefined)}
      aria-labelledby={props['aria-labelledby'] ?? (labelled ? titleId : undefined)}
      aria-describedby={props['aria-describedby'] ?? (described ? descriptionId : undefined)}
    >
      {leading || title || description || actions ? (
        <div className="ui-card__header">
          {leading ? <div className="ui-card__leading">{leading}</div> : null}
          <div className="ui-card__copy">
            {title ? <Heading className="ui-card__title" id={titleId} level={titleLevel}>{title}</Heading> : null}
            {description ? <div className="ui-card__description" id={descriptionId}>{description}</div> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </div>
      ) : null}
      {children ? <div className="ui-card__content">{children}</div> : null}
      {footer ? <div className="ui-card__footer">{footer}</div> : null}
    </div>
  );
}

export type DisclosureProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  summary: ReactNode;
  description?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
};

export function Disclosure({
  children,
  className = '',
  defaultOpen = false,
  description,
  disabled = false,
  onOpenChange,
  open,
  summary,
  ...props
}: DisclosureProps) {
  const [current, setCurrent] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  });
  const descriptionId = useId();
  const contentId = useId();
  return (
    <div
      {...props}
      className={`ui-disclosure ${className}`.trim()}
      data-open={current || undefined}
      data-disabled={disabled || undefined}
    >
      <button
        type="button"
        className="ui-disclosure__summary"
        data-oxs-cursor-role={disabled ? 'not-allowed' : 'pointer'}
        aria-expanded={current}
        aria-controls={contentId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        onClick={() => setCurrent((value) => !value)}
      >
        <span className="ui-disclosure__summary-copy">
          <span className="ui-disclosure__title">{summary}</span>
          {description ? <span className="ui-disclosure__description" aria-hidden="true">{description}</span> : null}
        </span>
        <Icon className="ui-disclosure__chevron" name="chevron-end" aria-hidden />
      </button>
      {description ? <span className="ui-visually-hidden" id={descriptionId}>{description}</span> : null}
      <div id={contentId} className="ui-disclosure__content" hidden={!current}>{children}</div>
    </div>
  );
}

export type AccordionItem = {
  value: string;
  summary: ReactNode;
  description?: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type AccordionProps = Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> & {
  items: readonly AccordionItem[];
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: readonly string[]) => void;
  multiple?: boolean;
  label?: string;
};

export function Accordion({
  className = '',
  defaultValue = [],
  items,
  label,
  multiple = false,
  onValueChange,
  value,
  ...props
}: AccordionProps) {
  const accordionId = useId().replace(/:/g, '');
  const [current, setCurrent] = useControllableState<readonly string[]>({
    value,
    defaultValue: multiple ? defaultValue : defaultValue.slice(0, 1),
    onValueChange,
  });
  const visibleCurrent = multiple ? current : current.slice(0, 1);
  return (
    <div {...props} className={`ui-accordion ${className}`.trim()} role={props.role ?? (label ? 'group' : undefined)} aria-label={label}>
      {items.map((item) => {
        const expanded = visibleCurrent.includes(item.value);
        const itemToken = safeCompositionId(item.value);
        const contentId = `oxs-accordion-${accordionId}-${itemToken}-content`;
        const descriptionId = item.description ? `oxs-accordion-${accordionId}-${itemToken}-description` : undefined;
        return (
          <div
            key={item.value}
            className="ui-disclosure ui-accordion__item"
            data-open={expanded || undefined}
            data-disabled={item.disabled || undefined}
          >
            <button
              type="button"
              className="ui-disclosure__summary"
              aria-expanded={expanded}
              aria-controls={contentId}
              aria-describedby={descriptionId}
              disabled={item.disabled}
              data-oxs-cursor-role={item.disabled ? 'not-allowed' : 'pointer'}
              onClick={() => {
                if (item.disabled) return;
                setCurrent((existing) => {
                  const normalized = multiple ? [...existing] : existing.slice(0, 1);
                  if (expanded) return normalized.filter((entry) => entry !== item.value);
                  return multiple
                    ? normalized.includes(item.value) ? normalized : [...normalized, item.value]
                    : [item.value];
                });
              }}
            >
              <span className="ui-disclosure__summary-copy">
                <span className="ui-disclosure__title">{item.summary}</span>
                {item.description ? <span className="ui-disclosure__description" aria-hidden="true">{item.description}</span> : null}
              </span>
              <Icon className="ui-disclosure__chevron" name="chevron-end" aria-hidden />
            </button>
            {item.description ? <span className="ui-visually-hidden" id={descriptionId}>{item.description}</span> : null}
            <div id={contentId} className="ui-disclosure__content" hidden={!expanded}>{item.content}</div>
          </div>
        );
      })}
    </div>
  );
}

function safeCompositionId(value: string) {
  return encodeURIComponent(value);
}

export type PageScaffoldProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  header?: ReactNode;
  sidebar?: ReactNode;
  sidebarPosition?: 'start' | 'end';
  footer?: ReactNode;
  children: ReactNode;
  inset?: 'none' | 'sm' | 'md' | 'lg';
  contentLabel?: string;
  contentRole?: 'main' | 'region';
};

export function PageScaffold({
  children,
  className = '',
  contentLabel,
  contentRole = 'main',
  footer,
  header,
  inset = 'md',
  sidebar,
  sidebarPosition = 'start',
  ...props
}: PageScaffoldProps) {
  return (
    <div
      {...props}
      className={`ui-page-scaffold ui-page-scaffold--inset-${inset} ${className}`.trim()}
      data-sidebar-position={sidebarPosition}
    >
      {header ? <div className="ui-page-scaffold__header">{header}</div> : null}
      <div className="ui-page-scaffold__body">
        {sidebar ? <aside className="ui-page-scaffold__sidebar">{sidebar}</aside> : null}
        {contentRole === 'main' ? (
          <main className="ui-page-scaffold__content" aria-label={contentLabel}>{children}</main>
        ) : (
          <section className="ui-page-scaffold__content" role="region" aria-label={contentLabel}>{children}</section>
        )}
      </div>
      {footer ? <footer className="ui-page-scaffold__footer">{footer}</footer> : null}
    </div>
  );
}

export type TileGridProps = HTMLAttributes<HTMLDivElement> & {
  density?: 'compact' | 'comfortable' | 'roomy';
  label?: string;
  keyboardNavigation?: boolean;
};

const TILE_ACTION_SELECTOR = '[data-ui-tile-action]:not([disabled])';

export function TileGrid({
  children,
  className = '',
  density = 'comfortable',
  keyboardNavigation = false,
  label,
  onFocusCapture,
  onKeyDown,
  ...props
}: TileGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!keyboardNavigation) return;
    const items = tileActions(gridRef.current);
    const active = document.activeElement instanceof HTMLElement && items.includes(document.activeElement)
      ? document.activeElement
      : items[0];
    for (const item of items) item.tabIndex = item === active ? 0 : -1;
  });

  const updateRovingTabStop = (event: ReactFocusEvent<HTMLDivElement>) => {
    if (keyboardNavigation && event.target instanceof HTMLElement && event.target.matches(TILE_ACTION_SELECTOR)) {
      for (const item of tileActions(gridRef.current)) item.tabIndex = item === event.target ? 0 : -1;
    }
    onFocusCapture?.(event);
  };

  return (
    <div
      {...props}
      ref={gridRef}
      className={`ui-tile-grid ui-tile-grid--${density} ${className}`.trim()}
      role={props.role ?? (label ? 'group' : undefined)}
      aria-label={props['aria-label'] ?? label}
      onFocusCapture={updateRovingTabStop}
      onKeyDown={(event) => {
        if (keyboardNavigation) moveTileGridFocus(event, gridRef.current);
        if (!event.defaultPrevented) onKeyDown?.(event);
      }}
    >
      {children}
    </div>
  );
}

function tileActions(root: HTMLElement | null) {
  return [...(root?.querySelectorAll<HTMLElement>(TILE_ACTION_SELECTOR) ?? [])];
}

function moveTileGridFocus(event: ReactKeyboardEvent<HTMLDivElement>, root: HTMLElement | null) {
  const items = tileActions(root);
  if (!items.length) return;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const index = active ? items.indexOf(active) : -1;
  if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault();
    const next = event.key === 'Home' ? items[0] : items.at(-1);
    next?.focus({ preventScroll: true });
    return;
  }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  const current = index >= 0 ? items[index] : items[0];
  const measurements = items.map((item) => ({ item, rect: item.getBoundingClientRect() }));
  const currentRect = measurements.find(({ item }) => item === current)?.rect ?? current.getBoundingClientRect();
  const cx = currentRect.left + currentRect.width / 2;
  const cy = currentRect.top + currentRect.height / 2;
  const rtl = root ? getComputedStyle(root).direction === 'rtl' : false;
  const logicalKey = rtl
    ? event.key === 'ArrowLeft' ? 'ArrowRight' : event.key === 'ArrowRight' ? 'ArrowLeft' : event.key
    : event.key;
  const candidates = measurements
    .filter(({ item }) => item !== current)
    .map(({ item, rect }) => {
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const dx = x - cx;
      const dy = y - cy;
      const valid = logicalKey === 'ArrowRight' ? dx > 1
        : logicalKey === 'ArrowLeft' ? dx < -1
        : logicalKey === 'ArrowDown' ? dy > 1
        : dy < -1;
      const primary = logicalKey === 'ArrowRight' || logicalKey === 'ArrowLeft' ? Math.abs(dx) : Math.abs(dy);
      const secondary = logicalKey === 'ArrowRight' || logicalKey === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
      return { item, valid, score: primary + secondary * 2.5 };
    })
    .filter((candidate) => candidate.valid)
    .sort((a, b) => a.score - b.score);
  const spatialTarget = candidates[0]?.item;
  if (spatialTarget) {
    spatialTarget.focus({ preventScroll: true });
    return;
  }

  const hasMeasurableGeometry = measurements.some(({ rect }) =>
    rect.width !== 0
    || rect.height !== 0
    || rect.left !== 0
    || rect.top !== 0
    || rect.right !== 0
    || rect.bottom !== 0,
  );
  if (hasMeasurableGeometry) return;

  // Hidden/test layouts can legitimately report only zero geometry. Keep the
  // roving model usable with deterministic logical-order navigation until a
  // measurable 2D layout exists. Once geometry exists, an arrow at a spatial
  // edge is a no-op rather than leaking focus into the next logical row.
  const logicalDelta = logicalKey === 'ArrowRight' || logicalKey === 'ArrowDown' ? 1 : -1;
  const fallbackIndex = Math.min(items.length - 1, Math.max(0, (index >= 0 ? index : 0) + logicalDelta));
  items[fallbackIndex]?.focus({ preventScroll: true });
}

export type TileProps = Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onClick' | 'tabIndex'> & {
  title: ReactNode;
  description?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  badge?: ReactNode;
  selected?: boolean;
  selectionSemantics?: 'visual' | 'current';
  disabled?: boolean;
  tabIndex?: number;
  pending?: boolean;
  pendingLabel?: string;
  onActivate?: () => void;
};

export function Tile({
  badge,
  className = '',
  description,
  disabled = false,
  leading,
  onActivate,
  pending = false,
  pendingLabel = 'Working',
  selected = false,
  selectionSemantics = 'visual',
  tabIndex,
  title,
  trailing,
  ...props
}: TileProps) {
  const mainContent = (
    <>
      {leading ? <span className="ui-tile__leading">{leading}</span> : null}
      <span className="ui-tile__copy">
        <span className="ui-tile__title">{title}</span>
        {description ? <span className="ui-tile__description">{description}</span> : null}
      </span>
      {badge ? <span className="ui-tile__badge">{badge}</span> : null}
    </>
  );
  return (
    <div
      {...props}
      className={`ui-tile ${className}`.trim()}
      role={props.role}
      data-selected={selected || undefined}
      aria-current={selected && selectionSemantics === 'current' ? true : undefined}
      data-disabled={disabled || undefined}
      data-pending={pending || undefined}
    >
      <div className="ui-tile__shell">
        {onActivate ? (
          <Button
            data-ui-tile-action
            className="ui-tile__action"
            variant="ghost"
            disabled={disabled}
            loading={pending}
            loadingLabel={pendingLabel}
            tabIndex={tabIndex}
            onClick={onActivate}
          >
            {mainContent}
          </Button>
        ) : (
          <div className="ui-tile__content" tabIndex={tabIndex}>{mainContent}</div>
        )}
        {trailing ? <span className="ui-tile__trailing">{trailing}</span> : null}
      </div>
    </div>
  );
}

export type ApplicationItemIcon = IconName | { src: string };
export type ApplicationItemProps = Omit<TileProps, 'title' | 'leading'> & {
  name: string;
  icon: ApplicationItemIcon;
};

export function ApplicationItem({
  icon,
  name,
  pendingLabel = 'Opening application',
  ...props
}: ApplicationItemProps) {
  const graphic = typeof icon === 'string'
    ? <Icon name={icon} size="lg" aria-hidden />
    : <img className="ui-application-item__image" src={icon.src} alt="" draggable={false} />;
  return (
    <Tile
      {...props}
      className={`ui-application-item ${props.className ?? ''}`.trim()}
      title={name}
      pendingLabel={pendingLabel}
      leading={<span className="ui-application-item__icon" aria-hidden>{graphic}</span>}
    />
  );
}

export type ContentStateKind = 'empty' | 'error' | 'loading';
export type ContentStateProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  kind: ContentStateKind;
  title: ReactNode;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  status?: ReactNode;
};

export function ContentState({
  actions,
  className = '',
  description,
  icon,
  kind,
  status,
  title,
  titleLevel = 3,
  ...props
}: ContentStateProps) {
  const role = props.role ?? (kind === 'error' ? 'alert' : kind === 'loading' ? 'status' : undefined);
  return (
    <div {...props} className={`ui-content-state ui-content-state--${kind} ${className}`.trim()} role={role}>
      <div className="ui-content-state__visual" aria-hidden>
        {kind === 'loading' && !icon ? <Spinner label="Loading" /> : icon}
      </div>
      <div className="ui-content-state__copy">
        <Heading className="ui-content-state__title" level={titleLevel}>{title}</Heading>
        {description ? <div className="ui-content-state__description">{description}</div> : null}
        {status ? <div className="ui-content-state__status">{status}</div> : null}
      </div>
      {actions ? <div className="ui-content-state__actions">{actions}</div> : null}
    </div>
  );
}
