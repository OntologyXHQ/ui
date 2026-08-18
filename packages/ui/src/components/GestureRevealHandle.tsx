import type { ButtonHTMLAttributes } from 'react';
import { Label, Stack } from '../primitives';

export type GestureRevealHandleProps = {
  gestureProps: ButtonHTMLAttributes<HTMLButtonElement>;
  onActivate: () => void;
  expanded?: boolean;
  label?: string;
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
      data-oxs-cursor-role="grab"
    >
      <Stack gap="3xs" align="center">
        <span className="ui-gesture-reveal__handle" aria-hidden />
        <Label tone="tertiary">{visibleLabel}</Label>
      </Stack>
    </button>
  );
}
