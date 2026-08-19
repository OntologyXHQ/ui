import type { ComponentPropsWithoutRef, PropsWithChildren } from 'react';
import { createElement } from 'react';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'danger'
  | 'success'
  | 'warning';
export type TextVariant = 'body' | 'body-strong' | 'caption';
export type HeadingSize = 'display' | 'title' | 'heading';
export type TextWrap = 'normal' | 'balance' | 'pretty' | 'nowrap';
export type TextOverflowWrap = 'normal' | 'anywhere';
export type TextElement = 'p' | 'span';
export type CodeElement = 'code' | 'kbd' | 'samp';

/** Shared visual text policy. Native `dir`, `lang`, `title`, data-* and aria-* attributes remain available. */
type SharedTextProps = {
  /** Semantic foreground role resolved through Foundation color tokens. @default primary */
  tone?: TextTone;
  /** Uses a single-line ellipsis without changing the accessible/full text content. @default false */
  truncate?: boolean;
  /** Opts the rendered text into explicit text selection rather than inheriting host selection policy. @default false */
  selectable?: boolean;
  /** Browser text-wrap strategy; bidi direction still comes from native `dir`/UiRoot. @default normal */
  wrap?: TextWrap;
  /** Allows otherwise-unbreakable strings to wrap without introducing horizontal page overflow. @default normal */
  overflowWrap?: TextOverflowWrap;
};

function textStateClasses(
  tone: TextTone,
  truncate: boolean,
  selectable: boolean,
  wrap: TextWrap,
  overflowWrap: TextOverflowWrap,
) {
  return [
    `ui-text--${tone}`,
    `ui-text--wrap-${wrap}`,
    `ui-text--overflow-wrap-${overflowWrap}`,
    truncate ? 'ui-text--truncate' : '',
    selectable ? 'ui-text--selectable' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

type PolymorphicTextProps<T extends TextElement, OwnKeys extends PropertyKey = never> = {
  /** Chooses paragraph or inline native semantics while preserving that element's native prop typing. @default p */
  as?: T;
  /** Structural class hook for package/consumer composition; visual values still come from tokens/typed props. */
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<T>,
  OwnKeys | keyof SharedTextProps | 'as' | 'children' | 'className' | 'style' | 'color'
>;

export type TextProps<T extends TextElement = 'p'> = PropsWithChildren<
  SharedTextProps &
    PolymorphicTextProps<T, 'variant'> & {
      /** Visual body/caption role; native element semantics are controlled independently by `as`. @default body */
      variant?: TextVariant;
    }
>;

export function Text<T extends TextElement = 'p'>({
  as = 'p' as T,
  children,
  tone = 'primary',
  truncate = false,
  selectable = false,
  wrap = 'normal',
  overflowWrap = 'normal',
  variant = 'body',
  className = '',
  ...props
}: TextProps<T>) {
  const classes = [
    'ui-text',
    `ui-text--${variant}`,
    textStateClasses(tone, truncate, selectable, wrap, overflowWrap),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(as, { ...props, className: classes }, children);
}

export type HeadingProps = PropsWithChildren<
  SharedTextProps &
    PrimitiveHtmlProps<HTMLHeadingElement> & {
      /** Native heading rank used for document/accessibility structure. @default 2 */
      level?: 1 | 2 | 3 | 4 | 5 | 6;
      /** Visual heading scale independent from the semantic rank. @default heading */
      size?: HeadingSize;
    }
>;

export function Heading({
  children,
  level = 2,
  size = 'heading',
  tone = 'primary',
  truncate = false,
  selectable = false,
  wrap = 'balance',
  overflowWrap = 'normal',
  className = '',
  ...props
}: HeadingProps) {
  const classes = [
    'ui-heading',
    `ui-heading--${size}`,
    textStateClasses(tone, truncate, selectable, wrap, overflowWrap),
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return createElement(tag, { ...props, className: classes }, children);
}

export type LabelProps = PropsWithChildren<
  SharedTextProps &
    PrimitiveHtmlProps<HTMLSpanElement> & {
      /** Visual weight only. Form-control association belongs to Field/Component semantics above Primitives. @default regular */
      emphasis?: 'regular' | 'strong';
    }
>;

export function Label({
  children,
  emphasis = 'regular',
  tone = 'secondary',
  truncate = false,
  selectable = false,
  wrap = 'normal',
  overflowWrap = 'normal',
  className = '',
  ...props
}: LabelProps) {
  const classes = [
    'ui-label',
    `ui-label--${emphasis}`,
    textStateClasses(tone, truncate, selectable, wrap, overflowWrap),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={classes} {...props}>{children}</span>;
}

type PolymorphicCodeProps<T extends CodeElement> = {
  /** Chooses native code, keyboard-input or sample-output semantics. @default code */
  as?: T;
  /** Structural class hook for package/consumer composition; inline visual values remain forbidden. */
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<T>,
  keyof Pick<SharedTextProps, 'tone' | 'selectable' | 'wrap' | 'overflowWrap'> |
    'as' |
    'children' |
    'className' |
    'style' |
    'color'
>;

export type CodeProps<T extends CodeElement = 'code'> = PropsWithChildren<
  PolymorphicCodeProps<T> & {
    /** Semantic foreground role resolved through Foundation color tokens. @default primary */
    tone?: TextTone;
    /** Opts code-like text into explicit selection. @default true */
    selectable?: boolean;
    /** Browser text-wrap strategy. @default normal */
    wrap?: TextWrap;
    /** Allows long code/tokens to wrap when the owning composition chooses reflow over scrolling. @default normal */
    overflowWrap?: TextOverflowWrap;
  }
>;

export function Code<T extends CodeElement = 'code'>({
  as = 'code' as T,
  children,
  tone = 'primary',
  selectable = true,
  wrap = 'normal',
  overflowWrap = 'normal',
  className = '',
  ...props
}: CodeProps<T>) {
  return createElement(
    as,
    {
      ...props,
      className: [
        'ui-code',
        textStateClasses(tone, false, selectable, wrap, overflowWrap),
        className,
      ]
        .filter(Boolean)
        .join(' '),
    },
    children,
  );
}
