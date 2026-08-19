import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  resolveUiAdaptiveBand,
  resolveUiColorScheme,
  resolveUiDensity,
  resolveUiDirection,
  resolveUiPointerPrecision,
  UiEnvironmentProvider,
  uiEnvironmentStyle,
  useUiEnvironment,
  type UiEnvironmentSnapshot,
} from '../environment';

function Probe({ label }: { label: string }) {
  const environment = useUiEnvironment();
  return <output aria-label={label}>{JSON.stringify(environment)}</output>;
}

function readProbe(label: string) {
  return JSON.parse(screen.getByLabelText(label).textContent ?? '{}') as UiEnvironmentSnapshot;
}

describe('UI environment resolution', () => {
  it('resolves palette, density, direction and pointer preferences without device-name sniffing', () => {
    expect(resolveUiColorScheme('dark', 'auto', 'light')).toBe('dark');
    expect(resolveUiColorScheme('system', 'auto', 'light')).toBe('light');
    expect(resolveUiColorScheme('custom', 'auto', 'dark', 'light')).toBe('light');
    expect(resolveUiColorScheme('custom', 'dark', 'light')).toBe('dark');

    expect(resolveUiPointerPrecision('auto', true)).toBe('coarse');
    expect(resolveUiPointerPrecision('auto', false)).toBe('fine');
    expect(resolveUiDensity('auto', 'coarse')).toBe('comfortable');
    expect(resolveUiDensity('auto', 'fine')).toBe('compact');
    expect(resolveUiDensity('compact', 'coarse')).toBe('compact');

    expect(resolveUiDirection('auto', undefined, 'rtl')).toBe('rtl');
    expect(resolveUiDirection('ltr', undefined, 'rtl')).toBe('ltr');
  });

  it('derives adaptive bands from container inline size rather than viewport/device labels', () => {
    expect(resolveUiAdaptiveBand(320)).toBe('compact');
    expect(resolveUiAdaptiveBand(480)).toBe('compact');
    expect(resolveUiAdaptiveBand(481)).toBe('medium');
    expect(resolveUiAdaptiveBand(896)).toBe('medium');
    expect(resolveUiAdaptiveBand(897)).toBe('expanded');
    expect(resolveUiAdaptiveBand(1280)).toBe('expanded');
    expect(resolveUiAdaptiveBand(1281)).toBe('wide');
  });

  it('inherits scoped environment preferences while allowing nested capability overrides', () => {
    render(
      <UiEnvironmentProvider
        theme="light"
        direction="rtl"
        density="comfortable"
        modality="keyboard"
        pointerPrecision="fine"
        safeArea={{ blockStart: '12px' }}
        tokens={{ 'color-accent': '#123456' }}
      >
        <Probe label="outer" />
        <UiEnvironmentProvider
          density="auto"
          pointerPrecision="coarse"
          occlusion={{ blockEnd: '240px' }}
        >
          <Probe label="inner" />
        </UiEnvironmentProvider>
      </UiEnvironmentProvider>,
    );

    const outer = readProbe('outer');
    const inner = readProbe('inner');
    expect(outer).toMatchObject({
      theme: 'light',
      colorScheme: 'light',
      density: 'comfortable',
      direction: 'rtl',
      modality: 'keyboard',
      pointerPrecision: 'fine',
    });
    expect(inner).toMatchObject({
      theme: 'light',
      colorScheme: 'light',
      density: 'comfortable',
      densityPreference: 'auto',
      direction: 'rtl',
      modality: 'keyboard',
      pointerPrecision: 'coarse',
      safeArea: { blockStart: '12px' },
      occlusion: { blockEnd: '240px' },
      tokens: { 'color-accent': '#123456' },
    });
  });

  it('projects safe-area and transient occlusion as separate logical CSS inputs', () => {
    const style = uiEnvironmentStyle({
      theme: 'custom',
      colorScheme: 'dark',
      colorSchemePreference: 'dark',
      density: 'compact',
      densityPreference: 'compact',
      direction: 'rtl',
      directionPreference: 'rtl',
      modality: 'touch',
      modalityPreference: 'touch',
      pointerPrecision: 'coarse',
      pointerPrecisionPreference: 'coarse',
      safeArea: { inlineStart: '16px', blockEnd: '28px' },
      occlusion: { blockEnd: '280px' },
      tokens: {},
    });

    expect(style).toMatchObject({
      '--oxs-safe-inline-start': '16px',
      '--oxs-safe-block-end': '28px',
      '--oxs-occlusion-block-end': '280px',
    });
  });
});
