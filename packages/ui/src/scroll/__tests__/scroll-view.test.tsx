import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { ScrollSnapItem, ScrollView } from '../../components/ScrollView';
import {
  alignedSnapOffset,
  logicalHorizontalFromPhysical,
  logicalSnapItemStart,
  physicalHorizontalFromLogical,
} from '../logicalPosition';
import { consumeNativeScrollChain, findNativeScrollableAncestor } from '../nativeChain';

function setMetric(
  element: HTMLElement,
  key: 'clientHeight' | 'scrollHeight' | 'clientWidth' | 'scrollWidth',
  value: number,
) {
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

  it('derives nested variable-size snap starts from viewport-relative logical geometry', () => {
    const item = { top: 140, left: 230, right: 350 } as DOMRect;
    const viewport = { top: 100, left: 200, right: 500 } as DOMRect;
    expect(logicalSnapItemStart(item, viewport, 60, 'vertical', 'ltr')).toBe(100);
    expect(logicalSnapItemStart(item, viewport, 60, 'horizontal', 'ltr')).toBe(90);
    expect(logicalSnapItemStart(item, viewport, 60, 'horizontal', 'rtl')).toBe(210);
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

  it('deterministically chains exhausted wheel input to a native scrollable ancestor', () => {
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
    viewport.scrollTop = 200;
    ancestor.scrollTop = 0;

    expect(findNativeScrollableAncestor(viewport, 'vertical', 40)).toBe(ancestor);
    expect(fireEvent.wheel(viewport, { deltaY: 40, deltaMode: 0 })).toBe(false);
    expect(ancestor.scrollTop).toBe(40);
    ancestor.scrollTop = 0;
    expect(consumeNativeScrollChain(viewport, 'vertical', 40)).toEqual({
      position: 40,
      consumed: 40,
      overflow: 0,
    });
    expect(ancestor.scrollTop).toBe(40);
  });

  it('does not jump across a nearer native scroll owner to a farther OXS ScrollView', () => {
    render(
      <UiRoot>
        <ScrollView ariaLabel="Far outer OXS">
          <div data-testid="near-native" style={{ overflowY: 'auto' }}>
            <ScrollView ariaLabel="Boundary inner OXS">Inner content</ScrollView>
            <div style={{ height: 300 }}>Native continuation</div>
          </div>
          <div style={{ height: 300 }}>Outer continuation</div>
        </ScrollView>
      </UiRoot>,
    );

    const outer = screen.getByLabelText('Far outer OXS');
    const native = screen.getByTestId('near-native');
    const inner = screen.getByLabelText('Boundary inner OXS');
    for (const element of [outer, native, inner]) {
      setMetric(element, 'clientHeight', 100);
      setMetric(element, 'scrollHeight', 300);
    }
    inner.scrollTop = 200;
    native.scrollTop = 0;
    outer.scrollTop = 0;

    expect(fireEvent.wheel(inner, { deltaY: 40, deltaMode: 0 })).toBe(false);
    expect(native.scrollTop).toBe(40);
    expect(outer.scrollTop).toBe(0);
  });

  it('preserves consumer pointer callbacks while direct manipulation owns the gesture', () => {
    const down = vi.fn();
    const move = vi.fn();
    const up = vi.fn();
    render(
      <UiRoot>
        <ScrollView
          ariaLabel="Callback scroll"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
        >
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
