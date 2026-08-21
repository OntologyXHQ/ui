import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import type { CursorRole, SystemCursorRole } from './types';
import { normalizeCursorRole } from './types';

export type CursorRoleAttributes = {
  /** Browser-preview/system fallback role. */
  'data-oxs-cursor-role': SystemCursorRole;
  /** Full host-neutral intent, including custom role identifiers that the browser preview cannot render. */
  'data-oxs-cursor-intent': CursorRole;
};

export function cursorRoleAttributes(role: CursorRole): CursorRoleAttributes {
  return {
    'data-oxs-cursor-role': normalizeCursorRole(role),
    'data-oxs-cursor-intent': role,
  };
}

export function useCursorRole(role: CursorRole): CursorRoleAttributes {
  return useMemo(() => cursorRoleAttributes(role), [role]);
}

export type CursorRegionProps = PropsWithChildren<{
  /** Semantic cursor intent. Custom roles are preserved for the native host and use a safe browser fallback. */
  role: CursorRole;
}>;

export function CursorRegion({ role, children }: CursorRegionProps) {
  return (
    <span className="ui-cursor-region" {...cursorRoleAttributes(role)}>
      {children}
    </span>
  );
}
