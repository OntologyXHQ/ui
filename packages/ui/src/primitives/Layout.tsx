import type { PropsWithChildren } from 'react';
import type { SpaceToken } from '../foundations';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type LayoutGap = SpaceToken;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between';
export type BoxElement = 'div' | 'section' | 'article' | 'aside' | 'main' | 'nav';

type LayoutProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    gap?: LayoutGap;
    align?: Align;
    justify?: Justify;
  }
>;

function classes(kind: string, gap: LayoutGap, align: Align, justify: Justify, className: string) {
  return `ui-${kind} ui-gap-${gap} ui-align-${align} ui-justify-${justify} ${className}`.trim();
}

export type BoxProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLElement> & {
    as?: BoxElement;
  }
>;

export function Box({ as = 'div', children, className = '', ...props }: BoxProps) {
  const Element = as;
  return (
    <Element className={`ui-box ${className}`.trim()} {...props}>
      {children}
    </Element>
  );
}

export function Stack({
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  ...props
}: LayoutProps) {
  return (
    <div className={classes('stack', gap, align, justify, className)} {...props}>
      {children}
    </div>
  );
}

export function Row({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  className = '',
  ...props
}: LayoutProps) {
  return (
    <div className={classes('row', gap, align, justify, className)} {...props}>
      {children}
    </div>
  );
}

export function Wrap({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  className = '',
  ...props
}: LayoutProps) {
  return (
    <div className={classes('wrap', gap, align, justify, className)} {...props}>
      {children}
    </div>
  );
}

export type GridProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    gap?: LayoutGap;
    min?: 'tile' | 'card' | 'wide';
  }
>;

export function Grid({ children, gap = 'md', min = 'card', className = '', ...props }: GridProps) {
  return (
    <div className={`ui-grid ui-grid--${min} ui-gap-${gap} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export type ContainerProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    width?: 'compact' | 'content' | 'wide' | 'full';
  }
>;

export function Container({
  children,
  width = 'content',
  className = '',
  ...props
}: ContainerProps) {
  return (
    <div className={`ui-container ui-container--${width} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export type InsetProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    space?: SpaceToken;
  }
>;

export function Inset({ children, space = 'md', className = '', ...props }: InsetProps) {
  return (
    <div className={`ui-inset ui-inset--${space} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export type SafeAreaEdge = 'all' | 'inline' | 'block' | 'block-start' | 'block-end';
export type SafeAreaProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLDivElement> & {
    edges?: SafeAreaEdge;
  }
>;

export function SafeArea({ children, edges = 'all', className = '', ...props }: SafeAreaProps) {
  return (
    <div className={`ui-safe-area ui-safe-area--${edges} ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export type SpacerAxis = 'both' | 'inline' | 'block';
export type SpacerProps = PrimitiveHtmlProps<HTMLSpanElement> & {
  size?: SpaceToken;
  axis?: SpacerAxis;
};

export function Spacer({ size = 'md', axis = 'both', className = '', ...props }: SpacerProps) {
  return (
    <span
      {...props}
      className={`ui-spacer ui-spacer--${size} ui-spacer--axis-${axis} ${className}`.trim()}
      aria-hidden
    />
  );
}
