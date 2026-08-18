import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive/UiRoot';
import { TextField } from '../../components/TextField';
import { configureUiClipboardAdapter } from '../clipboard';

afterEach(() => {
  configureUiClipboardAdapter(undefined);
  vi.restoreAllMocks();
});

describe('UI editable text contract', () => {
  it('exposes content purpose, selection and composition through one field contract', () => {
    const state = vi.fn();
    render(
      <TextField
        label="Email"
        defaultValue="hello@example.com"
        contentPurpose="email"
        onEditingStateChange={state}
      />,
    );
    const input = screen.getByLabelText('Email') as HTMLInputElement;
    input.setSelectionRange(1, 5, 'forward');
    fireEvent.select(input);
    fireEvent.compositionStart(input, { data: '候' });

    expect(input).toHaveAttribute('data-oxs-content-purpose', 'email');
    expect(input).toHaveAttribute('inputmode', 'email');
    expect(state).toHaveBeenCalledWith(
      expect.objectContaining({
        selection: expect.objectContaining({ start: 1, end: 5 }),
        contentPurpose: 'email',
        secure: false,
      }),
    );
    expect(state).toHaveBeenCalledWith(expect.objectContaining({ composing: true, preedit: '候' }));
  });

  it('copies and cuts through the injected platform clipboard adapter', () => {
    const writes: string[] = [];
    configureUiClipboardAdapter({
      isAvailable: () => true,
      readText: async () => '',
      writeText: (text) => {
        writes.push(text);
        return true;
      },
    });
    render(<TextField label="Name" defaultValue="alpha beta" />);
    const input = screen.getByLabelText('Name') as HTMLInputElement;

    input.setSelectionRange(0, 5);
    fireEvent.keyDown(input, { key: 'c', ctrlKey: true });
    expect(writes).toEqual(['alpha']);

    input.setSelectionRange(6, 10);
    fireEvent.keyDown(input, { key: 'x', ctrlKey: true });
    expect(writes).toEqual(['alpha', 'beta']);
    expect(input.value).toBe('alpha ');
  });

  it('pastes a request-scoped response from the injected platform clipboard adapter', async () => {
    configureUiClipboardAdapter({
      isAvailable: () => true,
      readText: async () => 'world',
      writeText: () => true,
    });
    render(<TextField label="Paste target" defaultValue="hello " />);
    const input = screen.getByLabelText('Paste target') as HTMLInputElement;
    fireEvent.focus(input);
    input.setSelectionRange(6, 6);

    fireEvent.keyDown(input, { key: 'v', ctrlKey: true });
    await waitFor(() => expect(input.value).toBe('hello world'));
  });

  it('prevents copy and cut from secure fields', () => {
    const writeText = vi.fn(() => true);
    configureUiClipboardAdapter({
      isAvailable: () => true,
      readText: async () => '',
      writeText,
    });
    render(<TextField label="Password" defaultValue="secret" secure />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    input.select();

    fireEvent.keyDown(input, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(input, { key: 'x', ctrlKey: true });

    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('data-oxs-secure', 'true');
    expect(writeText).not.toHaveBeenCalled();
    expect(input.value).toBe('secret');
  });

  it('blocks secure copy/cut from context-menu events as well as keyboard shortcuts', () => {
    const writeText = vi.fn(() => true);
    configureUiClipboardAdapter({
      isAvailable: () => true,
      readText: async () => '',
      writeText,
    });
    render(<TextField label="Secure" defaultValue="secret" secure />);
    const input = screen.getByLabelText('Secure') as HTMLInputElement;
    input.select();

    expect(fireEvent.copy(input)).toBe(false);
    expect(fireEvent.cut(input)).toBe(false);
    expect(writeText).not.toHaveBeenCalled();
    expect(input.value).toBe('secret');
  });

  it('ends the active editing session when a focused field unmounts', () => {
    const end = vi.fn();
    const { rerender } = render(
      <UiRoot editingBridge={{ end }}>
        <TextField label="Transient field" defaultValue="abc" />
      </UiRoot>,
    );
    fireEvent.focus(screen.getByLabelText('Transient field'));
    rerender(<UiRoot editingBridge={{ end }}><div>Gone</div></UiRoot>);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('drops a delayed paste response after the field value or selection changes', async () => {
    let resolvePaste!: (value: string) => void;
    const readText = vi.fn(() => new Promise<string>((resolve) => { resolvePaste = resolve; }));
    render(
      <UiRoot clipboardAdapter={{ isAvailable: () => true, readText, writeText: () => true }}>
        <TextField label="Race target" defaultValue="hello" />
      </UiRoot>,
    );
    const input = screen.getByLabelText('Race target') as HTMLInputElement;
    fireEvent.focus(input);
    input.setSelectionRange(5, 5);
    fireEvent.keyDown(input, { key: 'v', ctrlKey: true });
    fireEvent.change(input, { target: { value: 'hello!' } });
    input.setSelectionRange(6, 6);
    fireEvent.select(input);
    resolvePaste(' stale');
    await waitFor(() => expect(readText).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(input.value).toBe('hello!');
  });

  it('keeps clipboard transport scoped to the owning UiRoot', () => {
    const leftWrites: string[] = [];
    const rightWrites: string[] = [];
    render(
      <>
        <UiRoot clipboardAdapter={{
          isAvailable: () => true,
          readText: async () => '',
          writeText: (text) => { leftWrites.push(text); return true; },
        }}>
          <TextField label="Left" defaultValue="alpha" />
        </UiRoot>
        <UiRoot clipboardAdapter={{
          isAvailable: () => true,
          readText: async () => '',
          writeText: (text) => { rightWrites.push(text); return true; },
        }}>
          <TextField label="Right" defaultValue="beta" />
        </UiRoot>
      </>,
    );
    const left = screen.getByLabelText('Left') as HTMLInputElement;
    const right = screen.getByLabelText('Right') as HTMLInputElement;
    left.select();
    right.select();
    fireEvent.keyDown(left, { key: 'c', ctrlKey: true });
    fireEvent.keyDown(right, { key: 'c', ctrlKey: true });
    expect(leftWrites).toEqual(['alpha']);
    expect(rightWrites).toEqual(['beta']);
  });

});

it('publishes a backend-neutral editing session through UiRoot', () => {
  const begin = vi.fn();
  const update = vi.fn();
  const end = vi.fn();
  render(
    <UiRoot editingBridge={{ begin, update, end }}>
      <TextField label="Session field" defaultValue="abc" />
    </UiRoot>,
  );
  const input = screen.getByLabelText('Session field') as HTMLInputElement;
  fireEvent.focus(input);
  input.setSelectionRange(1, 2);
  fireEvent.select(input);
  fireEvent.blur(input);
  expect(begin).toHaveBeenCalledWith(expect.objectContaining({ state: expect.objectContaining({ valueLength: 3 }) }));
  expect(update).toHaveBeenCalledWith(expect.objectContaining({ state: expect.objectContaining({ selection: expect.objectContaining({ start: 1, end: 2 }) }) }));
  expect(end).toHaveBeenCalledTimes(1);
});
