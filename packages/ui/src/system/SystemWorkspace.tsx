import type { ReactNode } from 'react';
import { AppBar, StatusIndicator } from '../components';

export type SystemWorkspaceProps = {
  title?: ReactNode;
  status?: string;
  label?: string;
  children?: ReactNode;
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
