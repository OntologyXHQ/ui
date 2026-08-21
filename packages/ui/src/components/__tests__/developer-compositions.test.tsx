import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import {
  Accordion,
  AppBar,
  ApplicationItem,
  Card,
  ContentState,
  Disclosure,
  PageScaffold,
  ScrollView,
  Tile,
  TileGrid,
} from '../index';

function renderUi(node: ReactNode) {
  return render(<UiRoot>{node}</UiRoot>);
}

describe('developer compositions', () => {
  it('keeps AppBar product-neutral while preserving semantic heading and logical action regions', () => {
    renderUi(
      <AppBar
        title="Workspace"
        subtitle="Developer composition"
        leading={<span>Leading</span>}
        actions={<button type="button">Refresh</button>}
        titleLevel={2}
      />,
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
    expect(screen.getByText('Developer composition')).toBeInTheDocument();
  });

  it('associates card title/description without inventing child interaction', () => {
    renderUi(
      <Card title="Account" description="Local profile">
        <span>Body</span>
      </Card>,
    );
    const group = screen.getByRole('group', { name: 'Account' });
    expect(group).toHaveAccessibleDescription('Local profile');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('keeps application identity reusable inside a responsive tile collection', () => {
    const activate = vi.fn();
    renderUi(
      <TileGrid label="Applications">
        <ApplicationItem
          name="Browser"
          icon="browser"
          badge={<span>2</span>}
          onActivate={activate}
          selected
        />
        <Tile title="Static tile" description="Metadata" />
      </TileGrid>,
    );
    expect(screen.getByRole('group', { name: 'Applications' })).toBeInTheDocument();
    const browser = screen.getByRole('button', { name: 'Browser' });
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Browser 2' })).not.toBeInTheDocument();
    expect(browser.closest('.ui-tile')).toHaveAttribute('data-selected', 'true');
    fireEvent.click(browser);
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it('offers one keyboard tab stop and arrow roving for interactive tile grids', () => {
    renderUi(
      <TileGrid label="Apps" keyboardNavigation>
        <ApplicationItem name="Browser" icon="browser" onActivate={() => {}} />
        <ApplicationItem name="Terminal" icon="terminal" onActivate={() => {}} />
      </TileGrid>,
    );
    const browser = screen.getByRole('button', { name: 'Browser' });
    const terminal = screen.getByRole('button', { name: 'Terminal' });
    expect(browser).toHaveAttribute('tabindex', '0');
    expect(terminal).toHaveAttribute('tabindex', '-1');
    browser.focus();
    fireEvent.keyDown(browser, { key: 'ArrowRight' });
    expect(terminal).toHaveFocus();
    expect(terminal).toHaveAttribute('tabindex', '0');
  });

  it('uses real 2D geometry for TileGrid arrow navigation', () => {
    renderUi(
      <TileGrid label="Spatial apps" keyboardNavigation>
        <ApplicationItem name="A" icon="browser" onActivate={() => {}} />
        <ApplicationItem name="B" icon="terminal" onActivate={() => {}} />
        <ApplicationItem name="C" icon="files" onActivate={() => {}} />
        <ApplicationItem name="D" icon="settings" onActivate={() => {}} />
      </TileGrid>,
    );
    const itemRects = [
      [screen.getByRole('button', { name: 'A' }), { left: 0, top: 0 }],
      [screen.getByRole('button', { name: 'B' }), { left: 120, top: 0 }],
      [screen.getByRole('button', { name: 'C' }), { left: 0, top: 120 }],
      [screen.getByRole('button', { name: 'D' }), { left: 120, top: 120 }],
    ] as const;
    itemRects.forEach(([item, { left, top }]) => {
      vi.spyOn(item, 'getBoundingClientRect').mockReturnValue({
        x: left,
        y: top,
        left,
        top,
        right: left + 100,
        bottom: top + 100,
        width: 100,
        height: 100,
        toJSON: () => ({}),
      });
    });
    const [[itemA], [itemB], [itemC], [itemD]] = itemRects;
    itemA.focus();
    fireEvent.keyDown(itemA, { key: 'ArrowDown' });
    expect(itemC).toHaveFocus();
    fireEvent.keyDown(itemC, { key: 'ArrowRight' });
    expect(itemD).toHaveFocus();

    itemB.focus();
    fireEvent.keyDown(itemB, { key: 'ArrowRight' });
    expect(itemB).toHaveFocus();

    itemD.focus();
    fireEvent.keyDown(itemD, { key: 'ArrowDown' });
    expect(itemD).toHaveFocus();
  });

  it('uses logical-order fallback only when TileGrid geometry is unavailable', () => {
    renderUi(
      <TileGrid label="Unmeasured apps" keyboardNavigation>
        <ApplicationItem name="One" icon="browser" onActivate={() => {}} />
        <ApplicationItem name="Two" icon="terminal" onActivate={() => {}} />
      </TileGrid>,
    );
    const one = screen.getByRole('button', { name: 'One' });
    const two = screen.getByRole('button', { name: 'Two' });
    one.focus();
    fireEvent.keyDown(one, { key: 'ArrowRight' });
    expect(two).toHaveFocus();
  });

  it('keeps controlled Disclosure state authoritative instead of letting native mutation leak through', () => {
    const onOpenChange = vi.fn();
    renderUi(
      <Disclosure summary="Controlled details" open={false} onOpenChange={onOpenChange}>
        Hidden content
      </Disclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'Controlled details' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Hidden content')).toHaveAttribute('hidden');
  });

  it('normalizes multi-value input to one open section when Accordion is single-select', () => {
    renderUi(
      <Accordion
        label="Single accordion"
        value={['a', 'b']}
        items={[
          { value: 'a', summary: 'Section A', content: 'A content' },
          { value: 'b', summary: 'Section B', content: 'B content' },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Section A' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Section B' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('provides generic page landmarks and logical sidebar ownership', () => {
    renderUi(
      <PageScaffold
        header={<div>Header</div>}
        sidebar={<div>Navigation</div>}
        footer={<div>Footer</div>}
        contentLabel="Settings content"
        sidebarPosition="end"
      >
        Main body
      </PageScaffold>,
    );
    expect(screen.getByRole('main', { name: 'Settings content' })).toHaveTextContent('Main body');
    expect(screen.getByText('Navigation').closest('aside')).toBeInTheDocument();
    expect(screen.getByText('Footer').closest('footer')).toBeInTheDocument();
  });

  it('keeps accordion state React-owned and disabled sections non-activating', () => {
    renderUi(
      <Accordion
        label="Preferences"
        defaultValue={['appearance']}
        items={[
          { value: 'appearance', summary: 'Appearance', content: 'Theme' },
          { value: 'secure', summary: 'Secure', content: 'Locked', disabled: true },
        ]}
      />,
    );
    expect(screen.getByRole('button', { name: 'Appearance' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Secure' })).toBeDisabled();
    expect(screen.getByText('Theme')).not.toHaveAttribute('hidden');
  });

  it('standardizes empty/error/loading replacement states', () => {
    renderUi(
      <>
        <ContentState kind="empty" title="Nothing here" />
        <ContentState kind="error" title="Could not load" />
        <ContentState kind="loading" title="Loading items" />
      </>,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.getByRole('status')).toHaveTextContent('Loading items');
  });

  it('exposes ScrollView through the Component surface while retaining shared runtime semantics', () => {
    renderUi(<ScrollView ariaLabel="Developer scroll">Scrollable content</ScrollView>);
    expect(screen.getByLabelText('Developer scroll')).toBeInTheDocument();
  });
});
