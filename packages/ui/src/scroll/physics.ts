import type { SpringSpec } from '../motion';

export type ScrollAxis = 'vertical' | 'horizontal';
export type ScrollSnapMode = 'none' | 'proximity' | 'mandatory';
export type ScrollIndicatorMode = 'auto' | 'always' | 'hidden';

export type ScrollPhysicsConfig = {
  deceleration: number;
  edgeResistance: number;
  maxOverscrollRatio: number;
  stopVelocity: number;
};

export type ScrollRange = {
  position: number;
  max: number;
};

export type ScrollDeltaResult = {
  position: number;
  overflow: number;
  consumed: number;
};

export const DEFAULT_SCROLL_PHYSICS: ScrollPhysicsConfig = {
  deceleration: 0.996,
  edgeResistance: 0.34,
  maxOverscrollRatio: 0.18,
  stopVelocity: 0.02,
};

const DEFAULT_BOUNCE_SPRING: SpringSpec = {
  stiffness: 320,
  damping: 32,
  mass: 1,
  restSpeed: 0.02,
  restDelta: 0.08,
};

export function readScrollPhysicsConfig(element: Element | null): ScrollPhysicsConfig {
  if (!element || typeof getComputedStyle === 'undefined') {
    return DEFAULT_SCROLL_PHYSICS;
  }

  const style = getComputedStyle(element);

  return {
    deceleration: readNumber(
      style,
      '--oxs-scroll-deceleration',
      DEFAULT_SCROLL_PHYSICS.deceleration,
    ),
    edgeResistance: readNumber(
      style,
      '--oxs-scroll-edge-resistance',
      DEFAULT_SCROLL_PHYSICS.edgeResistance,
    ),
    maxOverscrollRatio: readNumber(
      style,
      '--oxs-scroll-max-overscroll-ratio',
      DEFAULT_SCROLL_PHYSICS.maxOverscrollRatio,
    ),
    stopVelocity: readNumber(
      style,
      '--oxs-scroll-stop-velocity',
      DEFAULT_SCROLL_PHYSICS.stopVelocity,
    ),
  };
}

export function readScrollBounceSpec(element: Element | null): SpringSpec {
  if (!element || typeof getComputedStyle === 'undefined') {
    return DEFAULT_BOUNCE_SPRING;
  }

  const style = getComputedStyle(element);

  return {
    stiffness: readNumber(style, '--oxs-scroll-bounce-stiffness', DEFAULT_BOUNCE_SPRING.stiffness),
    damping: readNumber(style, '--oxs-scroll-bounce-damping', DEFAULT_BOUNCE_SPRING.damping),
    mass: readNumber(style, '--oxs-scroll-bounce-mass', DEFAULT_BOUNCE_SPRING.mass),
    restSpeed: readNumber(style, '--oxs-scroll-bounce-rest-speed', DEFAULT_BOUNCE_SPRING.restSpeed),
    restDelta: readNumber(style, '--oxs-scroll-bounce-rest-delta', DEFAULT_BOUNCE_SPRING.restDelta),
  };
}

export function consumeScrollDelta(range: ScrollRange, delta: number): ScrollDeltaResult {
  const next = range.position + delta;
  const position = clamp(next, 0, Math.max(0, range.max));
  const consumed = position - range.position;

  return {
    position,
    consumed,
    overflow: delta - consumed,
  };
}

export function applyEdgeResistance(
  currentOverscroll: number,
  overflow: number,
  viewportExtent: number,
  config: ScrollPhysicsConfig,
) {
  const maxOverscroll = Math.max(24, viewportExtent * config.maxOverscrollRatio);
  const distanceRatio = Math.min(1, Math.abs(currentOverscroll) / maxOverscroll);
  const resistance = config.edgeResistance * (1 - distanceRatio * 0.72);
  const next = currentOverscroll - overflow * resistance;

  return clamp(next, -maxOverscroll, maxOverscroll);
}

export function decayScrollVelocity(
  velocityPxPerMs: number,
  deltaMs: number,
  config: ScrollPhysicsConfig,
) {
  if (Math.abs(velocityPxPerMs) <= config.stopVelocity) {
    return 0;
  }

  return velocityPxPerMs * config.deceleration ** Math.max(0, deltaMs);
}

export function normalizeWheelDelta(
  delta: number,
  deltaMode: number,
  lineExtent: number,
  pageExtent: number,
) {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return delta * lineExtent;
  }

  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return delta * pageExtent;
  }

  return delta;
}

export function computeIndicatorMetrics(
  viewportExtent: number,
  contentExtent: number,
  position: number,
) {
  if (viewportExtent <= 0 || contentExtent <= viewportExtent) {
    return { visible: false, size: 0, offset: 0 };
  }

  const minimumSize = 24;
  const trackExtent = viewportExtent;
  const size = Math.max(minimumSize, (viewportExtent / contentExtent) * trackExtent);
  const availableTrack = Math.max(0, trackExtent - size);
  const maxScroll = Math.max(1, contentExtent - viewportExtent);
  const offset = (clamp(position, 0, maxScroll) / maxScroll) * availableTrack;

  return { visible: true, size, offset };
}

export function nearestSnapOffset(
  offsets: readonly number[],
  position: number,
  max: number,
): number | null {
  if (offsets.length === 0) {
    return null;
  }

  let nearest = clamp(offsets[0] ?? 0, 0, max);
  let distance = Math.abs(nearest - position);

  for (const offset of offsets.slice(1)) {
    const candidate = clamp(offset, 0, max);
    const candidateDistance = Math.abs(candidate - position);

    if (candidateDistance < distance) {
      nearest = candidate;
      distance = candidateDistance;
    }
  }

  return nearest;
}

function readNumber(style: CSSStyleDeclaration, name: string, fallback: number) {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}
