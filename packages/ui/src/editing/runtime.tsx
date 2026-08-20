import type { PropsWithChildren } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  getConfiguredUiClipboardAdapter,
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

type EditableTextRuntime = {
  session: EditableTextSessionSnapshot | null;
  begin: (session: EditableTextSessionSnapshot) => void;
  update: (session: EditableTextSessionSnapshot) => void;
  end: (sessionId: string) => void;
  hasClipboard: () => boolean;
  writeClipboardText: (text: string) => boolean;
  readClipboardText: () => Promise<string>;
};

const noopRuntime: EditableTextRuntime = {
  session: null,
  begin: () => {},
  update: () => {},
  end: () => {},
  hasClipboard: hasUiClipboardTransport,
  writeClipboardText: writeUiClipboardText,
  readClipboardText: readUiClipboardText,
};

const EditableTextRuntimeContext = createContext<EditableTextRuntime>(noopRuntime);

export function EditableTextRuntimeProvider({
  children,
  bridge,
  clipboardAdapter,
}: PropsWithChildren<{ bridge?: EditableTextBridge; clipboardAdapter?: UiClipboardAdapter }>) {
  const bridgeRef = useRef(bridge);
  const adapterRef = useRef(clipboardAdapter ?? getConfiguredUiClipboardAdapter());
  const sessionRef = useRef<EditableTextSessionSnapshot | null>(null);
  bridgeRef.current = bridge;
  adapterRef.current = clipboardAdapter ?? getConfiguredUiClipboardAdapter();
  const [session, setSession] = useState<EditableTextSessionSnapshot | null>(null);

  const commitSession = useCallback((next: EditableTextSessionSnapshot | null) => {
    sessionRef.current = next;
    setSession(next);
  }, []);

  const begin = useCallback(
    (next: EditableTextSessionSnapshot) => {
      const previous = sessionRef.current;
      if (previous && previous.id !== next.id) bridgeRef.current?.end?.(previous.id);
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

  const hasClipboard = useCallback(() => adapterRef.current?.isAvailable() ?? false, []);
  const writeClipboardText = useCallback(
    (text: string) => adapterRef.current?.writeText(text) ?? false,
    [],
  );
  const readClipboardText = useCallback(() => {
    const adapter = adapterRef.current;
    if (!adapter)
      return Promise.reject(new Error('OntologyX UI clipboard adapter is unavailable.'));
    return adapter.readText();
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
      hasClipboard,
      writeClipboardText,
      readClipboardText,
    }),
    [begin, end, hasClipboard, readClipboardText, session, update, writeClipboardText],
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
