export type UiDocsLayer = 'foundations' | 'primitives' | 'components' | 'system';
export type UiDocsStatus = 'candidate' | 'accepted' | 'experimental' | 'deprecated';

export type UiDocsExample = {
  id: string;
  title: string;
  description?: string;
  component: string;
};

export type UiDocsPreview = {
  /** Dedicated source-owned preview component used only when scalar/static fixture seeding is insufficient. */
  component: string;
};

export type UiDocsLiteral =
  | string
  | number
  | boolean
  | null
  | readonly UiDocsLiteral[]
  | { readonly [key: string]: UiDocsLiteral };

export type UiDocsPlayground = {
  preferredWidth?: 'narrow' | 'medium' | 'wide';
  /** Optional scalar-control whitelist. Omit to auto-generate every safe scalar control. */
  controls?: readonly string[];
  /** Explicit option controls for named/string-like prop types that cannot be inferred safely. */
  options?: { readonly [prop: string]: readonly string[] };
  /** Static fixture props for complex required values such as options/items. */
  fixture?: { readonly [key: string]: UiDocsLiteral };
};

export type UiDocsDefinition = {
  exportName: string;
  layer: UiDocsLayer;
  category: string;
  /** Relative navigation order within the owning layer/category taxonomy. */
  order: number;
  summary: string;
  usage: string;
  status: UiDocsStatus;
  accessibility: string;
  rtl: string;
  touch: string;
  responsive: string;
  examples?: readonly UiDocsExample[];
  /** Explicit per-export preview escape hatch for complex required props; never reuse a family demo implicitly. */
  preview?: UiDocsPreview;
  playground?: UiDocsPlayground;
};

export function defineUiDocs<const T extends UiDocsDefinition>(definition: T): T {
  return definition;
}

export function defineUiDocsGroup<const T extends readonly UiDocsDefinition[]>(definitions: T): T {
  return definitions;
}
