import type { ComponentPropsWithoutRef, PropsWithChildren, ReactNode } from 'react';
import { createElement } from 'react';
import type { SpaceToken } from '../foundations';

export type LayoutGap = SpaceToken;
export type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type LayoutOverflow = 'visible' | 'clip' | 'hidden' | 'auto';
export type LayoutMinSize = 'auto' | 'zero';
export type LayoutFlex = 'initial' | 'none' | 'auto' | 'grow';
export type LayoutAlignSelf = 'auto' | 'start' | 'center' | 'end' | 'stretch';
export type GridSpan = 'auto' | 'full' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type GridColumnCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type GridColumns = 'auto-fit' | GridColumnCount;
export type GridMinColumn = 'tile' | 'card' | 'wide';
export type ContainerWidth = 'readable' | 'content' | 'wide' | 'full';
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

type BoundaryValues = Required<
  Pick<LayoutBoundaryProps, 'overflow' | 'minInlineSize' | 'minBlockSize' | 'flex' | 'alignSelf' | 'gridSpan'>
> & Pick<LayoutBoundaryProps, 'overflowInline' | 'overflowBlock'>;

function boundaryClasses({
  overflow,
  overflowInline,
  overflowBlock,
  minInlineSize,
  minBlockSize,
  flex,
  alignSelf,
  gridSpan,
}: BoundaryValues) {
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
  boundary: BoundaryValues,
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

type GridOwnProps = {
  /** Semantic spacing token between grid tracks. @default md */
  gap?: LayoutGap;
  /** Uses a fixed finite track count or intrinsic `auto-fit` tracks. @default auto-fit */
  columns?: GridColumns;
  /** Minimum semantic track size used by `columns="auto-fit"`. @default card */
  minColumn?: GridMinColumn;
  /** Aligns grid items on the logical block/cross axis. @default stretch */
  align?: Align;
};

export type GridProps<T extends BoxElement = 'div'> = PropsWithChildren<
  GridOwnProps & PolymorphicLayoutBaseProps<T, keyof GridOwnProps>
>;

export function Grid<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  gap = 'md',
  columns = 'auto-fit',
  minColumn = 'card',
  align = 'stretch',
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
}: GridProps<T>) {
  const classes = [
    'ui-grid',
    `ui-grid-columns-${columns}`,
    `ui-grid-min-${minColumn}`,
    `ui-gap-${gap}`,
    `ui-align-${align}`,
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

type ContainerOwnProps = {
  /** Semantic maximum inline-size tier. `full` remains constrained by the containing block. @default content */
  width?: ContainerWidth;
};

export type ContainerProps<T extends BoxElement = 'div'> = PropsWithChildren<
  ContainerOwnProps & PolymorphicLayoutBaseProps<T, keyof ContainerOwnProps>
>;

export function Container<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  width = 'content',
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
}: ContainerProps<T>) {
  const classes = [
    'ui-container',
    `ui-container-width-${width}`,
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

type InsetOwnProps = {
  /** Base logical padding on every edge. Axis/edge props override only their owned edges. @default md */
  space?: SpaceToken;
  /** Overrides padding on both logical inline edges. */
  inline?: SpaceToken;
  /** Overrides padding on both logical block edges. */
  block?: SpaceToken;
  /** Overrides padding on the logical inline-start edge. */
  inlineStart?: SpaceToken;
  /** Overrides padding on the logical inline-end edge. */
  inlineEnd?: SpaceToken;
  /** Overrides padding on the logical block-start edge. */
  blockStart?: SpaceToken;
  /** Overrides padding on the logical block-end edge. */
  blockEnd?: SpaceToken;
};

export type InsetProps<T extends BoxElement = 'div'> = PropsWithChildren<
  InsetOwnProps & PolymorphicLayoutBaseProps<T, keyof InsetOwnProps>
>;

export function Inset<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  space = 'md',
  inline,
  block,
  inlineStart,
  inlineEnd,
  blockStart,
  blockEnd,
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
}: InsetProps<T>) {
  const classes = [
    'ui-inset',
    `ui-inset-all-${space}`,
    inline ? `ui-inset-inline-${inline}` : '',
    block ? `ui-inset-block-${block}` : '',
    inlineStart ? `ui-inset-inline-start-${inlineStart}` : '',
    inlineEnd ? `ui-inset-inline-end-${inlineEnd}` : '',
    blockStart ? `ui-inset-block-start-${blockStart}` : '',
    blockEnd ? `ui-inset-block-end-${blockEnd}` : '',
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

export type SafeAreaEdge = 'block-start' | 'inline-end' | 'block-end' | 'inline-start';
export type SafeAreaEdges = 'all' | 'inline' | 'block' | SafeAreaEdge | readonly SafeAreaEdge[];

type SafeAreaOwnProps = {
  /** Persistent safe-area edges to consume. Arrays allow explicit logical combinations. @default all */
  edges?: SafeAreaEdges;
};

export type SafeAreaProps<T extends BoxElement = 'div'> = PropsWithChildren<
  SafeAreaOwnProps & PolymorphicLayoutBaseProps<T, keyof SafeAreaOwnProps>
>;

function normalizedSafeAreaEdges(edges: SafeAreaEdges): readonly SafeAreaEdge[] {
  if (typeof edges !== 'string') return [...new Set(edges)];
  if (edges === 'all') return ['block-start', 'inline-end', 'block-end', 'inline-start'];
  if (edges === 'inline') return ['inline-start', 'inline-end'];
  if (edges === 'block') return ['block-start', 'block-end'];
  return [edges];
}

export function SafeArea<T extends BoxElement = 'div'>({
  as = 'div' as T,
  children,
  edges = 'all',
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
}: SafeAreaProps<T>) {
  const classes = [
    'ui-safe-area',
    ...normalizedSafeAreaEdges(edges).map((edge) => `ui-safe-area-edge-${edge}`),
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

export type SpacerAxis = 'inline' | 'block';
export type SpacerProps = {
  /** Tokenized spacer extent on its selected logical axis. @default md */
  size?: SpaceToken;
  /** Logical axis that receives the spacer extent. @default block */
  axis?: SpacerAxis;
  /** Structural selector hook; Spacer remains permanently non-semantic and aria-hidden. */
  className?: string;
};

export function Spacer({ size = 'md', axis = 'block', className = '' }: SpacerProps) {
  return (
    <span
      className={`ui-spacer ui-spacer-size-${size} ui-spacer-axis-${axis} ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
