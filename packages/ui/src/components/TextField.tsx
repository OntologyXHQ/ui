import type {
  ClipboardEvent,
  CompositionEvent,
  FocusEvent,
  InputHTMLAttributes,
  InputEvent as ReactInputEvent,
  KeyboardEvent,
  ReactNode,
  Ref,
  SyntheticEvent,
  TextareaHTMLAttributes,
} from 'react';
import { forwardRef, useRef, useState } from 'react';
import {
  type EditableContentPurpose,
  type EditableTextState,
  inputModeForContentPurpose,
  useEditableTextContract,
} from '../editing';
import { Icon, Row } from '../primitives';
import { Button, type ControlSize } from './Button';
import { FieldFrame, type FieldStateProps, useFieldIds } from './Field';
import { IconButton } from './IconButton';

type SharedTextFieldProps = Omit<FieldStateProps, 'leading' | 'trailing'> & {
  leading?: ReactNode;
  trailing?: ReactNode;
  contentPurpose?: EditableContentPurpose;
  onEditingStateChange?: (state: EditableTextState) => void;
  textDirection?: 'auto' | 'ltr' | 'rtl';
};

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> &
  SharedTextFieldProps & {
    secure?: boolean;
    prefix?: ReactNode;
    suffix?: ReactNode;
  };

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(value);
    return;
  }
  (ref as { current: T | null }).current = value;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  {
    'aria-describedby': ariaDescribedBy,
    className = '',
    contentPurpose = 'text',
    description,
    disabled = false,
    error,
    fieldSize = 'md',
    hideLabel = false,
    id,
    inputMode,
    label,
    leading,
    leadingLabel,
    onBlur,
    onCompositionEnd,
    onCompositionStart,
    onCompositionUpdate,
    onCopy,
    onCut,
    onEditingStateChange,
    onFocus,
    onInput,
    onKeyDown,
    onSelect,
    optionalLabel,
    prefix,
    readOnly = false,
    required = false,
    secure = false,
    suffix,
    supportingAction,
    textDirection = 'auto',
    trailing,
    type,
    ...inputProps
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLInputElement | null>(null);
  const ids = useFieldIds({ id, description, error, prefix, suffix, describedBy: ariaDescribedBy });
  const resolvedSecure = secure || contentPurpose === 'password' || type === 'password';
  const resolvedType = type ?? (resolvedSecure ? 'password' : 'text');
  const editing = useEditableTextContract({
    inputRef: localRef,
    sessionId: ids.controlId,
    contentPurpose,
    secure: resolvedSecure,
    onEditingStateChange,
  });

  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    assignRef(forwardedRef, node);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    editing.onFocus(event);
    onFocus?.(event);
  };
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    editing.onBlur(event);
    onBlur?.(event);
  };
  const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
    editing.onSelect(event);
    onSelect?.(event);
  };
  const handleInput = (event: ReactInputEvent<HTMLInputElement>) => {
    editing.onInput(event);
    onInput?.(event);
  };
  const handleCompositionStart = (event: CompositionEvent<HTMLInputElement>) => {
    editing.onCompositionStart(event);
    onCompositionStart?.(event);
  };
  const handleCompositionUpdate = (event: CompositionEvent<HTMLInputElement>) => {
    editing.onCompositionUpdate(event);
    onCompositionUpdate?.(event);
  };
  const handleCompositionEnd = (event: CompositionEvent<HTMLInputElement>) => {
    editing.onCompositionEnd(event);
    onCompositionEnd?.(event);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    editing.onKeyDown(event);
    onKeyDown?.(event);
  };

  const handleCopy = (event: ClipboardEvent<HTMLInputElement>) => {
    if (resolvedSecure) {
      event.preventDefault();
      return;
    }
    onCopy?.(event);
  };
  const handleCut = (event: ClipboardEvent<HTMLInputElement>) => {
    if (resolvedSecure) {
      event.preventDefault();
      return;
    }
    onCut?.(event);
  };

  return (
    <FieldFrame
      ids={ids}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      required={required}
      optionalLabel={optionalLabel}
      disabled={disabled}
      readOnly={readOnly}
      fieldSize={fieldSize}
      leading={leading}
      leadingLabel={leadingLabel}
      prefix={prefix}
      suffix={suffix}
      trailing={trailing}
      supportingAction={supportingAction}
      className={className}
    >
      <input
        ref={setRef}
        {...inputProps}
        id={ids.controlId}
        className="ui-field__input"
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        type={resolvedType}
        dir={textDirection}
        inputMode={inputMode ?? inputModeForContentPurpose(contentPurpose)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        data-oxs-cursor-role={disabled ? 'not-allowed' : 'text'}
        data-oxs-content-purpose={contentPurpose}
        data-oxs-secure={resolvedSecure ? 'true' : 'false'}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelect={handleSelect}
        onInput={handleInput}
        onCompositionStart={handleCompositionStart}
        onCompositionUpdate={handleCompositionUpdate}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        onCopy={handleCopy}
        onCut={handleCut}
      />
    </FieldFrame>
  );
});

export type SearchFieldProps = Omit<
  TextFieldProps,
  | 'type'
  | 'contentPurpose'
  | 'leading'
  | 'trailing'
  | 'value'
  | 'defaultValue'
  | 'onChange'
  | 'label'
