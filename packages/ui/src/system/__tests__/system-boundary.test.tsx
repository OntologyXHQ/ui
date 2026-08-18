import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../index';
import { filterSystemLauncherItems, SystemLauncher, SystemScaffold, SystemSurface, SystemWorkspace } from '..';

describe('System UI boundary', () => {
  it('keeps workspace, chrome, transient and privileged hosts structurally distinct', () => {
    render(
      <SystemScaffold
        workspace={<div>Workspace slot</div>}
        chrome={<SystemSurface kind="chrome">Chrome slot</SystemSurface>}
        transient={<SystemSurface kind="transient">Transient slot</SystemSurface>}
        privileged={<SystemSurface kind="privileged">Privileged slot</SystemSurface>}
        insets={{ blockStart: 12, blockEnd: 44 }}
      />,
    );
    const root = screen.getByText('Workspace slot').closest('[data-oxs-system-scaffold]');
    expect(root).toHaveStyle('--oxs-system-inset-block-start: 12px');
    expect(root).toHaveStyle('--oxs-system-inset-block-end: 44px');
    expect(screen.getByText('Privileged slot').closest('[data-oxs-system-surface]')).toHaveAttribute(
      'data-oxs-system-surface',
      'privileged',
    );
  });

  it('filters launcher items and keeps activation policy outside the System visual', () => {
    const apps = [
      { id: 'browser', name: 'Browser', icon: 'browser' as const, keywords: ['web'] },
      { id: 'files', name: 'Files', icon: 'files' as const, keywords: ['folder'] },
    ];
    expect(filterSystemLauncherItems(apps, 'web')).toEqual([apps[0]]);
    expect(filterSystemLauncherItems(apps, 'FILES')).toEqual([apps[1]]);
  });

  it('renders the migrated launcher from public Component semantics', () => {
    const launch = vi.fn(() => false);
    render(
      <UiRoot>
        <SystemLauncher
          open
          query=""
          apps={[{ id: 'browser', name: 'Browser', icon: 'browser' }]}
          onQueryChange={() => {}}
          onLaunch={launch}
          onClose={() => {}}
        />
      </UiRoot>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Browser' }));
    expect(launch).toHaveBeenCalledWith('browser');
  });

  it('keeps desktop workspace composition separate from native scene authority', () => {
    render(<SystemWorkspace title="OXS" status="Desktop"><div>Native scene slot</div></SystemWorkspace>);
    expect(screen.getByRole('region', { name: 'Desktop workspace' })).toHaveAttribute(
      'data-oxs-production-workspace',
    );
    expect(screen.getByText('Native scene slot')).toBeInTheDocument();
  });
});
