import type { ReactNode } from 'react';
import { Card, ScrollView, Toolbar } from '../components';
import type { SystemInsets, SystemSurfaceEdge, SystemSurfaceKind } from './SystemScaffold';
import { SystemScaffold, SystemSurface } from './SystemScaffold';

export type DesktopShellLayoutProps = {
  workspace: ReactNode;
  topBar?: ReactNode;
  dock?: ReactNode;
  dockEdge?: Extract<SystemSurfaceEdge, 'block-end' | 'inline-start' | 'inline-end'>;
  panel?: ReactNode;
  panelEdge?: Extract<SystemSurfaceEdge, 'inline-start' | 'inline-end'>;
  transient?: ReactNode;
  privileged?: ReactNode;
  insets?: SystemInsets;
  className?: string;
};

/** OXS desktop slot vocabulary. Native scene/window authority stays outside React. */
export function DesktopShellLayout({
  workspace,
  topBar,
  dock,
  dockEdge = 'block-end',
  panel,
  panelEdge = 'inline-end',
  transient,
  privileged,
  insets,
  className = '',
}: DesktopShellLayoutProps) {
  const chrome =
    topBar || dock || panel ? (
      <div className="ui-desktop-shell-layout__chrome">
        {topBar ? <div className="ui-desktop-shell-layout__top-bar">{topBar}</div> : null}
        {dock ? (
          <div className="ui-desktop-shell-layout__dock" data-edge={dockEdge}>
            {dock}
          </div>
        ) : null}
        {panel ? (
          <div className="ui-desktop-shell-layout__panel" data-edge={panelEdge}>
            {panel}
          </div>
        ) : null}
      </div>
    ) : undefined;

  return (
    <SystemScaffold
      className={`ui-desktop-shell-layout ${className}`.trim()}
      workspace={workspace}
      chrome={chrome}
      transient={transient}
      privileged={privileged}
      insets={insets}
    />
  );
}

export type SystemBarProps = {
  label: string;
  leading?: ReactNode;
  center?: ReactNode;
  trailing?: ReactNode;
  edge?: Extract<SystemSurfaceEdge, 'block-start' | 'block-end'>;
  density?: 'compact' | 'comfortable';
  className?: string;
};

export function SystemBar({
  label,
  leading,
  center,
  trailing,
  edge = 'block-start',
  density = 'comfortable',
  className = '',
}: SystemBarProps) {
  return (
    <SystemSurface
      kind="chrome"
      edge={edge}
      label={label}
      className={`ui-system-bar ui-system-bar--${density} ${className}`.trim()}
    >
      <Toolbar className="ui-system-bar__toolbar" label={label}>
        <span className="ui-system-bar__leading">{leading}</span>
        <span className="ui-system-bar__center">{center}</span>
        <span className="ui-system-bar__trailing">{trailing}</span>
      </Toolbar>
    </SystemSurface>
  );
}

export type SystemDockProps = {
  label?: string;
  edge?: Extract<SystemSurfaceEdge, 'block-end' | 'inline-start' | 'inline-end'>;
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function SystemDock({
  label = 'System dock',
  edge = 'block-end',
  children,
  trailing,
  className = '',
}: SystemDockProps) {
  return (
    <SystemSurface
      kind="chrome"
      edge={edge}
      label={label}
      className={`ui-system-dock ${className}`.trim()}
    >
      <Toolbar className="ui-system-dock__toolbar" label={label} overflow={trailing}>
        {children}
      </Toolbar>
    </SystemSurface>
  );
}

export type SystemPanelProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  kind?: Extract<SystemSurfaceKind, 'chrome' | 'transient'>;
  edge?: Extract<SystemSurfaceEdge, 'inline-start' | 'inline-end'>;
  width?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

export function SystemPanel({
  title,
  subtitle,
  actions,
  children,
  kind = 'chrome',
  edge = 'inline-end',
  width = 'md',
  label,
  className = '',
}: SystemPanelProps) {
  const resolvedLabel = label ?? (typeof title === 'string' ? title : 'System panel');
  return (
    <SystemSurface
      kind={kind}
      edge={edge}
      label={resolvedLabel}
      className={`ui-system-panel ui-system-panel--${width} ${className}`.trim()}
    >
      <Card
        className="ui-system-panel__card"
        padding="sm"
        title={title}
        description={subtitle}
        actions={actions}
        emphasis="strong"
      >
        <ScrollView className="ui-system-panel__scroll" ariaLabel={resolvedLabel}>
          {children}
        </ScrollView>
      </Card>
    </SystemSurface>
  );
}

export type SystemChromeGroupProps = {
  label: string;
  children: ReactNode;
  trailing?: ReactNode;
};

export function SystemChromeGroup({ label, children, trailing }: SystemChromeGroupProps) {
  return (
    <div className="ui-system-chrome-group" role="group" aria-label={label}>
      <div className="ui-system-chrome-group__content">{children}</div>
      {trailing ? <div className="ui-system-chrome-group__trailing">{trailing}</div> : null}
    </div>
  );
}
