import type {
  ButtonHTMLAttributes,
  KeyboardEventHandler,
  MouseEventHandler,
  PointerEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { forwardRef } from 'react';
import type { PressActivation } from '../interaction';
import { usePress } from '../interaction';
import { useControllableState } from './controlState';

export type ControlSize = 'sm' | 'md' | 'lg';
export type ButtonVariant = 'ghost' | 'soft' | 'filled';
export type ButtonTone = 'default' | 'danger';

export type ButtonProps = PropsWithChildren<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
    type?: 'button' | 'submit' | 'reset';
    variant?: ButtonVariant;
    tone?: ButtonTone;
    size?: ControlSize;
    loading?: boolean;
    loadingLabel?: string;
    leading?: ReactNode;
    trailing?: ReactNode;
    fullWidth?: boolean;
    /** Shared long-press activation; uses the canonical press/gesture arena. */
    onLongPress?: (activation: PressActivation) => void;
    longPressDelay?: number;
    onPressChange?: (pressed: boolean) => void;
  }
>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    className = '',
    disabled = false,
    fullWidth = false,
    leading,
    loading = false,
    loadingLabel = 'Working',
    longPressDelay,
    onBlur,
    onLongPress,
    onClickCapture,
    onKeyDown,
    onKeyUp,
    onLostPointerCapture,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPressChange,
    size = 'md',
    tone = 'default',
    trailing,
    type = 'button',
    variant = 'ghost',
    ...props
  },
  ref,
) {
  const unavailable = disabled || loading;
  const { pressProps, pressed } = usePress({
    disabled: unavailable,
    keyboardActivation: 'native',
    longPressDelay,
    onLongPress,
    onPressChange,
  });

  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={[
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--tone-${tone}`,
        `ui-button--${size}`,
        fullWidth ? 'ui-button--full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={unavailable}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-pressed={pressed || undefined}
      data-oxs-cursor-role={loading ? 'progress' : disabled ? 'not-allowed' : 'pointer'}
      onClickCapture={composeMouseHandler(pressProps.onClickCapture, onClickCapture)}
      onKeyDown={composeKeyboardHandler(pressProps.onKeyDown, onKeyDown)}
      onKeyUp={composeKeyboardHandler(pressProps.onKeyUp, onKeyUp)}
      onPointerDown={composePointerHandler(pressProps.onPointerDown, onPointerDown)}
      onPointerMove={composePointerHandler(pressProps.onPointerMove, onPointerMove)}
      onPointerUp={composePointerHandler(pressProps.onPointerUp, onPointerUp)}
      onPointerCancel={composePointerHandler(pressProps.onPointerCancel, onPointerCancel)}
      onLostPointerCapture={composePointerHandler(
        pressProps.onLostPointerCapture,
        onLostPointerCapture,
      )}
      onBlur={(event) => {
        pressProps.onBlur?.(event);
        onBlur?.(event);
      }}
    >
      <span className="ui-button__content" aria-hidden={loading || undefined}>
        {leading ? (
          <span className="ui-button__slot" aria-hidden>
            {leading}
          </span>
        ) : null}
        <span className="ui-button__label">{children}</span>
        {trailing ? (
          <span className="ui-button__slot" aria-hidden>
            {trailing}
          </span>
        ) : null}
      </span>
      {loading ? (
        <span className="ui-button__loading" aria-hidden>
          <span className="ui-control-spinner" />
        </span>
      ) : null}
      {loading ? <span className="ui-visually-hidden">{loadingLabel}</span> : null}
    </button>
  );
});

export type ToggleButtonProps = Omit<ButtonProps, 'aria-pressed'> & {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
};

export const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(function ToggleButton(
  {
    defaultPressed = false,
    disabled = false,
    onClick,
    onPressedChange,
    pressed,
    ...props
  },
  ref,
) {
  const [current, setCurrent] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onValueChange: onPressedChange,
  });

  return (
    <Button
      {...props}
      ref={ref}
      disabled={disabled}
      aria-pressed={current}
      data-selected={current || undefined}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !disabled) setCurrent(!current);
      }}
    />
  );
});

function composePointerHandler(
  kernel: PointerEventHandler<HTMLElement> | undefined,
  consumer: PointerEventHandler<HTMLButtonElement> | undefined,
): PointerEventHandler<HTMLButtonElement> | undefined {
  if (!kernel) return consumer;
  if (!consumer) return (event) => kernel(event);
  return (event) => {
    kernel(event);
    if (!event.defaultPrevented) consumer(event);
  };
}


function composeKeyboardHandler(
  kernel: KeyboardEventHandler<HTMLElement> | undefined,
  consumer: KeyboardEventHandler<HTMLButtonElement> | undefined,
): KeyboardEventHandler<HTMLButtonElement> | undefined {
  if (!kernel) return consumer;
  if (!consumer) return (event) => kernel(event);
  return (event) => {
    kernel(event);
    if (!event.defaultPrevented) consumer(event);
  };
}

function composeMouseHandler(
  kernel: MouseEventHandler<HTMLElement> | undefined,
  consumer: MouseEventHandler<HTMLButtonElement> | undefined,
): MouseEventHandler<HTMLButtonElement> | undefined {
  if (!kernel) return consumer;
  if (!consumer) return (event) => kernel(event);
  return (event) => {
    kernel(event);
    if (!event.defaultPrevented) consumer(event);
  };
}
