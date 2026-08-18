import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import type { IconName } from '../primitives';
import { Icon } from '../primitives';
import type { ButtonTone, ButtonVariant, ControlSize } from './Button';
import { Button } from './Button';
import { useControllableState } from './controlState';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'aria-pressed' | 'children' | 'type'
> & {
  label: string;
  icon: IconName;
  size?: ControlSize;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  loading?: boolean;
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  tooltip?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    className = '',
    defaultPressed,
    disabled = false,
    icon,
    label,
    loading = false,
    onClick,
    onPressedChange,
    pressed,
    size = 'md',
    title,
    tone = 'default',
    tooltip,
    variant = 'ghost',
    ...props
  },
  ref,
) {
  const toggle = pressed !== undefined || defaultPressed !== undefined || onPressedChange !== undefined;
  const [currentPressed, setCurrentPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed ?? false,
    onValueChange: onPressedChange,
  });

  return (
    <Button
      {...props}
      ref={ref}
      className={`ui-icon-button ${className}`.trim()}
      size={size}
      tone={tone}
      variant={variant}
      loading={loading}
      loadingLabel={label}
      disabled={disabled}
      aria-label={label}
      aria-pressed={toggle ? currentPressed : undefined}
      data-selected={toggle && currentPressed ? true : undefined}
      title={tooltip ?? title ?? label}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && toggle && !disabled && !loading) {
          setCurrentPressed(!currentPressed);
        }
      }}
    >
      <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} aria-hidden />
    </Button>
  );
});
