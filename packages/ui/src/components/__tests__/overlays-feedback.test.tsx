import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { gestureArena } from '../../gestures/arena';
import {
  AlertDialog,
  Banner,
  ContextMenu,
  Dialog,
  Menu,
  MenuItem,
  Popover,
  ToastHost,
  Tooltip,
  Button,
  useToastQueue,
} from '../index';

afterEach(() => {
  vi.useRealTimers();
});

function wrap(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('overlay and transient feedback components', () => {
  it('shares modal dismissal and focus restoration through Dialog', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open</button>
          <Dialog open={open} onOpenChange={setOpen} title="Preferences">
            <button type="button">Inside</button>
          </Dialog>
        </>
      );
    }
    wrap(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Preferences' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal overlays in the UiRoot portal and isolates underlying UI', () => {
    function Harness() {
      return (
        <>
          <button type="button">Outside action</button>
          <Dialog open onOpenChange={() => {}} title="Portal dialog">
            <textarea aria-label="Notes" data-autofocus />
          </Dialog>
        </>
      );
    }
    wrap(<Harness />);
    const dialog = screen.getByRole('dialog', { name: 'Portal dialog' });
    expect(dialog.closest('[data-oxs-portal-root]')).toBeInTheDocument();
    const outside = screen.getByText('Outside action', { selector: 'button' });
    expect(outside.closest('.ui-drag-drop-runtime')).toHaveAttribute('inert');
  });


  it('moves focus into a modal Popover before isolating its focused background', async () => {
    const user = userEvent.setup();
    function Harness() {
      const anchorRef = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button ref={anchorRef} onClick={() => setOpen(true)}>Open modal popover</Button>
          <Popover
            open={open}
            onOpenChange={setOpen}
            anchorRef={anchorRef}
            ariaLabel="Modal popover"
            modal
            autoFocus={false}
          >
            Modal content
          </Popover>
        </>
      );
    }

    wrap(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open modal popover' });
    await user.click(trigger);
    const popover = screen.getByRole('dialog', { name: 'Modal popover' });
    const backgroundRuntime = trigger.closest<HTMLElement>('.ui-drag-drop-runtime');

    expect(popover).toHaveAttribute('tabindex', '-1');
    expect(document.activeElement).toBe(popover);
    expect(backgroundRuntime).toHaveAttribute('inert');
    expect(backgroundRuntime).toHaveAttribute('aria-hidden', 'true');
    expect(backgroundRuntime?.contains(document.activeElement)).toBe(false);
  });

  it('keeps modal lock and isolation correct when a lower modal closes out of order', () => {
    function Harness() {
      const [lowerOpen, setLowerOpen] = useState(true);
      const [upperOpen, setUpperOpen] = useState(true);
      return (
        <>
          <button type="button">Background</button>
          <Dialog open={lowerOpen} onOpenChange={setLowerOpen} title="Lower modal">
            Lower content
          </Dialog>
          <Dialog open={upperOpen} onOpenChange={setUpperOpen} title="Upper modal">
            <button type="button" onClick={() => setLowerOpen(false)}>Close lower</button>
            <button type="button" onClick={() => setUpperOpen(false)}>Close upper</button>
          </Dialog>
        </>
      );
    }

    const { container } = wrap(<Harness />);
    const root = container.querySelector<HTMLElement>('.ui-root');
    const backgroundRuntime = screen.getByText('Background', { selector: 'button' }).closest<HTMLElement>('.ui-drag-drop-runtime');
    expect(root?.style.overflow).toBe('hidden');
    expect(backgroundRuntime).toHaveAttribute('inert');

    fireEvent.click(screen.getByRole('button', { name: 'Close lower' }));
    expect(screen.queryByRole('dialog', { name: 'Lower modal' })).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Upper modal' })).toBeInTheDocument();
    expect(root?.style.overflow).toBe('hidden');
    expect(backgroundRuntime).toHaveAttribute('inert');

    fireEvent.click(screen.getByRole('button', { name: 'Close upper' }));
    expect(root?.style.overflow).toBe('');
    expect(backgroundRuntime).not.toHaveAttribute('inert');
  });

  it('arbitrates Escape across independent UiRoots without sharing modal state', () => {
    function RootDialog({ name }: { name: string }) {
      const [open, setOpen] = useState(true);
      return <Dialog open={open} onOpenChange={setOpen} title={name}>Content</Dialog>;
    }

    render(
      <>
        <UiRoot><RootDialog name="First root dialog" /></UiRoot>
        <UiRoot><RootDialog name="Second root dialog" /></UiRoot>
      </>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('dialog', { name: 'First root dialog' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Second root dialog' })).not.toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'First root dialog' })).not.toBeInTheDocument();
  });

  it('owns outside pointer dismissal once instead of double-firing through the scrim', () => {
    const onOpenChange = vi.fn();
    const { container } = wrap(
      <Dialog open onOpenChange={onOpenChange} title="Single dismiss">Content</Dialog>,
    );
    const scrim = container.querySelector<HTMLElement>('.ui-scrim');
    expect(scrim).not.toBeNull();
    fireEvent.pointerDown(scrim!);
    fireEvent.click(scrim!);
    expect(onOpenChange).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps focus-triggered tooltips available in coarse-pointer environments', () => {
    vi.useFakeTimers();
    render(
      <UiRoot pointerPrecision="coarse">
        <Tooltip content="Keyboard help" delayMs={10}>
          <button type="button">Help</button>
        </Tooltip>
      </UiRoot>,
    );
    fireEvent.focus(screen.getByRole('button', { name: 'Help' }));
    act(() => vi.advanceTimersByTime(20));
    expect(screen.getByRole('tooltip')).toHaveTextContent('Keyboard help');
  });

  it('routes ContextMenu long-press through one shared trigger press candidate', () => {
    vi.useFakeTimers();
    const register = vi.spyOn(gestureArena, 'register');
    try {
      wrap(
        <ContextMenu
          ariaLabel="File actions"
          longPressDelayMs={40}
          actions={[{ id: 'open', label: 'Open', onSelect: () => {} }]}
        >
          <Button variant="soft">File target</Button>
        </ContextMenu>,
      );
      const trigger = screen.getByRole('button', { name: 'File target' });
      fireEvent.pointerDown(trigger, {
        pointerId: 31,
        pointerType: 'touch',
        button: 0,
        isPrimary: true,
        clientX: 24,
        clientY: 24,
      });

      expect(register).toHaveBeenCalledTimes(1);
      act(() => vi.advanceTimersByTime(50));
      expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();

      fireEvent.pointerUp(trigger, {
        pointerId: 31,
        pointerType: 'touch',
        button: 0,
        isPrimary: true,
        clientX: 24,
        clientY: 24,
      });
      expect(screen.getByRole('menu', { name: 'File actions' })).toBeInTheDocument();
    } finally {
      register.mockRestore();
    }
  });

  it('supports menu typeahead without creating a private menu runtime', async () => {
    const user = userEvent.setup();
    function Harness() {
      const anchor = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={anchor} type="button">Anchor</button>
          <Menu open onOpenChange={() => {}} anchorRef={anchor} ariaLabel="Commands">
            <MenuItem>Alpha</MenuItem>
            <MenuItem>Beta</MenuItem>
          </Menu>
        </>
      );
    }
    wrap(<Harness />);
    const menu = screen.getByRole('menu', { name: 'Commands' });
    menu.focus();
    await user.keyboard('b');
    expect(screen.getByRole('menuitem', { name: 'Beta' })).toHaveFocus();
  });

  it('keeps alert confirmation explicit and blocks outside-dismiss ownership', async () => {
    const user = userEvent.setup();
    const confirm = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <AlertDialog
          open={open}
          onOpenChange={setOpen}
          title="Remove?"
          confirmLabel="Remove"
          confirmTone="danger"
          onConfirm={confirm}
        />
      );
    }
    wrap(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Remove' }));
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('uses one floating/roving path for popover and menu', async () => {
    const user = userEvent.setup();
    function Harness() {
      const anchor = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <>
          <button ref={anchor} type="button" onClick={() => setOpen(true)}>Actions</button>
          <Menu open={open} onOpenChange={setOpen} anchorRef={anchor} ariaLabel="Actions">
            <MenuItem>First</MenuItem>
            <MenuItem>Second</MenuItem>
          </Menu>
        </>
      );
    }
    wrap(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu', { name: 'Actions' })).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('keeps tooltip supplemental and excludes touch hover activation', () => {
    vi.useFakeTimers();
    wrap(
      <Tooltip content="Supplemental help" delayMs={10}>
        <button type="button">Help</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole('button', { name: 'Help' });
    fireEvent.pointerEnter(trigger, { pointerType: 'touch' });
    act(() => vi.advanceTimersByTime(20));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('does not restart toast duration when the host rerenders', () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    const item = { id: 'one', message: 'Saved', durationMs: 1000 } as const;
    const { rerender } = wrap(<ToastHost items={[item]} onDismiss={dismiss} />);
    act(() => vi.advanceTimersByTime(600));
    rerender(<UiRoot><ToastHost items={[item]} onDismiss={dismiss} /></UiRoot>);
    act(() => vi.advanceTimersByTime(450));
    expect(dismiss).toHaveBeenCalledWith('one');
  });


  it('upserts duplicate explicit toast ids instead of creating duplicate keys or dismiss groups', async () => {
    const user = userEvent.setup();
    function Harness() {
      const queue = useToastQueue();
      return (
        <>
          <button
            type="button"
            onClick={() => {
              queue.push({ id: 'sync', message: 'First', durationMs: null });
              queue.push({ id: 'sync', message: 'Second', durationMs: null });
            }}
          >
            Replace toast
          </button>
          <ToastHost items={queue.toasts} onDismiss={queue.dismiss} />
        </>
      );
    }
    wrap(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Replace toast' }));
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.getAllByText('Second')).toHaveLength(1);
  });

  it('exposes controlled toast queue and persistent banner feedback', async () => {
    const user = userEvent.setup();
    function Harness() {
      const queue = useToastQueue();
      return (
        <>
          <button type="button" onClick={() => queue.push({ message: 'Saved', durationMs: null })}>Notify</button>
          <Banner message="Connected" />
          <ToastHost items={queue.toasts} onDismiss={queue.dismiss} />
        </>
      );
    }
    wrap(<Harness />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('restores focus through nested modal lineage when the lower modal closes first', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [lowerOpen, setLowerOpen] = useState(false);
      const [upperOpen, setUpperOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setLowerOpen(true)}>Open lower</button>
          <Dialog open={lowerOpen} onOpenChange={setLowerOpen} title="Lower focus modal">
            <button type="button" onClick={() => setUpperOpen(true)}>Open upper</button>
          </Dialog>
          <Dialog open={upperOpen} onOpenChange={setUpperOpen} title="Upper focus modal">
            <button type="button" onClick={() => setLowerOpen(false)}>Remove lower</button>
            <button type="button" onClick={() => setUpperOpen(false)}>Close upper</button>
          </Dialog>
        </>
      );
    }
    wrap(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open lower' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Open upper' }));
    await user.click(screen.getByRole('button', { name: 'Remove lower' }));
    await user.click(screen.getByRole('button', { name: 'Close upper' }));
    await act(async () => Promise.resolve());
    expect(trigger).toHaveFocus();
  });

  it('moves Tab out of a portaled Menu relative to its trigger instead of the portal DOM order', async () => {
    const user = userEvent.setup();
    function Harness() {
      const anchor = useRef<HTMLButtonElement>(null);
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button">Before</button>
          <button ref={anchor} type="button" onClick={() => setOpen(true)}>Menu trigger</button>
          <button type="button">After</button>
          <Menu open={open} onOpenChange={setOpen} anchorRef={anchor} ariaLabel="Tab menu">
            <MenuItem>Command</MenuItem>
          </Menu>
        </>
      );
    }
    wrap(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Menu trigger' }));
    expect(screen.getByRole('menuitem', { name: 'Command' })).toHaveFocus();
    await user.tab();
    await act(async () => Promise.resolve());
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

});
