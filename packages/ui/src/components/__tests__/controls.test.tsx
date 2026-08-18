import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Button } from '../Button';
import { SearchField, TextField } from '../TextField';

describe('UI controls', () => {
  it('exposes stable loading and disabled button semantics', () => {
    render(
      <Button loading loadingLabel="Saving changes">
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Saving changes' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('data-oxs-cursor-role', 'progress');
  });

  it('tracks keyboard pressed state without replacing native button activation', () => {
    render(<Button>Continue</Button>);
    const button = screen.getByRole('button', { name: 'Continue' });
    fireEvent.keyDown(button, { key: ' ' });
    expect(button).toHaveAttribute('data-pressed', 'true');
    fireEvent.keyUp(button, { key: ' ' });
    expect(button).not.toHaveAttribute('data-pressed');
  });

  it('connects labels, description and error state', () => {
    render(
      <TextField
        label="Display name"
        description="Visible locally"
        error="This name is unavailable"
      />,
    );

    const input = screen.getByLabelText('Display name');
    const alert = screen.getByRole('alert');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(alert.id);
    expect(input).toHaveAttribute('data-oxs-cursor-role', 'text');
  });

  it('provides an accessible default label when SearchField omits label', () => {
    render(<SearchField value="" onValueChange={() => {}} />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('keeps SearchField controlled and clears through the UI Kit action', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [value, setValue] = useState('Terminal');
      return <SearchField label="Search applications" value={value} onValueChange={setValue} />;
    }

    render(<Harness />);
    const search = screen.getByRole('searchbox', { name: 'Search applications' });
    expect(search).toHaveValue('Terminal');

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(search).toHaveValue('');
  });
});
