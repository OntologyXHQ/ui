import type {
  MotionPreference,
  UiDensity,
  UiDirection,
  UiModalityPreference,
  UiPointerPrecisionPreference,
  UiSafeAreaInsets,
  UiTheme,
  UiTokenOverrides,
} from '@oxs/ui';
import { UiRoot } from '@oxs/ui';
import { createContext, type CSSProperties, type PropsWithChildren, useContext, useMemo, useState } from 'react';

export type StudioViewport = 'fit' | 'phone' | 'tablet' | 'desktop' | 'ultrawide';
export type StudioSafeAreaPreset = 'none' | 'notch' | 'gesture' | 'keyboard';
export type StudioContainerPreset = 'auto' | 'compact' | 'content' | 'wide';

export type StudioEnvironmentState = {
  theme: UiTheme;
  direction: UiDirection;
  density: UiDensity;
  motion: MotionPreference;
  modality: UiModalityPreference;
  pointerPrecision: UiPointerPrecisionPreference;
  viewport: StudioViewport;
  container: StudioContainerPreset;
  safeAreaPreset: StudioSafeAreaPreset;
};

type StudioEnvironmentContextValue = {
  environment: StudioEnvironmentState;
  update: <K extends keyof StudioEnvironmentState>(key: K, value: StudioEnvironmentState[K]) => void;
};

const StudioEnvironmentContext = createContext<StudioEnvironmentContextValue | null>(null);

const viewportWidths: Record<StudioViewport, string> = {
  fit: '100%',
  phone: '390px',
  tablet: '820px',
  desktop: '1280px',
  ultrawide: '1720px',
};

const containerWidths: Record<StudioContainerPreset, string> = {
  auto: '88rem',
  compact: '48rem',
  content: '68rem',
  wide: '104rem',
};

const safeAreaPresets: Record<StudioSafeAreaPreset, UiSafeAreaInsets> = {
  none: { blockStart: 0, inlineEnd: 0, blockEnd: 0, inlineStart: 0 },
  notch: { blockStart: 32, inlineEnd: 12, blockEnd: 12, inlineStart: 12 },
  gesture: { blockStart: 0, inlineEnd: 0, blockEnd: 28, inlineStart: 0 },
  keyboard: { blockStart: 0, inlineEnd: 0, blockEnd: 280, inlineStart: 0 },
};

const customTokens: UiTokenOverrides = {
  'color-accent': '#7c8cff',
  'color-accent-hover': '#94a0ff',
  'color-accent-pressed': '#6676ed',
  'color-canvas': '#0a0d16',
  'color-canvas-raised': '#121827',
  'color-surface': '#111827',
};

function initialEnvironment(): StudioEnvironmentState {
  const params = new URLSearchParams(window.location.search);
  const pick = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
    const value = params.get(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  };
  return {
    theme: pick('theme', ['system', 'dark', 'light', 'custom'] as const, 'dark'),
    direction: pick('dir', ['auto', 'ltr', 'rtl'] as const, 'ltr'),
    density: pick('density', ['auto', 'compact', 'comfortable'] as const, 'comfortable'),
    motion: pick('motion', ['system', 'full', 'reduced'] as const, 'system'),
    modality: pick('modality', ['auto', 'keyboard', 'mouse', 'touch', 'pen'] as const, 'auto'),
    pointerPrecision: pick('pointer', ['auto', 'fine', 'coarse'] as const, 'auto'),
    viewport: pick('viewport', ['fit', 'phone', 'tablet', 'desktop', 'ultrawide'] as const, 'fit'),
    container: pick('container', ['auto', 'compact', 'content', 'wide'] as const, 'auto'),
    safeAreaPreset: pick('safe', ['none', 'notch', 'gesture', 'keyboard'] as const, 'none'),
  };
}

export function StudioEnvironmentProvider({ children }: PropsWithChildren) {
  const [environment, setEnvironment] = useState<StudioEnvironmentState>(initialEnvironment);
  const value = useMemo<StudioEnvironmentContextValue>(
    () => ({
      environment,
      update: (key, next) => {
        setEnvironment((current) => ({ ...current, [key]: next }));
        const url = new URL(window.location.href);
        const param = key === 'direction' ? 'dir' : key === 'pointerPrecision' ? 'pointer' : key === 'safeAreaPreset' ? 'safe' : key;
        url.searchParams.set(param, String(next));
        window.history.replaceState(null, '', url);
      },
    }),
    [environment],
  );

  return (
    <StudioEnvironmentContext.Provider value={value}>
      <div className="ui-studio-stage">
        <div
          className="ui-studio-viewport"
          data-viewport={environment.viewport}
          style={{
            '--ui-studio-viewport-width': viewportWidths[environment.viewport],
            '--ui-studio-content-width': containerWidths[environment.container],
          } as CSSProperties}
        >
          <UiRoot
            instrumentPerformance
            theme={environment.theme}
            colorScheme={environment.theme === 'custom' ? 'dark' : 'auto'}
            density={environment.density}
            direction={environment.direction}
            modality={environment.modality}
            pointerPrecision={environment.pointerPrecision}
            safeArea={safeAreaPresets[environment.safeAreaPreset]}
            tokens={environment.theme === 'custom' ? customTokens : undefined}
            motion={environment.motion}
            className="ui-studio-root"
          >
            {children}
          </UiRoot>
        </div>
      </div>
    </StudioEnvironmentContext.Provider>
  );
}

export function useStudioEnvironment() {
  const value = useContext(StudioEnvironmentContext);
  if (!value) throw new Error('useStudioEnvironment must render inside StudioEnvironmentProvider.');
  return value;
}
