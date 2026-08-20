import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button, Slider, Switch, UiRoot } from '../../index';
import {
  DesktopShellLayout,
  SystemApplicationBrowser,
  SystemBar,
  SystemCommandSurface,
  SystemDock,
  SystemKeyboardHost,
  SystemLockLayout,
  SystemNotificationCenter,
  SystemOsd,
  SystemPanel,
  SystemQuickSettings,
  SystemSettingsLayout,
  SystemWorkspace,
} from '..';

describe('System layout library', () => {
  it('composes desktop workspace, bar, dock and panel without owning the native scene', () => {
    render(
      <UiRoot>
        <div style={{ position: 'relative', width: 900, height: 600 }}>
          <DesktopShellLayout
            workspace={
              <SystemWorkspace>
                <div>Native scene</div>
              </SystemWorkspace>
            }
            topBar={<SystemBar label="Top bar" leading={<span>Status</span>} />}
            dock={
              <SystemDock>
                <Button>Launcher</Button>
              </SystemDock>
            }
            panel={
              <SystemPanel title="Side panel">
                <span>Panel content</span>
              </SystemPanel>
            }
          />
        </div>
      </UiRoot>,
    );

    expect(screen.getByText('Native scene')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Top bar' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'System dock' })).toBeInTheDocument();
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  it('supports application browsing in grid/list layouts with caller-owned activation policy', () => {
    const activate = vi.fn();
    const change = vi.fn();
    const { rerender } = render(
      <UiRoot>
        <SystemApplicationBrowser
          query=""
          apps={[{ id: 'browser', name: 'Browser', icon: 'browser', description: 'Web' }]}
          onQueryChange={change}
          onActivate={activate}
        />
      </UiRoot>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Browser/ }));
    expect(activate).toHaveBeenCalledWith('browser');

    rerender(
      <UiRoot>
        <SystemApplicationBrowser
          query="web"
          presentation="list"
          apps={[{ id: 'browser', name: 'Browser', icon: 'browser', description: 'Web' }]}
          onQueryChange={change}
          onActivate={activate}
        />
      </UiRoot>,
    );
    expect(screen.getByRole('list', { name: 'Applications' })).toBeInTheDocument();
  });

  it('keeps settings navigation adaptive while caller owns active section state', () => {
    const onValueChange = vi.fn();
    render(
      <UiRoot>
        <SystemSettingsLayout
          title="Settings"
          sections={[
            { value: 'display', label: 'Display' },
            { value: 'input', label: 'Input' },
          ]}
          value="display"
          onValueChange={onValueChange}
        >
          <div>Settings content</div>
        </SystemSettingsLayout>
      </UiRoot>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Input' }));
    expect(onValueChange).toHaveBeenCalledWith('input');
    expect(screen.getByRole('main', { name: 'Settings content' })).toBeInTheDocument();
  });

  it('composes notification and quick-settings view models from public Components', () => {
    render(
      <UiRoot>
        <SystemNotificationCenter
          items={[
            { id: '1', title: 'Update ready', body: 'Restart when convenient', unread: true },
          ]}
        />
        <SystemQuickSettings
          sections={[
            { id: 'wifi', title: 'Wireless', content: <Switch label="Wi-Fi" defaultChecked /> },
            { id: 'sound', title: 'Sound', content: <Slider label="Volume" defaultValue={50} /> },
          ]}
        />
      </UiRoot>,
    );
    expect(screen.getByText('Update ready')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Volume' })).toBeInTheDocument();
  });

  it('keeps OSD, lock and keyboard host as UI-only System surfaces', () => {
    render(
      <UiRoot>
        <div style={{ position: 'relative', width: 600, height: 500 }}>
          <SystemOsd label="Volume" value={64} />
          <SystemLockLayout primary="12:42" authentication={<Button>Unlock</Button>} />
          <SystemKeyboardHost
            state={{
              surfaceId: 'test-keyboard',
              sessionId: 'session-1',
              visible: true,
              language: 'en',
              layout: 'letters',
              contentPurpose: 'text',
              secure: false,
            }}
            onCommand={() => undefined}
          />
        </div>
      </UiRoot>,
    );
    expect(screen.getByRole('progressbar', { name: 'Volume' })).toHaveAttribute('value', '64');
    expect(screen.getByRole('region', { name: 'Lock screen' })).toBeInTheDocument();
    expect(
      screen
        .getByRole('group', { name: 'System touch keyboard' })
        .closest('[data-oxs-system-surface]'),
    ).toHaveAttribute('data-oxs-system-surface', 'privileged');
  });

  it('filters command results and transfers Arrow focus from search into the command list', () => {
    render(
      <UiRoot>
        <SystemCommandSurface
          open
          query="sett"
          commands={[
            { id: 'settings', label: 'Open settings', shortcut: 'Ctrl+,' },
            { id: 'restart', label: 'Restart shell', shortcut: 'Ctrl+R' },
          ]}
          onQueryChange={() => {}}
          onActivate={() => {}}
          onOpenChange={() => {}}
        />
      </UiRoot>,
    );
    expect(screen.getByText('Open settings')).toBeInTheDocument();
    expect(screen.queryByText('Restart shell')).not.toBeInTheDocument();
    const search = screen.getByRole('searchbox', { name: 'Search commands' });
    search.focus();
    fireEvent.keyDown(search, { key: 'ArrowDown' });
    expect(screen.getByRole('button', { name: /Open settings/ })).toHaveFocus();
  });

  it('makes a non-interactive application browser truly inert to search and activation', () => {
    const activate = vi.fn();
    render(
      <UiRoot>
        <SystemApplicationBrowser
          query=""
          interactive={false}
          apps={[{ id: 'browser', name: 'Browser', icon: 'browser' }]}
          onQueryChange={() => {}}
          onActivate={activate}
        />
      </UiRoot>,
    );
    expect(screen.getByRole('searchbox', { name: 'Search applications' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Browser' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Browser' }));
    expect(activate).not.toHaveBeenCalled();
  });

  it('propagates a caller-owned settings content label consistently to the page and scroll region', () => {
    render(
      <UiRoot>
        <SystemSettingsLayout
          title="Preferences"
          contentLabel="Preference details"
          sections={[{ value: 'display', label: 'Display' }]}
          value="display"
          onValueChange={() => {}}
        >
          Details
        </SystemSettingsLayout>
      </UiRoot>,
    );
    expect(screen.getByRole('main', { name: 'Preference details' })).toBeInTheDocument();
    expect(
      screen.getByLabelText('Preference details', { selector: '.ui-scroll-view__viewport' }),
    ).toBeInTheDocument();
  });

  it('renders a command surface with shared dialog/search/list semantics', () => {
    const activate = vi.fn();
    render(
      <UiRoot>
        <SystemCommandSurface
          open
          query=""
          commands={[{ id: 'settings', label: 'Open settings', shortcut: 'Ctrl+,' }]}
          onQueryChange={() => {}}
          onActivate={activate}
          onOpenChange={() => {}}
        />
      </UiRoot>,
    );
    fireEvent.click(screen.getByText('Open settings'));
    expect(activate).toHaveBeenCalledWith('settings');
  });
});
