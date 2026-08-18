import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import type { CursorRole, SystemCursorRole } from './types';
import { normalizeCursorRole } from './types';

export type CursorRoleAttributes = {
  'data-oxs-cursor-role': SystemCursorRole;
};

export function cursorRoleAttributes(role: CursorRole): CursorRoleAttributes {
  return {
    'data-oxs-cursor-role': normalizeCursorRole(role),
  };
}

export function useCursorRole(role: CursorRole): CursorRoleAttributes {
  return useMemo(() => cursorRoleAttributes(role), [role]);
}

export type CursorRegionProps = PropsWithChildren<{
  role: CursorRole;
}>;

export function CursorRegion({ role, children }: CursorRegionProps) {
  return (
    <span className="ui-cursor-region" {...cursorRoleAttributes(role)}>
      {children}
    </span>
  );
}
