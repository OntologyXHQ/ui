import type { HTMLAttributes, LiHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { Divider, Heading } from '../primitives';

export type ListState = 'ready' | 'loading' | 'empty' | 'error';

export type ListProps = HTMLAttributes<HTMLUListElement> & {
  /** Accessible collection name when surrounding context does not already label the list. */
  label?: string;
  /** Draws lightweight separators between direct ListItem children. @default false */
  divided?: boolean;
  /** Predictable collection replacement state. @default ready */
  state?: ListState;
  /** Caller-owned visible replacement content for non-ready states. */
  stateContent?: ReactNode;
  /** Accessible state label used when replacement content is not self-describing. */
  stateLabel?: string;
};

export function List({
  children,
  className = '',
  divided = false,
  label,
  state = 'ready',
  stateContent,
  stateLabel,
  ...props
}: ListProps) {
  const replacement =
    state === 'ready' ? null : (
      <li className="ui-list__state-item">
        <div
          className="ui-list__state"
          role={state === 'error' ? 'alert' : state === 'loading' ? 'status' : undefined}
          aria-label={stateLabel}
        >
          {stateContent ?? stateLabel}
        </div>
      </li>
    );
  return (
    <ul
      {...props}
      className={`ui-list ${divided ? 'ui-list--divided' : ''} ${className}`.trim()}
      aria-label={label}
      aria-busy={state === 'loading' || undefined}
      data-state={state}
    >
      {replacement ?? children}
    </ul>
  );
}

export type ListSectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** Optional section heading. */
  title?: ReactNode;
  /** Supporting text associated with the section. */
  description?: ReactNode;
  /** Caller-owned utility content rendered beside the heading. */
  trailing?: ReactNode;
  /** Semantic heading rank for the section title. @default 3 */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** Collection content, normally one or more List instances. */
  children: ReactNode;
};

export function ListSection({
  children,
  className = '',
  description,
  headingLevel = 3,
  title,
  trailing,
  ...props
}: ListSectionProps) {
  const headingId = useId();
  const descriptionId = useId();
  return (
    <section
      {...props}
      className={`ui-list-section ${className}`.trim()}
      aria-labelledby={title ? headingId : undefined}
      aria-describedby={description ? descriptionId : undefined}
    >
      {title || description || trailing ? (
        <div className="ui-list-section__header">
          <div className="ui-list-section__copy">
            {title ? (
              <Heading
                className="ui-list-section__title"
                id={headingId}
                level={headingLevel}
                size="heading"
              >
                {title}
              </Heading>
            ) : null}
            {description ? (
              <div className="ui-list-section__description" id={descriptionId}>
                {description}
              </div>
            ) : null}
          </div>
          {trailing ? <div className="ui-list-section__trailing">{trailing}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type ListItemProps = Omit<LiHTMLAttributes<HTMLLIElement>, 'onSelect' | 'title'> & {
  /** Primary visible row label. */
  primary: ReactNode;
  /** Optional supporting copy. */
  secondary?: ReactNode;
  /** Optional bounded metadata rendered separately from the primary action. */
  metadata?: ReactNode;
  /** Optional decorative/semantic leading content. */
  leading?: ReactNode;
  /** Optional trailing content rendered as a sibling of the primary action so nested interactivity is impossible. */
  trailing?: ReactNode;
  /** Visual selected state. @default false */
  selected?: boolean;
  /** Whether selected state is visual-only or denotes the current item. @default visual */
  selectionSemantics?: 'visual' | 'current';
  /** Disables the primary row action without disabling independent trailing controls. @default false */
  disabled?: boolean;
  /** Turns the main row surface into a native button action. */
  onActivate?: () => void;
  /** Optional explicit accessible name for the primary row action. */
  actionLabel?: string;
  /** Optional keyboard shortcut metadata for the primary row action. */
  actionAriaKeyShortcuts?: string;
};

export function ListItem({
  actionAriaKeyShortcuts,
  actionLabel,
  className = '',
  disabled = false,
  leading,
  metadata,
  onActivate,
  primary,
  secondary,
  selected = false,
  selectionSemantics = 'visual',
  trailing,
  ...props
}: ListItemProps) {
  const mainContent = (
    <>
      {leading ? <span className="ui-list-item__leading">{leading}</span> : null}
      <span className="ui-list-item__copy">
        <span className="ui-list-item__primary">{primary}</span>
        {secondary ? <span className="ui-list-item__secondary">{secondary}</span> : null}
      </span>
      {metadata ? <span className="ui-list-item__metadata">{metadata}</span> : null}
    </>
  );

  return (
    <li
      {...props}
      className={`ui-list-item ${selected ? 'ui-list-item--selected' : ''} ${className}`.trim()}
      data-selected={selected || undefined}
      aria-current={selected && selectionSemantics === 'current' ? 'true' : undefined}
      data-disabled={disabled || undefined}
    >
      {onActivate ? (
        <div className="ui-list-item__action-row">
          <button
            className="ui-list-item__action"
            type="button"
            disabled={disabled}
            aria-label={actionLabel}
            aria-keyshortcuts={actionAriaKeyShortcuts}
            data-oxs-cursor-role={disabled ? 'not-allowed' : 'pointer'}
            onClick={() => onActivate()}
          >
            {mainContent}
          </button>
          {trailing ? <span className="ui-list-item__trailing">{trailing}</span> : null}
        </div>
      ) : (
        <div className="ui-list-item__content">
          {mainContent}
          {trailing ? <span className="ui-list-item__trailing">{trailing}</span> : null}
        </div>
      )}
    </li>
  );
}

export type ListSeparatorProps = {
  /** Logical inset policy for the visual divider. @default content */
  inset?: 'none' | 'content';
};

export function ListSeparator({ inset = 'content' }: ListSeparatorProps) {
  return (
    <li className={`ui-list-separator ui-list-separator--${inset}`} role="presentation">
      <Divider decorative />
    </li>
  );
}
