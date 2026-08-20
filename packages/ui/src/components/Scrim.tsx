export type ScrimTone = 'standard' | 'strong';

export type ScrimProps = {
  /** Whether the backdrop currently participates in the owning overlay. */
  active: boolean;
  /** Backdrop strength without changing modality semantics. @default standard */
  tone?: ScrimTone;
  /** Optional dismissal request; lifecycle authority remains with the overlay owner. */
  onDismiss?: () => void;
  /** Accessible label used when the scrim itself is dismissible. @default Dismiss overlay */
  dismissLabel?: string;
  /** Additional class name for composition without owning overlay behavior. */
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
