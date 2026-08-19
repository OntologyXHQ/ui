import type { ButtonHTMLAttributes } from 'react';
import { forwardRef, useId } from 'react';
import type { IconName } from '../primitives';
import { Icon } from '../primitives';
import type { ButtonIntent, ButtonVariant, ControlSize } from './Button';
import { Button } from './Button';
import { useControllableState } from './controlState';

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'aria-pressed' | 'children' | 'type'> & {
  /** Accessible action name; IconButton never infers semantics from the glyph. */
  label: string;
  /** Canonical built-in glyph name rendered decoratively inside the labeled button. */
  icon: IconName;
  /** Shared control height/target scale. @default md */
  size?: ControlSize;
  /** Action emphasis shared with Button. @default quiet */
  variant?: ButtonVariant;
  /** Semantic risk intent shared with Button. @default neutral */
  intent?: ButtonIntent;
  /** Pending action state; disables activation and reuses the OX loading mark. @default false */
  loading?: boolean;
  /** Controlled toggle state. Omit all pressed props for ordinary momentary actions. */
  pressed?: boolean;
  /** Initial uncontrolled toggle state. */
  defaultPressed?: boolean;
  /** Toggle-state callback used only when the IconButton is configured as a toggle. */
  onPressedChange?: (pressed: boolean) => void;
  /** Supplemental tooltip/description text linked through aria-describedby and native title. */
  tooltip?: string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    'aria-describedby': describedBy,
    className = '',
    defaultPressed,
    disabled = false,
    icon,
    intent = 'neutral',
    label,
    loading = false,
    onClick,
    onPressedChange,
    pressed,
    size = 'md',
    title,
    tooltip,
    variant = 'quiet',
    ...props
  },
  ref,
) {
  const tooltipId = useId().replace(/:/g, '');
  const toggle = pressed !== undefined || defaultPressed !== undefined || onPressedChange !== undefined;
  const [currentPressed, setCurrentPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed ?? false,
    onValueChange: onPressedChange,
  });
  const tooltipDescriptionId = tooltip ? `${tooltipId}-tooltip` : undefined;
  const combinedDescription = [describedBy, tooltipDescriptionId].filter(Boolean).join(' ') || undefined;

  return (
    <>
      <Button
        {...props}
        ref={ref}
        className={`ui-icon-button ${className}`.trim()}
        size={size}
        intent={intent}
        variant={variant}
        loading={loading}
        loadingLabel={label}
        disabled={disabled}
        aria-label={label}
        aria-describedby={combinedDescription}
        aria-pressed={toggle ? currentPressed : undefined}
        data-selected={toggle && currentPressed ? true : undefined}
        title={title ?? tooltip ?? label}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && toggle && !disabled && !loading) setCurrentPressed(!currentPressed);
        }}
      >
        <Icon name={icon} size={size === 'sm' ? 'sm' : 'md'} />
      </Button>
      {tooltip ? <span id={tooltipDescriptionId} role="tooltip" className="ui-visually-hidden">{tooltip}</span> : null}
    </>
  );
});
