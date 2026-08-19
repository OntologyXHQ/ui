import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from 'react';
import { createElement } from 'react';
import type { SpaceToken } from '../foundations';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type LayoutGap = SpaceToken;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type LayoutOverflow = 'visible' | 'clip' | 'hidden' | 'auto';
export type LayoutMinSize = 'auto' | 'zero';
export type LayoutFlex = 'initial' | 'none' | 'auto' | 'grow';
export type LayoutAlignSelf = 'auto' | 'start' | 'center' | 'end' | 'stretch';
export type GridSpan = 'auto' | 'full' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type BoxElement =
  | 'div'
  | 'section'
  | 'article'
  | 'aside'
  | 'main'
  | 'nav'
  | 'header'
  | 'footer'
  | 'figure'
  | 'figcaption'
  | 'address'
  | 'ul'
  | 'ol'
  | 'li'
  | 'dl'
  | 'dt'
  | 'dd'
  | 'form'
  | 'fieldset';

type LayoutBoundaryProps = {
  /** Controls clipping/scrolling on both logical axes. @default visible */
  overflow?: LayoutOverflow;
  /** Overrides overflow on the logical inline axis without introducing physical x/y API. */
  overflowInline?: LayoutOverflow;
  /** Overrides overflow on the logical block axis without introducing physical x/y API. */
  overflowBlock?: LayoutOverflow;
  /** Controls the inline-axis minimum size; `zero` prevents flex/grid content from forcing overflow. @default zero */
  minInlineSize?: LayoutMinSize;
  /** Controls the block-axis minimum size for nested scroll/flex layouts. @default auto */
  minBlockSize?: LayoutMinSize;
  /** Controls flex participation when this primitive is itself a flex child. @default initial */
  flex?: LayoutFlex;
  /** Controls cross-axis self alignment when this primitive is a flex/grid child. @default auto */
  alignSelf?: LayoutAlignSelf;
  /** Controls the grid-column span when this primitive is a direct Grid child. @default auto */
  gridSpan?: GridSpan;
};

type PolymorphicLayoutBaseProps<T extends BoxElement, OwnKeys extends PropertyKey = never> =
  LayoutBoundaryProps & {
    /** Chooses the native semantic element while preserving that element's native prop typing. */
    as?: T;
    /** Structural escape hatch for host/layout integration; visual values still belong in typed props/tokens. */
    className?: string;
  } & Omit<
    ComponentPropsWithoutRef<T>,
    OwnKeys | keyof LayoutBoundaryProps | 'as' | 'children' | 'className' | 'style' | 'color'
  >;

function boundaryClasses({
  overflow,
  overflowInline,
  overflowBlock,
  minInlineSize,
  minBlockSize,
  flex,
  alignSelf,
  gridSpan,
}: Required<Pick<LayoutBoundaryProps, 'overflow' | 'minInlineSize' | 'minBlockSize' | 'flex' | 'alignSelf' | 'gridSpan'>> &
  Pick<LayoutBoundaryProps, 'overflowInline' | 'overflowBlock'>) {
  return [
    `ui-overflow-${overflow}`,
    overflowInline ? `ui-overflow-inline-${overflowInline}` : '',
    overflowBlock ? `ui-overflow-block-${overflowBlock}` : '',
    `ui-min-inline-${minInlineSize}`,
    `ui-min-block-${minBlockSize}`,
    `ui-flex-${flex}`,
    `ui-align-self-${alignSelf}`,
    `ui-grid-span-${gridSpan}`,
  ].filter(Boolean);
}

function layoutClasses(
  kind: string,
  gap: LayoutGap,
  align: Align,
  justify: Justify,
  boundary: Parameters<typeof boundaryClasses>[0],
  className: string,
) {
  return [
    `ui-${kind}`,
    `ui-gap-${gap}`,
    `ui-align-${align}`,
    `ui-justify-${justify}`,
    ...boundaryClasses(boundary),
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function renderElement<T extends BoxElement>(
  as: T,
  className: string,
  props: Record<string, unknown>,
  children: ReactNode,
) {
  return createElement(as, { ...props, className }, children);
}

export type BoxProps<T extends BoxElement = 'div'> = PropsWithChildren<PolymorphicLayoutBaseProps<T>>;

export function Box<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  className = '',
  overflow = 'visible',
  overflowInline,
  overflowBlock,
  minInlineSize = 'zero',
  minBlockSize = 'auto',
  flex = 'initial',
  alignSelf = 'auto',
  gridSpan = 'auto',
  ...props
}: BoxProps<T>) {
  const classes = [
    'ui-box',
    ...boundaryClasses({
      overflow,
      overflowInline,
      overflowBlock,
      minInlineSize,
      minBlockSize,
      flex,
      alignSelf,
      gridSpan,
    }),
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return renderElement(as, classes, props as Record<string, unknown>, children);
}

type FlowOwnProps = {
  /** Semantic spacing token between direct children. @default md */
  gap?: LayoutGap;
  /** Cross-axis child alignment. */
  align?: Align;
  /** Main-axis child distribution without changing DOM order. @default start */
  justify?: Justify;
};

export type StackProps<T extends BoxElement = 'div'> = PropsWithChildren<
  FlowOwnProps & PolymorphicLayoutBaseProps<T, keyof FlowOwnProps>
>;

export function Stack<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  className = '',
  overflow = 'visible',
  overflowInline,
  overflowBlock,
  minInlineSize = 'zero',
  minBlockSize = 'auto',
  flex = 'initial',
  alignSelf = 'auto',
  gridSpan = 'auto',
  ...props
}: StackProps<T>) {
  const classes = layoutClasses(
    'stack',
    gap,
    align,
    justify,
    { overflow, overflowInline, overflowBlock, minInlineSize, minBlockSize, flex, alignSelf, gridSpan },
    className,
  );
  return renderElement(as, classes, props as Record<string, unknown>, children);
}

export type RowProps<T extends BoxElement = 'div'> = PropsWithChildren<
  FlowOwnProps & PolymorphicLayoutBaseProps<T, keyof FlowOwnProps>
>;

export function Row<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  className = '',
  overflow = 'visible',
  overflowInline,
  overflowBlock,
  minInlineSize = 'zero',
  minBlockSize = 'auto',
  flex = 'initial',
  alignSelf = 'auto',
  gridSpan = 'auto',
  ...props
}: RowProps<T>) {
  const classes = layoutClasses(
    'row',
    gap,
    align,
    justify,
    { overflow, overflowInline, overflowBlock, minInlineSize, minBlockSize, flex, alignSelf, gridSpan },
    className,
  );
  return renderElement(as, classes, props as Record<string, unknown>, children);
}

export type WrapProps<T extends BoxElement = 'div'> = PropsWithChildren<
  FlowOwnProps & PolymorphicLayoutBaseProps<T, keyof FlowOwnProps>
>;

export function Wrap<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  className = '',
  overflow = 'visible',
  overflowInline,
  overflowBlock,
  minInlineSize = 'zero',
  minBlockSize = 'auto',
  flex = 'initial',
  alignSelf = 'auto',
  gridSpan = 'auto',
  ...props
}: WrapProps<T>) {
  const classes = layoutClasses(
    'wrap',
    gap,
    align,
    justify,
    { overflow, overflowInline, overflowBlock, minInlineSize, minBlockSize, flex, alignSelf, gridSpan },
    className,
  );
  return renderElement(as, classes, props as Record<string, unknown>, children);
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
