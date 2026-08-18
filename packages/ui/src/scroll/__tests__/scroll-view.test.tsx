import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { ScrollSnapItem, ScrollView } from '../../components/ScrollView';
import {
  alignedSnapOffset,
  logicalHorizontalFromPhysical,
  physicalHorizontalFromLogical,
} from '../logicalPosition';

function setMetric(element: HTMLElement, key: 'clientHeight' | 'scrollHeight' | 'clientWidth' | 'scrollWidth', value: number) {
  Object.defineProperty(element, key, { configurable: true, value });
}

describe('ScrollView runtime contracts', () => {
  it('normalizes every RTL scrollLeft model into one logical inline position', () => {
    for (const type of ['negative', 'positive-descending', 'positive-ascending'] as const) {
      const physical = physicalHorizontalFromLogical(type, 100, 30);
      expect(logicalHorizontalFromPhysical(type, 100, physical)).toBe(30);
    }
    expect(physicalHorizontalFromLogical('negative', 100, 30)).toBe(-30);
    expect(physicalHorizontalFromLogical('positive-descending', 100, 30)).toBe(70);
    expect(physicalHorizontalFromLogical('positive-ascending', 100, 30)).toBe(30);
  });

  it('computes real start/center/end snap offsets from item and viewport geometry', () => {
    expect(alignedSnapOffset(100, 20, 60, 'start')).toBe(100);
    expect(alignedSnapOffset(100, 20, 60, 'center')).toBe(80);
    expect(alignedSnapOffset(100, 20, 60, 'end')).toBe(60);
  });

  it('direct-manipulates safely when the host has no Pointer Capture implementation', () => {
    render(
      <UiRoot>
        <ScrollView ariaLabel="Pointer-safe scroll">
          <ScrollSnapItem>One</ScrollSnapItem>
          <ScrollSnapItem align="center">Two</ScrollSnapItem>
        </ScrollView>
      </UiRoot>,
    );
    const viewport = screen.getByLabelText('Pointer-safe scroll');
    expect(() => {
      fireEvent.pointerDown(viewport, { pointerId: 7, pointerType: 'touch', clientY: 100 });
      fireEvent.pointerMove(viewport, { pointerId: 7, pointerType: 'touch', clientY: 70 });
      fireEvent.pointerUp(viewport, { pointerId: 7, pointerType: 'touch', clientY: 70 });
    }).not.toThrow();
  });

  it('lets wheel input chain to a native scrollable ancestor when already at its own edge', () => {
    render(
      <UiRoot>
        <div data-testid="native-scroll" style={{ overflowY: 'auto' }}>
          <ScrollView ariaLabel="Inner scroll">Content</ScrollView>
        </div>
      </UiRoot>,
    );
    const ancestor = screen.getByTestId('native-scroll');
    const viewport = screen.getByLabelText('Inner scroll');
    setMetric(ancestor, 'clientHeight', 100);
    setMetric(ancestor, 'scrollHeight', 300);
    setMetric(viewport, 'clientHeight', 100);
    setMetric(viewport, 'scrollHeight', 300);
    viewport.scrollTop = 0;

    expect(fireEvent.wheel(viewport, { deltaY: -40, deltaMode: 0 })).toBe(true);
  });

  it('preserves consumer pointer callbacks while direct manipulation owns the gesture', () => {
    const down = vi.fn();
    const move = vi.fn();
    const up = vi.fn();
    render(
      <UiRoot>
        <ScrollView ariaLabel="Callback scroll" onPointerDown={down} onPointerMove={move} onPointerUp={up}>
          Content
        </ScrollView>
      </UiRoot>,
    );
    const viewport = screen.getByLabelText('Callback scroll');
    fireEvent.pointerDown(viewport, { pointerId: 21, pointerType: 'touch', clientY: 100 });
    fireEvent.pointerMove(viewport, { pointerId: 21, pointerType: 'touch', clientY: 70 });
    fireEvent.pointerUp(viewport, { pointerId: 21, pointerType: 'touch', clientY: 70 });
    expect(down).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledTimes(1);
    expect(up).toHaveBeenCalledTimes(1);
  });

  it('keeps wheel ownership inside a parent OXS ScrollView before chaining to a native ancestor', () => {
    render(
      <UiRoot>
        <div data-testid="outer-native" style={{ overflowY: 'auto' }}>
          <ScrollView ariaLabel="Outer OXS">
            <ScrollView ariaLabel="Inner OXS">Inner content</ScrollView>
          </ScrollView>
        </div>
      </UiRoot>,
    );
    const native = screen.getByTestId('outer-native');
    const outer = screen.getByLabelText('Outer OXS');
    const inner = screen.getByLabelText('Inner OXS');
    for (const element of [native, outer, inner]) {
      setMetric(element, 'clientHeight', 100);
      setMetric(element, 'scrollHeight', 300);
    }
    inner.scrollTop = 0;
    outer.scrollTop = 100;
    expect(fireEvent.wheel(inner, { deltaY: -40, deltaMode: 0 })).toBe(false);
  });

});
