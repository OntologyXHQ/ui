import type {
  MotionPreference,
  UiDensity,
  UiDirection,
  UiModalityPreference,
  UiOcclusionInsets,
  UiPointerPrecisionPreference,
  UiSafeAreaInsets,
  UiTheme,
  UiTokenOverrides,
} from '@ontologyx/ui';
import { UiRoot } from '@ontologyx/ui';
import { createContext, type CSSProperties, type PropsWithChildren, useContext, useMemo, useState } from 'react';

export type StudioViewport = 'fit' | 'phone' | 'tablet' | 'desktop' | 'ultrawide';
export type StudioEnvironmentInsetPreset = 'none' | 'notch' | 'gesture' | 'keyboard';
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
  insetPreset: StudioEnvironmentInsetPreset;
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

type StudioEnvironmentInsets = {
  safeArea?: UiSafeAreaInsets;
  occlusion?: UiOcclusionInsets;
};

const environmentInsetPresets: Record<StudioEnvironmentInsetPreset, StudioEnvironmentInsets> = {
  none: {
    safeArea: { blockStart: '0px', inlineEnd: '0px', blockEnd: '0px', inlineStart: '0px' },
    occlusion: { blockStart: '0px', inlineEnd: '0px', blockEnd: '0px', inlineStart: '0px' },
  },
  notch: { safeArea: { blockStart: '32px', inlineEnd: '12px', blockEnd: '12px', inlineStart: '12px' } },
  gesture: { safeArea: { blockStart: '0px', inlineEnd: '0px', blockEnd: '28px', inlineStart: '0px' } },
  keyboard: { occlusion: { blockStart: '0px', inlineEnd: '0px', blockEnd: '280px', inlineStart: '0px' } },
};

const customTokens: UiTokenOverrides = {
  'color-accent': '#7c8cff',
  'color-accent-hover': '#94a0ff',
  'color-accent-pressed': '#6676ed',
  'color-accent-text': '#aeb7ff',
  'color-on-accent': '#090d18',
  'color-accent-soft': 'rgba(124, 140, 255, 0.16)',
  'color-accent-border': 'rgba(174, 183, 255, 0.5)',
  'color-focus': '#aeb7ff',
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
    insetPreset: pick('insets', ['none', 'notch', 'gesture', 'keyboard'] as const, 'none'),
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
        const param =
          key === 'direction'
            ? 'dir'
            : key === 'pointerPrecision'
              ? 'pointer'
              : key === 'insetPreset'
                ? 'insets'
                : key;
        url.searchParams.set(param, String(next));
        window.history.replaceState(null, '', url);
      },
    }),
    [environment],
  );

  const insets = environmentInsetPresets[environment.insetPreset];

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
            safeArea={insets.safeArea}
            occlusion={insets.occlusion}
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
