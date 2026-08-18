import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../index';
import {
  systemKeyboardLayouts,
  SystemKeyboardHost,
  type SystemKeyboardCommand,
  type SystemKeyboardSurfaceState,
} from '../SystemKeyboard';

const baseState: SystemKeyboardSurfaceState = {
  surfaceId: 'keyboard-main',
  sessionId: 'session-a',
  visible: true,
  language: 'en',
  layout: 'letters',
  contentPurpose: 'text',
  secure: false,
};

function renderKeyboard(state: SystemKeyboardSurfaceState = baseState, onCommand = vi.fn()) {
  render(
    <UiRoot>
      <div style={{ position: 'relative', width: 800, height: 420 }}>
        <SystemKeyboardHost state={state} onCommand={onCommand} />
      </div>
    </UiRoot>,
  );
  return onCommand;
}

afterEach(() => vi.useRealTimers());

describe('System touch keyboard', () => {
  it('uses compositor-owned visibility/session identity and emits typed commands instead of mutating an input', () => {
    const onCommand = renderKeyboard();
    const keyboard = screen.getByRole('group', { name: 'System touch keyboard' });
    expect(keyboard).toHaveAttribute('data-oxs-system-keyboard-surface-id', 'keyboard-main');
    expect(keyboard).toHaveAttribute('data-oxs-system-keyboard-session', 'session-a');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'q' }));
    expect(onCommand).toHaveBeenLastCalledWith({
      type: 'insert-text', surfaceId: 'keyboard-main', sessionId: 'session-a', keyId: 'en-r1-q', text: 'q', repeat: false,
    });
  });

  it('keeps Shift/Caps state in the System surface and consumes one-shot Shift after character output', () => {
    const onCommand = renderKeyboard();
    const shift = screen.getByRole('button', { name: 'Shift' });
    fireEvent.click(shift);
    expect(shift).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Q' }));
    expect(onCommand).toHaveBeenCalledWith(expect.objectContaining({ type: 'insert-text', text: 'Q' }));
    expect(shift).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(shift);
    fireEvent.click(shift);
    expect(screen.getByText('Caps')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Q' }));
    expect(shift).toHaveAttribute('aria-pressed', 'true');
  });

  it('uses the shared long-press path for alternates and suppresses alternates in secure mode', () => {
    vi.useFakeTimers();
    renderKeyboard();
    const e = screen.getByRole('button', { name: 'e' });
    fireEvent.pointerDown(e, { pointerId: 31, pointerType: 'touch', button: 0, isPrimary: true, clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(560));
    expect(screen.getByRole('group', { name: 'Alternates for e' })).toBeInTheDocument();

    cleanup();
    vi.useFakeTimers();
    renderKeyboard({ ...baseState, secure: true });
    expect(screen.getByText('Secure')).toBeInTheDocument();
    const secureE = screen.getByRole('button', { name: 'e' });
    fireEvent.pointerDown(secureE, { pointerId: 32, pointerType: 'touch', button: 0, isPrimary: true, clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(560));
    expect(screen.queryByRole('group', { name: 'Alternates for e' })).not.toBeInTheDocument();
  });

  it('repeats repeatable keys after shared long press and stops repeat when press ends', () => {
    vi.useFakeTimers();
    const onCommand = renderKeyboard();
    const backspace = screen.getByRole('button', { name: 'Backspace' });
    fireEvent.pointerDown(backspace, { pointerId: 41, pointerType: 'touch', button: 0, isPrimary: true, clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(760));
    const repeatsBeforeRelease = (onCommand.mock.calls as [SystemKeyboardCommand][]).filter(([command]) => command.type === 'backspace').length;
    expect(repeatsBeforeRelease).toBeGreaterThan(1);
    fireEvent.pointerUp(backspace, { pointerId: 41, pointerType: 'touch', button: 0, isPrimary: true, clientX: 0, clientY: 0 });
    act(() => vi.advanceTimersByTime(250));
    const repeatsAfterRelease = (onCommand.mock.calls as [SystemKeyboardCommand][]).filter(([command]) => command.type === 'backspace').length;
    expect(repeatsAfterRelease).toBe(repeatsBeforeRelease);
  });

  it('switches visual geometry by purpose/language without changing native lifecycle ownership', () => {
    const onCommand = renderKeyboard({ ...baseState, language: 'fa' });
    const keyboard = screen.getByRole('group', { name: 'System touch keyboard' });
    expect(keyboard).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('button', { name: 'ض' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Switch language' }));
    expect(onCommand).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'request-language', language: 'en' }));
  });

  it('uses a numeric-only plane for numeric purpose and hides entirely when native visibility is false', () => {
    renderKeyboard({ ...baseState, layout: 'numeric', contentPurpose: 'numeric' });
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'q' })).not.toBeInTheDocument();

    const { container } = render(
      <UiRoot><SystemKeyboardHost state={{ ...baseState, visible: false }} onCommand={() => undefined} /></UiRoot>,
    );
    expect(container.querySelector('[data-oxs-system-keyboard]')).toBeNull();
  });

  it('keeps layout/key identities stable and geometry-free in the model', () => {
    const layoutIds = systemKeyboardLayouts.map((layout) => layout.id);
    expect(new Set(layoutIds).size).toBe(layoutIds.length);
    for (const layout of systemKeyboardLayouts) {
      const ids = layout.rows.flat().map((key) => key.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const key of layout.rows.flat()) {
        expect(key).not.toHaveProperty('width');
        expect(key).not.toHaveProperty('x');
        expect(key).not.toHaveProperty('y');
      }
    }
  });
});
