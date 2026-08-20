import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import {
  AdaptiveNavigation,
  Badge,
  List,
  ListItem,
  Progress,
  Spinner,
  StatusIndicator,
  tabRelationshipIds,
  TabPanel,
  Tabs,
  Toolbar,
} from '../index';

function renderUi(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('data and navigation components', () => {
  it('keeps static list rows non-interactive and action rows native buttons', () => {
    const activate = vi.fn();
    renderUi(
      <List label="Files">
        <ListItem primary="Static" secondary="Metadata" />
        <ListItem primary="Open" onActivate={activate} selected />
      </List>,
    );
    expect(screen.queryByRole('button', { name: 'Static' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('supports controlled tab and navigation selection', () => {
    const onTab = vi.fn();
    const onNav = vi.fn();
    renderUi(
      <>
        <Tabs
          label="Sections"
          value="one"
          onValueChange={onTab}
          items={[
            { value: 'one', label: 'One' },
            { value: 'two', label: 'Two' },
          ]}
        />
        <AdaptiveNavigation
          label="Destinations"
          value="home"
          onValueChange={onNav}
          items={[
            { value: 'home', label: 'Home' },
            { value: 'search', label: 'Search' },
          ]}
        />
      </>,
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Two' }));
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(onTab).toHaveBeenCalledWith('two');
    expect(onNav).toHaveBeenCalledWith('search');
  });

  it('keeps a tab stop for invalid controlled values and exposes tab-panel relations', () => {
    renderUi(
      <Tabs
        label="Sections"
        value="missing"
        items={[
          { value: 'one', label: 'One', disabled: true },
          { value: 'two', label: 'Two', id: 'two-tab', panelId: 'two-panel' },
        ]}
      />,
    );
    const tab = screen.getByRole('tab', { name: 'Two' });
    expect(tab).toHaveAttribute('tabindex', '0');
    expect(tab).toHaveAttribute('id', 'two-tab');
    expect(tab).toHaveAttribute('aria-controls', 'two-panel');
  });

  it('keeps manual Tabs focus independent from selection until activation', () => {
    const onValueChange = vi.fn();
    renderUi(
      <Tabs
        label="Manual sections"
        activationMode="manual"
        value="one"
        onValueChange={onValueChange}
        items={[
          { value: 'one', label: 'One' },
          { value: 'two', label: 'Two' },
        ]}
      />,
    );
    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(two).toHaveFocus();
    expect(two).toHaveAttribute('tabindex', '0');
    expect(one).toHaveAttribute('aria-selected', 'true');
    expect(two).toHaveAttribute('aria-selected', 'false');
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(two);
    expect(onValueChange).toHaveBeenCalledWith('two');
  });

  it('provides deterministic tab-panel relationship helpers', () => {
    const ids = tabRelationshipIds('settings', 'display');
    renderUi(
      <>
        <Tabs
          label="Settings sections"
          value="display"
          items={[{ value: 'display', label: 'Display', id: ids.tabId, panelId: ids.panelId }]}
        />
        <TabPanel id={ids.panelId} value="display" activeValue="display" labelledBy={ids.tabId}>
          Display content
        </TabPanel>
      </>,
    );
    expect(screen.getByRole('tab', { name: 'Display' })).toHaveAttribute(
      'aria-controls',
      ids.panelId,
    );
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', ids.tabId);
  });

  it('keeps static status and spinners silent unless announcement is explicitly requested', () => {
    const { container } = renderUi(
      <>
        <StatusIndicator label="Connected" />
        <StatusIndicator label="Sync changed" announce />
        <Spinner label="Refreshing" />
        <Spinner label="Loading results" announce />
        <Spinner label="Starting OntologyX" size="hero" />
      </>,
    );
    const indicators = container.querySelectorAll('.ui-status-indicator');
    const spinners = container.querySelectorAll('.ui-spinner');
    expect(indicators[0]).not.toHaveAttribute('role');
    expect(indicators[1]).toHaveAttribute('role', 'status');
    expect(spinners[0]).toHaveAttribute('aria-hidden', 'true');
    expect(spinners[0]).not.toHaveAttribute('role');
    expect(spinners[1]).toHaveAttribute('role', 'status');
    expect(spinners[1]).toHaveAttribute('aria-label', 'Loading results');
    expect(spinners[2]).toHaveClass('ui-spinner--hero');
    expect(spinners[2]).toHaveAttribute('aria-hidden', 'true');
    expect(spinners[0].querySelector('[data-oxs-loading-mark=\"ox\"]')).toBeInTheDocument();
    expect(spinners[0].querySelector('.ui-ox-loading-mark__track')).toBeInTheDocument();
    expect(spinners[0].querySelector('.ui-ox-loading-mark__orbit')).toBeInTheDocument();
    expect(spinners[0].querySelector('.ui-ox-loading-mark__cross')).toBeInTheDocument();
    expect(spinners[0].querySelectorAll('.ui-ox-loading-mark__cross-stroke')).toHaveLength(2);
    expect(spinners[0].querySelectorAll('.ui-ox-loading-mark__echo')).toHaveLength(2);
    expect(
      spinners[0].querySelector('[data-oxs-loading-choreography="write-heartbeat-release"]'),
    ).toBeInTheDocument();
  });

  it('normalizes invalid progress maxima instead of emitting NaN semantics', () => {
    renderUi(<Progress label="Import" value={10} max={0} showValue />);
    const progress = screen.getByRole('progressbar', { name: 'Import' });
    expect(progress).toHaveAttribute('max', '100');
    expect(progress).toHaveAttribute('value', '10');
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('exposes native progress and toolbar semantics', () => {
    renderUi(
      <>
        <Progress label="Download" value={40} showValue />
        <Toolbar label="Editor actions">
          <button type="button">Save</button>
        </Toolbar>
        <Badge tone="success">Ready</Badge>
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Download' })).toHaveAttribute('value', '40');
    expect(screen.getByRole('toolbar', { name: 'Editor actions' })).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });
});
