import type {
  CompositionEvent,
  FormEvent,
  InputHTMLAttributes,
  KeyboardEvent,
  FocusEvent,
  RefObject,
  SyntheticEvent,
} from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useEditableTextRuntime } from './runtime';
import type { EditableContentPurpose, EditableTextSessionSnapshot, EditableTextState } from './types';

export type EditableTextElement = HTMLInputElement | HTMLTextAreaElement;

export type EditableTextContractOptions<T extends EditableTextElement = HTMLInputElement> = {
  inputRef: RefObject<T | null>;
  sessionId: string;
  contentPurpose: EditableContentPurpose;
  secure: boolean;
  onEditingStateChange?: (state: EditableTextState) => void;
};

export function useEditableTextContract<T extends EditableTextElement>({
  inputRef,
  sessionId,
  contentPurpose,
  secure,
  onEditingStateChange,
}: EditableTextContractOptions<T>) {
  const runtime = useEditableTextRuntime();
  const activeRef = useRef(false);
  const composingRef = useRef(false);
  const preeditRef = useRef('');
  const asyncRequestRef = useRef(0);
  const callbackRef = useRef(onEditingStateChange);
  const runtimeRef = useRef(runtime);
  const sessionIdRef = useRef(sessionId);
  callbackRef.current = onEditingStateChange;
  runtimeRef.current = runtime;
  sessionIdRef.current = sessionId;

  const invalidateAsyncRequests = useCallback(() => {
    asyncRequestRef.current += 1;
  }, []);

  const readSnapshot = useCallback((): EditableTextSessionSnapshot | null => {
    const input = inputRef.current;
    if (!input) return null;
    return {
      id: sessionId,
      state: {
        valueLength: input.value.length,
        selection: {
          start: input.selectionStart ?? 0,
          end: input.selectionEnd ?? input.selectionStart ?? 0,
          direction: input.selectionDirection ?? 'none',
        },
        composing: composingRef.current,
        preedit: preeditRef.current,
        contentPurpose,
        secure,
      },
    };
  }, [contentPurpose, inputRef, secure, sessionId]);

  const publishState = useCallback(() => {
    const snapshot = readSnapshot();
    if (!snapshot) return;
    callbackRef.current?.(snapshot.state);
    if (activeRef.current) runtime.update(snapshot);
  }, [readSnapshot, runtime]);

  const onFocus = useCallback(
    (_event: FocusEvent<T>) => {
      invalidateAsyncRequests();
      const snapshot = readSnapshot();
      if (!snapshot) return;
      activeRef.current = true;
      runtime.begin(snapshot);
      callbackRef.current?.(snapshot.state);
    },
    [invalidateAsyncRequests, readSnapshot, runtime],
  );

  const endSession = useCallback(() => {
    invalidateAsyncRequests();
    if (!activeRef.current) return;
    activeRef.current = false;
    runtime.end(sessionId);
  }, [invalidateAsyncRequests, runtime, sessionId]);

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
      preeditRef.current = event.data ?? '';
      publishState();
    },
    [invalidateAsyncRequests, publishState],
  );

  const onCompositionUpdate = useCallback(
    (event: CompositionEvent<T>) => {
      preeditRef.current = event.data ?? '';
      publishState();
    },
    [publishState],
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
      const pasteStart = input.selectionStart ?? 0;
      const pasteEnd = input.selectionEnd ?? pasteStart;
      const valueBefore = input.value;
      void runtime.readClipboardText()
        .then((text) => {
          if (
            requestId !== asyncRequestRef.current ||
            !activeRef.current ||
            inputRef.current !== input ||
            !input.isConnected ||
            input.value !== valueBefore ||
            (input.selectionStart ?? 0) !== pasteStart ||
            (input.selectionEnd ?? pasteStart) !== pasteEnd
          ) return;
          input.setRangeText(text, pasteStart, pasteEnd, 'end');
          dispatchEditingInput(input, 'insertFromPaste', text);
          publishState();
        })
        .catch((error: unknown) => {
          if (requestId !== asyncRequestRef.current) return;
          console.error('OntologyX UI clipboard paste failed.', error);
        });
    },
    [inputRef, invalidateAsyncRequests, publishState, runtime, secure],
  );

  useEffect(
    () => () => {
      asyncRequestRef.current += 1;
      if (!activeRef.current) return;
      activeRef.current = false;
      runtimeRef.current.end(sessionIdRef.current);
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

export function inputModeForContentPurpose(
  purpose: EditableContentPurpose,
): InputHTMLAttributes<HTMLInputElement>['inputMode'] {
  switch (purpose) {
    case 'search': return 'search';
    case 'url': return 'url';
    case 'email': return 'email';
    case 'number': return 'numeric';
    case 'decimal': return 'decimal';
    case 'telephone': return 'tel';
    case 'text':
    case 'password': return 'text';
  }
}

function dispatchEditingInput(
  input: EditableTextElement,
  inputType: 'deleteByCut' | 'insertFromPaste',
  data: string | null,
) {
  input.dispatchEvent(
    new InputEvent('input', { bubbles: true, composed: true, inputType, data }),
  );
}
