import type { HTMLAttributes, ReactNode } from 'react';
import { Heading } from '../primitives';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
};

export function Badge({ children, className = '', size = 'md', tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span {...props} className={`ui-badge ui-badge--${tone} ui-badge--${size} ${className}`.trim()}>
      {children}
    </span>
  );
}

export type StatusIndicatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  label: string;
  tone?: BadgeTone;
  showLabel?: boolean;
  announce?: boolean;
};

export function StatusIndicator({
  announce = false,
  className = '',
  label,
  showLabel = true,
  tone = 'neutral',
  ...props
}: StatusIndicatorProps) {
  return (
    <span
      {...props}
      className={`ui-status-indicator ui-status-indicator--${tone} ${className}`.trim()}
      role={announce ? 'status' : undefined}
    >
      <span className="ui-status-indicator__dot" aria-hidden />
      {showLabel ? <span className="ui-status-indicator__label">{label}</span> : <span className="ui-visually-hidden">{label}</span>}
    </span>
  );
}

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  label: string;
  value?: number;
  max?: number;
  showValue?: boolean;
};

export function Progress({
  className = '',
  label,
  max = 100,
  showValue = false,
  value,
  ...props
}: ProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const normalized = value === undefined || !Number.isFinite(value)
    ? undefined
    : Math.min(safeMax, Math.max(0, value));
  return (
    <div {...props} className={`ui-progress ${className}`.trim()}>
      <div className="ui-progress__header">
        <span className="ui-progress__label">{label}</span>
        {showValue && normalized !== undefined ? (
          <span className="ui-progress__value">{Math.round((normalized / safeMax) * 100)}%</span>
        ) : null}
      </div>
      <progress className="ui-progress__native" aria-label={label} max={safeMax} value={normalized} />
    </div>
  );
}

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  announce?: boolean;
};

export function Spinner({ announce = false, className = '', label = 'Loading', size = 'md', ...props }: SpinnerProps) {
  return (
    <span
      {...props}
      className={`ui-spinner ui-spinner--${size} ${className}`.trim()}
      role={announce ? 'status' : undefined}
      aria-label={announce ? label : undefined}
      aria-hidden={announce ? undefined : true}
    />
  );
}

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  width?: 'short' | 'medium' | 'full';
  shape?: 'text' | 'rect' | 'circle';
};

export function Skeleton({
  className = '',
  shape = 'text',
  width = 'full',
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      className={`ui-skeleton ui-skeleton--${shape} ui-skeleton--${width} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  titleLevel?: 2 | 3 | 4 | 5 | 6;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  action,
  className = '',
  description,
  icon,
  title,
  titleLevel = 3,
  ...props
}: EmptyStateProps) {
  return (
    <div {...props} className={`ui-empty-state ${className}`.trim()}>
      {icon ? <div className="ui-empty-state__icon" aria-hidden>{icon}</div> : null}
      <Heading className="ui-empty-state__title" level={titleLevel}>{title}</Heading>
      {description ? <div className="ui-empty-state__description">{description}</div> : null}
      {action ? <div className="ui-empty-state__action">{action}</div> : null}
    </div>
  );
}
