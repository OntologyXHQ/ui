import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import type { ElevationToken, MaterialToken, RadiusToken } from '../foundations';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type SurfaceBorder = 'none' | 'subtle' | 'strong';
export type DividerTone = 'subtle' | 'default' | 'strong';
export type DividerThickness = 'hairline' | 'strong';

export type SurfaceProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    /** Foundation material role only; interaction/selection state belongs to Components. @default glass */
    material?: MaterialToken;
    /** Static Foundation elevation tier. Hover/press elevation is not a Primitive contract. @default 1 */
    elevation?: ElevationToken;
    /** Foundation shape token. @default lg */
    radius?: RadiusToken;
    /** Static semantic border strength. @default subtle */
    border?: SurfaceBorder;
    /** Clips visual descendants to the selected surface radius. @default false */
    clip?: boolean;
  }
>;

export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(function Surface(
  {
    children,
    className = '',
    material = 'glass',
    elevation = 1,
    radius = 'lg',
    border = 'subtle',
    clip = false,
    ...props
  },
  ref,
) {
  const classes = [
    'ui-surface',
    `ui-surface--material-${material}`,
    `ui-surface--elevation-${elevation}`,
    `ui-radius-${radius}`,
    `ui-surface--border-${border}`,
    clip ? 'ui-surface--clip' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={ref} className={classes} {...props}>{children}</div>;
});

export type DividerProps = Omit<
  PrimitiveHtmlProps<HTMLDivElement>,
  'role' | 'aria-hidden' | 'aria-orientation'
> & {
  /** Separator axis. @default horizontal */
  orientation?: 'horizontal' | 'vertical';
  /** Logical-axis inset from the start/end/both edges. @default none */
  inset?: 'none' | 'start' | 'end' | 'both';
  /** Semantic border color role. @default subtle */
  tone?: DividerTone;
  /** Foundation border thickness token. @default hairline */
  thickness?: DividerThickness;
  /** Removes separator semantics when the line is purely ornamental. @default false */
  decorative?: boolean;
};

export function Divider({
  orientation = 'horizontal',
  inset = 'none',
  tone = 'subtle',
  thickness = 'hairline',
  decorative = false,
  className = '',
  ...props
}: DividerProps) {
  return (
    <div
      {...props}
      role={decorative ? 'none' : 'separator'}
      aria-hidden={decorative || undefined}
      aria-orientation={decorative ? undefined : orientation}
      className={[
        'ui-divider',
        `ui-divider--${orientation}`,
        `ui-divider--inset-${inset}`,
        `ui-divider--tone-${tone}`,
        `ui-divider--thickness-${thickness}`,
        className,
      ].filter(Boolean).join(' ')}
    />
  );
}
