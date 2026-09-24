import { describe, expect, it } from 'vitest';
import { DEFAULT_CAMERA_ZOOM, GAME_WIDTH, GAME_HEIGHT, RENDER_SCALE } from '../config';

import {
  getCameraConstraintBounds,
  getCameraScrollForTarget,
  getCameraScrollLimits,
  getEffectiveCameraViewport,
  roundCameraScroll,
} from './cameraFollow';

const logicalViewport = {
  width: 512,
  height: 288,
  zoomX: 1,
  zoomY: 1,
};

const houseBounds = {
  x: 0,
  y: 0,
  width: 1024,
  height: 576,
};

describe('camera follow math', () => {
  it('doubles render resolution without changing visible world area or displayed object sizes', () => {
    expect(RENDER_SCALE).toBe(2);
    expect([GAME_WIDTH, GAME_HEIGHT, DEFAULT_CAMERA_ZOOM]).toEqual([1024, 576, 2.5]);
    const viewport = {
      width: GAME_WIDTH, height: GAME_HEIGHT, zoomX: DEFAULT_CAMERA_ZOOM, zoomY: DEFAULT_CAMERA_ZOOM,
    };
    expect(getEffectiveCameraViewport(viewport)).toEqual({ width: 409.6, height: 230.4 });
    // FIT maps both resolutions to the same CSS width; scale cancels out.
    expect(DEFAULT_CAMERA_ZOOM / GAME_WIDTH).toBe(1.25 / 512);
    expect(getCameraScrollForTarget({ x: 512, y: 288 }, viewport, houseBounds)).toEqual({
      x: 0, y: 0,
    });
  });

  it('derives the effective world viewport from independent zoom values', () => {
    expect(
      getEffectiveCameraViewport({
        width: 512,
        height: 288,
        zoomX: 0.5,
        zoomY: 0.75,
      }),
    ).toEqual({ width: 1024, height: 384 });
  });

  it('centers the full house when fit zoom makes the viewport equal to the world', () => {
    const fitViewport = {
      ...logicalViewport,
      zoomX: 0.5,
      zoomY: 0.5,
    };

    expect(getCameraScrollLimits(fitViewport, houseBounds)).toEqual({
      minX: 256,
      maxX: 256,
      minY: 144,
      maxY: 144,
    });
    expect(getCameraScrollForTarget({ x: 104, y: 168 }, fitViewport, houseBounds)).toEqual({
      x: 256,
      y: 144,
    });
  });

  it('centers a target in a zoomed-in viewport', () => {
    const zoomedViewport = {
      ...logicalViewport,
      zoomX: 2,
      zoomY: 2,
    };

    expect(getCameraScrollForTarget({ x: 512, y: 288 }, zoomedViewport, houseBounds)).toEqual({
      x: 256,
      y: 144,
    });
  });

  it('clamps horizontal and vertical follow independently at every edge', () => {
    const zoomedViewport = {
      ...logicalViewport,
      zoomX: 2,
      zoomY: 2,
    };

    expect(getCameraScrollLimits(zoomedViewport, houseBounds)).toEqual({
      minX: -128,
      maxX: 640,
      minY: -72,
      maxY: 360,
    });
    expect(getCameraScrollForTarget({ x: 0, y: 288 }, zoomedViewport, houseBounds)).toEqual({
      x: -128,
      y: 144,
    });
    expect(getCameraScrollForTarget({ x: 1024, y: 288 }, zoomedViewport, houseBounds)).toEqual({
      x: 640,
      y: 144,
    });
    expect(getCameraScrollForTarget({ x: 512, y: 0 }, zoomedViewport, houseBounds)).toEqual({
      x: 256,
      y: -72,
    });
    expect(getCameraScrollForTarget({ x: 512, y: 576 }, zoomedViewport, houseBounds)).toEqual({
      x: 256,
      y: 360,
    });
  });

  it('centers smaller worlds instead of permitting blank-world overscroll', () => {
    const largerEffectiveViewport = {
      ...logicalViewport,
      zoomX: 0.5,
      zoomY: 0.5,
    };
    const smallerBounds = {
      x: 32,
      y: 48,
      width: 512,
      height: 288,
    };

    expect(getCameraScrollLimits(largerEffectiveViewport, smallerBounds)).toEqual({
      minX: 32,
      maxX: 32,
      minY: 48,
      maxY: 48,
    });
    expect(
      getCameraScrollForTarget({ x: 32, y: 48 }, largerEffectiveViewport, smallerBounds),
    ).toEqual({ x: 32, y: 48 });
    expect(getCameraConstraintBounds(largerEffectiveViewport, smallerBounds)).toEqual({
      x: -224,
      y: -96,
      width: 1024,
      height: 576,
    });
  });

  it('supports a non-16:9 viewport and a larger world', () => {
    const viewport = {
      width: 640,
      height: 360,
      zoomX: 1,
      zoomY: 1,
    };
    const bounds = {
      x: 16,
      y: 24,
      width: 1600,
      height: 900,
    };

    expect(getCameraScrollLimits(viewport, bounds)).toEqual({
      minX: 16,
      maxX: 976,
      minY: 24,
      maxY: 564,
    });
    expect(getCameraScrollForTarget({ x: 816, y: 474 }, viewport, bounds)).toEqual({
      x: 496,
      y: 294,
    });
  });

  it('centers only the smaller axis when world dimensions differ', () => {
    const viewport = {
      width: 512,
      height: 288,
      zoomX: 0.5,
      zoomY: 1,
    };
    const bounds = {
      x: 16,
      y: 24,
      width: 512,
      height: 900,
    };

    expect(getCameraScrollLimits(viewport, bounds)).toEqual({
      minX: 16,
      maxX: 16,
      minY: 24,
      maxY: 636,
    });
    expect(getCameraConstraintBounds(viewport, bounds)).toEqual({
      x: -240,
      y: 24,
      width: 1024,
      height: 900,
    });
  });

  it('rounds scroll down to preserve Phaser round-pixel behavior', () => {
    expect(roundCameraScroll({ x: 12.9, y: -4.1 })).toEqual({ x: 12, y: -5 });
  });

  it('rejects invalid viewport, bounds, and target values', () => {
    expect(() =>
      getEffectiveCameraViewport({ width: 0, height: 288, zoomX: 1, zoomY: 1 }),
    ).toThrow('Camera viewport width must be a positive finite number');
    expect(() =>
      getCameraScrollLimits(logicalViewport, { x: 0, y: 0, width: 0, height: 576 }),
    ).toThrow('Camera bounds width must be a positive finite number');
    expect(() =>
      getCameraScrollForTarget({ x: Number.NaN, y: 0 }, logicalViewport, houseBounds),
    ).toThrow('Camera target must be finite');
    expect(() => roundCameraScroll({ x: 0, y: Number.POSITIVE_INFINITY })).toThrow(
      'Camera scroll must be finite',
    );
  });
});
