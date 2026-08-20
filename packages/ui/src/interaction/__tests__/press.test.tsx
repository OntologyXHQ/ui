import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePress } from '../press';

function PressHarness({
  onPress,
  onClick,
  disabled = false,
}: {
  onPress: () => void;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { pressProps, pressed } = usePress({ onPress, disabled });
  return (
    <div
      {...pressProps}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      onClick={onClick}
      data-testid="press-target"
    >
      {pressed ? 'Pressed' : 'Idle'}
    </div>
  );
}

function pointerSequence(target: HTMLElement, pointerId = 7) {
  fireEvent.pointerDown(target, {
    pointerId,
    pointerType: 'mouse',
    button: 0,
    isPrimary: true,
    clientX: 10,
    clientY: 10,
  });
  fireEvent.pointerUp(target, {
    pointerId,
    pointerType: 'mouse',
    button: 0,
    isPrimary: true,
    clientX: 10,
    clientY: 10,
  });
}

describe('press pointer-capture capability', () => {
  it('activates without requiring Pointer Capture APIs from the host', () => {
    const onPress = vi.fn();
    render(<PressHarness onPress={onPress} />);
    const target = screen.getByTestId('press-target');

    Object.defineProperties(target, {
      setPointerCapture: { configurable: true, value: undefined },
      hasPointerCapture: { configurable: true, value: undefined },
      releasePointerCapture: { configurable: true, value: undefined },
    });

    expect(() => pointerSequence(target)).not.toThrow();
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('suppresses the synthesized click after a cancelled pointer press', () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    render(<PressHarness onPress={onPress} onClick={onClick} />);
    const target = screen.getByTestId('press-target');

    fireEvent.pointerDown(target, {
      pointerId: 17,
      pointerType: 'touch',
      button: 0,
      isPrimary: true,
      clientX: 4,
      clientY: 4,
    });
    fireEvent.pointerCancel(target, { pointerId: 17, pointerType: 'touch', isPrimary: true });
    fireEvent.click(target);

    expect(onPress).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('cancels an active pointer transaction when disabled changes before release', () => {
    const onPress = vi.fn();
    const onClick = vi.fn();
    const { rerender } = render(<PressHarness onPress={onPress} onClick={onClick} />);
    const target = screen.getByTestId('press-target');

    fireEvent.pointerDown(target, {
      pointerId: 23,
      pointerType: 'touch',
      button: 0,
      isPrimary: true,
      clientX: 8,
      clientY: 8,
    });
    expect(target).toHaveAttribute('data-pressed', 'true');

    rerender(<PressHarness onPress={onPress} onClick={onClick} disabled />);
    expect(target).not.toHaveAttribute('data-pressed');
    fireEvent.pointerUp(target, { pointerId: 23, pointerType: 'touch', isPrimary: true });
    fireEvent.click(target);

    expect(onPress).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses Pointer Capture when the host exposes it', () => {
    const onPress = vi.fn();
    render(<PressHarness onPress={onPress} />);
    const target = screen.getByTestId('press-target');
    const setPointerCapture = vi.fn();
    const hasPointerCapture = vi.fn(() => true);
    const releasePointerCapture = vi.fn();

    Object.defineProperties(target, {
      setPointerCapture: { configurable: true, value: setPointerCapture },
      hasPointerCapture: { configurable: true, value: hasPointerCapture },
      releasePointerCapture: { configurable: true, value: releasePointerCapture },
    });

    pointerSequence(target, 11);
    expect(setPointerCapture).toHaveBeenCalledWith(11);
    expect(hasPointerCapture).toHaveBeenCalledWith(11);
    expect(releasePointerCapture).toHaveBeenCalledWith(11);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
