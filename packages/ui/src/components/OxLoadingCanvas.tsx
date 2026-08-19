import { useLayoutEffect, useRef } from 'react';
import { useMotionRuntime } from '../motion/runtime';

const OX_PERIOD_MS = 1900;
const TAU = Math.PI * 2;

type OrbitKeyframe = Readonly<{
  at: number;
  length: number;
  offset: number;
}>;

const ORBIT_KEYFRAMES: readonly OrbitKeyframe[] = [
  { at: 0, length: 7, offset: 0 },
  { at: 0.14, length: 22, offset: -7 },
  { at: 0.32, length: 72, offset: -29 },
  { at: 0.39, length: 96, offset: -40 },
  { at: 0.57, length: 94, offset: -55 },
  { at: 0.74, length: 42, offset: -77 },
  { at: 0.91, length: 14, offset: -94 },
  { at: 1, length: 7, offset: -100 },
];

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function easeOutCubic(value: number) {
  const inverse = 1 - clamp01(value);
  return 1 - inverse * inverse * inverse;
}

function easeInCubic(value: number) {
  const normalized = clamp01(value);
  return normalized * normalized * normalized;
}

function easeInOutCubic(value: number) {
  const normalized = clamp01(value);
  return normalized < 0.5
    ? 4 * normalized * normalized * normalized
    : 1 - Math.pow(-2 * normalized + 2, 3) / 2;
}

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function segment(progress: number, start: number, end: number, from: number, to: number, easing = easeInOutCubic) {
  if (progress <= start) return from;
  if (progress >= end) return to;
  return interpolate(from, to, easing((progress - start) / (end - start)));
}

function orbitAt(progress: number) {
  const normalized = clamp01(progress);
  for (let index = 0; index < ORBIT_KEYFRAMES.length - 1; index += 1) {
    const from = ORBIT_KEYFRAMES[index];
    const to = ORBIT_KEYFRAMES[index + 1];
    if (normalized <= to.at) {
      const local = (normalized - from.at) / Math.max(0.0001, to.at - from.at);
      const easing = index <= 2 ? easeOutCubic : index >= 5 ? easeInCubic : easeInOutCubic;
      const eased = easing(local);
      return {
        length: interpolate(from.length, to.length, eased),
        offset: interpolate(from.offset, to.offset, eased),
      };
    }
  }
  return ORBIT_KEYFRAMES.at(-1) ?? { length: 7, offset: -100 };
}

function writeProgress(progress: number, start: number, written: number, release: number, hidden: number) {
  if (progress <= start) return 0;
  if (progress < written) return segment(progress, start, written, 0, 1, easeOutCubic);
  if (progress <= release) return 1;
  if (progress < hidden) return segment(progress, release, hidden, 1, 0, easeInCubic);
  return 0;
}

function heartbeatScale(progress: number) {
  if (progress < 0.38) return 1;
  if (progress < 0.42) return segment(progress, 0.38, 0.42, 1, 1.13, easeOutCubic);
  if (progress < 0.45) return segment(progress, 0.42, 0.45, 1.13, 0.965, easeInCubic);
  if (progress < 0.49) return segment(progress, 0.45, 0.49, 0.965, 1.075, easeOutCubic);
  if (progress < 0.53) return segment(progress, 0.49, 0.53, 1.075, 1, easeInOutCubic);
  return 1;
}

function echoState(progress: number, start: number, peak: number, end: number, peakOpacity: number, fromScale: number, toScale: number) {
  if (progress <= start || progress >= end) return { opacity: 0, scale: toScale };
  if (progress <= peak) {
    const local = easeOutCubic((progress - start) / (peak - start));
    return {
      opacity: peakOpacity * local,
      scale: interpolate(fromScale, fromScale + (toScale - fromScale) * 0.28, local),
    };
  }
  const local = easeOutCubic((progress - peak) / (end - peak));
  return {
    opacity: peakOpacity * (1 - local),
    scale: interpolate(fromScale + (toScale - fromScale) * 0.28, toScale, local),
  };
}

