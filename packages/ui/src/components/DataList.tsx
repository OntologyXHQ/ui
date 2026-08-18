import type { HTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';
import { Divider } from '../primitives';

export type ListProps = HTMLAttributes<HTMLDivElement> & {
  label?: string;
  divided?: boolean;
};

export function List({ children, className = '', divided = false, label, ...props }: ListProps) {
  return (
    <div
      {...props}
      className={`ui-list ${divided ? 'ui-list--divided' : ''} ${className}`.trim()}
      role="list"
      aria-label={label}
    >
      {children}
    </div>
  );
}

export type ListSectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
};

export function ListSection({
  children,
  className = '',
  description,
  title,
  trailing,
  ...props
}: ListSectionProps) {
  const headingId = useId();
  return (
    <section
      {...props}
      role={props.role ?? 'group'}
      className={`ui-list-section ${className}`.trim()}
      aria-labelledby={title ? headingId : undefined}
    >
      {title || description || trailing ? (
        <div className="ui-list-section__header">
          <div className="ui-list-section__copy">
            {title ? (
              <div className="ui-list-section__title" id={headingId}>
                {title}
              </div>
            ) : null}
            {description ? <div className="ui-list-section__description">{description}</div> : null}
          </div>
          {trailing ? <div className="ui-list-section__trailing">{trailing}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export type ListItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'onSelect' | 'title'> & {
  primary: ReactNode;
  secondary?: ReactNode;
  metadata?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  selectionSemantics?: 'visual' | 'current';
  disabled?: boolean;
  onActivate?: () => void;
  actionLabel?: string;
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
    <div
      {...props}
      className={`ui-list-item ${selected ? 'ui-list-item--selected' : ''} ${className}`.trim()}
      role="listitem"
      data-selected={selected || undefined}
      aria-current={selected && selectionSemantics === 'current' ? true : undefined}
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
    </div>
  );
}

export type ListSeparatorProps = { inset?: 'none' | 'content' };

export function ListSeparator({ inset = 'content' }: ListSeparatorProps) {
  return <Divider decorative className={`ui-list-separator ui-list-separator--${inset}`} />;
}
