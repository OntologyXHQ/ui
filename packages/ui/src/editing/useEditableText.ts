import type {
  CompositionEvent,
  FocusEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
  SyntheticEvent,
} from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useEditableTextRuntime } from './runtime';
import type {
  EditableContentPurpose,
  EditableEnterKeyHint,
  EditableInputMode,
  EditableTextSessionSnapshot,
  EditableTextState,
} from './types';

export type EditableTextElement = HTMLInputElement | HTMLTextAreaElement;

export type EditableTextContractOptions<T extends EditableTextElement = HTMLInputElement> = {
  inputRef: RefObject<T | null>;
  sessionId: string;
  contentPurpose: EditableContentPurpose;
  secure: boolean;
  multiline?: boolean;
  inputMode: EditableInputMode;
  enterKeyHint?: EditableEnterKeyHint;
  readOnly?: boolean;
  onEditingStateChange?: (state: EditableTextState) => void;
};

/**
 * Publishes focused text-session metadata to the owning UiRoot bridge while leaving native DOM/IME
 * composition and keyboard lifecycle in the browser/platform host. No committed text value crosses
 * this bridge, and secure sessions redact composition preedit text.
 */
export function useEditableTextContract<T extends EditableTextElement>({
  inputRef,
  sessionId,
  contentPurpose,
  secure,
  multiline = false,
  inputMode,
  enterKeyHint,
  readOnly = false,
  onEditingStateChange,
}: EditableTextContractOptions<T>) {
  const runtime = useEditableTextRuntime();
  const activeRef = useRef(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const composingRef = useRef(false);
  const preeditRef = useRef('');
  const asyncRequestRef = useRef(0);
  const callbackRef = useRef(onEditingStateChange);
  const runtimeRef = useRef(runtime);
  callbackRef.current = onEditingStateChange;
  runtimeRef.current = runtime;

  const invalidateAsyncRequests = useCallback(() => {
    asyncRequestRef.current += 1;
  }, []);

  const readSnapshot = useCallback(
    (id = sessionId): EditableTextSessionSnapshot | null => {
      const input = inputRef.current;
      if (!input) return null;
      return {
        id,
        descriptor: {
          multiline,
          inputMode,
          enterKeyHint,
          readOnly,
        },
        state: {
          valueLength: input.value.length,
          selection: {
            start: input.selectionStart ?? 0,
            end: input.selectionEnd ?? input.selectionStart ?? 0,
            direction: input.selectionDirection ?? 'none',
          },
          composing: composingRef.current,
          preedit: secure ? '' : preeditRef.current,
          contentPurpose,
          secure,
        },
      };
    },
    [contentPurpose, enterKeyHint, inputMode, inputRef, multiline, readOnly, secure, sessionId],
  );

  const publishState = useCallback(() => {
    const activeSessionId = activeSessionIdRef.current ?? sessionId;
    const snapshot = readSnapshot(activeSessionId);
    if (!snapshot) return;
    callbackRef.current?.(snapshot.state);
    if (activeRef.current && runtime.ownsSession(activeSessionId)) runtime.update(snapshot);
  }, [readSnapshot, runtime, sessionId]);

  const onFocus = useCallback(
    (_event: FocusEvent<T>) => {
      invalidateAsyncRequests();
      const snapshot = readSnapshot(sessionId);
      if (!snapshot) return;
      const previousSessionId = activeSessionIdRef.current;
      if (activeRef.current && previousSessionId && previousSessionId !== sessionId) {
        runtime.end(previousSessionId);
      }
      activeRef.current = true;
      activeSessionIdRef.current = sessionId;
      runtime.begin(snapshot);
      callbackRef.current?.(snapshot.state);
    },
    [invalidateAsyncRequests, readSnapshot, runtime, sessionId],
  );

  const endSession = useCallback(() => {
    invalidateAsyncRequests();
    if (!activeRef.current) return;
    const activeSessionId = activeSessionIdRef.current;
    activeRef.current = false;
    activeSessionIdRef.current = null;
    composingRef.current = false;
    preeditRef.current = '';
    if (activeSessionId) runtime.end(activeSessionId);
  }, [invalidateAsyncRequests, runtime]);

  const onBlur = useCallback((_event: FocusEvent<T>) => endSession(), [endSession]);

  const onSelect = useCallback(
    (_event: SyntheticEvent<T>) => {
      invalidateAsyncRequests();
      publishState();
    },
    [invalidateAsyncRequests, publishState],
  );

  const onInput = useCallback(
    (_event: FormEvent<T>) => {
      invalidateAsyncRequests();
      publishState();
    },
    [invalidateAsyncRequests, publishState],
  );

  const onCompositionStart = useCallback(
    (event: CompositionEvent<T>) => {
      invalidateAsyncRequests();
      composingRef.current = true;
      preeditRef.current = secure ? '' : (event.data ?? '');
      publishState();
    },
    [invalidateAsyncRequests, publishState, secure],
  );

  const onCompositionUpdate = useCallback(
    (event: CompositionEvent<T>) => {
      preeditRef.current = secure ? '' : (event.data ?? '');
      publishState();
    },
    [publishState, secure],
  );

  const onCompositionEnd = useCallback(
    (_event: CompositionEvent<T>) => {
      composingRef.current = false;
      preeditRef.current = '';
      publishState();
    },
    [publishState],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<T>) => {
      if (event.altKey || (!event.ctrlKey && !event.metaKey)) return;
      const input = inputRef.current;
      if (!input) return;

      const key = event.key.toLowerCase();
      if (key === 'a') {
        invalidateAsyncRequests();
        event.preventDefault();
        input.select();
        publishState();
        return;
      }

      if (!['c', 'x', 'v'].includes(key) || composingRef.current) return;

      if ((key === 'c' || key === 'x') && secure) {
        event.preventDefault();
        return;
      }

      if (!runtime.hasClipboard()) return;

      if (key === 'c' || key === 'x') {
        invalidateAsyncRequests();
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? start;
        const selectedText = input.value.slice(start, end);
        event.preventDefault();
        if (!selectedText || !runtime.writeClipboardText(selectedText)) return;
        if (key === 'x') {
          input.setRangeText('', start, end, 'end');
          dispatchEditingInput(input, 'deleteByCut', null);
          publishState();
        }
        return;
      }

      event.preventDefault();
      const requestId = ++asyncRequestRef.current;
      const activeSessionId = activeSessionIdRef.current;
      if (!activeSessionId || !runtime.ownsSession(activeSessionId)) return;
      const clipboardRequest = runtime.readClipboardText();
      const pasteStart = input.selectionStart ?? 0;
      const pasteEnd = input.selectionEnd ?? pasteStart;
      const valueBefore = input.value;
      void clipboardRequest.promise
        .then((text) => {
          if (
            requestId !== asyncRequestRef.current ||
            !activeRef.current ||
            activeSessionIdRef.current !== activeSessionId ||
            !runtime.ownsSession(activeSessionId) ||
            runtime.clipboardGeneration() !== clipboardRequest.generation ||
            inputRef.current !== input ||
            !input.isConnected ||
            input.value !== valueBefore ||
            (input.selectionStart ?? 0) !== pasteStart ||
            (input.selectionEnd ?? pasteStart) !== pasteEnd
          )
            return;
          input.setRangeText(text, pasteStart, pasteEnd, 'end');
          dispatchEditingInput(input, 'insertFromPaste', text);
          publishState();
        })
        .catch((error: unknown) => {
          if (
            requestId !== asyncRequestRef.current ||
            activeSessionIdRef.current !== activeSessionId ||
            runtime.clipboardGeneration() !== clipboardRequest.generation
          )
            return;
          console.error('OntologyX UI clipboard paste failed.', error);
        });
    },
    [inputRef, invalidateAsyncRequests, publishState, runtime, secure],
  );

  useEffect(() => {
    if (!activeRef.current) return;
    const previousSessionId = activeSessionIdRef.current;
    if (!previousSessionId || previousSessionId === sessionId) return;
    invalidateAsyncRequests();
    runtime.end(previousSessionId);
    const snapshot = readSnapshot(sessionId);
    if (!snapshot) {
      activeRef.current = false;
      activeSessionIdRef.current = null;
      return;
    }
    activeSessionIdRef.current = sessionId;
    runtime.begin(snapshot);
    callbackRef.current?.(snapshot.state);
  }, [invalidateAsyncRequests, readSnapshot, runtime, sessionId]);

  useEffect(
    () => () => {
      asyncRequestRef.current += 1;
      if (!activeRef.current) return;
      const activeSessionId = activeSessionIdRef.current;
      activeRef.current = false;
      activeSessionIdRef.current = null;
      composingRef.current = false;
      preeditRef.current = '';
      if (activeSessionId) runtimeRef.current.end(activeSessionId);
    },
    [],
  );

  return {
    onFocus,
    onBlur,
    onSelect,
    onInput,
    onCompositionStart,
    onCompositionUpdate,
    onCompositionEnd,
    onKeyDown,
    publishState,
  };
}

export function inputModeForContentPurpose(purpose: EditableContentPurpose): EditableInputMode {
  switch (purpose) {
    case 'search':
      return 'search';
    case 'url':
      return 'url';
    case 'email':
      return 'email';
    case 'number':
      return 'numeric';
    case 'decimal':
      return 'decimal';
    case 'telephone':
      return 'tel';
    case 'text':
    case 'password':
      return 'text';
  }
}

function dispatchEditingInput(
  input: EditableTextElement,
  inputType: 'deleteByCut' | 'insertFromPaste',
  data: string | null,
) {
  const InputEventConstructor = input.ownerDocument.defaultView?.InputEvent;
  if (!InputEventConstructor) return;
  input.dispatchEvent(
    new InputEventConstructor('input', { bubbles: true, composed: true, inputType, data }),
  );
}
