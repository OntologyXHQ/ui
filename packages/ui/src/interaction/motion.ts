import { useMotionRuntime } from '../motion/runtime';

export function useMotionPolicy() {
  const runtime = useMotionRuntime();
  const reduced = runtime.preference === 'reduced';

  return {
    preference: runtime.preference,
    reduced,
    targetFrameRate: runtime.targetFrameRate,
    shouldAnimate: !reduced,
    duration: (milliseconds: number) => (reduced ? 0 : milliseconds),
  } as const;
}
