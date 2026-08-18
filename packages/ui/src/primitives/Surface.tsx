import type { PropsWithChildren } from 'react';
import { forwardRef } from 'react';
import type { ElevationToken, MaterialToken, RadiusToken } from '../foundations';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type SurfaceProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    material?: MaterialToken;
    elevation?: ElevationToken;
    radius?: RadiusToken;
    border?: 'none' | 'subtle' | 'strong';
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

export type DividerProps = PrimitiveHtmlProps<HTMLDivElement> & {
  orientation?: 'horizontal' | 'vertical';
  inset?: 'none' | 'start' | 'end' | 'both';
  decorative?: boolean;
};

export function Divider({
  orientation = 'horizontal',
  inset = 'none',
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
      className={`ui-divider ui-divider--${orientation} ui-divider--inset-${inset} ${className}`.trim()}
    />
  );
}
