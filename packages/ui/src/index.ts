import './styles/index.css';

export * from './adaptive';
export * from './components';
export * from './primitives';
export * from './system';


// Public configuration/value contracts used by UiRoot and visual SDK consumers.
export type {
  UiColorScheme,
  UiDensity,
  UiDirection,
  UiEnvironmentLength,
  UiInputModality,
  UiLogicalInsets,
  UiModalityPreference,
  UiOcclusionInsets,
  UiPointerPrecision,
  UiPointerPrecisionPreference,
  UiSafeAreaInsets,
  UiTheme,
} from './foundations/environment';
export type { UiCustomizableToken, UiTokenGroup, UiTokenOverrides, UiTokenValue } from './foundations/tokens';
export { UI_CUSTOMIZABLE_TOKENS, UI_TOKEN_GROUPS } from './foundations/tokens';
export type { FrameRateTarget, MotionPreference, SpringPreset } from './motion';
export type {
  CursorAnimationPreference,
  CursorRole,
  CursorRuntimeConfig,
  PointerModality,
  SystemCursorRole,
} from './cursor/types';
export { SYSTEM_CURSOR_ROLES } from './cursor/types';

// Developer-facing visual capabilities whose engines live in shared runtimes.
export type { CursorRegionProps, CursorRoleAttributes } from './cursor/CursorRegion';
export { CursorRegion, cursorRoleAttributes, useCursorRole } from './cursor/CursorRegion';
export type { SharedBoundsProps } from './motion/SharedBounds';
export { SharedBounds } from './motion/SharedBounds';
export type {
  MotionTransitionProps,
  TransitionAliasProps,
  TransitionKind,
} from './motion/Transition';
export {
  CollapseTransition,
  FadeTransition,
  MotionTransition,
  ReplaceTransition,
  RevealTransition,
  ScaleTransition,
  SlideTransition,
} from './motion/Transition';

// Explicit shell/platform integration seams kept on the canonical surface.
export type { UiClipboardAdapter } from './editing/clipboard';
export { configureUiClipboardAdapter } from './editing/clipboard';
export { useDragReveal } from './gestures/useDragReveal';
