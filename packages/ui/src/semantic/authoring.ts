import { assertValidUiDefinition } from './diagnostics';
import type {
  UiCollectionNode,
  UiCommandGroupNode,
  UiConfirmationNode,
  UiDefinition,
  UiDefinitionInput,
} from './model';
import { UI_IR_VERSION } from './model';

export function defineUi(input: UiDefinitionInput): UiDefinition {
  const definition: UiDefinition = {
    irVersion: UI_IR_VERSION,
    kind: 'surface',
    id: input.id,
    nodes: input.nodes,
  };
  assertValidUiDefinition(definition);
  return definition;
}

export const ui = {
  commandGroup(node: Omit<UiCommandGroupNode, 'kind'>): UiCommandGroupNode {
    return { ...node, kind: 'command-group' };
  },
  collection(node: Omit<UiCollectionNode, 'kind'>): UiCollectionNode {
    return { ...node, kind: 'collection' };
  },
  confirmation(node: Omit<UiConfirmationNode, 'kind'>): UiConfirmationNode {
    return { ...node, kind: 'confirmation' };
  },
};
