import type {
  ButtonHTMLAttributes,
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  InputHTMLAttributes,
  PointerEventHandler,
  PropsWithChildren,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from 'react';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { resolveUiDirection, useUiEnvironment } from '../foundations';
import { usePanGesture } from '../gestures';
import { useRovingFocus } from '../interaction';
import type { IconName } from '../primitives';
import { Icon } from '../primitives';
import type { ControlSize } from './Button';
import { ToggleButton } from './Button';
import { useControllableState } from './controlState';

export type SelectionLabelProps = {
  /** Visible control label and accessible name source. */
  label: ReactNode;
  /** Optional supporting description associated with the control. */
  description?: ReactNode;
};

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'checked' | 'defaultChecked' | 'onChange' | 'size' | 'type'
> &
  SelectionLabelProps & {
    /** Controlled checked state. */
    checked?: boolean;
    /** Initial uncontrolled state and native form-reset target. @default false */
    defaultChecked?: boolean;
    /** Reports committed checked-state changes. */
    onCheckedChange?: (checked: boolean) => void;
    /** Exposes the native mixed state without inventing a third persisted value. @default false */
    indeterminate?: boolean;
    /** Prevents mutation while preserving focus/read semantics. @default false */
    readOnly?: boolean;
    /** Shared control target scale. @default md */
    size?: ControlSize;
  };

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    checked,
    className = '',
    defaultChecked = false,
    description,
    disabled = false,
    indeterminate = false,
    label,
    onCheckedChange,
    onClick,
    readOnly = false,
    size = 'md',
    ...props
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const controlId = `oxs-checkbox-${useId()}`;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const [current, setCurrent] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onValueChange: onCheckedChange,
  });

  useEffect(() => {
    if (localRef.current) localRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  useEffect(() => {
    const form = localRef.current?.form;
    if (!form || checked !== undefined) return;
    const reset = () => setCurrent(defaultChecked);
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [checked, defaultChecked, setCurrent]);

  return (
    <label
      className={`ui-choice ui-choice--${size} ${className}`.trim()}
      data-disabled={disabled || undefined}
      data-oxs-cursor-role={disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer'}
    >
      <input
        {...props}
        ref={(node) => {
          localRef.current = node;
          if (node) node.indeterminate = indeterminate;
          assignRef(forwardedRef, node);
        }}
        id={controlId}
        className="ui-choice__native"
        type="checkbox"
        checked={current}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        disabled={disabled}
        aria-checked={indeterminate ? 'mixed' : current}
        aria-readonly={readOnly || undefined}
        onClick={(event) => {
          if (readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={(event) => {
          if (!readOnly) setCurrent(event.currentTarget.checked);
          if (indeterminate) event.currentTarget.indeterminate = true;
        }}
      />
      <span className="ui-choice__indicator" aria-hidden>
        {indeterminate ? (
          <span className="ui-choice__mixed" />
        ) : current ? (
          <Icon name="check" size="sm" />
        ) : null}
      </span>
      <ChoiceCopy
        label={label}
        description={description}
        labelId={labelId}
        descriptionId={descriptionId}
      />
    </label>
  );
});

export type RadioGroupProps = PropsWithChildren<
  Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> & {
    /** Accessible name for the mutually-exclusive group. */
    label: string;
    /** Controlled selected value. */
    value?: string;
    /** Initial uncontrolled selected value and form-reset target. */
    defaultValue?: string;
    /** Reports committed selection changes. */
    onValueChange?: (value: string) => void;
    /** Native radio name shared by child Radio controls. */
    name?: string;
    /** Visual/group flow axis. @default vertical */
    orientation?: 'horizontal' | 'vertical';
    /** Disables every child Radio. @default false */
    disabled?: boolean;
    /** Prevents selection changes while preserving group readability. @default false */
    readOnly?: boolean;
  }
>;

type RadioContextValue = {
  value: string | undefined;
  setValue: (value: string) => void;
  name: string;
  disabled: boolean;
  readOnly: boolean;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioGroup({
  children,
  className = '',
  defaultValue,
  disabled = false,
  label,
  name,
  onKeyDown,
  onValueChange,
  orientation = 'vertical',
  readOnly = false,
  value,
  ...props
}: RadioGroupProps) {
  const generatedName = useId();
  const groupRef = useRef<HTMLDivElement | null>(null);
  const [current, setCurrent] = useControllableState<string>({
    value,
    defaultValue: defaultValue ?? '',
    onValueChange,
  });
  useEffect(() => {
    if (value !== undefined) return;
    const form =
      groupRef.current?.querySelector<HTMLInputElement>('input[type="radio"]')?.form ??
      groupRef.current?.closest('form');
    if (!form) return;
    const reset = () => setCurrent(defaultValue ?? '');
    form.addEventListener('reset', reset);
    return () => form.removeEventListener('reset', reset);
  }, [defaultValue, setCurrent, value]);

  const context = useMemo<RadioContextValue>(
    () => ({
      value: current,
      setValue: setCurrent,
      name: name ?? generatedName,
      disabled,
      readOnly,
    }),
    [current, disabled, generatedName, name, readOnly, setCurrent],
  );

  return (
    <RadioContext.Provider value={context}>
      <div
        {...props}
        ref={groupRef}
        className={`ui-radio-group ui-radio-group--${orientation} ${className}`.trim()}
        role="radiogroup"
        aria-label={label}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </RadioContext.Provider>
  );
}

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'checked' | 'defaultChecked' | 'name' | 'onChange' | 'size' | 'type' | 'value'
> &
  SelectionLabelProps & {
    /** Stable native radio value owned by the surrounding RadioGroup. */
    value: string;
    /** Shared control target scale. @default md */
    size?: ControlSize;
  };

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
  { className = '', description, disabled = false, label, onClick, size = 'md', value, ...props },
  ref,
) {
  const group = useContext(RadioContext);
  if (!group) throw new Error('Radio must render inside RadioGroup.');
  const unavailable = disabled || group.disabled;
  const checked = group.value === value;
  const controlId = `oxs-radio-${useId()}`;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;

  return (
    <label
      className={`ui-choice ui-choice--radio ui-choice--${size} ${className}`.trim()}
      data-disabled={unavailable || undefined}
      data-oxs-cursor-role={unavailable ? 'not-allowed' : group.readOnly ? 'default' : 'pointer'}
    >
      <input
        {...props}
        ref={ref}
        id={controlId}
        className="ui-choice__native"
        type="radio"
        name={group.name}
        value={value}
        checked={checked}
        disabled={unavailable}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(event) => {
          if (group.readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onChange={() => {
          if (!group.readOnly && !unavailable) group.setValue(value);
        }}
      />
      <span className="ui-choice__indicator" aria-hidden>
        <span className="ui-choice__radio-dot" />
      </span>
      <ChoiceCopy
        label={label}
        description={description}
        labelId={labelId}
        descriptionId={descriptionId}
      />
    </label>
  );
});

export type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-checked' | 'children' | 'onChange' | 'role' | 'type'
> &
  SelectionLabelProps & {
    /** Controlled on/off state. */
    checked?: boolean;
    /** Initial uncontrolled on/off state. @default false */
    defaultChecked?: boolean;
    /** Reports committed switch-state changes. */
    onCheckedChange?: (checked: boolean) => void;
    /** Prevents tap/drag mutation while preserving switch semantics. @default false */
    readOnly?: boolean;
    /** Shared control target scale. @default md */
    size?: ControlSize;
  };

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    checked,
    className = '',
    defaultChecked = false,
    description,
    disabled = false,
    label,
    onCheckedChange,
    onClick,
    onLostPointerCapture,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    readOnly = false,
    size = 'md',
    ...props
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLButtonElement | null>(null);
  const draggedRef = useRef(false);
  const controlId = `oxs-switch-${useId()}`;
  const labelId = `${controlId}-label`;
  const descriptionId = `${controlId}-description`;
  const { direction } = useUiEnvironment();
  const [current, setCurrent] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onValueChange: onCheckedChange,
  });
  const pan = usePanGesture({
    axis: 'x',
    disabled: disabled || readOnly,
    threshold: 4,
    onBegin: () => {
      draggedRef.current = true;
    },
    onEnd: (sample) => {
      const resolved = resolveUiDirection(direction, localRef.current);
      const logicalTranslation = resolved === 'rtl' ? -sample.translation.x : sample.translation.x;
      setCurrent(logicalTranslation >= 0);
      localRef.current?.ownerDocument.defaultView?.setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    },
    onCancel: () => {
      draggedRef.current = false;
    },
  });

  return (
    <div
      className={`ui-switch-row ui-switch-row--${size} ${className}`.trim()}
      data-disabled={disabled || undefined}
    >
      <button
        {...props}
        ref={(node) => {
          localRef.current = node;
          assignRef(forwardedRef, node);
        }}
        id={controlId}
        type="button"
        className="ui-switch"
        role="switch"
        aria-checked={current}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        data-checked={current || undefined}
        data-oxs-cursor-role={disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer'}
        onPointerDown={composeGesturePointerHandler(onPointerDown, pan.gestureProps.onPointerDown)}
        onPointerMove={composeGesturePointerHandler(onPointerMove, pan.gestureProps.onPointerMove)}
        onPointerUp={composeGesturePointerHandler(onPointerUp, pan.gestureProps.onPointerUp)}
        onPointerCancel={composeGesturePointerHandler(
          onPointerCancel,
          pan.gestureProps.onPointerCancel,
        )}
        onLostPointerCapture={composeGesturePointerHandler(
          onLostPointerCapture,
          pan.gestureProps.onLostPointerCapture,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented && !readOnly && !draggedRef.current) setCurrent(!current);
          draggedRef.current = false;
        }}
      >
        <span className="ui-switch__track" aria-hidden>
          <span className="ui-switch__thumb" />
        </span>
      </button>
      <label
        htmlFor={controlId}
        className="ui-choice__copy ui-switch__copy"
        data-oxs-cursor-role={disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer'}
      >
        <span id={labelId} className="ui-choice__label">
          {label}
        </span>
        {description ? (
          <span id={descriptionId} className="ui-choice__description">
            {description}
          </span>
        ) : null}
      </label>
    </div>
  );
});

export type SliderMark = {
  value: number;
  label?: ReactNode;
};

export type SliderProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  /** Accessible and visible label for the slider value control. */
  label: string;
  /** Controlled value; caller remains authoritative when supplied. */
  value?: number;
  /** Initial uncontrolled value used only when no controlled value is supplied. */
  defaultValue?: number;
  /** Reports committed value changes to controlled or observing callers. */
  onValueChange?: (value: number) => void;
  /** Lower value bound used for semantic range presentation. */
  min?: number;
  /** Upper bound used for native slider range semantics. */
  max?: number;
  /** Positive increment used for keyboard and pointer value normalization. */
  step?: number;
  /** Logical control orientation exposed through native ARIA semantics. */
  orientation?: 'horizontal' | 'vertical';
  /** Disables interaction while retaining visible semantic structure. */
  disabled?: boolean;
  /** Prevents mutation while retaining focusable/readable range semantics. */
  readOnly?: boolean;
  /** Optional semantic/reference marks rendered along the slider track. */
  marks?: readonly SliderMark[];
  /** Formats visible value text while preserving numeric slider semantics. */
  formatValue?: (value: number) => string;
};

export const Slider = forwardRef<HTMLDivElement, SliderProps>(function Slider(
  {
    className = '',
    defaultValue,
    disabled = false,
    formatValue = (value) => String(value),
    label,
    marks = [],
    max = 100,
    min = 0,
    onClick,
    onKeyDown,
    onPointerCancel,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onLostPointerCapture,
    onValueChange,
    orientation = 'horizontal',
    readOnly = false,
    step = 1,
    style,
    value,
    ...props
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const { direction } = useUiEnvironment();
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const safeStep = step > 0 ? step : 1;
  const [current, setCurrent] = useControllableState({
    value: value === undefined ? undefined : normalizeSliderValue(value, lower, upper, safeStep),
    defaultValue: normalizeSliderValue(defaultValue ?? lower, lower, upper, safeStep),
    onValueChange,
  });
  const progress = upper === lower ? 0 : ((current - lower) / (upper - lower)) * 100;

  const setFromPoint = (x: number, y: number) => {
    const node = localRef.current;
    if (!node || disabled || readOnly) return;
    const rect = node.getBoundingClientRect();
    let ratio: number;
    if (orientation === 'vertical') {
      ratio = 1 - (y - rect.top) / Math.max(1, rect.height);
    } else {
      ratio = (x - rect.left) / Math.max(1, rect.width);
      if (resolveUiDirection(direction, node) === 'rtl') ratio = 1 - ratio;
    }
    setCurrent(
      normalizeSliderValue(lower + clamp01(ratio) * (upper - lower), lower, upper, safeStep),
    );
  };

  const pan = usePanGesture({
    axis: orientation === 'horizontal' ? 'x' : 'y',
    disabled: disabled || readOnly,
    threshold: 0,
    onBegin: (sample) => setFromPoint(sample.position.x, sample.position.y),
    onUpdate: (sample) => setFromPoint(sample.position.x, sample.position.y),
  });

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || disabled || readOnly) return;
    const resolved = resolveUiDirection(direction, localRef.current);
    const pageStep = Math.max(safeStep, (upper - lower) / 10);
    let next: number | null = null;
    if (event.key === 'Home') next = lower;
    else if (event.key === 'End') next = upper;
    else if (event.key === 'PageUp') next = current + pageStep;
    else if (event.key === 'PageDown') next = current - pageStep;
    else if (event.key === 'ArrowUp') next = current + safeStep;
    else if (event.key === 'ArrowDown') next = current - safeStep;
    else if (event.key === 'ArrowRight')
      next = current + (resolved === 'rtl' ? -safeStep : safeStep);
    else if (event.key === 'ArrowLeft')
      next = current + (resolved === 'rtl' ? safeStep : -safeStep);

    if (next !== null) {
      event.preventDefault();
      setCurrent(normalizeSliderValue(next, lower, upper, safeStep));
    }
  };

  const gestureProps = pan.gestureProps;
  const composePointer = (
    consumer: PointerEventHandler<HTMLElement> | undefined,
    gesture: PointerEventHandler<HTMLElement> | undefined,
    respectCancellation = true,
  ): PointerEventHandler<HTMLDivElement> | undefined =>
    consumer || gesture
      ? (event) => {
          consumer?.(event);
          if (!respectCancellation || !event.defaultPrevented) gesture?.(event);
        }
      : undefined;

  return (
    <div className={`ui-slider-field ui-slider-field--${orientation} ${className}`.trim()}>
      <div className="ui-slider-field__header">
        <span className="ui-slider-field__label">{label}</span>
        <span className="ui-slider-field__value">{formatValue(current)}</span>
      </div>
      <div
        {...props}
        ref={(node) => {
          localRef.current = node;
          assignRef(forwardedRef, node);
        }}
        className="ui-slider"
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={lower}
        aria-valuemax={upper}
        aria-valuenow={current}
        aria-valuetext={formatValue(current)}
        aria-orientation={orientation}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        data-oxs-cursor-role={disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer'}
        style={{ ...style, '--ui-slider-progress': `${progress}%` } as CSSProperties}
        onPointerDown={composePointer(
          onPointerDown,
          gestureProps.onPointerDown as PointerEventHandler<HTMLElement>,
        )}
        onPointerMove={composePointer(
          onPointerMove,
          gestureProps.onPointerMove as PointerEventHandler<HTMLElement>,
        )}
        onPointerUp={composePointer(
          onPointerUp,
          gestureProps.onPointerUp as PointerEventHandler<HTMLElement>,
          false,
        )}
        onPointerCancel={composePointer(
          onPointerCancel,
          gestureProps.onPointerCancel as PointerEventHandler<HTMLElement>,
          false,
        )}
        onLostPointerCapture={composePointer(
          onLostPointerCapture,
          gestureProps.onLostPointerCapture as PointerEventHandler<HTMLElement>,
          false,
        )}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) setFromPoint(event.clientX, event.clientY);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="ui-slider__track" aria-hidden>
          <span className="ui-slider__fill" />
          {marks.map((mark) => {
            const markProgress =
              upper === lower ? 0 : clamp01((mark.value - lower) / (upper - lower)) * 100;
            return (
              <span
                key={mark.value}
                className="ui-slider__mark"
                style={{ '--ui-slider-mark': `${markProgress}%` } as CSSProperties}
              />
            );
          })}
          <span className="ui-slider__thumb" />
        </span>
      </div>
      {marks.some((mark) => mark.label !== undefined) ? (
        <div className="ui-slider__labels" aria-hidden>
          {marks.map((mark) => (
            <span
              key={mark.value}
              style={
                {
                  '--ui-slider-mark': `${upper === lower ? 0 : clamp01((mark.value - lower) / (upper - lower)) * 100}%`,
                } as CSSProperties
              }
            >
              {mark.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
});

export type ToggleOption = {
  /** Stable option identity. */
  value: string;
  /** Visible option label. */
  label: ReactNode;
  /** Optional decorative icon name. */
  icon?: IconName;
  /** Keeps the option visible but removes mutation/focus. */
  disabled?: boolean;
};

export type SegmentedControlProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'defaultValue' | 'onChange'
> & {
  /** Accessible name for the single-selection segment group. */
  label: string;
  /** Ordered peer modes/options. */
  options: readonly ToggleOption[];
  /** Controlled selected value. Invalid/disabled values recover visually to the first enabled option. */
  value?: string;
  /** Initial uncontrolled selected value. */
  defaultValue?: string;
  /** Reports committed single-selection changes. */
  onValueChange?: (value: string) => void;
  /** Shared control target scale. @default md */
  size?: ControlSize;
  /** Disables every segment. @default false */
  disabled?: boolean;
  /** Expands segments evenly across the available inline size. @default false */
  fullWidth?: boolean;
};

export function SegmentedControl({
  className = '',
  defaultValue,
  disabled = false,
  fullWidth = false,
  label,
  onValueChange,
  options,
  size = 'md',
  value,
  ...props
}: SegmentedControlProps) {
  const firstEnabled = options.find((option) => !option.disabled)?.value ?? '';
  const fallback = defaultValue ?? firstEnabled;
  const [current, setCurrent] = useControllableState({
    value,
    defaultValue: fallback,
    onValueChange,
  });
  const selectedValue = options.some((option) => option.value === current && !option.disabled)
    ? current
    : firstEnabled;
  const [focusValue, setFocusValue] = useState(selectedValue);
  const rovingValue = options.some((option) => option.value === focusValue && !option.disabled)
    ? focusValue
    : selectedValue;
  const groupRef = useRef<HTMLDivElement | null>(null);
  const moveFocus = useRovingFocus({
    containerRef: groupRef,
    itemSelector: '[data-ui-segment]:not(:disabled)',
    orientation: 'horizontal',
  });

  return (
    <div
      {...props}
      ref={groupRef}
      className={`ui-segmented ${fullWidth ? 'ui-segmented--full' : ''} ${className}`.trim()}
      role="radiogroup"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={(event) => {
        moveFocus(event);
        props.onKeyDown?.(event);
      }}
    >
      {options.map((option) => {
        const selected = option.value === selectedValue;
        return (
          // biome-ignore lint/a11y/useSemanticElements: SegmentedControl is an ARIA radio composite, not a native form radio group.
          <button
            key={option.value}
            type="button"
            role="radio"
            data-ui-segment
            aria-checked={selected}
            tabIndex={option.value === rovingValue ? 0 : -1}
            disabled={disabled || option.disabled}
            className={`ui-segmented__item ui-segmented__item--${size}`}
            data-oxs-cursor-role={disabled || option.disabled ? 'not-allowed' : 'pointer'}
            onFocus={() => {
              if (disabled || option.disabled) return;
              setFocusValue(option.value);
              setCurrent(option.value);
            }}
            onClick={() => {
              if (disabled || option.disabled) return;
              setFocusValue(option.value);
              setCurrent(option.value);
            }}
          >
            {option.icon ? <Icon name={option.icon} size="sm" /> : null}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type ToggleGroupProps = Omit<HTMLAttributes<HTMLDivElement>, 'defaultValue' | 'onChange'> & {
  /** Accessible name for the independent-toggle cluster. */
  label: string;
  /** Ordered independent toggle options. */
  options: readonly ToggleOption[];
  /** Controlled pressed-value set; unknown/disabled values are ignored visually. */
  value?: readonly string[];
  /** Initial uncontrolled pressed-value set. */
  defaultValue?: readonly string[];
  /** Reports immutable normalized pressed-value arrays. */
  onValueChange?: (value: readonly string[]) => void;
  /** Shared Button-family control scale. @default md */
  size?: ControlSize;
  /** Disables every toggle member. @default false */
  disabled?: boolean;
};

export function ToggleGroup({
  className = '',
  defaultValue = [],
  disabled = false,
  label,
  onValueChange,
  options,
  size = 'md',
  value,
  ...props
}: ToggleGroupProps) {
  const [current, setCurrent] = useControllableState<readonly string[]>({
    value,
    defaultValue,
    onValueChange,
  });
  const enabledValues = options.filter((option) => !option.disabled).map((option) => option.value);
  const visibleCurrent = [...new Set(current)].filter((candidate) =>
    enabledValues.includes(candidate),
  );
  const firstEnabled = enabledValues[0] ?? '';
  const [focusValue, setFocusValue] = useState(firstEnabled);
  const rovingValue = options.some((option) => option.value === focusValue && !option.disabled)
    ? focusValue
    : firstEnabled;
  const groupRef = useRef<HTMLDivElement | null>(null);
  const moveFocus = useRovingFocus({
    containerRef: groupRef,
    itemSelector: '[data-ui-toggle-group-item]:not(:disabled)',
    orientation: 'horizontal',
  });

  return (
    // biome-ignore lint/a11y/useSemanticElements: ToggleGroup groups independent toggle buttons; fieldset would imply native form controls.
    <div
      {...props}
      ref={groupRef}
      className={`ui-toggle-group ${className}`.trim()}
      role="group"
      aria-label={label}
      aria-disabled={disabled || undefined}
      onKeyDown={(event) => {
        moveFocus(event);
        props.onKeyDown?.(event);
      }}
    >
      {options.map((option) => {
        const pressed = visibleCurrent.includes(option.value);
        return (
          <ToggleButton
            key={option.value}
            data-ui-toggle-group-item
            size={size}
            tabIndex={option.value === rovingValue ? 0 : -1}
            pressed={pressed}
            disabled={disabled || option.disabled}
            leading={option.icon ? <Icon name={option.icon} size="sm" /> : undefined}
            onFocus={() => setFocusValue(option.value)}
            onPressedChange={(next) => {
              setCurrent(
                next
                  ? [...visibleCurrent, option.value]
                  : visibleCurrent.filter((candidate) => candidate !== option.value),
              );
            }}
          >
            {option.label}
          </ToggleButton>
        );
      })}
    </div>
  );
}

function ChoiceCopy({
  label,
  description,
  labelId,
  descriptionId,
}: SelectionLabelProps & { labelId?: string; descriptionId?: string }) {
  return (
    <span className="ui-choice__copy">
      <span id={labelId} className="ui-choice__label">
        {label}
      </span>
      {description ? (
        <span id={descriptionId} className="ui-choice__description">
          {description}
        </span>
      ) : null}
    </span>
  );
}

function assignRef<T>(ref: ForwardedRef<T>, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function composeGesturePointerHandler(
  consumer: PointerEventHandler<HTMLButtonElement> | undefined,
  kernel: PointerEventHandler<HTMLElement> | undefined,
): PointerEventHandler<HTMLButtonElement> | undefined {
  if (!consumer && !kernel) return undefined;
  return (event) => {
    consumer?.(event);
    if (!event.defaultPrevented) kernel?.(event);
  };
}

function normalizeSliderValue(value: number, min: number, max: number, step: number) {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  const clamped = Math.min(upper, Math.max(lower, value));
  const safeStep = step > 0 ? step : 1;
  const steps = Math.round((clamped - lower) / safeStep);
  const normalized = lower + steps * safeStep;
  const precision = decimalPlaces(safeStep);
  return Number(Math.min(upper, Math.max(lower, normalized)).toFixed(precision));
}

function decimalPlaces(value: number) {
  const text = String(value);
  const index = text.indexOf('.');
  return index < 0 ? 0 : text.length - index - 1;
}
