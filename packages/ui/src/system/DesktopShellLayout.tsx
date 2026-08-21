import type { ReactNode } from 'react';
import { Card, ScrollView, Toolbar } from '../components';
import type { SystemInsets, SystemSurfaceEdge, SystemSurfaceKind } from './SystemScaffold';
import { SystemScaffold, SystemSurface } from './SystemScaffold';

export type DesktopShellLayoutProps = {
  /** Caller-owned workspace content; native scene/window authority remains outside React. */
  workspace: ReactNode;
  /** Optional top System bar composition. */
  topBar?: ReactNode;
  /** Optional dock composition using accepted Component controls. */
  dock?: ReactNode;
  /** Logical dock edge; inline start/end remain direction-safe. */
  dockEdge?: Extract<SystemSurfaceEdge, 'block-end' | 'inline-start' | 'inline-end'>;
  /** Optional nonmodal System panel composition. */
  panel?: ReactNode;
  /** Logical panel edge; inline start/end remain direction-safe. */
  panelEdge?: Extract<SystemSurfaceEdge, 'inline-start' | 'inline-end'>;
  /** Optional transient System layer; lifecycle authority stays with the caller. */
  transient?: ReactNode;
  /** Optional privileged System layer mounted only by the owning System composition. */
  privileged?: ReactNode;
  /** Logical System insets supplied by the host without device-name branching. */
  insets?: SystemInsets;
  /** Optional consumer class name appended without changing component ownership. */
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
  /** Accessible toolbar label for the System bar. */
  label: string;
  /** Optional logical-start content; direction follows the owning UI environment. */
  leading?: ReactNode;
  /** Optional center group between logical leading and trailing System bar content. */
  center?: ReactNode;
  /** Optional logical-end content; direction follows the owning UI environment. */
  trailing?: ReactNode;
  /** Logical surface edge; start/end semantics remain correct in RTL. */
  edge?: Extract<SystemSurfaceEdge, 'block-start' | 'block-end'>;
  /** Named visual density that does not weaken Component touch-target contracts. */
  density?: 'compact' | 'comfortable';
  /** Optional consumer class name appended without changing component ownership. */
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
  /** Accessible toolbar label for the System dock. */
  label?: string;
  /** Logical surface edge; start/end semantics remain correct in RTL. */
  edge?: Extract<SystemSurfaceEdge, 'block-end' | 'inline-start' | 'inline-end'>;
  /** Caller-owned content rendered inside this reusable visual boundary. */
  children: ReactNode;
  /** Optional logical-end content; direction follows the owning UI environment. */
  trailing?: ReactNode;
  /** Optional consumer class name appended without changing component ownership. */
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
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title: ReactNode;
  /** Optional caller-owned supporting title text. */
  subtitle?: ReactNode;
  /** Optional caller-owned action region composed from public Components. */
  actions?: ReactNode;
  /** Caller-owned content rendered inside this reusable visual boundary. */
  children: ReactNode;
  /** Chooses whether the panel participates as persistent chrome or transient System UI. */
  kind?: Extract<SystemSurfaceKind, 'chrome' | 'transient'>;
  /** Logical surface edge; start/end semantics remain correct in RTL. */
  edge?: Extract<SystemSurfaceEdge, 'inline-start' | 'inline-end'>;
  /** Named panel width bounded by the current container. */
  width?: 'sm' | 'md' | 'lg';
  /** Optional accessible panel label; falls back to a string title when available. */
  label?: string;
  /** Optional consumer class name appended without changing component ownership. */
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
  /** Accessible group label for related System chrome content. */
  label: string;
  /** Caller-owned content rendered inside this reusable visual boundary. */
  children: ReactNode;
  /** Optional logical-end content; direction follows the owning UI environment. */
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
