import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getConfiguredUiClipboardAdapter,
  getConfiguredUiClipboardGeneration,
  hasUiClipboardTransport,
  readUiClipboardText,
  type UiClipboardAdapter,
  writeUiClipboardText,
} from './clipboard';
import type { EditableTextSessionSnapshot } from './types';

export type EditableTextBridge = {
  begin?: (session: EditableTextSessionSnapshot) => void;
  update?: (session: EditableTextSessionSnapshot) => void;
  end?: (sessionId: string) => void;
};

type ClipboardReadRequest = {
  generation: number;
  promise: Promise<string>;
};

type EditableTextRuntime = {
  session: EditableTextSessionSnapshot | null;
  begin: (session: EditableTextSessionSnapshot) => void;
  update: (session: EditableTextSessionSnapshot) => void;
  end: (sessionId: string) => void;
  ownsSession: (sessionId: string) => boolean;
  clipboardGeneration: () => number;
  hasClipboard: () => boolean;
  writeClipboardText: (text: string) => boolean;
  readClipboardText: () => ClipboardReadRequest;
};

const noopRuntime: EditableTextRuntime = {
  session: null,
  begin: () => {},
  update: () => {},
  end: () => {},
  ownsSession: () => true,
  clipboardGeneration: getConfiguredUiClipboardGeneration,
  hasClipboard: hasUiClipboardTransport,
  writeClipboardText: writeUiClipboardText,
  readClipboardText: () => ({
    generation: getConfiguredUiClipboardGeneration(),
    promise: readUiClipboardText(),
  }),
};

const EditableTextRuntimeContext = createContext<EditableTextRuntime>(noopRuntime);

export function EditableTextRuntimeProvider({
  children,
  bridge,
  clipboardAdapter,
}: PropsWithChildren<{ bridge?: EditableTextBridge; clipboardAdapter?: UiClipboardAdapter }>) {
  const bridgeRef = useRef(bridge);
  const resolvedAdapter = clipboardAdapter ?? getConfiguredUiClipboardAdapter();
  const adapterRef = useRef(resolvedAdapter);
  const adapterGenerationRef = useRef(0);
  const sessionRef = useRef<EditableTextSessionSnapshot | null>(null);
  const [session, setSession] = useState<EditableTextSessionSnapshot | null>(null);

  useLayoutEffect(() => {
    if (bridgeRef.current === bridge) return;
    const previousBridge = bridgeRef.current;
    const active = sessionRef.current;
    if (active) previousBridge?.end?.(active.id);
    bridgeRef.current = bridge;
    if (active) bridge?.begin?.(active);
  }, [bridge]);

  useLayoutEffect(() => {
    if (adapterRef.current === resolvedAdapter) return;
    adapterRef.current = resolvedAdapter;
    adapterGenerationRef.current += 1;
  }, [resolvedAdapter]);

  const commitSession = useCallback((next: EditableTextSessionSnapshot | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const begin = useCallback(
    (next: EditableTextSessionSnapshot) => {
      const previous = sessionRef.current;
      if (previous?.id === next.id) {
        commitSession(next);
        bridgeRef.current?.update?.(next);
        return;
      }
      if (previous) bridgeRef.current?.end?.(previous.id);
      commitSession(next);
      bridgeRef.current?.begin?.(next);
    },
    [commitSession],
  );

  const update = useCallback(
    (next: EditableTextSessionSnapshot) => {
      if (sessionRef.current?.id !== next.id) return;
      commitSession(next);
      bridgeRef.current?.update?.(next);
    },
    [commitSession],
  );

  const end = useCallback(
    (sessionId: string) => {
      if (sessionRef.current?.id !== sessionId) return;
      commitSession(null);
      bridgeRef.current?.end?.(sessionId);
    },
    [commitSession],
  );

  const ownsSession = useCallback((sessionId: string) => sessionRef.current?.id === sessionId, []);
  const clipboardGeneration = useCallback(() => adapterGenerationRef.current, []);
  const hasClipboard = useCallback(() => adapterRef.current?.isAvailable() ?? false, []);
  const writeClipboardText = useCallback(
    (text: string) => adapterRef.current?.writeText(text) ?? false,
    [],
  );
  const readClipboardText = useCallback((): ClipboardReadRequest => {
    const adapter = adapterRef.current;
    const generation = adapterGenerationRef.current;
    return {
      generation,
      promise: adapter
        ? adapter.readText()
        : Promise.reject(new Error('OntologyX UI clipboard adapter is unavailable.')),
    };
  }, []);

  useEffect(
    () => () => {
      const active = sessionRef.current;
      if (!active) return;
      sessionRef.current = null;
      bridgeRef.current?.end?.(active.id);
    },
    [],
  );

  const runtime = useMemo(
    () => ({
      session,
      begin,
      update,
      end,
      ownsSession,
      clipboardGeneration,
      hasClipboard,
      writeClipboardText,
      readClipboardText,
    }),
    [
      begin,
      clipboardGeneration,
      end,
      hasClipboard,
      ownsSession,
      readClipboardText,
      session,
      update,
      writeClipboardText,
    ],
  );
  return (
    <EditableTextRuntimeContext.Provider value={runtime}>
      {children}
    </EditableTextRuntimeContext.Provider>
  );
}

export function useEditableTextRuntime() {
  return useContext(EditableTextRuntimeContext);
}
