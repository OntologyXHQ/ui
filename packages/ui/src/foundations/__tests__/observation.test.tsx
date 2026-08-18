import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { observeElementSize, useObservedElementSize } from '../observation';

describe('shared UI observation service', () => {
  it('publishes an initial measurement through the canonical observer entry point', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, right: 120, bottom: 48, width: 120, height: 48,
      toJSON: () => ({}),
    });
    const listener = vi.fn();
    const stop = observeElementSize(element, listener);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ inlineSize: 120, blockSize: 48 }));
    stop();
  });

  it('observes the initial committed ref target and follows the same RefObject to a replacement element', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getRect(this: HTMLElement) {
      const width = Number(this.dataset.auditWidth ?? 0);
      return {
        x: 0, y: 0, top: 0, left: 0, right: width, bottom: 20, width, height: 20,
        toJSON: () => ({}),
      };
    });

    function Harness() {
      const [second, setSecond] = useState(false);
      const ref = useRef<HTMLDivElement>(null);
      const size = useObservedElementSize(ref);
      return (
        <>
          <button type="button" onClick={() => setSecond(true)}>Swap</button>
          {second
            ? <div key="second" ref={ref} data-audit-width="240" />
            : <div key="first" ref={ref} data-audit-width="120" />}
          <output aria-label="Observed width">{size?.width ?? 'none'}</output>
        </>
      );
    }

    render(<Harness />);
    expect(screen.getByLabelText('Observed width')).toHaveTextContent('120');
    fireEvent.click(screen.getByRole('button', { name: 'Swap' }));
    expect(screen.getByLabelText('Observed width')).toHaveTextContent('240');
  });
});
