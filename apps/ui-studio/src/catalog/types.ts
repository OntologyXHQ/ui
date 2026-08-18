import type { ComponentType } from 'react';

export type UiCatalogLayer = 'foundations' | 'primitives' | 'components' | 'system';
export type UiCatalogStatus = 'candidate' | 'accepted' | 'experimental' | 'deprecated';

export type UiCatalogProp = {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  deprecated: boolean;
  default: string | null;
};

export type UiCatalogExample = {
  id: string;
  title: string;
  description: string;
  load: () => Promise<{ default: ComponentType }>;
};

export type UiCatalogEntry = {
  id: string;
  exportName: string;
  layer: UiCatalogLayer;
  category: string;
  order: number;
  summary: string;
  usage: string;
  status: UiCatalogStatus;
  accessibility: string;
  rtl: string;
  touch: string;
  responsive: string;
  playground: {
    preferredWidth?: 'narrow' | 'medium' | 'wide';
    controls?: readonly string[];
    options?: Readonly<Record<string, readonly string[]>>;
    fixture?: Readonly<Record<string, unknown>>;
  } | null;
  props: readonly UiCatalogProp[];
  examples: readonly UiCatalogExample[];
};
