export type ScrimTone = 'standard' | 'strong';

export type ScrimProps = {
  active: boolean;
  tone?: ScrimTone;
  onDismiss?: () => void;
  dismissLabel?: string;
  className?: string;
};

export function Scrim({
  active,
  className = '',
  dismissLabel = 'Dismiss overlay',
  onDismiss,
  tone = 'standard',
}: ScrimProps) {
  const classes = ['ui-scrim', `ui-scrim--${tone}`, active ? 'ui-scrim--active' : '', className]
    .filter(Boolean)
    .join(' ');

  if (onDismiss) {
    return (
      <button
        type="button"
        className={classes}
        aria-label={dismissLabel}
        aria-hidden={!active}
        disabled={!active}
        tabIndex={-1}
        data-oxs-cursor-role="pointer"
        onClick={onDismiss}
      />
    );
  }

  return <div className={classes} aria-hidden />;
}
