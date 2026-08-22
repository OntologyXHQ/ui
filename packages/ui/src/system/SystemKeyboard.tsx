import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button } from '../components';
import { SystemSurface } from './SystemScaffold';

export type SystemKeyboardLanguage = 'en' | 'fa';
export type SystemKeyboardLayoutMode = 'letters' | 'symbols' | 'numeric';
export type SystemKeyboardContentPurpose =
  | 'text'
  | 'password'
  | 'numeric'
  | 'email'
  | 'url'
  | 'search';
export type SystemKeyboardShiftState = 'off' | 'once' | 'caps';
export type SystemKeyboardKeyKind =
  | 'character'
  | 'modifier'
  | 'action'
  | 'navigation'
  | 'symbol'
  | 'numeric'
  | 'language';
export type SystemKeyboardAction =
  | 'shift'
  | 'symbols'
  | 'backspace'
  | 'enter'
  | 'space'
  | 'move-start'
  | 'move-end'
  | 'switch-language';

export type SystemKeyboardKeyModel = {
  id: string;
  kind: SystemKeyboardKeyKind;
  label: string;
  ariaLabel?: string;
  value?: string;
  action?: SystemKeyboardAction;
  alternates?: readonly string[];
  repeatable?: boolean;
};

export type SystemKeyboardLayoutModel = {
  id: string;
  language: SystemKeyboardLanguage | 'neutral';
  direction: 'ltr' | 'rtl';
  mode: SystemKeyboardLayoutMode;
  rows: readonly (readonly SystemKeyboardKeyModel[])[];
};

/** Compositor/native-owned surface/session inputs. React never discovers focus or physical keyboards itself. */
export type SystemKeyboardSurfaceState = {
  surfaceId: string;
  sessionId: string | null;
  visible: boolean;
  language: SystemKeyboardLanguage;
  layout: SystemKeyboardLayoutMode;
  contentPurpose: SystemKeyboardContentPurpose;
  secure: boolean;
};

export type SystemKeyboardCommand =
  | {
      type: 'insert-text';
      surfaceId: string;
      sessionId: string;
      keyId: string;
      text: string;
      repeat?: boolean;
    }
  | { type: 'backspace'; surfaceId: string; sessionId: string; keyId: string; repeat?: boolean }
  | { type: 'enter'; surfaceId: string; sessionId: string; keyId: string }
  | {
      type: 'move';
      surfaceId: string;
      sessionId: string;
      keyId: string;
      direction: 'start' | 'end';
      repeat?: boolean;
    }
  | {
      type: 'request-layout';
      surfaceId: string;
      sessionId: string;
      keyId: string;
      layout: SystemKeyboardLayoutMode;
    }
  | {
      type: 'request-language';
      surfaceId: string;
      sessionId: string;
      keyId: string;
      language: SystemKeyboardLanguage;
    }
  | {
      type: 'modifier';
      surfaceId: string;
      sessionId: string;
      keyId: string;
      shift: SystemKeyboardShiftState;
    };

type SystemKeyboardCommandPayload = SystemKeyboardCommand extends infer Command
  ? Command extends SystemKeyboardCommand
    ? Omit<Command, 'surfaceId' | 'sessionId'>
    : never
  : never;

export type SystemKeyboardHostProps = {
  /** Caller-owned privileged keyboard surface/session state from the native text-input boundary. */
  state: SystemKeyboardSurfaceState;
  /** Emits typed keyboard commands to the host-owned text-input/IME authority. */
  onCommand: (command: SystemKeyboardCommand) => void;
  /** Languages the host currently exposes for keyboard switching. */
  availableLanguages?: readonly SystemKeyboardLanguage[];
  /** Accessible group label for the privileged touch keyboard. */
  label?: string;
  /** Marks whether this privileged keyboard contributes transient content occlusion. */
  occludesContent?: boolean;
  /** Optional consumer class name appended without changing component ownership. */
  className?: string;
};

