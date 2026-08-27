/**
 * Advanced infrastructure surface for UI Studio diagnostics and platform integration.
 * Product UI should prefer the canonical `@ontologyx/ui` Components/Primitives/System surface.
 */
export * from './cursor';
export * from './drag-drop';
export * from './editing';
export * from './foundations';
export * from './gestures';
export * from './interaction';
export * from './motion';
export * from './scroll';
export type {
  SemanticCommandGroupProps,
  SemanticConfirmationProps,
  SemanticFormProps,
} from './semantic/react';
export { SemanticCommandGroup, SemanticConfirmation, SemanticForm } from './semantic/react';
