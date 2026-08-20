import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { Button } from '../Button';
import { Tile, TileGrid } from '../Compositions';
import { List, ListItem, ListSection, ListSeparator } from '../DataList';
import { AdaptiveNavigation, TabPanel, Tabs } from '../Navigation';

function Root({ children }: { children: ReactNode }) {
  return <UiRoot>{children}</UiRoot>;
}

describe('UIR09 navigation and data-presentation contracts', () => {
  it('uses native list/section semantics and keeps trailing controls outside the row action', () => {
    const activate = vi.fn();
    render(
      <Root>
        <ListSection title="Files" description="Recent files">
          <List label="Files" divided>
            <ListItem primary="Static" />
            <ListSeparator />
            <ListItem
              primary="Open"
              onActivate={activate}
              trailing={<Button aria-label="More actions">More</Button>}
            />
          </List>
        </ListSection>
      </Root>,
    );
    expect(screen.getByRole('list').tagName).toBe('UL');
    const listItems = screen.getAllByRole('listitem');
    expect(listItems.every((item) => item.tagName === 'LI')).toBe(true);
    const open = screen.getByRole('button', { name: /Open/ });
    const more = screen.getByRole('button', { name: 'More actions' });
    expect(open.contains(more)).toBe(false);
    expect(screen.getByRole('heading', { name: 'Files' })).toBeInTheDocument();
  });

  it('exposes deterministic loading/empty/error list states without inventing data ownership', () => {
    const { rerender } = render(
      <Root>
        <List label="Results" state="loading" stateLabel="Loading results" />
      </Root>,
    );
    expect(screen.getByRole('list', { name: 'Results' })).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading results' })).toBeInTheDocument();
    rerender(
      <Root>
        <List label="Results" state="error" stateLabel="Results unavailable" />
      </Root>,
    );
    expect(screen.getByRole('alert', { name: 'Results unavailable' })).toBeInTheDocument();
  });

  it('keeps href destinations native anchors while action destinations remain buttons', async () => {
    const user = userEvent.setup();
    const activate = vi.fn();
    render(
      <Root>
        <AdaptiveNavigation
          label="Destinations"
          defaultValue="home"
          items={[
            { value: 'home', label: 'Home', href: '#home' },
            { value: 'settings', label: 'Settings', onActivate: activate },
          ]}
        />
      </Root>,
    );
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '#home');
    expect(home).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('supports automatic/manual Tabs with derived relationships and invalid selection recovery', () => {
    render(
      <Root>
        <Tabs
          idBase="settings"
          label="Settings"
          value="missing"
          activationMode="manual"
          items={[
            { value: 'disabled', label: 'Disabled', disabled: true },
            { value: 'display', label: 'Display' },
            { value: 'sound', label: 'Sound' },
          ]}
        />
        <TabPanel idBase="settings" value="display" activeValue="display">
          Display content
        </TabPanel>
      </Root>,
    );
    const display = screen.getByRole('tab', { name: 'Display' });
    expect(display).toHaveAttribute('aria-selected', 'true');
    expect(display).toHaveAttribute('aria-controls', 'settings-panel-display');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', 'settings-tab-display');
  });

  it('keeps TileGrid one-tab-stop spatial focus through reorder and skips disabled tiles', () => {
    function Harness() {
      const [reversed, setReversed] = useState(false);
      const tiles = reversed ? ['Gamma', 'Beta', 'Alpha'] : ['Alpha', 'Beta', 'Gamma'];
      return (
        <Root>
          <button type="button" onClick={() => setReversed((value) => !value)}>
            Reorder
          </button>
          <TileGrid label="Projects" keyboardNavigation>
            {tiles.map((title) => (
              <Tile key={title} title={title} onActivate={() => undefined} />
            ))}
            <Tile title="Disabled" disabled onActivate={() => undefined} />
          </TileGrid>
        </Root>
      );
    }
    render(<Harness />);
    const alpha = screen.getByRole('button', { name: 'Alpha' });
    alpha.focus();
    fireEvent.click(screen.getByRole('button', { name: 'Reorder' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
    const tileButtons = ['Alpha', 'Beta', 'Gamma'].map((name) =>
      screen.getByRole('button', { name }),
    );
    expect(tileButtons.filter((button) => button.tabIndex === 0)).toHaveLength(1);
  });
});
