export type { FrameRateTarget, MotionFrame, MotionFrameHost, MotionFrameListener } from './clock';
export { motionFrameHost, MotionClock } from './clock';
export type {
  FramePerformanceListener,
  FramePerformanceSnapshot,
} from './performance';
export { FramePerformanceMonitor } from './performance';
export type {
  MotionPreference,
  MotionRuntime,
  MotionRuntimeProviderProps,
} from './runtime';
export {
  MotionRuntimeProvider,
  useFramePerformanceSnapshot,
  useMotionRuntime,
  useReactCommitProbe,
  useReducedMotion,
} from './runtime';
export type { SharedBoundsProps } from './SharedBounds';
export { SharedBounds } from './SharedBounds';
export type {
  SpringPreset,
  SpringSpec,
  SpringState,
} from './spring';
export {
  readSpringSpec,
  SpringValue,
  stepSpring,
} from './spring';
export type {
  MotionTransitionProps,
  TransitionAliasProps,
  TransitionKind,
} from './Transition';
export {
  CollapseTransition,
  FadeTransition,
  MotionTransition,
  ReplaceTransition,
  RevealTransition,
  ScaleTransition,
  SlideTransition,
} from './Transition';

export type MotionProgress = {
  progress: number;
  velocity: number;
};

export type {
  InteractiveSettleOptions,
  InteractiveTransitionListener,
  InteractiveTransitionOptions,
  InteractiveTransitionPhase,
  InteractiveTransitionSnapshot,
} from './interactive';
export {
  InteractiveTransitionController,
  resolveInteractiveSettleTarget,
  useInteractiveTransition,
} from './interactive';
