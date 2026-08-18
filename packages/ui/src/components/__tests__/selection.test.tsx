import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Button, ToggleButton } from '../Button';
import { IconButton } from '../IconButton';
import {
  Checkbox,
  Radio,
  RadioGroup,
  SegmentedControl,
  Slider,
  Switch,
  ToggleGroup,
} from '../Selection';

function Root({ children }: { children: ReactNode }) {
  return <UiRoot>{children}</UiRoot>;
}

describe('UIP06 action and selection Components', () => {
  it('keeps Button busy semantics and exposes toggle state through aria-pressed', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <Button loading loadingLabel="Saving">Save</Button>
        <ToggleButton>Pin</ToggleButton>
        <IconButton icon="settings" label="Lock settings" defaultPressed />
      </Root>,
    );

    expect(screen.getByRole('button', { name: 'Saving' })).toBeDisabled();
    const toggle = screen.getByRole('button', { name: 'Pin' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Lock settings' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('supports controlled checkbox and radio selection contracts', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [checked, setChecked] = useState(false);
      const [radio, setRadio] = useState('one');
      return (
        <Root>
          <Checkbox checked={checked} onCheckedChange={setChecked} label="Preview" />
          <RadioGroup label="Choice" value={radio} onValueChange={setRadio}>
            <Radio value="one" label="One" />
            <Radio value="two" label="Two" />
          </RadioGroup>
        </Root>
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: 'Preview' }));
    expect(screen.getByRole('checkbox', { name: 'Preview' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Two' }));
    expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
  });

  it('keeps indeterminate checkbox semantics explicit', () => {
    render(
      <Root>
        <Checkbox label="Mixed" indeterminate />
      </Root>,
    );
    expect(screen.getByRole('checkbox', { name: 'Mixed' })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('toggles Switch by native button activation and exposes switch semantics', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <Switch label="Live updates" />
      </Root>,
    );
    const control = screen.getByRole('switch', { name: 'Live updates' });
    expect(control).toHaveAttribute('aria-checked', 'false');
    await user.click(control);
    expect(control).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps one enabled tab stop when controlled selection is invalid or disabled', () => {
    render(
      <Root>
        <SegmentedControl
          label="Density"
          value="missing"
          options={[
            { value: 'compact', label: 'Compact', disabled: true },
            { value: 'comfortable', label: 'Comfortable' },
          ]}
        />
        <ToggleGroup
          label="Tools"
          options={[
            { value: 'grid', label: 'Grid', disabled: true },
            { value: 'snap', label: 'Snap' },
          ]}
        />
      </Root>,
    );
    expect(screen.getByRole('radio', { name: 'Comfortable' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { name: 'Snap' })).toHaveAttribute('tabindex', '0');
  });

  it('lets consumer cancellation veto toggle state changes', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn((event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(
      <Root>
        <ToggleButton onClick={cancel}>Pin</ToggleButton>
        <IconButton icon="settings" label="Settings toggle" defaultPressed={false} onClick={cancel} />
      </Root>,
    );
    await user.click(screen.getByRole('button', { name: 'Pin' }));
    await user.click(screen.getByRole('button', { name: 'Settings toggle' }));
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Settings toggle' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('makes the visible Switch label an activation target', async () => {
    const user = userEvent.setup();
    render(<Root><Switch label="Wi-Fi" /></Root>);
    await user.click(screen.getByText('Wi-Fi'));
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toHaveAttribute('aria-checked', 'true');
  });

  it('steps Slider from the keyboard and reverses horizontal arrows in RTL', () => {
    render(
      <UiRoot direction="rtl">
        <Slider label="Volume" defaultValue={50} step={10} />
      </UiRoot>,
    );
    const slider = screen.getByRole('slider', { name: 'Volume' });
    slider.focus();
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(slider).toHaveAttribute('aria-valuenow', '40');
    fireEvent.keyDown(slider, { key: 'ArrowLeft' });
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('supports single segmented state and multi-toggle grouping', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <SegmentedControl
          label="Density"
          defaultValue="compact"
          options={[
            { value: 'compact', label: 'Compact' },
            { value: 'comfortable', label: 'Comfortable' },
          ]}
        />
        <ToggleGroup
          label="Tools"
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'snap', label: 'Snap' },
          ]}
        />
      </Root>,
    );

    const comfortable = screen.getByRole('radio', { name: 'Comfortable' });
    await user.click(comfortable);
    expect(comfortable).toHaveAttribute('aria-checked', 'true');

    const grid = screen.getByRole('button', { name: 'Grid' });
    await user.click(grid);
    expect(grid).toHaveAttribute('aria-pressed', 'true');
  });

  it('preserves Slider consumer style and pointer handlers and lets click cancellation veto mutation', () => {
    const onPointerDown = vi.fn();
    const onClick = vi.fn((event: ReactMouseEvent<HTMLDivElement>) => event.preventDefault());
    render(
      <Root>
        <Slider
          label="Protected slider"
          defaultValue={40}
          style={{ opacity: 0.8 }}
          onPointerDown={onPointerDown}
          onClick={onClick}
        />
      </Root>,
    );
    const slider = screen.getByRole('slider', { name: 'Protected slider' });
    expect(slider).toHaveStyle({ opacity: '0.8' });
    fireEvent.pointerDown(slider, { pointerId: 91, pointerType: 'mouse', clientX: 30, clientY: 5 });
    expect(onPointerDown).toHaveBeenCalledTimes(1);
    fireEvent.click(slider, { clientX: 90, clientY: 5 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(slider).toHaveAttribute('aria-valuenow', '40');
  });

});
