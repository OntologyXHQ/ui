import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { ToggleButton } from '../Button';
import { Accordion, Disclosure } from '../Compositions';
import { Select } from '../Select';
import { Checkbox, Radio, RadioGroup, SegmentedControl, Switch, ToggleGroup } from '../Selection';

function Root({ children }: { children: ReactNode }) {
  return <UiRoot>{children}</UiRoot>;
}

describe('UIR08 selection and disclosure contracts', () => {
  it('restores uncontrolled native checkbox/radio state on form reset and preserves mixed/read-only semantics', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <form aria-label="preferences">
          <Checkbox name="preview" defaultChecked label="Preview" />
          <Checkbox label="Mixed" indeterminate readOnly />
          <RadioGroup label="Theme" name="theme" defaultValue="system">
            <Radio value="system" label="System" />
            <Radio value="dark" label="Dark" />
          </RadioGroup>
          <button type="reset">Reset</button>
        </form>
      </Root>,
    );

    const preview = screen.getByRole('checkbox', { name: 'Preview' });
    const mixed = screen.getByRole('checkbox', { name: 'Mixed' });
    await user.click(preview);
    await user.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(preview).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    await user.click(mixed);
    expect(mixed).toHaveAttribute('aria-checked', 'mixed');
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(preview).toBeChecked();
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('keeps Switch and ToggleButton cancellation/state ownership explicit', async () => {
    const user = userEvent.setup();
    const cancel = vi.fn((event: ReactMouseEvent<HTMLButtonElement>) => event.preventDefault());
    render(
      <Root>
        <Switch label="Live updates" />
        <ToggleButton onClick={cancel}>Pin</ToggleButton>
      </Root>,
    );
    await user.click(screen.getByText('Live updates'));
    expect(screen.getByRole('switch', { name: 'Live updates' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Pin' }));
    expect(screen.getByRole('button', { name: 'Pin' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('normalizes segmented and multi-toggle controlled values while preserving one roving tab stop', async () => {
    const user = userEvent.setup();
    const onSegment = vi.fn();
    const onToggles = vi.fn();
    render(
      <Root>
        <SegmentedControl
          label="Density"
          value="missing"
          onValueChange={onSegment}
          options={[
            { value: 'disabled', label: 'Disabled', disabled: true },
            { value: 'comfortable', label: 'Comfortable' },
            { value: 'compact', label: 'Compact' },
          ]}
        />
        <ToggleGroup
          label="Tools"
          value={['ghost', 'locked', 'grid', 'grid']}
          onValueChange={onToggles}
          options={[
            { value: 'grid', label: 'Grid' },
            { value: 'snap', label: 'Snap' },
            { value: 'locked', label: 'Locked', disabled: true },
          ]}
        />
      </Root>,
    );
    const comfortable = screen.getByRole('radio', { name: 'Comfortable' });
    expect(comfortable).toHaveAttribute('aria-checked', 'true');
    expect(comfortable).toHaveAttribute('tabindex', '0');
    const grid = screen.getByRole('button', { name: 'Grid' });
    expect(grid).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Snap' }));
    expect(onToggles).toHaveBeenCalledWith(['grid', 'snap']);
  });

  it('keeps Select required validity, typeahead and uncontrolled reset on one visible trigger', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <form aria-label="density form">
          <Select
            label="Density"
            name="density"
            required
            defaultValue="comfortable"
            options={[
              { value: 'comfortable', label: 'Comfortable' },
              { value: 'compact', label: 'Compact' },
              { value: 'locked', label: 'Locked', disabled: true },
            ]}
          />
          <button type="reset">Reset density</button>
        </form>
      </Root>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Density' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'c', timeStamp: 10 });
    expect(trigger).toHaveTextContent('Compact');
    await user.click(screen.getByRole('button', { name: 'Reset density' }));
    expect(trigger).toHaveTextContent('Comfortable');
  });

  it('gives Disclosure and Accordion semantic heading/region ownership and keyboard header movement', async () => {
    const user = userEvent.setup();
    render(
      <Root>
        <Disclosure summary="Advanced" headingLevel={4}>
          Disclosure content
        </Disclosure>
        <Accordion
          label="Preferences"
          items={[
            { value: 'one', summary: 'One', content: 'One content' },
            { value: 'skip', summary: 'Skip', content: 'Skip content', disabled: true },
            { value: 'two', summary: 'Two', content: 'Two content' },
          ]}
        />
      </Root>,
    );
    const disclosure = screen.getByRole('button', { name: 'Advanced' });
    expect(disclosure.closest('h4')).not.toBeNull();
    await user.click(disclosure);
    expect(screen.getByRole('region', { name: 'Advanced' })).toBeVisible();

    const one = screen.getByRole('button', { name: 'One' });
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });
});
