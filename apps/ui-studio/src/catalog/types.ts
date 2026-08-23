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

export type UiCatalogDedicatedPreviewProps = {
  componentProps: Readonly<Record<string, unknown>>;
  state: string;
};

export type UiCatalogPreview = {
  component: string;
  load: () => Promise<{ default: ComponentType<UiCatalogDedicatedPreviewProps> }>;
};

export type UiCatalogStateModel = {
  valueProp: string;
  changeProp: string;
  defaultProp: string | null;
  mode: 'controlled' | 'controlled-uncontrolled';
};

export type UiCatalogCertification = {
  owner: string;
  behaviorTests: readonly string[];
  behaviorSources: readonly string[];
  browserScenarios: readonly string[];
  browserSource: string;
  requiredAxes: readonly string[];
  result: 'certified';
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
  certification: UiCatalogCertification | null;
  preview: UiCatalogPreview | null;
  stateModels: readonly UiCatalogStateModel[];
  playground: {
    preferredWidth?: 'narrow' | 'medium' | 'wide';
    controls?: readonly string[];
    options?: Readonly<Record<string, readonly string[]>>;
    fixture?: Readonly<Record<string, unknown>>;
  } | null;
  props: readonly UiCatalogProp[];
  examples: readonly UiCatalogExample[];
};
