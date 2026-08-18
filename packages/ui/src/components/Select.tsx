import type { KeyboardEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useUiPortalHost, viewportLengthToPortalHost, viewportPointToPortalHost } from '../foundations/portal';
import { type FloatingAnchor, useFloatingPosition, useOverlayLifecycle } from '../interaction';
import { defineUiIcon, Icon } from '../primitives';
import { useControllableState } from './controlState';
import { FieldFrame, type FieldStateProps, useFieldIds } from './Field';

const selectChevron = defineUiIcon({ paths: ['m7 9 5 5 5-5'] });
const TYPEAHEAD_RESET_MS = 700;

export type SelectOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type SelectProps = Omit<FieldStateProps, 'leading' | 'trailing' | 'prefix' | 'suffix'> & {
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  name?: string;
  form?: string;
  className?: string;
  id?: string;
};

export function Select({
  options,
  value,
  defaultValue = '',
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  placeholder = 'Select an option',
  name,
  form,
  id,
  label,
  description,
  error,
  hideLabel = false,
  required = false,
  optionalLabel,
  disabled = false,
  readOnly = false,
  fieldSize = 'md',
  supportingAction,
  className = '',
}: SelectProps) {
  const portalHost = useUiPortalHost();
  const [currentValue, setCurrentValue] = useControllableState({ value, defaultValue, onValueChange });
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onValueChange: onOpenChange });
  const [activeValue, setActiveValue] = useState('');
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const typeaheadRef = useRef({ text: '', at: 0 });
  const ids = useFieldIds({ id, description, error });
  const listboxId = `${ids.controlId}-listbox`;
  const selected = useMemo(() => options.find((option) => option.value === currentValue) ?? null, [currentValue, options]);
  const enabled = useMemo(() => options.filter((option) => !option.disabled), [options]);
  const activeOpen = isOpen && portalHost !== null;
  const anchor: FloatingAnchor = { kind: 'element', ref: triggerRef };
  const { position } = useFloatingPosition({
    open: activeOpen,
    anchor,
    surfaceRef: listRef,
    placement: 'bottom-start',
    gap: 6,
    viewportMargin: 8,
  });
  const overlay = useOverlayLifecycle({
    open: activeOpen,
    surfaceRef: listRef,
    anchorRef: triggerRef,
    onDismiss: () => setOpen(false),
    modal: false,
    autoFocus: false,
    escape: true,
    outsidePress: true,
    restoreFocus: false,
    lockScroll: false,
  });

  useEffect(() => {
    if (!activeOpen) return;
    const preferred = enabled.some((option) => option.value === currentValue)
      ? currentValue
      : enabled[0]?.value ?? '';
    setActiveValue(preferred);
  }, [activeOpen, currentValue, enabled]);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const local = portalHost
      ? viewportPointToPortalHost(portalHost, { x: position.x, y: position.y })
      : { x: position.x, y: position.y };
    list.style.setProperty('--oxs-select-x', `${local.x}px`);
    list.style.setProperty('--oxs-select-y', `${local.y}px`);
    list.style.setProperty('--oxs-overlay-depth', String(overlay.depth));
    const triggerWidth = triggerRef.current?.getBoundingClientRect().width ?? 0;
    if (triggerWidth > 0) {
      const localWidth = portalHost
        ? viewportLengthToPortalHost(portalHost, triggerWidth, 'inline')
        : triggerWidth;
      list.style.setProperty('--oxs-select-trigger-width', `${localWidth}px`);
    }
  }, [overlay.depth, portalHost, position.x, position.y]);

  const selectValue = (next: string) => {
    if (readOnly || disabled) return;
    setCurrentValue(next);
    setActiveValue(next);
    setOpen(false);
  };

  const moveActive = (delta: number) => {
    if (!enabled.length) return;
    const index = Math.max(0, enabled.findIndex((option) => option.value === activeValue));
    const next = (index + delta + enabled.length) % enabled.length;
    setActiveValue(enabled[next]?.value ?? '');
  };

  const applyTypeahead = (key: string, choose: boolean) => {
    if (key.length !== 1 || /\s/.test(key) || !enabled.length) return false;
    const normalizedKey = key.normalize('NFKC').toLocaleLowerCase();
    const now = Date.now();
    const previous = now - typeaheadRef.current.at > TYPEAHEAD_RESET_MS ? '' : typeaheadRef.current.text;
    const repeated = previous.length > 0 && [...previous].every((character) => character === normalizedKey);
    const text = repeated ? normalizedKey : `${previous}${normalizedKey}`;
    typeaheadRef.current = { text, at: now };
    const matches = enabled.filter((option) => normalizeTypeahead(option.label).startsWith(text));
    if (!matches.length) return false;
    let candidate = matches[0];
    if (repeated && matches.length > 1) {
      const from = matches.findIndex((option) => option.value === (activeValue || currentValue));
      candidate = matches[(from + 1 + matches.length) % matches.length] ?? matches[0];
    }
    setActiveValue(candidate.value);
    if (choose) setCurrentValue(candidate.value);
    return true;
  };

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || readOnly) return;
    if (event.key === 'Tab') {
      if (activeOpen) setOpen(false);
      return;
    }
    if (event.key === 'Escape' && activeOpen) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!activeOpen) {
        setOpen(true);
        const preferred = enabled.some((option) => option.value === currentValue) ? currentValue : enabled[0]?.value ?? '';
        setActiveValue(preferred);
      } else {
        moveActive(event.key === 'ArrowDown' ? 1 : -1);
      }
      return;
    }
    if (activeOpen && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveValue(event.key === 'Home' ? enabled[0]?.value ?? '' : enabled.at(-1)?.value ?? '');
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activeOpen && activeValue) selectValue(activeValue);
      else setOpen(true);
      return;
    }
    if (applyTypeahead(event.key, !activeOpen)) event.preventDefault();
  };

  const listbox = activeOpen && portalHost ? createPortal(
    <div
      ref={listRef}
      id={listboxId}
      className="ui-select-listbox"
      role="listbox"
      aria-labelledby={ids.labelId}
      data-placement={position.placement}
      data-ready={position.ready}
      data-oxs-overlay-depth={overlay.depth}
    >
      {options.map((option) => {
        const optionId = selectOptionId(ids.controlId, option.value);
        return (
          <div
            key={option.value}
            id={optionId}
            role="option"
            aria-selected={option.value === currentValue}
            aria-disabled={option.disabled || undefined}
            data-value={option.value}
            data-active={option.value === activeValue || undefined}
            className="ui-select-option"
            data-oxs-cursor-role={option.disabled ? 'not-allowed' : 'pointer'}
            onPointerDown={(event) => event.preventDefault()}
            onPointerMove={() => {
              if (!option.disabled) setActiveValue(option.value);
            }}
            onClick={() => {
              if (!option.disabled) selectValue(option.value);
            }}
          >
            <span className="ui-select-option__copy">
              <span className="ui-select-option__label">{option.label}</span>
              {option.description ? <span className="ui-select-option__description">{option.description}</span> : null}
            </span>
            {option.value === currentValue ? <Icon name="check" size="sm" /> : null}
          </div>
        );
      })}
    </div>,
    portalHost,
  ) : null;

  return (
    <>
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
        supportingAction={supportingAction}
        className={`ui-select-field ${className}`.trim()}
      >
        <button
          ref={triggerRef}
          id={ids.controlId}
          type="button"
          role="combobox"
          className="ui-select-trigger"
          disabled={disabled}
          aria-labelledby={ids.labelId}
          aria-describedby={ids.describedBy}
          aria-invalid={error ? true : undefined}
          aria-haspopup="listbox"
          aria-expanded={activeOpen}
          aria-controls={activeOpen ? listboxId : undefined}
          aria-activedescendant={activeOpen && activeValue ? selectOptionId(ids.controlId, activeValue) : undefined}
          aria-readonly={readOnly || undefined}
          aria-required={required || undefined}
          data-placeholder={!selected || undefined}
          data-oxs-cursor-role={disabled ? 'not-allowed' : readOnly ? 'default' : 'pointer'}
          onClick={() => {
            if (!readOnly) setOpen((current) => !current);
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="ui-select-trigger__value">{selected?.label ?? placeholder}</span>
          <Icon glyph={selectChevron} size="sm" />
        </button>
      </FieldFrame>
      {name || required ? (
        <select
          className="ui-select-native-proxy"
          name={name}
          form={form}
          value={currentValue}
          disabled={disabled}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
          onInvalid={() => triggerRef.current?.focus({ preventScroll: true })}
        >
          <option value="" />
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
          ))}
        </select>
      ) : null}
      {listbox}
    </>
  );
}

function normalizeTypeahead(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase();
}

function selectOptionId(controlId: string, value: string) {
  return `${controlId}-option-${safeDomId(value)}`;
}

function safeDomId(value: string) {
  return encodeURIComponent(value);
}
