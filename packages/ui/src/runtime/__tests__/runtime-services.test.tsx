import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive/UiRoot';
import { useCursorRuntime } from '../../cursor';
import { useDragSource, useDropTarget } from '../../drag-drop';

function CursorProbe() {
  const cursor = useCursorRuntime();
  return <output data-testid="cursor">{cursor.modality}:{cursor.pointerVisible ? 'visible' : 'hidden'}</output>;
}

function KeyboardDragFixture({ onDrop }: { onDrop: () => void }) {
  const source = useDragSource({ id: 'source', item: { id: 'source', type: 'item', label: 'Source' } });
  const target = useDropTarget({ id: 'target', operation: 'move', onDrop });
  return <><button {...source}>Source</button><button {...target}>Target</button></>;
}

describe('UIP04 runtime integration', () => {
  it('derives cursor visibility from the shared environment modality', () => {
    const { rerender } = render(<UiRoot modality="touch"><CursorProbe /></UiRoot>);
    expect(screen.getByTestId('cursor')).toHaveTextContent('touch:hidden');
    rerender(<UiRoot modality="mouse"><CursorProbe /></UiRoot>);
    expect(screen.getByTestId('cursor')).toHaveTextContent('pointer:visible');
  });

  it('supports keyboard drag selection and drop through the shared runtime', async () => {
    const onDrop = vi.fn();
    render(<UiRoot><KeyboardDragFixture onDrop={onDrop} /></UiRoot>);
    const source = screen.getByText('Source');
    fireEvent.keyDown(source, { key: ' ' });
    await Promise.resolve();
    fireEvent.keyDown(source, { key: 'Enter' });
    expect(onDrop).toHaveBeenCalledTimes(1);
  });
});
