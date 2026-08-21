import type { ReactNode } from 'react';
import { AppBar, StatusIndicator } from '../components';

export type SystemWorkspaceProps = {
  /** Caller-owned visible title; reusable UI never supplies product meaning. */
  title?: ReactNode;
  /** Optional caller-owned workspace status text rendered in System chrome. */
  status?: string;
  /** Accessible landmark label for the workspace region. */
  label?: string;
  /** Caller-owned content rendered inside this reusable visual boundary. */
  children?: ReactNode;
  /** Optional consumer class name appended without changing component ownership. */
  className?: string;
};

export function SystemWorkspace({
  title = 'OXS',
  status = 'Desktop',
  label = 'Desktop workspace',
  children,
  className = '',
}: SystemWorkspaceProps) {
  return (
    <section
      className={`ui-system-workspace ${className}`.trim()}
      aria-label={label}
      data-oxs-production-workspace
    >
      <AppBar
        className="ui-system-workspace__bar"
        title={title}
        actions={<StatusIndicator tone="neutral" label={status} />}
      />
      {children ? <div className="ui-system-workspace__scene">{children}</div> : null}
    </section>
  );
}
