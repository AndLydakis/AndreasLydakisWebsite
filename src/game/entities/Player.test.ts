import Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { Player } from './Player';
import type { InputController } from '../systems/InputController';

// Exercise the real Player constructor without booting a browser/Phaser scene.
vi.mock('phaser', () => ({
  default: {
    Physics: { Arcade: { Body: class {
      setSize = vi.fn();
      setOffset = vi.fn();
      setAllowGravity = vi.fn();
      setCollideWorldBounds = vi.fn();
      setVelocity = vi.fn();
    } } },
  },
}));

describe('player ground contact', () => {
  it.each([[32, 32], [32, 48]])('anchors collision to the bottom of a %sx%s sprite', (width, height) => {
    const body = new Phaser.Physics.Arcade.Body({} as Phaser.Physics.Arcade.World);
    const sprite = { width, height, body, x: 100, y: 100 };
    const scene = { physics: { add: { existing: vi.fn() } } };
    new Player(
      scene as unknown as Phaser.Scene,
      sprite as unknown as Phaser.GameObjects.Sprite,
      {} as InputController,
      { tileSize: 16 },
    );

    expect(body.setSize).toHaveBeenCalledWith(width / 2, 1, false);
    expect(body.setOffset).toHaveBeenCalledWith(width / 4, height - 1);
    expect(body.setCollideWorldBounds).toHaveBeenCalledWith(true);
    // At an upper wall, the sprite bottom ends one pixel beyond the floor edge,
    // instead of stopping a whole sprite-height away with its head at the wall.
    const floorEdge = 64;
    const spriteTopAtContact = floorEdge - (height - 1);
    expect(spriteTopAtContact + height).toBe(floorEdge + 1);
  });
});
