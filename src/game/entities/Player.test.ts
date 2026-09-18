import Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { Player } from './Player';
import type { InputController } from '../systems/InputController';
import type { PlayerVisual } from './PlayerVisual';

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
  it('passes movement and stopped state to presentation without changing physics geometry', () => {
    const body = new Phaser.Physics.Arcade.Body({} as Phaser.Physics.Arcade.World);
    const sprite = { width: 32, height: 32, body, x: 104, y: 168 };
    const scene = { physics: { add: { existing: vi.fn() } } };
    const movement = { up: false, down: false, left: false, right: true };
    const input = { getMovementSnapshot: () => movement };
    const visual = { update: vi.fn() };
    const player = new Player(scene as unknown as Phaser.Scene,
      sprite as unknown as Phaser.GameObjects.Sprite, input as InputController,
      { tileSize: 16, visual: visual as unknown as PlayerVisual });
    player.update();
    expect(visual.update).toHaveBeenLastCalledWith('right', { x: 144, y: 0 });
    movement.right = false;
    player.update();
    expect(visual.update).toHaveBeenLastCalledWith('right', { x: 0, y: 0 });
    expect(player.getState()).toEqual({ position: { x: 6, y: 10 }, facing: 'right' });
    expect(body.setSize).toHaveBeenCalledTimes(1);
    expect(body.setOffset).toHaveBeenCalledTimes(1);
  });
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
