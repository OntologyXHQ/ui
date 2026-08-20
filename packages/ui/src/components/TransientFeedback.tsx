import type { HTMLAttributes, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Button, type ButtonIntent } from './Button';

export type TransientTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
export type ToastAction = { label: string; onAction: () => void; intent?: ButtonIntent };
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
  const push = useCallback(
    (input: ToastInput) => {
      const id = input.id ?? `${prefix}-toast-${++counter.current}`;
      setToasts((current) => {
        const next = {
          durationMs: 5000,
          dismissible: true,
          tone: 'neutral' as const,
          ...input,
          id,
        };
        const existing = current.findIndex((toast) => toast.id === id);
        if (existing < 0) return [...current, next];
        return current.map((toast, index) => (index === existing ? next : toast));
      });
      return id;
    },
    [prefix],
  );
  const clear = useCallback(() => setToasts([]), []);
  return { toasts, push, dismiss, clear };
}

export type SnackbarProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  /** Optional emphasized title shown before the message. */
  title?: ReactNode;
  /** Required feedback message content. */
  message: ReactNode;
  /** Semantic feedback tone; danger uses alert semantics. @default neutral */
  tone?: TransientTone;
  /** Optional caller-owned action shown beside the message. */
  action?: ToastAction;
  /** Enables the dismiss control when onDismiss is also supplied. @default false */
  dismissible?: boolean;
  /** Accessible name for the dismiss action. @default Dismiss message */
  dismissLabel?: string;
  /** Visible localized dismiss copy. @default Close */
  dismissText?: ReactNode;
  /** Called when the user activates the dismiss control. */
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
            variant="quiet"
            intent={action.intent ?? (tone === 'danger' ? 'destructive' : 'neutral')}
            onClick={action.onAction}
          >
            {action.label}
          </Button>
        ) : null}
        {dismissible && onDismiss ? (
          <Button size="sm" variant="quiet" onClick={onDismiss} aria-label={dismissLabel}>
            {dismissText}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export type ToastHostProps = {
  /** Controlled toast queue rendered in stable caller-provided order. */
  items: readonly ToastItem[];
  /** Removes one toast by its stable id after timeout or user dismissal. */
  onDismiss: (id: string) => void;
  /** Logical block edge used for host placement. @default block-end */
  placement?: 'block-end' | 'block-start';
  /** Accessible live-region name. @default Notifications */
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
      aria-live="polite"
      aria-relevant="additions text"
      aria-atomic="false"
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
  const hostRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<{ ownerWindow: Window; id: number } | null>(null);
  dismissRef.current = onDismiss;

  const clearTimer = useCallback(() => {
    const timer = timerRef.current;
    if (!timer) return;
    timer.ownerWindow.clearTimeout(timer.id);
    timerRef.current = null;
  }, []);

  const resume = useCallback(() => {
    if (duration === null || timerRef.current !== null) return;
    const ownerWindow = hostRef.current?.ownerDocument.defaultView ?? null;
    if (!ownerWindow) return;
    if (remainingRef.current <= 0) {
      ownerWindow.queueMicrotask(() => dismissRef.current());
      return;
    }
    startedAtRef.current = ownerWindow.performance.now();
    const id = ownerWindow.setTimeout(() => dismissRef.current(), remainingRef.current);
    timerRef.current = { ownerWindow, id };
  }, [duration]);

  const pause = useCallback(() => {
    const timer = timerRef.current;
    if (!timer || duration === null) return;
    const elapsed = timer.ownerWindow.performance.now() - startedAtRef.current;
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
    <div
      ref={hostRef}
      data-toast-id={item.id}
      onPointerEnter={pause}
      onPointerLeave={resume}
      onFocusCapture={pause}
      onBlurCapture={(event) => {
        if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node))
          return;
        resume();
      }}
    >
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
  /** Optional emphasized title shown before persistent feedback. */
  title?: ReactNode;
  /** Required persistent feedback message. */
  message: ReactNode;
  /** Semantic feedback tone; danger uses alert semantics. @default neutral */
  tone?: TransientTone;
  /** Optional caller-owned action shown with the message. */
  action?: ToastAction;
  /** Accessible label for the dismiss control. @default Dismiss banner */
  dismissLabel?: string;
  /** Visible localized dismiss copy. @default Close */
  dismissText?: ReactNode;
  /** Enables dismissal and receives the user dismissal request. */
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
          <Button
            size="sm"
            variant="quiet"
            intent={action.intent ?? 'neutral'}
            onClick={action.onAction}
          >
            {action.label}
          </Button>
        ) : null}
        {onDismiss ? (
          <Button size="sm" variant="quiet" aria-label={dismissLabel} onClick={onDismiss}>
            {dismissText}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
