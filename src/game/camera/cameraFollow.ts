export interface CameraPoint {
  readonly x: number;
  readonly y: number;
}

export interface CameraViewport {
  readonly width: number;
  readonly height: number;
  readonly zoomX: number;
  readonly zoomY: number;
}

export interface CameraBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface CameraScroll {
  readonly x: number;
  readonly y: number;
}

export interface CameraScrollLimits {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface EffectiveCameraViewport {
  readonly width: number;
  readonly height: number;
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number; received ${value}.`);
  }
}

function assertViewport(viewport: CameraViewport): void {
  assertPositiveFinite(viewport.width, 'Camera viewport width');
  assertPositiveFinite(viewport.height, 'Camera viewport height');
  assertPositiveFinite(viewport.zoomX, 'Camera horizontal zoom');
  assertPositiveFinite(viewport.zoomY, 'Camera vertical zoom');
}

function assertBounds(bounds: CameraBounds): void {
  if (!Number.isFinite(bounds.x) || !Number.isFinite(bounds.y)) {
    throw new RangeError(`Camera bounds origin must be finite; received (${bounds.x}, ${bounds.y}).`);
  }

  assertPositiveFinite(bounds.width, 'Camera bounds width');
  assertPositiveFinite(bounds.height, 'Camera bounds height');
}

/**
 * Returns the world-space area visible through the logical camera viewport.
 */
export function getEffectiveCameraViewport(viewport: CameraViewport): EffectiveCameraViewport {
  assertViewport(viewport);

  return {
    width: viewport.width / viewport.zoomX,
    height: viewport.height / viewport.zoomY,
  };
}

/**
 * Returns the scroll range used by Phaser's center-relative camera scroll.
 *
 * Phaser stores scroll as the world coordinate offset from the logical camera
 * center, rather than as the visible world-space top-left corner. Zoom changes
 * the range of valid offsets even though the target-centering offset remains
 * relative to the logical camera center.
 */
export function getCameraScrollLimits(
  viewport: CameraViewport,
  bounds: CameraBounds,
): CameraScrollLimits {
  assertViewport(viewport);
  assertBounds(bounds);

  const effectiveViewport = getEffectiveCameraViewport(viewport);
  const minX = bounds.x + (effectiveViewport.width - viewport.width) / 2;
  const minY = bounds.y + (effectiveViewport.height - viewport.height) / 2;

  return {
    minX,
    maxX: Math.max(minX, minX + bounds.width - effectiveViewport.width),
    minY,
    maxY: Math.max(minY, minY + bounds.height - effectiveViewport.height),
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Calculates the camera scroll that centers a target, constrained to bounds.
 */
export function getCameraScrollForTarget(
  target: CameraPoint,
  viewport: CameraViewport,
  bounds: CameraBounds,
): CameraScroll {
  if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) {
    throw new RangeError(`Camera target must be finite; received (${target.x}, ${target.y}).`);
  }

  assertViewport(viewport);
  const limits = getCameraScrollLimits(viewport, bounds);

  return {
    x: clamp(target.x - viewport.width / 2, limits.minX, limits.maxX),
    y: clamp(target.y - viewport.height / 2, limits.minY, limits.maxY),
  };
}

/**
 * Rounds scroll values in the same direction as Phaser's round-pixel camera
 * handling while keeping the helper independent of Phaser.
 */
export function roundCameraScroll(scroll: CameraScroll): CameraScroll {
  if (!Number.isFinite(scroll.x) || !Number.isFinite(scroll.y)) {
    throw new RangeError(`Camera scroll must be finite; received (${scroll.x}, ${scroll.y}).`);
  }

  return {
    x: Math.floor(scroll.x),
    y: Math.floor(scroll.y),
  };
}
