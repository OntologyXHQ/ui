import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UiRoot } from '../../adaptive';
import { MotionTransition, SlideTransition } from '../Transition';
import {
  assessFramePerformance,
  DEFAULT_FRAME_PERFORMANCE_BUDGET,
  type FramePerformanceSnapshot,
} from '../performance';

function performanceSnapshot(
  overrides: Partial<FramePerformanceSnapshot> = {},
): FramePerformanceSnapshot {
  return {
    targetFrameRate: 60,
    frameBudgetMs: 1000 / 60,
    sampledFrames: 60,
    averageFrameIntervalMs: 16.67,
    maximumFrameIntervalMs: 20,
    observedRefreshRateHz: 60,
    budgetMisses: 2,
    budgetMissRatio: 2 / 60,
    longFrames: 0,
    longFrameRatio: 0,
    reactCommits: 0,
    longTasks: 0,
    layoutShifts: 0,
    paintEntries: 0,
    ...overrides,
  };
}

describe('UIR11 transition lifecycle', () => {
  it('settles reduced motion semantically without spatial interpolation or active promotion', () => {
    const onRest = vi.fn();
    render(
      <UiRoot motion="reduced">
        <MotionTransition present={false} kind="slide-left" onRest={onRest} data-testid="motion">
          Hidden content
        </MotionTransition>
      </UiRoot>,
    );
    const motion = screen.getByTestId('motion');
    expect(motion).toHaveAttribute('aria-hidden', 'true');
    expect(motion).toHaveAttribute('inert');
    expect(motion).not.toHaveAttribute('data-motion-active');
    expect(motion.style.transform).toBe('');
    expect(motion.style.clipPath).toBe('');
    expect(onRest).toHaveBeenCalledWith(false);
  });

  it('resolves semantic inline slide direction through the owning UiRoot direction', () => {
    render(
      <UiRoot direction="rtl" motion="reduced">
        <SlideTransition present direction="inline-start" data-testid="slide">
          RTL content
        </SlideTransition>
      </UiRoot>,
    );
    expect(screen.getByTestId('slide')).toHaveAttribute('data-motion-kind', 'slide-right');
  });

  it('turns frame telemetry into explicit measurable hot-path budgets', () => {
    expect(assessFramePerformance(performanceSnapshot()).passed).toBe(true);
    expect(
      assessFramePerformance(performanceSnapshot({ budgetMisses: 12, budgetMissRatio: 0.2 }))
        .passed,
    ).toBe(false);
    const pending = assessFramePerformance(
      performanceSnapshot({
        sampledFrames: DEFAULT_FRAME_PERFORMANCE_BUDGET.minimumSampledFrames - 1,
      }),
    );
    expect(pending.measurable).toBe(false);
    expect(pending.passed).toBe(false);
  });
});