const EN_LETTERS: SystemKeyboardLayoutModel = {
  id: 'en-letters',
  language: 'en',
  direction: 'ltr',
  mode: 'letters',
  rows: [
    chars('en-r1', 'qwertyuiop', { e: ['é', 'è', 'ê'], i: ['í', 'ì'], o: ['ó', 'ò', 'ö'] }),
    chars('en-r2', 'asdfghjkl', { a: ['á', 'à', 'ä'], s: ['ß'] }),
    [
      key('shift', 'modifier', '⇧', { action: 'shift', ariaLabel: 'Shift' }),
      ...chars('en-r3', 'zxcvbnm'),
      key('backspace', 'action', '⌫', {
        action: 'backspace',
        ariaLabel: 'Backspace',
        repeatable: true,
      }),
    ],
  ],
};

const FA_LETTERS: SystemKeyboardLayoutModel = {
  id: 'fa-letters',
  language: 'fa',
  direction: 'rtl',
  mode: 'letters',
  rows: [
    charsFromValues('fa-r1', ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'چ']),
    charsFromValues('fa-r2', ['ش', 'س', 'ی', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ک', 'گ']),
    [
      ...charsFromValues('fa-r3', ['ظ', 'ط', 'ز', 'ر', 'ذ', 'د', 'پ', 'و', 'ژ']),
      key('backspace', 'action', '⌫', {
        action: 'backspace',
        ariaLabel: 'پاک کردن',
        repeatable: true,
      }),
    ],
  ],
};

const SYMBOLS: SystemKeyboardLayoutModel = {
  id: 'symbols',
  language: 'neutral',
  direction: 'ltr',
  mode: 'symbols',
  rows: [
    charsFromValues('symbols-r1', ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], 'symbol'),
    charsFromValues('symbols-r2', ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'], 'symbol'),
    [
      ...charsFromValues('symbols-r3', ['!', '?', ':', ';', "'", '"', '/', '\\'], 'symbol'),
      key('backspace', 'action', '⌫', {
        action: 'backspace',
        ariaLabel: 'Backspace',
        repeatable: true,
      }),
    ],
  ],
};

const NUMERIC: SystemKeyboardLayoutModel = {
  id: 'numeric',
  language: 'neutral',
  direction: 'ltr',
  mode: 'numeric',
  rows: [
    charsFromValues('numeric-r1', ['1', '2', '3'], 'numeric'),
    charsFromValues('numeric-r2', ['4', '5', '6'], 'numeric'),
    charsFromValues('numeric-r3', ['7', '8', '9'], 'numeric'),
    [
      key('decimal', 'numeric', '.', { value: '.' }),
      key('zero', 'numeric', '0', { value: '0' }),
      key('backspace', 'action', '⌫', {
        action: 'backspace',
        ariaLabel: 'Backspace',
        repeatable: true,
      }),
    ],
  ],
};

export const systemKeyboardLayouts: readonly SystemKeyboardLayoutModel[] = [
  EN_LETTERS,
  FA_LETTERS,
  SYMBOLS,
  NUMERIC,
];

function key(
  id: string,
  kind: SystemKeyboardKeyKind,
  label: string,
  extra: Partial<Omit<SystemKeyboardKeyModel, 'id' | 'kind' | 'label'>> = {},
): SystemKeyboardKeyModel {
  return { id, kind, label, ...extra };
}

function chars(
  prefix: string,
  values: string,
  alternates: Record<string, readonly string[]> = {},
): readonly SystemKeyboardKeyModel[] {
  return [...values].map((value) =>
    key(`${prefix}-${value}`, 'character', value, { value, alternates: alternates[value] }),
  );
}

function charsFromValues(
  prefix: string,
  values: readonly string[],
  kind: 'character' | 'symbol' | 'numeric' = 'character',
): readonly SystemKeyboardKeyModel[] {
  return values.map((value, index) => key(`${prefix}-${index}`, kind, value, { value }));
}

function activeLayout(state: SystemKeyboardSurfaceState): SystemKeyboardLayoutModel {
  if (state.contentPurpose === 'numeric' || state.layout === 'numeric') return NUMERIC;
  if (state.layout === 'symbols') return SYMBOLS;
  return state.language === 'fa' ? FA_LETTERS : EN_LETTERS;
}

function purposeKeys(state: SystemKeyboardSurfaceState): readonly SystemKeyboardKeyModel[] {
  if (state.contentPurpose === 'numeric') {
    return [key('enter', 'action', '↵', { action: 'enter', ariaLabel: 'Enter' })];
  }
  const keys: SystemKeyboardKeyModel[] = [];
  if (state.layout !== 'symbols') {
    keys.push(key('symbols', 'modifier', '?123', { action: 'symbols', ariaLabel: 'Symbols' }));
  } else {
    keys.push(
      key('letters', 'modifier', state.language === 'fa' ? 'اب‌پ' : 'ABC', {
        action: 'symbols',
        ariaLabel: 'Letters',
      }),
    );
  }
  keys.push(
    key('language', 'language', state.language === 'fa' ? 'فا/EN' : 'EN/فا', {
      action: 'switch-language',
      ariaLabel: 'Switch language',
    }),
  );
  if (state.contentPurpose === 'email') keys.push(key('email-at', 'symbol', '@', { value: '@' }));
  if (state.contentPurpose === 'url') keys.push(key('url-slash', 'symbol', '/', { value: '/' }));
  keys.push(key('space', 'action', 'space', { action: 'space', ariaLabel: 'Space' }));
  if (state.contentPurpose === 'email' || state.contentPurpose === 'url')
    keys.push(key('purpose-dot', 'symbol', '.', { value: '.' }));
  keys.push(
    key('move-start', 'navigation', '←', {
      action: 'move-start',
      ariaLabel: 'Move toward start',
      repeatable: true,
    }),
    key('move-end', 'navigation', '→', {
      action: 'move-end',
      ariaLabel: 'Move toward end',
      repeatable: true,
    }),
    key('enter', 'action', state.contentPurpose === 'search' ? 'Search' : '↵', {
      action: 'enter',
      ariaLabel: state.contentPurpose === 'search' ? 'Search' : 'Enter',
    }),
  );
  return keys;
}

function nextShift(value: SystemKeyboardShiftState): SystemKeyboardShiftState {
  if (value === 'off') return 'once';
  if (value === 'once') return 'caps';
  return 'off';
}

function shifted(value: string, shift: SystemKeyboardShiftState, language: SystemKeyboardLanguage) {
  return language === 'en' && shift !== 'off' ? value.toLocaleUpperCase('en') : value;
}

function nextLanguage(
  current: SystemKeyboardLanguage,
  available: readonly SystemKeyboardLanguage[],
) {
  const usable = available.length ? available : (['en', 'fa'] as const);
  const index = usable.indexOf(current);
  return usable[(index + 1 + usable.length) % usable.length] ?? current;
}

/**
 * Privileged visual keyboard surface. Visibility/session/device policy is input-only here;
 * Hosts route emitted commands through their native text-input/IME authority.
 */
export function SystemKeyboardHost({
  state,
  onCommand,
  availableLanguages = ['en', 'fa'],
  label = 'System touch keyboard',
  occludesContent = true,
  className = '',
}: SystemKeyboardHostProps) {
  const [shift, setShift] = useState<SystemKeyboardShiftState>('off');
  const [alternateKeyId, setAlternateKeyId] = useState<string | null>(null);
  const keyboardRef = useRef<HTMLDivElement | null>(null);
  const repeatTimerRef = useRef<number | null>(null);
  const repeatTimerWindowRef = useRef<Window | null>(null);
  const layout = useMemo(() => activeLayout(state), [state]);
  const secure = state.secure || state.contentPurpose === 'password';
  const active = Boolean(state.sessionId);

  const stopRepeat = useCallback(() => {
    if (repeatTimerRef.current !== null) {
      repeatTimerWindowRef.current?.clearInterval(repeatTimerRef.current);
    }
    repeatTimerRef.current = null;
    repeatTimerWindowRef.current = null;
  }, []);

  useEffect(() => stopRepeat, [stopRepeat]);
  useEffect(() => {
    setShift('off');
    setAlternateKeyId(null);
    stopRepeat();
  }, [
    state.sessionId,
    state.visible,
    state.language,
    state.layout,
    state.contentPurpose,
    secure,
    stopRepeat,
  ]);

  if (!state.visible) return null;

  const emit = (command: SystemKeyboardCommandPayload) => {
    if (!state.sessionId) return;
    onCommand({
      ...command,
      surfaceId: state.surfaceId,
      sessionId: state.sessionId,
    } as SystemKeyboardCommand);
  };

  const activate = (model: SystemKeyboardKeyModel, repeat = false) => {
    if (!active) return;
    if (model.value !== undefined) {
      const text = shifted(model.value, shift, state.language);
      emit({ type: 'insert-text', keyId: model.id, text, repeat });
      if (shift === 'once') setShift('off');
      setAlternateKeyId(null);
      return;
    }
    switch (model.action) {
      case 'shift': {
        const value = nextShift(shift);
        setShift(value);
        emit({ type: 'modifier', keyId: model.id, shift: value });
        break;
      }
      case 'symbols':
        emit({
          type: 'request-layout',
          keyId: model.id,
          layout: state.layout === 'symbols' ? 'letters' : 'symbols',
        });
        break;
      case 'switch-language':
        emit({
          type: 'request-language',
          keyId: model.id,
          language: nextLanguage(state.language, availableLanguages),
        });
        break;
      case 'backspace':
        emit({ type: 'backspace', keyId: model.id, repeat });
        break;
      case 'enter':
        emit({ type: 'enter', keyId: model.id });
        break;
      case 'space':
        emit({ type: 'insert-text', keyId: model.id, text: ' ', repeat });
        break;
      case 'move-start':
        emit({ type: 'move', keyId: model.id, direction: 'start', repeat });
        break;
      case 'move-end':
        emit({ type: 'move', keyId: model.id, direction: 'end', repeat });
        break;
      default:
        break;
    }
  };

  const longPress = (model: SystemKeyboardKeyModel) => {
    if (!active) return;
    if (!secure && model.alternates?.length) {
      setAlternateKeyId(model.id);
      return;
    }
    if (!model.repeatable) return;
    activate(model, true);
    stopRepeat();
    const ownerWindow = keyboardRef.current?.ownerDocument.defaultView;
    if (!ownerWindow) return;
    repeatTimerWindowRef.current = ownerWindow;
    repeatTimerRef.current = ownerWindow.setInterval(() => activate(model, true), 72);
  };

  const alternateKey = layout.rows.flat().find((candidate) => candidate.id === alternateKeyId);

  return (
    <SystemSurface
      kind="privileged"
      edge="block-end"
      occludesContent={occludesContent}
      label={label}
      className={`ui-system-keyboard-host ${className}`.trim()}
    >
      <div
        ref={keyboardRef}
        className="ui-system-keyboard"
        dir={layout.direction}
        role="group"
        aria-label={label}
        data-oxs-system-keyboard
        data-oxs-system-keyboard-surface-id={state.surfaceId}
        data-oxs-system-keyboard-session={state.sessionId ?? undefined}
        data-oxs-system-keyboard-language={state.language}
        data-oxs-system-keyboard-layout={state.layout}
        data-oxs-system-keyboard-purpose={state.contentPurpose}
        data-oxs-system-keyboard-secure={secure || undefined}
        data-oxs-system-keyboard-active={active || undefined}
      >
        <div className="ui-system-keyboard__status">
          <span className="ui-system-keyboard__status-copy">
            {state.language.toUpperCase()} · {state.contentPurpose}
          </span>
          <div className="ui-system-keyboard__status-badges">
            {shift !== 'off' ? (
              <Badge tone="accent">{shift === 'caps' ? 'Caps' : 'Shift'}</Badge>
            ) : null}
            {state.layout === 'symbols' ? <Badge>Symbols</Badge> : null}
            {secure ? <Badge tone="warning">Secure</Badge> : null}
          </div>
        </div>

        {!secure && alternateKey?.alternates?.length ? (
          <div
            className="ui-system-keyboard__alternates"
            role="group"
            aria-label={`Alternates for ${alternateKey.label}`}
          >
            {alternateKey.alternates.map((value) => (
              <Button
                key={value}
                size="lg"
                variant="secondary"
                className="ui-system-keyboard__alternate"
                onClick={() => {
                  if (!state.sessionId) return;
                  onCommand({
                    type: 'insert-text',
                    surfaceId: state.surfaceId,
                    sessionId: state.sessionId,
                    keyId: `${alternateKey.id}-alternate-${value}`,
                    text: value,
                  });
                  setAlternateKeyId(null);
                  if (shift === 'once') setShift('off');
                }}
              >
                {value}
              </Button>
            ))}
          </div>
        ) : null}

        <div className="ui-system-keyboard__rows">
          {layout.rows.map((row, rowIndex) => (
            <div className="ui-system-keyboard__row" key={`${layout.id}-${rowIndex}`}>
              {row.map((model) => (
                <KeyboardButton
                  key={model.id}
                  model={model}
                  active={active}
                  shift={shift}
                  language={state.language}
                  secure={secure}
                  selected={model.action === 'shift' ? shift !== 'off' : false}
                  onActivate={() => activate(model)}
                  onLongPress={() => longPress(model)}
                  onPressChange={(pressed) => {
                    if (!pressed) stopRepeat();
                  }}
                />
              ))}
            </div>
          ))}
          <div className="ui-system-keyboard__row ui-system-keyboard__row--purpose">
            {purposeKeys(state).map((model) => (
              <KeyboardButton
                key={model.id}
                model={model}
                active={active}
                shift={shift}
                language={state.language}
                secure={secure}
                selected={
                  model.action === 'shift'
                    ? shift !== 'off'
                    : model.action === 'symbols'
                      ? state.layout === 'symbols'
                      : false
                }
                onActivate={() => activate(model)}
                onLongPress={() => longPress(model)}
                onPressChange={(pressed) => {
                  if (!pressed) stopRepeat();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </SystemSurface>
  );
}

function KeyboardButton({
  model,
  active,
  shift,
  language,
  secure,
  selected = false,
  onActivate,
  onLongPress,
  onPressChange,
}: {
  model: SystemKeyboardKeyModel;
  active: boolean;
  shift: SystemKeyboardShiftState;
  language: SystemKeyboardLanguage;
  secure: boolean;
  selected?: boolean;
  onActivate: () => void;
  onLongPress: () => void;
  onPressChange: (pressed: boolean) => void;
}) {
  const label = model.value !== undefined ? shifted(model.value, shift, language) : model.label;
  const hasAlternates = !secure && Boolean(model.alternates?.length);
  return (
    <Button
      size="lg"
      variant={
        selected
          ? 'primary'
          : model.kind === 'character' || model.kind === 'numeric' || model.kind === 'symbol'
            ? 'secondary'
            : 'quiet'
      }
      className={`ui-system-keyboard__key ui-system-keyboard__key--${model.kind} ${model.action ? `ui-system-keyboard__key--${model.action}` : ''}`.trim()}
      disabled={!active}
      aria-label={model.ariaLabel ?? label}
      aria-pressed={model.kind === 'modifier' ? selected : undefined}
      aria-haspopup={hasAlternates ? 'listbox' : undefined}
      onClick={onActivate}
      onLongPress={hasAlternates || model.repeatable ? onLongPress : undefined}
      onPressChange={onPressChange}
      data-key-id={model.id}
      data-key-kind={model.kind}
      data-repeatable={model.repeatable || undefined}
    >
      {label}
    </Button>
  );
}
