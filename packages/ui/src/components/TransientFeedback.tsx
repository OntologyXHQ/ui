import type { HTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, type ButtonTone } from './Button';

export type TransientTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type ToastAction = { label: string; onAction: () => void; tone?: ButtonTone };
export type ToastItem = {
  id: string;
  title?: ReactNode;
  message: ReactNode;
  tone?: TransientTone;
  durationMs?: number | null;
  action?: ToastAction;
  dismissible?: boolean;
  dismissLabel?: string;
  dismissText?: ReactNode;
};
export type ToastInput = Omit<ToastItem, 'id'> & { id?: string };

export function useToastQueue(initial: readonly ToastItem[] = []) {
  const [toasts, setToasts] = useState<ToastItem[]>([...initial]);
  const prefix = useId().replace(/:/g, '');
  const counter = useRef(0);
  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
  const push = useCallback((input: ToastInput) => {
    const id = input.id ?? `${prefix}-toast-${++counter.current}`;
    setToasts((current) => {
      const next = { durationMs: 5000, dismissible: true, tone: 'neutral' as const, ...input, id };
      const existing = current.findIndex((toast) => toast.id === id);
      if (existing < 0) return [...current, next];
      return current.map((toast, index) => index === existing ? next : toast);
    });
    return id;
  }, [prefix]);
  const clear = useCallback(() => setToasts([]), []);
  return { toasts, push, dismiss, clear };
}

export type SnackbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode;
  message: ReactNode;
  tone?: TransientTone;
  action?: ToastAction;
  dismissible?: boolean;
  dismissLabel?: string;
  dismissText?: ReactNode;
  onDismiss?: () => void;
};

export function Snackbar({
  title,
  message,
  tone = 'neutral',
  action,
  dismissible = false,
  dismissLabel = 'Dismiss message',
  dismissText = 'Close',
  onDismiss,
  className = '',
  ...props
}: SnackbarProps) {
  return (
    <div
      {...props}
      className={`ui-snackbar ui-snackbar--${tone} ${className}`.trim()}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="ui-snackbar__copy">
        {title ? <strong className="ui-snackbar__title">{title}</strong> : null}
        <div className="ui-snackbar__message">{message}</div>
      </div>
      <div className="ui-snackbar__actions">
        {action ? (
          <Button
            size="sm"
            variant="ghost"
            tone={action.tone ?? (tone === 'danger' ? 'danger' : 'default')}
            onClick={action.onAction}
          >
            {action.label}
          </Button>
        ) : null}
        {dismissible && onDismiss ? (
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label={dismissLabel}>
            {dismissText}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export type ToastHostProps = {
  items: readonly ToastItem[];
  onDismiss: (id: string) => void;
  placement?: 'block-end' | 'block-start';
  label?: string;
};

export function ToastHost({
  items,
  onDismiss,
  placement = 'block-end',
  label = 'Notifications',
}: ToastHostProps) {
  return (
    <section
      className={`ui-toast-host ui-toast-host--${placement}`}
      aria-label={label}
    >
      {items.map((item) => (
        <TimedSnackbar key={item.id} item={item} onDismiss={() => onDismiss(item.id)} />
      ))}
    </section>
  );
}

function TimedSnackbar({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const duration = item.durationMs === undefined ? 5000 : item.durationMs;
  const dismissRef = useRef(onDismiss);
  const remainingRef = useRef(duration ?? 0);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  dismissRef.current = onDismiss;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resume = useCallback(() => {
    if (duration === null || remainingRef.current <= 0 || timerRef.current !== null) return;
    startedAtRef.current = performance.now();
    timerRef.current = window.setTimeout(() => dismissRef.current(), remainingRef.current);
  }, [duration]);

  const pause = useCallback(() => {
    if (timerRef.current === null || duration === null) return;
    const elapsed = performance.now() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    clearTimer();
  }, [clearTimer, duration]);

  useEffect(() => {
    clearTimer();
    if (duration === null) return;
    remainingRef.current = duration;
    resume();
    return clearTimer;
  }, [clearTimer, duration, resume]);

  return (
    <div onPointerEnter={pause} onPointerLeave={resume} onFocusCapture={pause} onBlurCapture={resume}>
      <Snackbar
        title={item.title}
        message={item.message}
        tone={item.tone}
        action={item.action}
        dismissible={item.dismissible ?? true}
        dismissLabel={item.dismissLabel}
        dismissText={item.dismissText}
        onDismiss={() => dismissRef.current()}
      />
    </div>
  );
}

export type BannerProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode;
  message: ReactNode;
  tone?: TransientTone;
  action?: ToastAction;
  dismissLabel?: string;
  dismissText?: ReactNode;
  onDismiss?: () => void;
};

export function Banner({
  title,
  message,
  tone = 'neutral',
  action,
  dismissLabel = 'Dismiss banner',
  dismissText = 'Close',
  onDismiss,
  className = '',
  ...props
}: BannerProps) {
  return (
    <div
      {...props}
      className={`ui-banner ui-banner--${tone} ${className}`.trim()}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <div className="ui-banner__copy">
        {title ? <strong>{title}</strong> : null}
        <span>{message}</span>
      </div>
      <div className="ui-banner__actions">
        {action ? (
          <Button size="sm" variant="ghost" tone={action.tone ?? 'default'} onClick={action.onAction}>
            {action.label}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button size="sm" variant="ghost" aria-label={dismissLabel} onClick={onDismiss}>
            {dismissText}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
