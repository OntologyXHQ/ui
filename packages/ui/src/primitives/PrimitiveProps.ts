import type { HTMLAttributes, SVGAttributes } from 'react';

/**
 * Public Primitive DOM escape hatch.
 *
 * `className` remains available so Components/System UI inside @oxs/ui can bind
 * structural selectors. Inline `style` is intentionally excluded: visual values
 * must come from Foundations tokens or explicit Primitive props.
 */
export type PrimitiveHtmlProps<T extends HTMLElement> = Omit<HTMLAttributes<T>, 'style' | 'color'>;

export type PrimitiveSvgProps = Omit<
  SVGAttributes<SVGSVGElement>,
  'children' | 'style' | 'color'
>;
