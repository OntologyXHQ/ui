import type { CSSProperties, ReactNode } from 'react';

export type SystemInsets = {
  blockStart?: number;
  inlineEnd?: number;
  blockEnd?: number;
  inlineStart?: number;
};

export type SystemScaffoldProps = {
  workspace: ReactNode;
  chrome?: ReactNode;
  transient?: ReactNode;
  privileged?: ReactNode;
  insets?: SystemInsets;
  className?: string;
};

export type SystemSurfaceKind = 'chrome' | 'transient' | 'privileged';
export type SystemSurfaceEdge = 'none' | 'block-start' | 'inline-end' | 'block-end' | 'inline-start';

export type SystemSurfaceProps = {
  kind: SystemSurfaceKind;
  edge?: SystemSurfaceEdge;
  occludesContent?: boolean;
  label?: string;
  className?: string;
  children: ReactNode;
};

type SystemStyle = CSSProperties & {
  '--oxs-system-inset-block-start'?: string;
  '--oxs-system-inset-inline-end'?: string;
  '--oxs-system-inset-block-end'?: string;
  '--oxs-system-inset-inline-start'?: string;
};

function insetValue(value: number | undefined): string {
  return `${Math.max(0, value ?? 0)}px`;
}

export function SystemScaffold({
  workspace,
  chrome,
  transient,
  privileged,
  insets,
  className = '',
}: SystemScaffoldProps) {
  const style: SystemStyle = {
    '--oxs-system-inset-block-start': insetValue(insets?.blockStart),
    '--oxs-system-inset-inline-end': insetValue(insets?.inlineEnd),
    '--oxs-system-inset-block-end': insetValue(insets?.blockEnd),
    '--oxs-system-inset-inline-start': insetValue(insets?.inlineStart),
  };

  return (
    <div
      className={`ui-system-scaffold ${className}`.trim()}
      style={style}
      data-oxs-system-scaffold
    >
      <div className="ui-system-scaffold__workspace">{workspace}</div>
      {chrome ? <div className="ui-system-scaffold__chrome">{chrome}</div> : null}
      {transient ? <div className="ui-system-scaffold__transient">{transient}</div> : null}
      {privileged ? (
        <div className="ui-system-scaffold__privileged" data-oxs-privileged-surface-host>
          {privileged}
        </div>
      ) : null}
    </div>
  );
}

export function SystemSurface({
  kind,
  edge = 'none',
  occludesContent = false,
  label,
  className = '',
  children,
}: SystemSurfaceProps) {
  return (
    <section
      className={`ui-system-surface ui-system-surface--${kind} ui-system-surface--${edge} ${className}`.trim()}
      aria-label={label}
      data-oxs-system-surface={kind}
      data-oxs-system-edge={edge}
      data-oxs-occludes-content={occludesContent || undefined}
    >
      {children}
    </section>
  );
}
