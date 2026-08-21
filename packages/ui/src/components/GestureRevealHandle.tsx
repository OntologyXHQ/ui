import type { ButtonHTMLAttributes } from 'react';
import { cursorRoleAttributes } from '../cursor/CursorRegion';
import { Label, Stack } from '../primitives';

export type GestureRevealHandleProps = {
  /** Arena-owned pointer/gesture handlers supplied by the shared reveal runtime. */
  gestureProps: ButtonHTMLAttributes<HTMLButtonElement>;
  /** Accessible activation path equivalent to committing the reveal gesture. */
  onActivate: () => void;
  /** Current expanded state reflected through `aria-expanded`. @default false */
  expanded?: boolean;
  /** Optional visible action label; otherwise a state-aware default is shown. */
  label?: string;
  /** Optional accessible name when it must differ from the visible action label. */
  ariaLabel?: string;
};

export function GestureRevealHandle({
  gestureProps,
  onActivate,
  expanded = false,
  label,
  ariaLabel,
}: GestureRevealHandleProps) {
  const visibleLabel = label ?? (expanded ? 'Drag to hide' : 'Drag to reveal');
  const accessibleLabel = ariaLabel ?? visibleLabel;
  return (
    <button
      {...gestureProps}
      type="button"
      className={`ui-gesture-reveal ${gestureProps.className ?? ''}`.trim()}
      aria-expanded={expanded}
      aria-label={accessibleLabel}
      onClick={(event) => {
        gestureProps.onClick?.(event);
        if (!event.defaultPrevented) onActivate();
      }}
      {...cursorRoleAttributes(expanded ? 'grabbing' : 'grab')}
    >
      <Stack gap="3xs" align="center">
        <span className="ui-gesture-reveal__handle" aria-hidden />
        <Label tone="tertiary">{visibleLabel}</Label>
      </Stack>
    </button>
  );
}
