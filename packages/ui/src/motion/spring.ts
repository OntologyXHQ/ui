export type SpringPreset = 'gentle' | 'standard' | 'snappy' | 'expressive';

export type SpringSpec = {
  stiffness: number;
  damping: number;
  mass: number;
  restSpeed: number;
  restDelta: number;
};

export type SpringState = {
  value: number;
  velocity: number;
};

const FALLBACK_SPRINGS: Record<SpringPreset, SpringSpec> = {
  gentle: {
    stiffness: 220,
    damping: 28,
    mass: 1,
    restSpeed: 0.002,
    restDelta: 0.002,
  },
  standard: {
    stiffness: 340,
    damping: 30,
    mass: 1,
    restSpeed: 0.002,
    restDelta: 0.002,
  },
  snappy: {
    stiffness: 520,
    damping: 38,
    mass: 0.92,
    restSpeed: 0.002,
    restDelta: 0.002,
  },
  expressive: {
    stiffness: 300,
    damping: 24,
    mass: 1,
    restSpeed: 0.002,
    restDelta: 0.002,
  },
};

const MAX_STEP_MS = 8;
const MAX_FRAME_DELTA_MS = 64;

export function readSpringSpec(
  element: Element | null,
  preset: SpringPreset = 'standard',
): SpringSpec {
  const fallback = FALLBACK_SPRINGS[preset];

  if (!element) return fallback;
  const ownerWindow = element.ownerDocument?.defaultView ?? null;
  if (!ownerWindow?.getComputedStyle) return fallback;

  const style = ownerWindow.getComputedStyle(element);
  const prefix = `--oxs-spring-${preset}`;

  return {
    stiffness: readNumber(style, `${prefix}-stiffness`, fallback.stiffness),
    damping: readNumber(style, `${prefix}-damping`, fallback.damping),
    mass: readNumber(style, `${prefix}-mass`, fallback.mass),
    restSpeed: readNumber(style, '--oxs-spring-rest-speed', fallback.restSpeed),
    restDelta: readNumber(style, '--oxs-spring-rest-delta', fallback.restDelta),
  };
}

export function stepSpring(
  state: SpringState,
  target: number,
  deltaMs: number,
  spec: SpringSpec,
): SpringState {
  let value = state.value;
  let velocity = state.velocity;
  let remainingMs = Math.min(Math.max(deltaMs, 0), MAX_FRAME_DELTA_MS);

  while (remainingMs > 0) {
    const stepMs = Math.min(remainingMs, MAX_STEP_MS);
    const dt = stepMs / 1000;
    const displacement = value - target;
    const springForce = -spec.stiffness * displacement;
    const dampingForce = -spec.damping * velocity;
    const acceleration = (springForce + dampingForce) / spec.mass;

    velocity += acceleration * dt;
    value += velocity * dt;
    remainingMs -= stepMs;
  }

  if (Math.abs(velocity) <= spec.restSpeed && Math.abs(target - value) <= spec.restDelta) {
    return { value: target, velocity: 0 };
  }

  return { value, velocity };
}

export class SpringValue {
  private state: SpringState;
  private target: number;
  private spec: SpringSpec;

  constructor(value: number, spec: SpringSpec, velocity = 0) {
    this.state = { value, velocity };
    this.target = value;
    this.spec = spec;
  }

  get value() {
    return this.state.value;
  }

  get velocity() {
    return this.state.velocity;
  }

  get destination() {
    return this.target;
  }

  setSpec(spec: SpringSpec) {
    this.spec = spec;
  }

  setTarget(target: number, inheritedVelocity?: number) {
    this.target = target;

    if (inheritedVelocity !== undefined) {
      this.state = {
        value: this.state.value,
        velocity: inheritedVelocity,
      };
    }
  }

  setState(value: number, velocity = 0) {
    this.target = value;
    this.state = { value, velocity };
  }

  jump(value: number) {
    this.target = value;
    this.state = { value, velocity: 0 };
  }

  step(deltaMs: number) {
    this.state = stepSpring(this.state, this.target, deltaMs, this.spec);
    return this.state;
  }

  isSettled() {
    return this.state.value === this.target && this.state.velocity === 0;
  }
}

function readNumber(style: CSSStyleDeclaration, name: string, fallback: number) {
  const value = Number.parseFloat(style.getPropertyValue(name));

  return Number.isFinite(value) ? value : fallback;
}
