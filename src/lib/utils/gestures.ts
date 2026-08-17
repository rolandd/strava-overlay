import type { OverlayTransform } from '../types';

export interface GestureOptions {
  getTransform: () => OverlayTransform;
  onUpdate: (transform: Partial<OverlayTransform>) => void;
  disabled?: boolean;
  viewRotationAngle?: number;
  snapThreshold?: number;
  releaseThreshold?: number;
}

/**
 * Normalizes an angle in degrees to the [-180, 180] range.
 */
export function normalizeAngle(deg: number): number {
  let a = deg % 360;
  if (a > 180) a -= 360;
  if (a <= -180) a += 360;
  return a === 0 ? 0 : a;
}

/**
 * Computes the shortest angular delta (in degrees, [-180, 180]) from angle `from` to angle `to`.
 */
export function getShortestAngleDelta(from: number, to: number): number {
  return normalizeAngle(to - from);
}

/**
 * Returns the nearest exact 90-degree right angle (0, 90, 180, -90).
 */
export function getNearestCardinalAngle(angle: number): number {
  const normalized = normalizeAngle(angle);
  const cardinal = Math.round(normalized / 90) * 90;
  const result = cardinal === -180 ? 180 : cardinal;
  return result === 0 ? 0 : result;
}

/**
 * Checks if a given angle is within a threshold of an exact cardinal (multiples of 90°) angle.
 */
export function isAngleNearCardinal(angle: number, thresholdDeg = 0.5): boolean {
  const nearest = getNearestCardinalAngle(angle);
  return Math.abs(getShortestAngleDelta(nearest, angle)) <= thresholdDeg;
}

/**
 * Dispatches a subtle haptic feedback vibration tick when available.
 */
export function triggerHapticSnap() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    // Ignore environments where vibrate is not supported or permitted
  }
}

export interface HysteresisResult {
  angle: number;
  isSnapped: boolean;
  justSnapped: boolean;
  activeSnapTarget: number | null;
}

/**
 * Tracks rotation hysteresis around cardinal 90° right angles (0°, ±90°, ±180°).
 * - Snaps into place when raw angle is within snapThreshold (default 3°).
 * - Requires twisting past releaseThreshold (default 6°) to break out of the snap.
 */
export class RotationHysteresisTracker {
  private snapThreshold: number;
  private releaseThreshold: number;
  private isSnapped = false;
  private activeSnapTarget: number | null = null;

  constructor(options?: { snapThreshold?: number; releaseThreshold?: number }) {
    this.snapThreshold = options?.snapThreshold ?? 3.0;
    this.releaseThreshold = options?.releaseThreshold ?? 6.0;
  }

  /**
   * Resets tracker with an initial starting angle.
   * If the initial angle is already within snapThreshold of a cardinal angle,
   * starts in the snapped state so turning off level requires extra twist.
   */
  reset(startAngle: number): void {
    const nearest = getNearestCardinalAngle(startAngle);
    const dist = Math.abs(getShortestAngleDelta(nearest, startAngle));
    if (dist <= this.snapThreshold) {
      this.isSnapped = true;
      this.activeSnapTarget = nearest;
    } else {
      this.isSnapped = false;
      this.activeSnapTarget = null;
    }
  }

  /**
   * Updates tracker with raw continuous angle and returns the snapped / continuous angle.
   */
  update(rawAngle: number): HysteresisResult {
    const normalized = normalizeAngle(rawAngle);

    if (this.isSnapped && this.activeSnapTarget !== null) {
      const distFromActive = Math.abs(getShortestAngleDelta(this.activeSnapTarget, normalized));
      if (distFromActive <= this.releaseThreshold) {
        // Retain snap lock at the exact cardinal angle
        return {
          angle: this.activeSnapTarget,
          isSnapped: true,
          justSnapped: false,
          activeSnapTarget: this.activeSnapTarget
        };
      }
      // Twist exceeded breakout threshold
      this.isSnapped = false;
      this.activeSnapTarget = null;
      return {
        angle: normalized,
        isSnapped: false,
        justSnapped: false,
        activeSnapTarget: null
      };
    }

    // Check if entering snap threshold of any cardinal right angle
    const nearest = getNearestCardinalAngle(normalized);
    const distToNearest = Math.abs(getShortestAngleDelta(nearest, normalized));

    if (distToNearest <= this.snapThreshold) {
      this.isSnapped = true;
      this.activeSnapTarget = nearest;
      return {
        angle: nearest,
        isSnapped: true,
        justSnapped: true,
        activeSnapTarget: nearest
      };
    }

    return {
      angle: normalized,
      isSnapped: false,
      justSnapped: false,
      activeSnapTarget: null
    };
  }

