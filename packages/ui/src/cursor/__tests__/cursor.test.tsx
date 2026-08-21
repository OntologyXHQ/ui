import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UiRoot } from '../../adaptive/UiRoot';
import { CursorRegion, cursorRoleAttributes } from '../CursorRegion';
import { normalizeCursorRuntimeConfig } from '../types';

describe('UIR12 cursor contract', () => {
  it('normalizes host-neutral theme, scale, hotspot and pointer-restoration bounds', () => {
    expect(
      normalizeCursorRuntimeConfig({
        theme: '  studio  ',
        nominalSize: 32,
        scale: 1.5,
        hotspot: { x: 7, y: 99 },
        pointerRestoreDistance: -4,
      }),
    ).toEqual(
      expect.objectContaining({
        theme: 'studio',
        nominalSize: 32,
        scale: 1.5,
        hotspot: { x: 7, y: 32 },
        pointerRestoreDistance: 0,
      }),
    );
  });

  it('preserves custom host intent while exposing a browser-safe fallback role', () => {
    expect(cursorRoleAttributes('custom:precision-crosshair')).toEqual({
      'data-oxs-cursor-role': 'default',
      'data-oxs-cursor-intent': 'custom:precision-crosshair',
    });
    render(
      <CursorRegion role="custom:precision-crosshair">
        <span>Precision region</span>
      </CursorRegion>,
    );
    const region = screen.getByText('Precision region').parentElement;
    expect(region).toHaveAttribute('data-oxs-cursor-role', 'default');
    expect(region).toHaveAttribute('data-oxs-cursor-intent', 'custom:precision-crosshair');
  });

  it('suppresses auto pointer presentation after touch and restores it only after meaningful mouse travel', () => {
    render(
      <UiRoot className="auto-cursor-root" cursor={{ pointerRestoreDistance: 10 }}>
        <CursorRegion role="pointer">Auto cursor region</CursorRegion>
      </UiRoot>,
    );
    const root = document.querySelector('.auto-cursor-root');
    expect(root).toHaveAttribute('data-oxs-pointer-visible', 'true');

    fireEvent.pointerDown(window, { pointerType: 'touch', clientX: 10, clientY: 10 });
    expect(root).toHaveAttribute('data-oxs-pointer-suppressed', 'true');
    expect(root).toHaveAttribute('data-oxs-pointer-visible', 'false');

    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 14, clientY: 10 });
    expect(root).toHaveAttribute('data-oxs-pointer-visible', 'false');
    fireEvent.pointerMove(window, { pointerType: 'mouse', clientX: 24, clientY: 10 });
    expect(root).toHaveAttribute('data-oxs-pointer-suppressed', 'false');
    expect(root).toHaveAttribute('data-oxs-pointer-visible', 'true');
  });

  it('projects independent cursor state and hotspot intent through nested UiRoots', () => {
    render(
      <UiRoot
        className="outer-cursor-root"
        modality="touch"
        cursor={{ theme: 'outer', nominalSize: 32, scale: 1.5, hotspot: { x: 6, y: 8 } }}
      >
        <CursorRegion role="grab">Outer region</CursorRegion>
        <UiRoot className="inner-cursor-root" modality="mouse" cursor={{ theme: 'inner' }}>
          <CursorRegion role="pointer">Inner region</CursorRegion>
        </UiRoot>
      </UiRoot>,
    );
    const outer = document.querySelector('.outer-cursor-root');
    const inner = document.querySelector('.inner-cursor-root');
    expect(outer).toHaveAttribute('data-oxs-pointer-visible', 'false');
    expect(outer).toHaveAttribute('data-oxs-cursor-theme', 'outer');
    expect(outer).toHaveAttribute('data-oxs-cursor-hotspot', '6,8');
    expect(inner).toHaveAttribute('data-oxs-pointer-visible', 'true');
    expect(inner).toHaveAttribute('data-oxs-cursor-theme', 'inner');
  });
});
