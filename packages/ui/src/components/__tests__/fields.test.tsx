import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { FieldGroup, FieldSection } from '../Field';
import { Select } from '../Select';
import { SearchField, TextArea, TextField } from '../TextField';

function withUiRoot(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('field and form components', () => {
  it('connects one shared field frame across required, description, error and read-only state', () => {
    render(
      <TextField
        label="Account"
        description="Local account name"
        error="Already in use"
        required
        readOnly
        defaultValue="oxs"
      />,
    );

    const input = screen.getByLabelText(/Account/);
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('readonly');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByText('Local account name').id);
    expect(input.getAttribute('aria-describedby')).toContain(screen.getByRole('alert').id);
  });

  it('publishes the same editable-text lifecycle for multiline input', async () => {
    const user = userEvent.setup();
    const onEditingStateChange = vi.fn();
    render(
      <TextArea
        label="Notes"
        defaultValue="hello"
        maxLength={12}
        showCharacterCount
        onEditingStateChange={onEditingStateChange}
      />,
    );

    const textarea = screen.getByLabelText(/Notes/);
    await user.click(textarea);
    await user.type(textarea, '!');
    expect(screen.getByText('6 / 12')).toBeInTheDocument();
    expect(onEditingStateChange).toHaveBeenCalled();
  });

  it('keeps search suggestions as a seam instead of owning a suggestion popup', async () => {
    const user = userEvent.setup();
    const onSuggestionsRequest = vi.fn();

    function Harness() {
      const [value, setValue] = useState('term');
      return (
        <SearchField
          value={value}
          onValueChange={setValue}
          suggestionsAvailable
          onSuggestionsRequest={onSuggestionsRequest}
        />
      );
    }

    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Show suggestions' }));
    expect(onSuggestionsRequest).toHaveBeenCalledTimes(1);
  });

  it('selects bounded choices through shared overlay/floating infrastructure', async () => {
    const user = userEvent.setup();
    function Harness() {
      const [value, setValue] = useState('one');
      return (
        <Select
          label="Mode"
          value={value}
          onValueChange={setValue}
          options={[
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
          ]}
        />
      );
    }

    withUiRoot(<Harness />);
    await user.click(screen.getByRole('combobox', { name: 'Mode' }));
    expect(screen.getByRole('listbox', { name: 'Mode' })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'Two' }));
    expect(screen.getByRole('combobox', { name: 'Mode' })).toHaveTextContent('Two');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('uses native form semantics for required/disabled Select and supports typeahead', async () => {
    const user = userEvent.setup();
    const { container, rerender } = withUiRoot(
      <Select
        label="Mode"
        name="mode"
        required
        options={[
          { value: 'alpha', label: 'Alpha' },
          { value: 'beta', label: 'Beta' },
        ]}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Mode' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'b' });
    expect(trigger).toHaveTextContent('Beta');
    const proxy = container.querySelector('select[name="mode"]');
    expect(proxy).toBeRequired();
    expect(proxy).not.toBeDisabled();

    rerender(
      <UiRoot>
        <Select
          label="Mode"
          name="mode"
          disabled
          options={[{ value: 'alpha', label: 'Alpha' }]}
        />
      </UiRoot>,
    );
    expect(container.querySelector('select[name="mode"]')).toBeDisabled();
    await user.keyboard('{Tab}');
  });


  it('keeps Select focus on the trigger so Tab continues to the next control after an open listbox', async () => {
    const user = userEvent.setup();
    withUiRoot(
      <>
        <Select
          label="Destination"
          options={[
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
          ]}
        />
        <button type="button">After select</button>
      </>,
    );
    const trigger = screen.getByRole('combobox', { name: 'Destination' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox', { name: 'Destination' })).toBeInTheDocument();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After select' })).toHaveFocus();
    expect(screen.queryByRole('listbox', { name: 'Destination' })).not.toBeInTheDocument();
  });

  it('cycles repeated single-key Select typeahead matches instead of accumulating a dead prefix', () => {
    withUiRoot(
      <Select
        label="Project"
        options={[
          { value: 'maple', label: 'Maple' },
          { value: 'moon', label: 'Moon' },
          { value: 'mars', label: 'Mars' },
        ]}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Project' });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: 'm' });
    expect(trigger).toHaveTextContent('Maple');
    fireEvent.keyDown(trigger, { key: 'm' });
    expect(trigger).toHaveTextContent('Moon');
    fireEvent.keyDown(trigger, { key: 'm' });
    expect(trigger).toHaveTextContent('Mars');
  });

  it('includes visible field affixes in the control description relationship', () => {
    render(<TextField label="Price" prefix="$" suffix="USD" />);
    const input = screen.getByLabelText('Price');
    const described = input.getAttribute('aria-describedby') ?? '';
    expect(described).toContain(screen.getByText('$').id);
    expect(described).toContain(screen.getByText('USD').id);
  });

  it('provides generic section/group semantics without field-local accessibility wiring', () => {
    render(
      <FieldSection title="Profile" description="Public identity">
        <FieldGroup label="Names" description="Identity fields">
          <TextField label="Display name" />
        </FieldGroup>
      </FieldSection>,
    );

    expect(screen.getByRole('region', { name: 'Profile' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Names' })).toBeInTheDocument();
  });

  it('keeps read-only SearchField immutable by removing its clear action', () => {
    const onValueChange = vi.fn();
    render(<SearchField label="Locked search" value="query" readOnly onValueChange={onValueChange} />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Locked search' })).toHaveAttribute('readonly');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('keeps Select option ids collision-free for values with similar sanitized forms', () => {
    withUiRoot(
      <Select
        label="Collision safe"
        options={[
          { value: 'a b', label: 'Space value' },
          { value: 'a-b', label: 'Dash value' },
        ]}
      />,
    );
    const trigger = screen.getByRole('combobox', { name: 'Collision safe' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length);
  });

});
