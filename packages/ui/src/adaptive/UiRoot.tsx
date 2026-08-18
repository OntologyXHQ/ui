import type { CSSProperties, PropsWithChildren } from 'react';
import { useState } from 'react';
import type { CursorRuntimeConfig } from '../cursor';
import { DragDropProvider } from '../drag-drop';
import type { EditableTextBridge, UiClipboardAdapter } from '../editing';
import { EditableTextRuntimeProvider } from '../editing/runtime';
import { CursorRuntimeProvider, useCursorRuntime } from '../cursor';
import type { UiEnvironmentOptions } from '../foundations';
import { UiEnvironmentProvider, uiEnvironmentStyle, useUiEnvironment } from '../foundations/environment';
import { UiPortalHostProvider } from '../foundations/portal';
import { OverlayRuntimeProvider } from '../interaction/overlayRuntime';
import type { FrameRateTarget, MotionPreference } from '../motion';
import { MotionRuntimeProvider, useReactCommitProbe } from '../motion';

export type UiRootProps = PropsWithChildren<
  UiEnvironmentOptions & {
    motion?: MotionPreference;
    targetFrameRate?: FrameRateTarget;
    instrumentPerformance?: boolean;
    cursor?: Partial<CursorRuntimeConfig>;
    editingBridge?: EditableTextBridge;
    clipboardAdapter?: UiClipboardAdapter;
    scope?: 'root' | 'nested';
    className?: string;
    style?: CSSProperties;
  }
>;

export function UiRoot({
  children,
  theme,
  colorScheme,
  density,
  direction,
  modality,
  pointerPrecision,
  safeArea,
  tokens,
  motion = 'system',
  targetFrameRate = 60,
  instrumentPerformance,
  cursor,
  editingBridge,
  clipboardAdapter,
  scope = 'root',
  className,
  style,
}: UiRootProps) {
  return (
    <UiEnvironmentProvider
      theme={theme}
      colorScheme={colorScheme}
      density={density}
      direction={direction}
      modality={modality}
      pointerPrecision={pointerPrecision}
      safeArea={safeArea}
      tokens={tokens}
    >
      <CursorRuntimeProvider config={cursor}>
        <MotionRuntimeProvider
          preference={motion}
          targetFrameRate={targetFrameRate}
          instrumentPerformance={instrumentPerformance}
        >
          <EditableTextRuntimeProvider bridge={editingBridge} clipboardAdapter={clipboardAdapter}>
            <OverlayRuntimeProvider>
              <UiRootFrame
                motion={motion}
                targetFrameRate={targetFrameRate}
                scope={scope}
                className={className}
                style={style}
              >
                <DragDropProvider>{children}</DragDropProvider>
              </UiRootFrame>
            </OverlayRuntimeProvider>
          </EditableTextRuntimeProvider>
        </MotionRuntimeProvider>
      </CursorRuntimeProvider>
    </UiEnvironmentProvider>
  );
}

function UiRootFrame({
  children,
  motion,
  targetFrameRate,
  scope,
  className,
  style,
}: PropsWithChildren<{
  motion: MotionPreference;
  targetFrameRate: FrameRateTarget;
  scope: 'root' | 'nested';
  className?: string;
  style?: CSSProperties;
}>) {
  useReactCommitProbe();
  const cursor = useCursorRuntime();
  const environment = useUiEnvironment();
  const environmentStyle = uiEnvironmentStyle(environment);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);

  return (
    <UiPortalHostProvider host={portalHost}>
      <div
        className={`ui-root ${className ?? ''}`.trim()}
        dir={environment.direction}
        data-oxs-scope={scope}
        data-oxs-density={environment.density}
        data-oxs-motion={motion}
        data-oxs-theme={environment.theme}
        data-oxs-color-scheme={environment.colorScheme}
        data-oxs-direction={environment.direction}
        data-oxs-modality={environment.modality}
        data-oxs-pointer-precision={environment.pointerPrecision}
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