  get snapped(): boolean {
    return this.isSnapped;
  }

  get snapTarget(): number | null {
    return this.activeSnapTarget;
  }
}

export function gestureHandler(node: HTMLElement, options: GestureOptions) {
  let currentOptions = options;
  const activePointers = new Map<number, { x: number; y: number }>();
  let initialDistance = 0;
  let initialAngle = 0;
  let lastScale = 1;
  let lastAngle = 0;

  const hysteresisTracker = new RotationHysteresisTracker({
    snapThreshold: currentOptions.snapThreshold,
    releaseThreshold: currentOptions.releaseThreshold
  });

  function getPointerDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getPointerAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
    return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
  }

  function onPointerDown(e: PointerEvent) {
    if (currentOptions.disabled) return;
    // Only primary button for mouse
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    e.stopPropagation();
    node.setPointerCapture(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const transform = currentOptions.getTransform();

    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      initialDistance = getPointerDistance(pts[0], pts[1]);
      initialAngle = getPointerAngle(pts[0], pts[1]);
      lastScale = transform.scale;
      lastAngle = transform.angle;
      hysteresisTracker.reset(lastAngle);
    }
  }

  function onPointerMove(e: PointerEvent) {
    if (currentOptions.disabled || !activePointers.has(e.pointerId)) return;
    e.preventDefault();
    e.stopPropagation();

    const prevPos = activePointers.get(e.pointerId)!;
    const currentPos = { x: e.clientX, y: e.clientY };
    const transform = currentOptions.getTransform();

    if (activePointers.size === 1) {
      // Single finger/pointer drag
      let dx = currentPos.x - prevPos.x;
      let dy = currentPos.y - prevPos.y;
      activePointers.set(e.pointerId, currentPos);

      const rot = currentOptions.viewRotationAngle || 0;
      if (rot !== 0) {
        const rad = (-rot * Math.PI) / 180;
        const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
        dx = rx;
        dy = ry;
      }

      currentOptions.onUpdate({
        x: transform.x + dx,
        y: transform.y + dy
      });
    } else if (activePointers.size === 2) {
      activePointers.set(e.pointerId, currentPos);
      const pts = Array.from(activePointers.values());
      const currentDist = getPointerDistance(pts[0], pts[1]);
      const currentAngle = getPointerAngle(pts[0], pts[1]);

      if (initialDistance > 0) {
        const scaleRatio = currentDist / initialDistance;
        const newScale = Math.max(0.1, Math.min(10.0, lastScale * scaleRatio));

        const angleDelta = currentAngle - initialAngle;
        const rawAngle = normalizeAngle(lastAngle + angleDelta);
        const snapResult = hysteresisTracker.update(rawAngle);

        if (snapResult.justSnapped) {
          triggerHapticSnap();
        }

        currentOptions.onUpdate({
          scale: Math.round(newScale * 1000) / 1000,
          angle: Math.round(snapResult.angle * 10) / 10
        });
      }
    }
  }

  function onPointerUp(e: PointerEvent) {
    if (activePointers.has(e.pointerId)) {
      activePointers.delete(e.pointerId);
      try {
        node.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore errors if pointer was already released
      }
    }

    if (activePointers.size === 1) {
      // Reset tracking for single finger remaining
      const remaining = Array.from(activePointers.entries())[0];
      activePointers.set(remaining[0], remaining[1]);
    }
  }

  function onPointerCancel(e: PointerEvent) {
    onPointerUp(e);
  }

  function onWheel(e: WheelEvent) {
    if (currentOptions.disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const transform = currentOptions.getTransform();
    // Smooth exponential zoom
    const zoomDelta = e.deltaY < 0 ? 1.05 : 0.95;
    const newScale = Math.max(0.1, Math.min(10.0, transform.scale * zoomDelta));

    currentOptions.onUpdate({
      scale: Math.round(newScale * 1000) / 1000
    });
  }

  node.addEventListener('pointerdown', onPointerDown);
  node.addEventListener('pointermove', onPointerMove, { passive: false });
  node.addEventListener('pointerup', onPointerUp);
  node.addEventListener('pointercancel', onPointerCancel);
  node.addEventListener('wheel', onWheel, { passive: false });

  return {
    update(newOptions: GestureOptions) {
      currentOptions = newOptions;
    },
    destroy() {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', onPointerUp);
      node.removeEventListener('pointercancel', onPointerCancel);
      node.removeEventListener('wheel', onWheel);
    }
  };
}