function numericCustomProperty(style: CSSStyleDeclaration, name: string, fallback: number) {
  const value = Number.parseFloat(style.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}

function drawLineProgress(
  context: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  progress: number,
) {
  if (progress <= 0) return;
  context.beginPath();
  context.moveTo(fromX, fromY);
  context.lineTo(interpolate(fromX, toX, progress), interpolate(fromY, toY, progress));
  context.stroke();
}

function syncCanvasBackingStore(canvas: HTMLCanvasElement, entry?: ResizeObserverEntry) {
  const rect = canvas.getBoundingClientRect();
  const physical = entry?.devicePixelContentBoxSize?.[0];
  const width = Math.max(1, Math.round(physical?.inlineSize ?? rect.width));
  const height = Math.max(1, Math.round(physical?.blockSize ?? rect.height));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

function drawCanvasMark(canvas: HTMLCanvasElement, progress: number, reduced: boolean) {
  const context = canvas.getContext('2d');
  const ownerWindow = canvas.ownerDocument.defaultView;
  if (!context || !ownerWindow) return;

  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, rect.width);
  const height = Math.max(1, rect.height);
  const backingScaleX = Math.max(1, canvas.width / width);
  const backingScaleY = Math.max(1, canvas.height / height);
  context.setTransform(backingScaleX, 0, 0, backingScaleY, 0, 0);
  context.clearRect(0, 0, width, height);

  const style = ownerWindow.getComputedStyle(canvas);
  const color = style.color || 'currentColor';
  const unit = Math.min(width, height) / 24;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 8.25 * unit;
  const trackStroke = numericCustomProperty(style, '--oxs-ox-track-stroke', 1.35);
  const orbitStroke = numericCustomProperty(style, '--oxs-ox-orbit-stroke', 1.95);
  const crossStroke = numericCustomProperty(style, '--oxs-ox-cross-stroke', 1.9);
  const echoStroke = numericCustomProperty(style, '--oxs-ox-echo-stroke', 1.25);

  context.strokeStyle = color;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  if (reduced) {
    context.globalAlpha = 1;
    context.lineWidth = orbitStroke;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, TAU);
    context.stroke();

    context.lineWidth = crossStroke;
    drawLineProgress(context, centerX - 3.6 * unit, centerY - 3.6 * unit, centerX + 3.6 * unit, centerY + 3.6 * unit, 1);
    drawLineProgress(context, centerX + 3.6 * unit, centerY - 3.6 * unit, centerX - 3.6 * unit, centerY + 3.6 * unit, 1);
    return;
  }

  const normalized = ((progress % 1) + 1) % 1;
  const orbit = orbitAt(normalized);
  const scale = heartbeatScale(normalized);

  context.globalAlpha = 0.13;
  context.lineWidth = trackStroke;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, TAU);
  context.stroke();

  const primaryEcho = echoState(normalized, 0.39, 0.42, 0.48, 0.34, 0.9, 1.22);
  const secondaryEcho = echoState(normalized, 0.46, 0.49, 0.55, 0.2, 0.94, 1.14);
  for (const echo of [primaryEcho, secondaryEcho]) {
    if (echo.opacity <= 0) continue;
    context.globalAlpha = echo.opacity;
    context.lineWidth = echoStroke;
    context.beginPath();
    context.arc(centerX, centerY, radius * echo.scale, 0, TAU);
    context.stroke();
  }

  context.globalAlpha = 1;
  context.lineWidth = orbitStroke;
  const startAngle = -Math.PI / 2 + ((-orbit.offset % 100) / 100) * TAU;
  const sweep = (orbit.length / 100) * TAU;
  context.beginPath();
  context.arc(centerX, centerY, radius, startAngle, startAngle + sweep);
  context.stroke();

  context.save();
  context.translate(centerX, centerY);
  context.scale(scale, scale);
  context.translate(-centerX, -centerY);
  context.lineWidth = crossStroke;
  const strokeA = writeProgress(normalized, 0.08, 0.29, 0.72, 0.94);
  const strokeB = writeProgress(normalized, 0.17, 0.36, 0.69, 0.9);
  drawLineProgress(context, centerX - 3.6 * unit, centerY - 3.6 * unit, centerX + 3.6 * unit, centerY + 3.6 * unit, strokeA);
  drawLineProgress(context, centerX + 3.6 * unit, centerY - 3.6 * unit, centerX - 3.6 * unit, centerY + 3.6 * unit, strokeB);
  context.restore();
  context.globalAlpha = 1;
}

/** Decorative Canvas backend for the public Spinner. Scheduling is owned by the current UiRoot MotionClock. */
export function OxLoadingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtime = useMotionRuntime();

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ownerWindow = canvas.ownerDocument.defaultView;
    if (!ownerWindow) return;
    const realmWindow = ownerWindow as Window & typeof globalThis;

    let lastProgress = 0;
    const draw = (progress = lastProgress) => {
      lastProgress = progress;
      drawCanvasMark(canvas, progress, runtime.preference === 'reduced');
    };

    syncCanvasBackingStore(canvas);
    draw(0);
    const ResizeObserverCtor = realmWindow.ResizeObserver;
    const resizeObserver = ResizeObserverCtor ? new ResizeObserverCtor((entries) => {
      syncCanvasBackingStore(canvas, entries[0]);
      draw();
    }) : null;
    resizeObserver?.observe(canvas);

    const unsubscribe = runtime.preference === 'reduced'
      ? () => undefined
      : runtime.clock.subscribe((frame) => draw((frame.elapsedMs % OX_PERIOD_MS) / OX_PERIOD_MS));

    return () => {
      unsubscribe();
      resizeObserver?.disconnect();
    };
  }, [runtime]);

  return (
    <canvas
      ref={canvasRef}
      className="ui-ox-loading-mark ui-ox-loading-canvas"
      aria-hidden="true"
      data-oxs-loading-mark="ox-canvas"
      data-oxs-loading-choreography="write-heartbeat-release"
      data-oxs-loading-renderer="canvas"
    />
  );
}
