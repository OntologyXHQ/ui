import type { CSSProperties, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { CursorRuntimeConfig } from '../cursor';
import { CursorRuntimeProvider, useCursorRuntime } from '../cursor';
import { DragDropProvider } from '../drag-drop';
import type { EditableTextBridge, UiClipboardAdapter } from '../editing';
import { EditableTextRuntimeProvider } from '../editing/runtime';
import type { UiEnvironmentOptions } from '../foundations';
import {
  resolveUiAdaptiveBand,
  uiEnvironmentStyle,
  useObservedElementSize,
  useUiEnvironment,
} from '../foundations';
import { UiEnvironmentProvider } from '../foundations/environment';
import { UiPortalHostProvider } from '../foundations/portal';
import { OverlayRuntimeProvider } from '../interaction/overlayRuntime';
import type { FrameRateTarget, MotionPreference } from '../motion';
import { MotionRuntimeProvider, useMotionRuntime, useReactCommitProbe } from '../motion';

export type UiRootProps = PropsWithChildren<
  UiEnvironmentOptions & {
    /** Motion preference for this runtime scope. System resolves against the owning Window realm. @default system */
    motion?: MotionPreference;
    /** Frame-rate target used by the root motion clock and performance monitor. @default 60 */
    targetFrameRate?: FrameRateTarget;
    /** Enables root-scoped frame-performance instrumentation without changing visual semantics. @default false */
    instrumentPerformance?: boolean;
    /** Root-scoped cursor runtime customization for platform hosts that opt into the shared cursor engine. */
    cursor?: Partial<CursorRuntimeConfig>;
    /** Host-neutral bridge for editable-text session transport owned by this root. */
    editingBridge?: EditableTextBridge;
    /** Clipboard adapter scoped to this root; nested roots may provide an independent transport. */
    clipboardAdapter?: UiClipboardAdapter;
    /** Optional host class name. Use semantic component props/tokens for design-system styling. */
    className?: string;
    /** Root-host escape hatch for integration geometry/CSS variables; component visual APIs remain typed. */
    style?: CSSProperties;
  }
>;

type UiRootRealm = {
  window: Window | null;
  document: Document | null;
  nestedByDom: boolean;
};

const UiRootDepthContext = createContext(0);

export function UiRoot({
  children,
  theme,
  colorScheme,
  density,
  direction,
  modality,
  pointerPrecision,
  safeArea,
  occlusion,
  tokens,
  motion = 'system',
  targetFrameRate = 60,
  instrumentPerformance,
  cursor,
  editingBridge,
  clipboardAdapter,
  className,
  style,
}: UiRootProps) {
  const parentDepth = useContext(UiRootDepthContext);
  const [realm, setRealm] = useState<UiRootRealm>({ window: null, document: null, nestedByDom: false });
  const bindRootElement = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const nextDocument = element.ownerDocument;
    const nextWindow = nextDocument.defaultView;
    const nestedByDom = Boolean(element.parentElement?.closest('.ui-root'));
    setRealm((current) =>
      current.document === nextDocument &&
      current.window === nextWindow &&
      current.nestedByDom === nestedByDom
        ? current
        : { document: nextDocument, window: nextWindow, nestedByDom },
    );
  }, []);
  const scope = parentDepth > 0 || realm.nestedByDom ? 'nested' : 'root';

  return (
    <UiEnvironmentProvider
      theme={theme}
      colorScheme={colorScheme}
      density={density}
      direction={direction}
      modality={modality}
      pointerPrecision={pointerPrecision}
      safeArea={safeArea}
      occlusion={occlusion}
      tokens={tokens}
      realmWindow={realm.window}
      realmDocument={realm.document}
    >
      <CursorRuntimeProvider config={cursor}>
        <MotionRuntimeProvider
          preference={motion}
          targetFrameRate={targetFrameRate}
          instrumentPerformance={instrumentPerformance}
          realmWindow={realm.window}
        >
          <EditableTextRuntimeProvider bridge={editingBridge} clipboardAdapter={clipboardAdapter}>
            <OverlayRuntimeProvider>
              <UiRootDepthContext.Provider value={parentDepth + 1}>
                <UiRootFrame
                  motionPreference={motion}
                  targetFrameRate={targetFrameRate}
                  scope={scope}
                  className={className}
                  style={style}
                  onRootElement={bindRootElement}
                >
                  <DragDropProvider>{children}</DragDropProvider>
                </UiRootFrame>
              </UiRootDepthContext.Provider>
            </OverlayRuntimeProvider>
          </EditableTextRuntimeProvider>
        </MotionRuntimeProvider>
      </CursorRuntimeProvider>
    </UiEnvironmentProvider>
  );
}

function UiRootFrame({
  children,
  motionPreference,
  targetFrameRate,
  scope,
  className,
  style,
  onRootElement,
}: PropsWithChildren<{
  motionPreference: MotionPreference;
  targetFrameRate: FrameRateTarget;
  scope: 'root' | 'nested';
  className?: string;
  style?: CSSProperties;
  onRootElement: (element: HTMLDivElement | null) => void;
}>) {
  useReactCommitProbe();
  const cursor = useCursorRuntime();
  const motion = useMotionRuntime();
  const environment = useUiEnvironment();
  const environmentStyle = uiEnvironmentStyle(environment);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rootSize = useObservedElementSize(rootRef);
  const adaptiveBand = rootSize ? resolveUiAdaptiveBand(rootSize.inlineSize) : undefined;
  const bindRoot = useCallback(
    (element: HTMLDivElement | null) => {
      rootRef.current = element;
      onRootElement(element);
    },
    [onRootElement],
  );

  return (
    <UiPortalHostProvider host={portalHost}>
      <div
        ref={bindRoot}
        className={`ui-root ${className ?? ''}`.trim()}
        dir={environment.direction}
        data-oxs-scope={scope}
        data-oxs-theme={environment.theme}
        data-oxs-color-scheme={environment.colorScheme}
        data-oxs-color-scheme-preference={environment.colorSchemePreference}
        data-oxs-density={environment.density}
        data-oxs-density-preference={environment.densityPreference}
        data-oxs-direction={environment.direction}
        data-oxs-direction-preference={environment.directionPreference}
        data-oxs-modality={environment.modality}
        data-oxs-modality-preference={environment.modalityPreference}
        data-oxs-pointer-precision={environment.pointerPrecision}
        data-oxs-pointer-precision-preference={environment.pointerPrecisionPreference}
        data-oxs-motion={motion.preference}
        data-oxs-motion-preference={motionPreference}
        data-oxs-adaptive-band={adaptiveBand}
        data-oxs-frame-rate={targetFrameRate}
        data-oxs-cursor-theme={cursor.config.theme}
        data-oxs-cursor-animation={cursor.config.animation}
        data-oxs-pointer-modality={cursor.modality}
        data-oxs-pointer-visible={cursor.pointerVisible}
        style={
          {
            ...environmentStyle,
            '--oxs-cursor-scale': cursor.config.scale,
            '--oxs-cursor-nominal-size': `${cursor.config.nominalSize}px`,
            ...style,
          } as CSSProperties
        }
      >
        {children}
        <div ref={setPortalHost} className="ui-portal-root" data-oxs-portal-root />
      </div>
    </UiPortalHostProvider>
  );
}