> & {
  label?: ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  clearLabel?: string;
  clearTabIndex?: number;
  suggestionsAvailable?: boolean;
  suggestionsLabel?: string;
  onSuggestionsRequest?: () => void;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    clearLabel = 'Clear search',
    clearTabIndex = 0,
    disabled = false,
    label = 'Search',
    onKeyDown,
    onSuggestionsRequest,
    onValueChange,
    readOnly = false,
    suggestionsAvailable = false,
    suggestionsLabel = 'Show suggestions',
    value,
    ...props
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLInputElement | null>(null);

  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    assignRef(forwardedRef, node);
  };

  const clear = () => {
    onValueChange('');
    requestAnimationFrame(() => localRef.current?.focus());
  };

  return (
    <TextField
      ref={setRef}
      {...props}
      type="search"
      contentPurpose="search"
      role="searchbox"
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          suggestionsAvailable &&
          onSuggestionsRequest &&
          event.key === 'ArrowDown'
        ) {
          event.preventDefault();
          onSuggestionsRequest();
        }
      }}
      leading={<Icon name="search" size="sm" />}
      trailing={
        value || (suggestionsAvailable && onSuggestionsRequest) ? (
          <Row gap="3xs" align="center">
            {value && !disabled && !readOnly ? (
              <IconButton
                label={clearLabel}
                icon="close"
                size="sm"
                variant="ghost"
                onClick={clear}
                tabIndex={clearTabIndex}
              />
            ) : null}
            {suggestionsAvailable && onSuggestionsRequest && !disabled ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onSuggestionsRequest}
                className="ui-search-field__suggestions"
                aria-label={suggestionsLabel}
              >
                {suggestionsLabel}
              </Button>
            ) : null}
          </Row>
        ) : null
      }
    />
  );
});

export type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix'> &
  Omit<SharedTextFieldProps, 'contentPurpose'> & {
    contentPurpose?: Exclude<EditableContentPurpose, 'password'>;
    prefix?: ReactNode;
    suffix?: ReactNode;
    resize?: 'none' | 'block' | 'inline' | 'both';
    showCharacterCount?: boolean;
  };

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    'aria-describedby': ariaDescribedBy,
    className = '',
    contentPurpose = 'text',
    defaultValue,
    description,
    disabled = false,
    error,
    fieldSize = 'md',
    hideLabel = false,
    id,
    inputMode,
    label,
    leading,
    leadingLabel,
    maxLength,
    onBlur,
    onCompositionEnd,
    onCompositionStart,
    onCompositionUpdate,
    onEditingStateChange,
    onFocus,
    onInput,
    onKeyDown,
    onSelect,
    optionalLabel,
    prefix,
    readOnly = false,
    required = false,
    resize = 'block',
    rows = 4,
    showCharacterCount = false,
    suffix,
    supportingAction,
    textDirection = 'auto',
    trailing,
    value,
    ...textareaProps
  },
  forwardedRef,
) {
  const localRef = useRef<HTMLTextAreaElement | null>(null);
  const initialLength = String(value ?? defaultValue ?? '').length;
  const [valueLength, setValueLength] = useState(initialLength);
  const displayedValueLength = value !== undefined ? String(value).length : valueLength;
  const ids = useFieldIds({ id, description, error, prefix, suffix, describedBy: ariaDescribedBy });
  const editing = useEditableTextContract({
    inputRef: localRef,
    sessionId: ids.controlId,
    contentPurpose,
    secure: false,
    onEditingStateChange,
  });

  const setRef = (node: HTMLTextAreaElement | null) => {
    localRef.current = node;
    assignRef(forwardedRef, node);
  };

  return (
    <FieldFrame
      ids={ids}
      label={label}
      description={description}
      error={error}
      hideLabel={hideLabel}
      required={required}
      optionalLabel={optionalLabel}
      disabled={disabled}
      readOnly={readOnly}
      fieldSize={fieldSize}
      leading={leading}
      leadingLabel={leadingLabel}
      prefix={prefix}
      suffix={suffix}
      trailing={trailing}
      supportingAction={
        showCharacterCount ? (
          <Row gap="xs" align="center">
            <span className="ui-field__count">
              {displayedValueLength}
              {typeof maxLength === 'number' ? ` / ${maxLength}` : ''}
            </span>
            {supportingAction}
          </Row>
        ) : (
          supportingAction
        )
      }
      multiline
      className={className}
    >
      <textarea
        ref={setRef}
        {...textareaProps}
        id={ids.controlId}
        className="ui-field__input ui-field__textarea"
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        rows={rows}
        maxLength={maxLength}
        dir={textDirection}
        data-resize={resize}
        inputMode={inputMode ?? inputModeForContentPurpose(contentPurpose)}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        data-oxs-cursor-role={disabled ? 'not-allowed' : 'text'}
        data-oxs-content-purpose={contentPurpose}
        onFocus={(event) => {
          editing.onFocus(event);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          editing.onBlur(event);
          onBlur?.(event);
        }}
        onSelect={(event) => {
          editing.onSelect(event);
          onSelect?.(event);
        }}
        onInput={(event) => {
          setValueLength(event.currentTarget.value.length);
          editing.onInput(event);
          onInput?.(event);
        }}
        onCompositionStart={(event) => {
          editing.onCompositionStart(event);
          onCompositionStart?.(event);
        }}
        onCompositionUpdate={(event) => {
          editing.onCompositionUpdate(event);
          onCompositionUpdate?.(event);
        }}
        onCompositionEnd={(event) => {
          editing.onCompositionEnd(event);
          onCompositionEnd?.(event);
        }}
        onKeyDown={(event) => {
          editing.onKeyDown(event);
          onKeyDown?.(event);
        }}
        value={value}
        defaultValue={defaultValue}
      />
    </FieldFrame>
  );
});
