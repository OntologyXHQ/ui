export type GestureAxis = 'x' | 'y' | 'free';

export type GesturePriority = 'passive' | 'default' | 'content' | 'system';

export type GesturePhase = 'possible' | 'began' | 'changed' | 'ended' | 'cancelled';

export type GesturePoint = {
  x: number;
  y: number;
};

export type GestureVector = {
  x: number;
  y: number;
};

export type PanGestureSample = {
  pointerId: number;
  pointerType: string;
  phase: GesturePhase;
  origin: GesturePoint;
  position: GesturePoint;
  translation: GestureVector;
  delta: GestureVector;
  velocity: GestureVector;
  elapsedMs: number;
};

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export type SwipeGestureResult = {
  direction: SwipeDirection;
  distance: number;
  velocity: number;
};
