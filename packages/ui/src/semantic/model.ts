export const UI_IR_VERSION = 1 as const;

export type UiIrVersion = typeof UI_IR_VERSION;
export type UiSemanticId = string;
export type UiCommandIntent = 'neutral' | 'destructive';
export type UiCommandEmphasis = 'quiet' | 'secondary' | 'primary';
export type UiSelectionMode = 'none' | 'single' | 'multiple';
export type UiNavigationMode = 'linear' | 'spatial';
export type UiCollectionPresentation = 'list' | 'grid';

export type UiCommandReference = {
  /** Stable command identity resolved through the host-owned command registry. */
  command: UiSemanticId;
  /** Optional local label override; canonical command metadata remains registry-owned. */
  label?: string;
  /** Optional presentation preference that never changes command semantics. */
  emphasis?: UiCommandEmphasis;
};

export type UiCommandGroupNode = {
  kind: 'command-group';
  /** Optional stable semantic node identity. */
  id?: UiSemanticId;
  /** Accessible label for the related command group. */
  label: string;
  /** Command references only; executable behavior never lives in IR. */
  commands: readonly UiCommandReference[];
  presentation?: {
    /** Soft author preference; later adaptive resolution may select another canonical presentation. */
    preferred?: 'inline' | 'menu';
  };
};

export type UiCollectionNode = {
  kind: 'collection';
  /** Stable collection identity. */
  id: UiSemanticId;
  /** Host-owned data source/binding identity. Values are not embedded in the semantic schema. */
  source: UiSemanticId;
  selection?: {
    mode: UiSelectionMode;
  };
  navigation?: {
    mode: UiNavigationMode;
  };
  /** Commands made relevant by this collection/selection context. */
  commands?: readonly UiSemanticId[];
  presentation?: {
    /** Soft author preference; runtime policy owns final presentation. */
    preferred?: UiCollectionPresentation;
  };
};

export type UiConfirmationNode = {
  kind: 'confirmation';
  /** Optional stable semantic node identity. */
  id?: UiSemanticId;
  /** Human-readable title used by the canonical confirmation surface. */
  title: string;
  /** Optional supporting description. */
  description?: string;
  /** Consequential command invoked only after explicit confirmation. */
  confirmCommand: UiSemanticId;
  /** Optional visible confirmation label override. */
  confirmLabel?: string;
  /** Optional visible cancellation label. @default Cancel */
  cancelLabel?: string;
  /** Semantic risk of the confirmation. @default neutral */
  intent?: UiCommandIntent;
};

export type UiAuthorNode = UiCommandGroupNode | UiCollectionNode | UiConfirmationNode;

export type UiDefinition = {
  irVersion: UiIrVersion;
  kind: 'surface';
  /** Stable surface identity used by inspection, diagnostics and automation. */
  id: UiSemanticId;
  nodes: readonly UiAuthorNode[];
};

export type UiDefinitionInput = Omit<UiDefinition, 'irVersion' | 'kind'>;
