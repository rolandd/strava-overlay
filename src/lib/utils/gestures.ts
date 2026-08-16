import type { OverlayTransform } from '../types';

export interface GestureOptions {
  getTransform: () => OverlayTransform;
  onUpdate: (transform: Partial<OverlayTransform>) => void;
  disabled?: boolean;
  viewRotationAngle?: number;
}

export function gestureHandler(node: HTMLElement, options: GestureOptions) {
  let currentOptions = options;
  const activePointers = new Map<number, { x: number; y: number }>();
  let initialDistance = 0;
  let initialAngle = 0;
  let lastScale = 1;
  let lastAngle = 0;

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
        let newAngle = (lastAngle + angleDelta) % 360;
        if (newAngle > 180) newAngle -= 360;
        if (newAngle < -180) newAngle += 360;

        currentOptions.onUpdate({
          scale: Math.round(newScale * 1000) / 1000,
          angle: Math.round(newAngle * 10) / 10
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
