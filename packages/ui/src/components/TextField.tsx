import type {
  ClipboardEvent,
  CompositionEvent,
  DragEvent,
  FocusEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  InputEvent as ReactInputEvent,
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
import { Button } from './Button';
import { FieldFrame, type FieldStateProps, useFieldIds } from './Field';
import { IconButton } from './IconButton';

type SharedTextFieldProps = Omit<FieldStateProps, 'leading' | 'trailing'> & {
  /** Logical-leading field content. Decorative unless leadingLabel is provided. */
  leading?: ReactNode;
  /** Logical-trailing field content. Interactive children keep their own semantics. */
  trailing?: ReactNode;
  /** Host-neutral text-purpose hint used by native inputMode and editing-session metadata. @default text */
  contentPurpose?: EditableContentPurpose;
  /** Observes value length, selection and composition state without exposing committed text. */
  onEditingStateChange?: (state: EditableTextState) => void;
  /** Bidi direction for editable text independently from surrounding field chrome. @default auto */
  textDirection?: 'auto' | 'ltr' | 'rtl';
};

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> &
  SharedTextFieldProps & {
    /** Forces password rendering and secure editing-session redaction/copy protection. @default false */
    secure?: boolean;
    /** Visible logical prefix associated with the control description. */
    prefix?: ReactNode;
    /** Visible logical suffix associated with the control description. */
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
    enterKeyHint,
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
    onDragStart,
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
  const resolvedType = resolvedSecure ? 'password' : (type ?? 'text');
  const resolvedInputMode = inputMode ?? inputModeForContentPurpose(contentPurpose);
  const editing = useEditableTextContract({
    inputRef: localRef,
    sessionId: ids.controlId,
    contentPurpose,
    secure: resolvedSecure,
    multiline: false,
    inputMode: resolvedInputMode,
    enterKeyHint,
    readOnly,
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
  const handleDragStart = (event: DragEvent<HTMLInputElement>) => {
    if (resolvedSecure) {
      event.preventDefault();
      return;
    }
    onDragStart?.(event);
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
        inputMode={resolvedInputMode}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? ids.errorId : undefined}
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
        onDragStart={handleDragStart}
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
  /** Accessible field label. @default Search */
  label?: ReactNode;
  /** Controlled search value; SearchField intentionally keeps search ownership explicit. */
  value: string;
  /** Receives committed search value changes and clear actions. */
  onValueChange: (value: string) => void;
  /** Accessible name for the clear action. @default Clear search */
  clearLabel?: string;
  /** Tab order for the clear action when a product intentionally removes it from sequential focus. @default 0 */
  clearTabIndex?: number;
  /** Declares that external suggestion results are available without making SearchField own a popup. @default false */
  suggestionsAvailable?: boolean;
  /** Accessible name for the external suggestions request action. @default Show suggestions */
  suggestionsLabel?: string;
  /** Requests caller-owned suggestions; ArrowDown and the action trigger this only outside composition. */
  onSuggestionsRequest?: () => void;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    clearLabel = 'Clear search',
    clearTabIndex = 0,
    disabled = false,
    label = 'Search',
    onCompositionEnd,
    onCompositionStart,
    onCompositionUpdate,
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
  const composingRef = useRef(false);
  const [composing, setComposing] = useState(false);

  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    assignRef(forwardedRef, node);
  };

  const clear = () => {
    if (composingRef.current || disabled || readOnly) return;
    onValueChange('');
    localRef.current?.focus({ preventScroll: true });
  };

  return (
    <TextField
      ref={setRef}
      {...props}
      type="search"
      contentPurpose="search"
      label={label}
      disabled={disabled}
      readOnly={readOnly}
      value={value}
      onChange={(event) => onValueChange(event.currentTarget.value)}
      onCompositionStart={(event) => {
        composingRef.current = true;
        setComposing(true);
        onCompositionStart?.(event);
      }}
      onCompositionUpdate={onCompositionUpdate}
      onCompositionEnd={(event) => {
        onCompositionEnd?.(event);
        composingRef.current = false;
        setComposing(false);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (
          !event.defaultPrevented &&
          !composingRef.current &&
          !event.nativeEvent.isComposing &&
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
                variant="quiet"
                onClick={clear}
                tabIndex={clearTabIndex}
                disabled={composing}
              />
            ) : null}
            {suggestionsAvailable && onSuggestionsRequest && !disabled ? (
              <Button
                size="sm"
                variant="quiet"
                onClick={onSuggestionsRequest}
                className="ui-search-field__suggestions"
                aria-label={suggestionsLabel}
                disabled={composing}
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
    /** Host-neutral text-purpose hint; password is intentionally unavailable for multiline controls. @default text */
    contentPurpose?: Exclude<EditableContentPurpose, 'password'>;
    /** Visible logical prefix associated with the control description. */
    prefix?: ReactNode;
    /** Visible logical suffix associated with the control description. */
    suffix?: ReactNode;
    /** Native logical resize policy. @default block */
    resize?: 'none' | 'block' | 'inline' | 'both';
    /** Shows non-live character guidance beside the support region. @default false */
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
    enterKeyHint,
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
  const resolvedInputMode = inputMode ?? inputModeForContentPurpose(contentPurpose);
  const editing = useEditableTextContract({
    inputRef: localRef,
    sessionId: ids.controlId,
    contentPurpose,
    secure: false,
    multiline: true,
    inputMode: resolvedInputMode,
    enterKeyHint,
    readOnly,
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
        inputMode={resolvedInputMode}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? true : undefined}
        aria-errormessage={error ? ids.errorId : undefined}
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
