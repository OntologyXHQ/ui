import { fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { ActionGroup, Button, IconButton, Toolbar } from '..';

function renderUi(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('accepted UIR06 action contracts', () => {
  it('preserves native form type semantics and loading cancellation while separating emphasis from destructive intent', () => {
    const submit = vi.fn((event: FormEvent<HTMLFormElement>) => event.preventDefault());
    renderUi(<form onSubmit={submit}><Button type="submit" variant="primary">Save</Button><Button intent="destructive" variant="secondary">Delete</Button><Button loading loadingLabel="Saving changes">Saving</Button></form>);
    const save = screen.getByRole('button', { name: 'Save' });
    const remove = screen.getByRole('button', { name: 'Delete' });
    const loading = screen.getByRole('button', { name: 'Saving changes' });
    expect(save).toHaveAttribute('type', 'submit');
    expect(remove).toHaveClass('ui-button--intent-destructive', 'ui-button--secondary');
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(save);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('links IconButton tooltip text without using it as the accessible-name source and preserves toggle semantics', () => {
    renderUi(<IconButton icon="settings" label="Settings" tooltip="Open workspace settings" defaultPressed />);
    const button = screen.getByRole('button', { name: 'Settings' });
    const tooltip = screen.getByRole('tooltip');
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps ActionGroup semantic-only and Toolbar owns one roving tab stop including pinned overflow', () => {
    renderUi(<Toolbar label="Editor" overflow={<Button>More</Button>}><ActionGroup label="Editing"><Button>Undo</Button><Button>Redo</Button><Button disabled>Cut</Button></ActionGroup></Toolbar>);
    expect(screen.getByRole('group', { name: 'Editing' })).toBeInTheDocument();
    const toolbar = screen.getByRole('toolbar', { name: 'Editor' });
    const undo = screen.getByRole('button', { name: 'Undo' });
    const redo = screen.getByRole('button', { name: 'Redo' });
    const more = screen.getByRole('button', { name: 'More' });
    expect([undo, redo, more].filter((item) => item.tabIndex === 0)).toHaveLength(1);
    undo.focus();
    fireEvent.keyDown(toolbar, { key: 'ArrowRight' });
    expect(redo).toHaveFocus();
    fireEvent.keyDown(toolbar, { key: 'End' });
    expect(more).toHaveFocus();
    fireEvent.keyDown(toolbar, { key: 'Home' });
    expect(undo).toHaveFocus();
  });
});
