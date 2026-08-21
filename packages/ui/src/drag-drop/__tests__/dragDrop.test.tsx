import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { ScrollView } from '../../components';
import { autoScrollDelta, DragDropProvider } from '../runtime';
import { cursorRoleForDragOperation } from '../types';
import { useDragSource } from '../useDragSource';
import { useDropTarget } from '../useDropTarget';

function pointerEvent(
  type: string,
  { pointerId = 1, pointerType = 'mouse', clientX = 0, clientY = 0 }: Partial<PointerEvent> = {},
) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, clientY });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: pointerId },
    pointerType: { configurable: true, value: pointerType },
    isPrimary: { configurable: true, value: true },
  });
  return event;
}

describe('UI Kit drag/drop runtime', () => {
  it('maps the shared operation vocabulary to centralized cursor feedback', () => {
    expect(cursorRoleForDragOperation('copy')).toBe('drag-copy');
    expect(cursorRoleForDragOperation('move')).toBe('drag-move');
    expect(cursorRoleForDragOperation('none')).toBe('no-drop');
  });

  it('computes bounded edge autoscroll in both directions', () => {
    expect(autoScrollDelta(2, 0, 200)).toBeLessThan(0);
    expect(autoScrollDelta(100, 0, 200)).toBe(0);
    expect(autoScrollDelta(198, 0, 200)).toBeGreaterThan(0);
  });

  it('keeps a captured pointer drag alive and resolves one registered drop target', () => {
    const onDrop = vi.fn();

    function Fixture() {
      const sourceProps = useDragSource({
        id: 'source',
        item: { id: 'document-1', type: 'document', label: 'Document' },
        threshold: 4,
      });
      const targetProps = useDropTarget({ id: 'target', operation: 'copy', onDrop });
      return (
        <>
          <button {...sourceProps}>Source</button>
          <div {...targetProps}>Target</div>
        </>
      );
    }

    render(
      <DragDropProvider>
        <Fixture />
      </DragDropProvider>,
    );

    const source = screen.getByText('Source');
    const target = screen.getByText('Target');
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 80,
      y: 80,
      left: 80,
      top: 80,
      right: 180,
      bottom: 180,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent(source, pointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    fireEvent(source, pointerEvent('pointermove', { clientX: 100, clientY: 100 }));
    fireEvent(source, pointerEvent('pointerup', { clientX: 100, clientY: 100 }));

    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'document-1', type: 'document' }),
      'copy',
    );
  });

  it('continues pointer drag on the owner Window when Pointer Capture is unavailable', () => {
    const onDrop = vi.fn();

    function Fixture() {
      const sourceProps = useDragSource({
        id: 'continuation-source',
        item: { id: 'continuation-item', type: 'document', label: 'Continuation item' },
        threshold: 2,
      });
      const targetProps = useDropTarget({ id: 'continuation-target', operation: 'move', onDrop });
      return (
        <>
          <button {...sourceProps}>Continuation source</button>
          <button {...targetProps}>Continuation target</button>
        </>
      );
    }

    render(
      <UiRoot>
        <Fixture />
      </UiRoot>,
    );
    const source = screen.getByRole('button', { name: 'Continuation source' });
    const target = screen.getByRole('button', { name: 'Continuation target' });
    Object.defineProperties(source, {
      setPointerCapture: { configurable: true, value: undefined },
      hasPointerCapture: { configurable: true, value: undefined },
      releasePointerCapture: { configurable: true, value: undefined },
    });
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 80,
      y: 80,
      left: 80,
      top: 80,
      right: 180,
      bottom: 180,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });

    fireEvent(source, pointerEvent('pointerdown', { pointerId: 71, clientX: 10, clientY: 10 }));
    act(() => {
      window.dispatchEvent(
        pointerEvent('pointermove', { pointerId: 71, clientX: 110, clientY: 110 }),
      );
    });
    expect(screen.getByText('Continuation item')).toHaveClass('ui-drag-preview');
    act(() => {
      window.dispatchEvent(
        pointerEvent('pointerup', { pointerId: 71, clientX: 110, clientY: 110 }),
      );
    });
    expect(onDrop).toHaveBeenCalledTimes(1);
    expect(onDrop).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'continuation-item' }),
      'move',
    );
  });

  it('keeps pointer drag previews inside the owning UiRoot portal scope', () => {
    function Fixture() {
      const sourceProps = useDragSource({
        id: 'preview-source',
        item: { id: 'document-2', type: 'document', label: 'Document two' },
        preview: 'Scoped preview',
        threshold: 2,
      });
      return <button {...sourceProps}>Preview source</button>;
    }

    render(
      <UiRoot>
        <Fixture />
      </UiRoot>,
    );

    const source = screen.getByText('Preview source');
    fireEvent(source, pointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    fireEvent(source, pointerEvent('pointermove', { clientX: 30, clientY: 30 }));

    const preview = screen.getByText('Scoped preview');
    expect(preview).toHaveClass('ui-drag-preview');
    expect(preview.closest('[data-oxs-portal-root]')).not.toBeNull();

    fireEvent(source, pointerEvent('pointercancel', { clientX: 30, clientY: 30 }));
  });

  it('abandons touch drag-start when movement turns the same pointer stream into scrolling', () => {
    function Fixture() {
      const sourceProps = useDragSource({
        id: 'touch-source',
        item: { id: 'touch-document', type: 'document', label: 'Touch document' },
        preview: 'Should not drag',
        threshold: 4,
        touchLongPressMs: 300,
      });
      return (
        <ScrollView ariaLabel="Touch scroll competition">
          <button {...sourceProps}>Touch source</button>
        </ScrollView>
      );
    }

    render(
      <UiRoot>
        <Fixture />
      </UiRoot>,
    );
    const source = screen.getByRole('button', { name: 'Touch source' });
    fireEvent(
      source,
      pointerEvent('pointerdown', {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 10,
        clientY: 80,
      }),
    );
    fireEvent(
      source,
      pointerEvent('pointermove', {
        pointerId: 11,
        pointerType: 'touch',
        clientX: 10,
        clientY: 50,
      }),
    );

    expect(screen.queryByText('Should not drag')).not.toBeInTheDocument();
    expect(source.closest('.ui-drag-drop-runtime')).toHaveAttribute(
      'data-oxs-drag-active',
      'false',
    );
    fireEvent(
      source,
      pointerEvent('pointerup', { pointerId: 11, pointerType: 'touch', clientX: 10, clientY: 50 }),
    );
  });

  it('continues edge autoscroll on animation frames while the drag pointer stays still', () => {
    vi.useFakeTimers();
    const originalDescriptor = Object.getOwnPropertyDescriptor(document, 'elementFromPoint');
    const scrollable = document.createElement('div');
    scrollable.style.overflowY = 'auto';
    const scrollBy = vi.fn();
    Object.defineProperties(scrollable, {
      clientHeight: { configurable: true, value: 100 },
      scrollHeight: { configurable: true, value: 500 },
      scrollBy: { configurable: true, value: scrollBy },
    });
    vi.spyOn(scrollable, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      toJSON: () => ({}),
    });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => scrollable),
    });

    function Fixture() {
      const sourceProps = useDragSource({
        id: 'auto-scroll-source',
        item: { id: 'document-3', type: 'document', label: 'Auto-scroll document' },
        threshold: 2,
      });
      return <button {...sourceProps}>Auto-scroll source</button>;
    }

    try {
      render(
        <DragDropProvider>
          <Fixture />
        </DragDropProvider>,
      );
      const source = screen.getByRole('button', { name: 'Auto-scroll source' });
      fireEvent(source, pointerEvent('pointerdown', { clientX: 50, clientY: 94 }));
      fireEvent(source, pointerEvent('pointermove', { clientX: 50, clientY: 98 }));
      act(() => vi.advanceTimersByTime(70));
      expect(scrollBy.mock.calls.length).toBeGreaterThan(1);
      fireEvent(source, pointerEvent('pointercancel', { clientX: 50, clientY: 98 }));
    } finally {
      if (originalDescriptor)
        Object.defineProperty(document, 'elementFromPoint', originalDescriptor);
      else Reflect.deleteProperty(document, 'elementFromPoint');
    }
  });

  it('keeps one drag session authoritative across multiple pointer sources', () => {
    function Fixture() {
      const first = useDragSource({
        id: 'first-source',
        item: { id: 'first', type: 'document', label: 'First item' },
        preview: 'First preview',
        threshold: 2,
      });
      const second = useDragSource({
        id: 'second-source',
        item: { id: 'second', type: 'document', label: 'Second item' },
        preview: 'Second preview',
        threshold: 2,
      });
      return (
        <>
          <button {...first}>First source</button>
          <button {...second}>Second source</button>
        </>
      );
    }
    render(
      <UiRoot>
        <Fixture />
      </UiRoot>,
    );
    const first = screen.getByRole('button', { name: 'First source' });
    const second = screen.getByRole('button', { name: 'Second source' });
    fireEvent(first, pointerEvent('pointerdown', { pointerId: 31, clientX: 5, clientY: 5 }));
    fireEvent(first, pointerEvent('pointermove', { pointerId: 31, clientX: 15, clientY: 15 }));
    expect(screen.getByText('First preview')).toBeInTheDocument();
    fireEvent(second, pointerEvent('pointerdown', { pointerId: 32, clientX: 5, clientY: 5 }));
    fireEvent(second, pointerEvent('pointermove', { pointerId: 32, clientX: 20, clientY: 20 }));
    expect(screen.queryByText('Second preview')).not.toBeInTheDocument();
    expect(screen.getByText('First preview')).toBeInTheDocument();
    fireEvent(first, pointerEvent('pointercancel', { pointerId: 31, clientX: 15, clientY: 15 }));
  });
});
