import type { PropsWithChildren } from 'react';
import type { PrimitiveHtmlProps } from './PrimitiveProps';

export type TextTone = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'danger' | 'success';
export type TextVariant = 'body' | 'body-strong' | 'caption' | 'label';
export type HeadingSize = 'display' | 'title' | 'heading';
export type TextWrap = 'normal' | 'balance' | 'pretty' | 'nowrap';

type SharedTextProps = {
  tone?: TextTone;
  truncate?: boolean;
  selectable?: boolean;
  wrap?: TextWrap;
};

function textStateClasses(tone: TextTone, truncate: boolean, selectable: boolean, wrap: TextWrap) {
  return [
    `ui-text--${tone}`,
    `ui-text--wrap-${wrap}`,
    truncate ? 'ui-text--truncate' : '',
    selectable ? 'ui-text--selectable' : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export type TextProps = PropsWithChildren<
  SharedTextProps &
    PrimitiveHtmlProps<HTMLElement> & {
      as?: 'p' | 'span';
      variant?: TextVariant;
    }
>;

export function Text({
  as = 'p',
  children,
  tone = 'primary',
  truncate = false,
  selectable = false,
  wrap = 'normal',
  variant = 'body',
  className = '',
  ...props
}: TextProps) {
  const classes = `ui-text ui-text--${variant} ${textStateClasses(
    tone,
    truncate,
    selectable,
    wrap,
  )} ${className}`.trim();

  if (as === 'span') {
    return (
      <span className={classes} {...props}>
        {children}
      </span>
    );
  }

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}

export type HeadingProps = PropsWithChildren<
  SharedTextProps &
    PrimitiveHtmlProps<HTMLHeadingElement> & {
      level?: 1 | 2 | 3 | 4 | 5 | 6;
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
  className = '',
  ...props
}: HeadingProps) {
  const classes = `ui-heading ui-heading--${size} ${textStateClasses(
    tone,
    truncate,
    selectable,
    wrap,
  )} ${className}`.trim();

  if (level === 1) {
    return <h1 className={classes} {...props}>{children}</h1>;
  }
  if (level === 3) {
    return <h3 className={classes} {...props}>{children}</h3>;
  }
  if (level === 4) {
    return <h4 className={classes} {...props}>{children}</h4>;
  }
  if (level === 5) {
    return <h5 className={classes} {...props}>{children}</h5>;
  }
  if (level === 6) {
    return <h6 className={classes} {...props}>{children}</h6>;
  }
  return <h2 className={classes} {...props}>{children}</h2>;
}

export type LabelProps = PropsWithChildren<
  SharedTextProps &
    PrimitiveHtmlProps<HTMLSpanElement> & {
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
  className = '',
  ...props
}: LabelProps) {
  const classes = `ui-label ui-label--${emphasis} ${textStateClasses(
    tone,
    truncate,
    selectable,
    wrap,
  )} ${className}`.trim();

  return <span className={classes} {...props}>{children}</span>;
}

export type CodeProps = PropsWithChildren<
  PrimitiveHtmlProps<HTMLElement> & {
    as?: 'code' | 'kbd' | 'samp';
    tone?: TextTone;
    selectable?: boolean;
    wrap?: TextWrap;
  }
>;

export function Code({
  as = 'code',
  children,
  tone = 'primary',
  selectable = true,
  wrap = 'normal',
  className = '',
  ...props
}: CodeProps) {
  const Element = as;
  return (
    <Element
      className={`ui-code ${textStateClasses(tone, false, selectable, wrap)} ${className}`.trim()}
      {...props}
    >
      {children}
    </Element>
  );
}
